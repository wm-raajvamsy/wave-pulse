"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  message: string;
  isUser?: boolean;
  className?: string;
}

/**
 * Converts various color formats to a standard hex/rgb value for rendering
 * Supports: hex (#rgb, #rrggbb), rgb(), rgba(), hsl(), named colors
 */
function parseColor(colorValue: string): string | null {
  if (!colorValue || typeof colorValue !== 'string') return null;
  
  const trimmed = colorValue.trim();
  
  // Hex color (#rgb or #rrggbb or #rrggbbaa)
  if (/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(trimmed)) {
    return trimmed;
  }
  
  // RGB/RGBA
  const rgbMatch = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  // HSL/HSLA
  const hslMatch = trimmed.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*[\d.]+)?\)/);
  if (hslMatch) {
    // Convert HSL to RGB (simplified conversion)
    const h = parseInt(hslMatch[1]) / 360;
    const s = parseInt(hslMatch[2]) / 100;
    const l = parseInt(hslMatch[3]) / 100;
    
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;
    
    let r = 0, g = 0, b = 0;
    if (h < 1/6) { r = c; g = x; }
    else if (h < 2/6) { r = x; g = c; }
    else if (h < 3/6) { g = c; b = x; }
    else if (h < 4/6) { g = x; b = c; }
    else if (h < 5/6) { r = x; b = c; }
    else { r = c; b = x; }
    
    return `rgb(${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)})`;
  }
  
  // Named colors (basic set)
  const namedColors: Record<string, string> = {
    'black': '#000000',
    'white': '#ffffff',
    'red': '#ff0000',
    'green': '#008000',
    'blue': '#0000ff',
    'yellow': '#ffff00',
    'cyan': '#00ffff',
    'magenta': '#ff00ff',
    'gray': '#808080',
    'grey': '#808080',
    'transparent': 'transparent',
  };
  
  if (namedColors[trimmed.toLowerCase()]) {
    return namedColors[trimmed.toLowerCase()];
  }
  
  return null;
}

/**
 * Component to render a color value with a visual swatch
 */
function ColorValue({ value, className = "" }: { value: string; className?: string }) {
  const color = parseColor(value);
  
  if (!color) {
    return <span className={className}>{value}</span>;
  }
  
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} style={{ verticalAlign: 'middle' }}>
      <span
        className="inline-block w-4 h-4 rounded border border-zinc-300 flex-shrink-0"
        style={{
          backgroundColor: color === 'transparent' ? 'white' : color,
          backgroundImage: color === 'transparent' 
            ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
            : undefined,
          backgroundSize: color === 'transparent' ? '8px 8px' : undefined,
          backgroundPosition: color === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined,
          verticalAlign: 'middle',
          marginTop: '-1px', // Fine-tune vertical alignment
        }}
        title={value}
      />
      <code className="text-xs font-mono" style={{ verticalAlign: 'middle' }}>{value}</code>
    </span>
  );
}

/**
 * Processes text to detect and replace color values with special markers
 * This works on the raw text before markdown processing
 */
function preprocessMessageForColors(text: string): string {
  // Match color values in various contexts:
  // - After color properties: "color: #151420"
  // - In lists: "- color: #151420"
  // - Standalone: "#151420" or "rgba(...)"
  const colorPattern = /([#][A-Fa-f0-9]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))(?=\s|$|,|;|`)/g;
  
  return text.replace(colorPattern, (match) => {
    const color = parseColor(match);
    if (color) {
      return `__COLOR_SWATCH__${match}__END_COLOR__`;
    }
    return match;
  });
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isUser = false,
  className = ""
}) => {
  // Preprocess message to add color markers for AI messages
  const processedMessage = isUser ? message : preprocessMessageForColors(message);

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
                // Inline code with better styling and color swatch support
                code: ({ inline, className: codeClassName, children, ...props }: any) => {
                  const isInline = inline !== false;
                  const content = String(children);
                  
                  // Check if this code block contains color markers
                  if (content.includes('__COLOR_SWATCH__')) {
                    const parts: React.ReactNode[] = [];
                    let lastIndex = 0;
                    const regex = /__COLOR_SWATCH__(.+?)__END_COLOR__/g;
                    let match;
                    let key = 0;
                    
                    while ((match = regex.exec(content)) !== null) {
                      if (match.index > lastIndex) {
                        parts.push(content.substring(lastIndex, match.index));
                      }
                      parts.push(<ColorValue key={`color-${key++}`} value={match[1]} />);
                      lastIndex = match.index + match[0].length;
                    }
                    
                    if (lastIndex < content.length) {
                      parts.push(content.substring(lastIndex));
                    }
                    
                    return isInline ? (
                      <code className="bg-zinc-100 text-zinc-900 px-1.5 py-0.5 rounded text-xs font-mono font-medium border border-zinc-200" {...props}>
                        {parts}
                      </code>
                    ) : (
                      <div className="my-3">
                        <code className="block bg-zinc-900 text-zinc-100 p-3 rounded-md text-xs font-mono overflow-x-auto border border-zinc-700" {...props}>
                          {parts}
                        </code>
                      </div>
                    );
                  }
                  
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
              {processedMessage}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};
