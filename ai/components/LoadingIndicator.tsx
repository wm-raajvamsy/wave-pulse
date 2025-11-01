"use client";

import React from 'react';

interface LoadingIndicatorProps {
  message?: string;
  className?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = "Processing...",
  className = ""
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="bg-white border border-zinc-200 rounded-lg px-4 py-3 shadow-sm flex items-center gap-3">
        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <p className="text-sm text-zinc-700">
          {message}
        </p>
      </div>
    </div>
  );
};
