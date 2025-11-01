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
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-zinc-200 flex-shrink-0 mt-1">
        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-xs">
          {message}
          <span className="inline-flex gap-0.5 ml-1">
            <span className="animate-pulse">.</span>
            <span className="animate-pulse delay-75">.</span>
            <span className="animate-pulse delay-150">.</span>
          </span>
        </p>
      </div>
    </div>
  );
};
