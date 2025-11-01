"use client";

import React, { useState } from 'react';
import { Button } from '@nextui-org/react';

interface ChatInputProps {
  onSubmit?: (message: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSubmit,
  placeholder = "Type your message...",
  className = "",
  disabled = false
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && onSubmit && !disabled) {
      onSubmit(message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${className}`}>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 px-4 py-2.5 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-zinc-100 disabled:cursor-not-allowed placeholder:text-zinc-400"
      />
      <Button
        type="submit"
        disabled={!message.trim() || disabled}
        isIconOnly
        size="sm"
        className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-9 h-9"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </Button>
    </form>
  );
};
