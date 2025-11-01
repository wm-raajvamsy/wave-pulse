"use client";

import React, { useState, useEffect } from 'react';
import { ChatModal, ChatMessage, LoadingIndicator, TaskList, ResearchSteps, ChatInput, type TaskItem, type ResearchStep } from './components';

const STORAGE_KEY_PREFIX = 'wavepulse_ai_chat_';

export function AIAssistant({ channelId }: { channelId?: string }) {
  const storageKey = `${STORAGE_KEY_PREFIX}${channelId || 'default'}`;
  
  // Load messages from localStorage on mount
  const [messages, setMessages] = useState<Array<{
    id: string;
    message: string;
    isUser: boolean;
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
  const [researchSteps, setResearchSteps] = useState<ResearchStep[]>([]);
  const [taskList, setTaskList] = useState<TaskItem[]>([]);
  const [showResearchSteps, setShowResearchSteps] = useState(false);
  const [showTaskList, setShowTaskList] = useState(false);

  const handleSendMessage = async (message: string) => {
    const newMessage = {
      id: Date.now().toString(),
      message,
      isUser: true
    };
    
    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);
    setShowResearchSteps(false);
    setShowTaskList(false);

    try {
      // Prepare history for context (last 10 messages)
      const recentHistory = messages.slice(-10).map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.message
      }));

      // Call Gemini API
      const response = await fetch('/wavepulse/api/chat', {
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from AI');
      }

      const data = await response.json();
      
      setIsLoading(false);
      
      // Update research steps if provided
      if (data.researchSteps && Array.isArray(data.researchSteps)) {
        setResearchSteps(data.researchSteps);
        setShowResearchSteps(true);
      }
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        message: data.message || 'No response received',
        isUser: false
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      setIsLoading(false);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        message: error instanceof Error ? error.message : 'An error occurred while processing your message',
        isUser: false
      };
      setMessages(prev => [...prev, errorMessage]);
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
              <ChatMessage
                key={msg.id}
                message={msg.message}
                isUser={msg.isUser}
              />
            ))}

            {/* Research Steps - Show during loading or after */}
            {(isLoading || showResearchSteps) && researchSteps.length > 0 && (
              <div className="mt-2 mb-4">
                <ResearchSteps steps={researchSteps} />
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-start">
                <LoadingIndicator message="Processing..." />
              </div>
            )}

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
                  setResearchSteps([]);
                  setShowResearchSteps(false);
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
