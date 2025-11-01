"use client";

import React, { useState, useEffect } from 'react';
import { ChatModal, ChatMessage, LoadingIndicator, TaskList, ResearchSteps, ChatInput, type TaskItem, type ResearchStep } from './components';

const STORAGE_KEY_PREFIX = 'wavepulse_ai_chat_';

export function AIAssistant({ 
  channelId, 
  onWidgetSelect 
}: { 
  channelId?: string;
  onWidgetSelect?: (widgetId: string) => void;
}) {
  const storageKey = `${STORAGE_KEY_PREFIX}${channelId || 'default'}`;
  
  // Load messages from localStorage on mount
  const [messages, setMessages] = useState<Array<{
    id: string;
    message: string;
    isUser: boolean;
    researchSteps?: ResearchStep[];
  }>>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  
  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (e) {
        console.error('Failed to save chat messages:', e);
      }
    }
  }, [messages, storageKey]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [taskList, setTaskList] = useState<TaskItem[]>([]);
  const [showTaskList, setShowTaskList] = useState(false);

  const handleSendMessage = async (message: string) => {
    const newMessage = {
      id: Date.now().toString(),
      message,
      isUser: true
    };
    
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);
    setShowTaskList(false);

    // Create a placeholder AI message that we'll update with streaming data
    const aiMessageId = (Date.now() + 1).toString();
    const placeholderMessage = {
      id: aiMessageId,
      message: '',
      isUser: false,
      researchSteps: [] as ResearchStep[]
    };
    setMessages(prev => [...prev, placeholderMessage]);

    try {
      // Prepare history for context (last 10 messages)
      const recentHistory = messages.slice(-10).map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.message
      }));

      // Use streaming endpoint
      const response = await fetch('/wavepulse/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          history: recentHistory,
          channelId: channelId
        }),
      });

      if (!response.ok) {
        // Try to read error as JSON, but handle if it's not
        try {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from AI');
        } catch {
          throw new Error(`Failed to get response from AI (status ${response.status})`);
        }
      }

      if (!response.headers.get('content-type')?.includes('text/event-stream')) {
        // Fallback to regular JSON response if streaming not available
      const data = await response.json();
        setIsLoading(false);
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId
            ? {
                ...msg,
                message: data.message || 'No response received',
                researchSteps: data.researchSteps || []
              }
            : msg
        ));
        return;
      }

      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let buffer = '';
      let finalResult: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'step' && data.data?.researchSteps) {
                // Update research steps in real-time
                setMessages(prev => prev.map(msg => 
                  msg.id === aiMessageId
                    ? { ...msg, researchSteps: data.data.researchSteps }
                    : msg
                ));
              } else if (data.type === 'complete') {
                // Final update with message
                finalResult = data.data;
              } else if (data.type === 'final') {
                // Final result received
                finalResult = data.data;
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Unknown error');
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
      
      setIsLoading(false);
      
      // Update message with final result
      if (finalResult) {
      // Handle widget selection if provided
        if (finalResult.widgetSelection && onWidgetSelect) {
          const { widgetId } = finalResult.widgetSelection;
        setTimeout(() => {
          onWidgetSelect(widgetId);
        }, 100);
      }
      
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId
            ? {
                ...msg,
                message: finalResult.message || 'Task completed successfully.',
                researchSteps: finalResult.researchSteps || msg.researchSteps
              }
            : msg
        ));
      }
    } catch (error) {
      setIsLoading(false);
      
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId
          ? {
              ...msg,
              message: error instanceof Error ? error.message : 'An error occurred while processing your message'
            }
          : msg
      ));
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-4">
      <ChatModal className="w-full h-[calc(100vh-160px)] border border-zinc-300 rounded-lg flex flex-col">
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-sm text-zinc-500 py-12">
                No messages yet. Start a conversation.
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <div key={msg.id}>
                {/* Show message only if it has content or is user message */}
                {(msg.message || msg.isUser) && (
              <ChatMessage
                    message={msg.message || (msg.isUser ? '' : 'Processing...')}
                isUser={msg.isUser}
              />
                )}
                {/* Research Steps - Show for each AI message that has steps (always show if loading) */}
                {!msg.isUser && msg.researchSteps && msg.researchSteps.length > 0 && (
              <div className="mt-2 mb-4">
                    <ResearchSteps steps={msg.researchSteps} />
              </div>
            )}
              </div>
            ))}

            {/* Task List */}
            {showTaskList && taskList.length > 0 && !isLoading && (
              <div className="mt-4">
                <TaskList tasks={taskList} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-zinc-300 bg-zinc-50 px-6 py-3 flex items-center gap-3 flex-shrink-0">
            <button 
              className="text-zinc-500 hover:text-zinc-700 p-1.5 rounded hover:bg-zinc-200 transition-colors"
              type="button"
            >
              <span className="text-lg font-semibold">+</span>
            </button>
            <div className="flex-1">
              <ChatInput
                onSubmit={handleSendMessage}
                placeholder="Type your message..."
                disabled={isLoading}
              />
            </div>
            {messages.length > 0 && (
              <button 
                className="px-4 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-800 hover:bg-zinc-200 rounded transition-colors"
                onClick={() => {
                  setMessages([]);
                  if (typeof window !== 'undefined') {
                    try {
                      localStorage.removeItem(storageKey);
                    } catch (e) {
                      console.error('Failed to clear chat:', e);
                    }
                  }
                }}
                type="button"
                title="Clear chat"
              >
                Clear
              </button>
            )}
            {isLoading && (
              <button 
                className="px-4 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-800 hover:bg-zinc-200 rounded transition-colors"
                onClick={() => setIsLoading(false)}
                type="button"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </ChatModal>
    </div>
  );
}
