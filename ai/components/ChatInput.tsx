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
        className="flex-1 px-3 py-1.5 text-xs border border-zinc-300 rounded focus:outline-none focus:border-zinc-400 disabled:bg-zinc-100 disabled:cursor-not-allowed"
      />
      <Button
        type="submit"
        disabled={!message.trim() || disabled}
        isIconOnly
        className="bg-transparent w-8 h-6 min-w-8 p-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </Button>
    </form>
  );
};
