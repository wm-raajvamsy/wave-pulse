"use client";

import React, { useState } from 'react';
import { ChatModal, ChatMessage, LoadingIndicator, TaskList, ResearchSteps, ChatInput, type TaskItem, type ResearchStep } from './components';

export function AIAssistant() {
  const [messages, setMessages] = useState<Array<{
    id: string;
    message: string;
    isUser: boolean;
  }>>([]);
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
          history: recentHistory
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from AI');
      }

      const data = await response.json();
      
      setIsLoading(false);
      
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
    <div className="w-full h-full p-4 pr-6">
      <ChatModal className="w-full h-[calc(100vh-160px)] border-2 border-black-500 rounded-lg" >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-sm text-gray-500 py-8">
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

            {/* Loading State */}
            {isLoading && (
              <LoadingIndicator message="Processing..." />
            )}

            {/* Research Steps */}
            {showResearchSteps && researchSteps.length > 0 && !isLoading && (
              <div className="mt-4">
                <ResearchSteps steps={researchSteps} />
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
          <div className="border-t border-zinc-300 pt-2 pb-2 px-4 flex items-center gap-2 flex-shrink-0">
            <button className="text-gray-500 hover:text-gray-700 p-1 rounded">
              <span className="text-xl">+</span>
            </button>
            <div className="flex-1">
              <ChatInput
                onSubmit={handleSendMessage}
                placeholder="Type your message..."
                disabled={isLoading}
              />
            </div>
            <button className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800">
              Cancel
            </button>
          </div>
        </div>
      </ChatModal>
    </div>
  );
}
