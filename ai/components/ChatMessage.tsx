"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}>
      <div className={`max-w-[80%] lg:max-w-[75%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
        isUser 
          ? 'bg-blue-600 text-white shadow-sm' 
          : 'bg-white border border-zinc-200 text-zinc-900 shadow-sm'
      }`}>
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message}</p>
        ) : (
          <div className="break-words markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Paragraph with better spacing
                p: ({ children }) => (
                  <p className="mb-3 last:mb-0 text-zinc-800 leading-6">{children}</p>
                ),
                // Bold text with better visual weight
                strong: ({ children }) => (
                  <strong className="font-bold text-zinc-900">{children}</strong>
                ),
                // Italic text
                em: ({ children }) => (
                  <em className="italic text-zinc-700">{children}</em>
                ),
                // Inline code with better styling
                code: ({ inline, className, children, ...props }: any) => {
                  const isInline = inline !== false;
                  return isInline ? (
                    <code 
                      className="bg-zinc-100 text-zinc-900 px-1.5 py-0.5 rounded text-xs font-mono font-medium border border-zinc-200" 
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <div className="my-3">
                      <code 
                        className="block bg-zinc-900 text-zinc-100 p-3 rounded-md text-xs font-mono overflow-x-auto border border-zinc-700" 
                        {...props}
                      >
                        {children}
                      </code>
                    </div>
                  );
                },
                // Preformatted blocks
                pre: ({ children }) => (
                  <pre className="my-3 overflow-x-auto">
                    {children}
                  </pre>
                ),
                // Unordered lists with better styling
                ul: ({ children }) => (
                  <ul className="list-disc list-outside mb-3 ml-4 space-y-2 text-zinc-800">
                    {children}
                  </ul>
                ),
                // Ordered lists
                ol: ({ children }) => (
                  <ol className="list-decimal list-outside mb-3 ml-4 space-y-2 text-zinc-800">
                    {children}
                  </ol>
                ),
                // List items with proper spacing
                li: ({ children }) => (
                  <li className="pl-2 leading-6">
                    {children}
                  </li>
                ),
                // Blockquotes with better visual distinction
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-400 bg-blue-50 pl-4 pr-3 py-2 my-3 rounded-r text-zinc-700 italic">
                    {children}
                  </blockquote>
                ),
                // Headings
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold text-zinc-900 mb-2 mt-4 first:mt-0">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-semibold text-zinc-900 mb-2 mt-3 first:mt-0">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-semibold text-zinc-900 mb-2 mt-3 first:mt-0">{children}</h3>
                ),
                // Links
                a: ({ href, children }) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    {children}
                  </a>
                ),
                // Horizontal rule
                hr: () => (
                  <hr className="my-4 border-zinc-300" />
                ),
              }}
            >
              {message}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};
