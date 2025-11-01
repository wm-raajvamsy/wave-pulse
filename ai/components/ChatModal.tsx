"use client";

import React from 'react';

interface ChatModalProps {
  children: React.ReactNode;
  className?: string;
}

export const ChatModal: React.FC<ChatModalProps> = ({ 
  children, 
  className = ""
}) => {
  return (
    <div className={`relative bg-white flex flex-col ${className}`}>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};
