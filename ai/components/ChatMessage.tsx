"use client";

import React from 'react';

interface ChatMessageProps {
  message: string;
  isUser?: boolean;
  className?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isUser = false,
  className = ""
}) => {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 ${className}`}>
      <div className={`max-w-[85%] rounded-lg px-4 py-2.5 text-xs ${
        isUser 
          ? 'bg-zinc-400 text-white shadow-md' 
          : 'bg-zinc-50 border border-zinc-300 text-zinc-900 shadow-sm'
      }`}>
        <p className="leading-relaxed whitespace-pre-wrap break-words">{message}</p>
      </div>
    </div>
  );
};
