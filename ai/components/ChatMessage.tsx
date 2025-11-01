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
    <span className={`inline-flex items-center gap-1.5 ${className}`} style={{ verticalAlign: 'middle', display: 'inline-flex' }}>
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
      <code className="text-xs font-mono whitespace-nowrap" style={{ verticalAlign: 'middle' }}>{value}</code>
    </span>
  );
}

/**
 * Processes text to detect and replace color values with special markers
 * This works on the raw text before markdown processing
 */
function preprocessMessageForColors(text: string): string {
  // Match color values in various contexts:
  // - After color properties: "color: #151420" or "backgroundColor: #eee"
  // - In lists: "- color: #151420"
  // - Standalone: "#151420" or "rgba(...)"
  // Improved pattern to catch colors even after colons, spaces, or other text
  const colorPattern = /([#][A-Fa-f0-9]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))(?=\s|$|,|;|`|__|\))/g;
  
  // Use matchAll to get all matches with their positions
  const matches = Array.from(text.matchAll(colorPattern));
  
  // Work backwards to preserve indices when replacing
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    if (!match || typeof match.index !== 'number') continue;
    
    const matchText = match[0];
    const offset = match.index;
    
    // Check if this is already inside a marker (avoid double-processing)
    const before = text.substring(Math.max(0, offset - 20), offset);
    const after = text.substring(offset + matchText.length, Math.min(text.length, offset + matchText.length + 20));
    
    if (before.includes('__COLOR_SWATCH__') || before.includes('COLOR_SWATCH') || 
        after.includes('__END_COLOR__') || after.includes('END_COLOR__')) {
      continue;
    }
    
    const color = parseColor(matchText);
    if (color) {
      text = text.substring(0, offset) + 
            `__COLOR_SWATCH__${matchText}__END_COLOR__` + 
            text.substring(offset + matchText.length);
    }
  }
  
  return text;
}

/**
 * Normalizes all color marker formats to the standard __COLOR_SWATCH__...__END_COLOR__ format
 */
function normalizeColorMarkers(text: string): string {
  // Unified normalization: handle all marker variations in a logical order
  // 1. Fix malformed markers like COLOR_SWATCH#eee__END_COLOR__
  text = text.replace(/COLOR_SWATCH([#][A-Fa-f0-9]{3,8})__END_COLOR__/g, '__COLOR_SWATCH__$1__END_COLOR__');
  text = text.replace(/COLOR_SWATCH([#][A-Fa-f0-9]{3,8})END_COLOR__/g, '__COLOR_SWATCH__$1__END_COLOR__');
  
  // 2. Normalize partial markers
  text = text.replace(/COLOR_SWATCH([^_E#])/g, '__COLOR_SWATCH__$1');
  text = text.replace(/([^_])END_COLOR__/g, '$1__END_COLOR__');
  text = text.replace(/COLOR_SWATCH__/g, '__COLOR_SWATCH__');
  
  // 3. Extract colors directly after COLOR_SWATCH or before END_COLOR__
  text = text.replace(/COLOR_SWATCH([#][A-Fa-f0-9]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/g, '__COLOR_SWATCH__$1');
  text = text.replace(/([#][A-Fa-f0-9]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))END_COLOR__/g, '$1__END_COLOR__');
  
  return text;
}

/**
 * Removes all color marker text variants from a string
 * Also removes orphaned underscores that might be leftover from incomplete markers
 */
function removeMarkerText(text: string): string {
  // First remove complete marker patterns
  let cleaned = text
    .replace(/__COLOR_SWATCH__/g, '')
    .replace(/__END_COLOR__/g, '')
    .replace(/COLOR_SWATCH/g, '')
    .replace(/END_COLOR__/g, '');
  
  // Remove orphaned double underscores that might be leftover
  // But be careful not to remove legitimate double underscores in the content
  // Only remove if they appear to be part of marker remnants
  cleaned = cleaned.replace(/__+(?=\s|$|#|rgba?|hsla?)/g, '');
  cleaned = cleaned.replace(/(?<=COLOR_SWATCH|END_COLOR|__COLOR_SWATCH|__END_COLOR)__+/g, '');
  
  // Also remove any standalone __ that appear before color patterns
  cleaned = cleaned.replace(/__+(?=[#][A-Fa-f0-9]|rgba?\(|hsla?\()/g, '');
  
  return cleaned;
}

/**
 * Processes text containing colors and returns React nodes with ColorValue components
 * Handles both marked (__COLOR_SWATCH__...__END_COLOR__) and unmarked color patterns
 */
function processColorsInText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  
  // First normalize any markers
  let normalizedText = normalizeColorMarkers(text);
  
  // Find all color occurrences - prioritize marked colors, then find unmarked ones
  // Use two separate patterns to ensure we capture everything correctly
  const markedColorPattern = /__COLOR_SWATCH__(.+?)__END_COLOR__/g;
  const directColorPattern = /([#][A-Fa-f0-9]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/g;
  
  // Collect all matches with their positions and types
  interface ColorMatch {
    index: number;
    length: number;
    value: string;
    isMarked: boolean;
  }
  
  const allMatches: ColorMatch[] = [];
  
  // Find marked colors first
  const markedMatches = Array.from(normalizedText.matchAll(markedColorPattern));
  for (const match of markedMatches) {
    if (match.index !== undefined) {
      allMatches.push({
        index: match.index,
        length: match[0].length,
        value: match[1],
        isMarked: true,
      });
    }
  }
  
  // Find unmarked colors, but exclude those already inside marked patterns
  const directMatches = Array.from(normalizedText.matchAll(directColorPattern));
  for (const match of directMatches) {
    if (match.index === undefined) continue;
    
    // Check if this color is already covered by a marked pattern
    const isAlreadyMarked = allMatches.some(m => 
      m.isMarked && 
      match.index! >= m.index && 
      match.index! < m.index + m.length
    );
    
    if (!isAlreadyMarked) {
      allMatches.push({
        index: match.index,
        length: match[0].length,
        value: match[0],
        isMarked: false,
      });
    }
  }
  
  // Sort matches by position
  allMatches.sort((a, b) => a.index - b.index);
  
  if (allMatches.length === 0) {
    // No colors found, return cleaned text
    const cleaned = removeMarkerText(normalizedText);
    return cleaned.trim() ? [cleaned] : [];
  }
  
  let lastIndex = 0;
  let keyIdx = 0;
  
  for (const match of allMatches) {
    // Add text before this match (cleaned of markers)
    if (match.index > lastIndex) {
      const textBefore = normalizedText.substring(lastIndex, match.index);
      const cleaned = removeMarkerText(textBefore);
      // Also trim any trailing underscores that might be marker remnants
      const trimmed = cleaned.replace(/__+$/, '').trim();
      if (trimmed) {
        parts.push(trimmed);
      }
    }
    
    // Process the color value
    if (parseColor(match.value)) {
      parts.push(<ColorValue key={`color-${keyIdx++}`} value={match.value} />);
    } else {
      // Not a valid color, add as text (but clean markers if it was marked)
      const cleaned = match.isMarked ? removeMarkerText(match.value) : removeMarkerText(match.value);
      if (cleaned.trim()) parts.push(cleaned.trim());
    }
    
    lastIndex = match.index + match.length;
  }
  
  // Add remaining text after last match (cleaned of markers)
  if (lastIndex < normalizedText.length) {
    const remaining = normalizedText.substring(lastIndex);
    const cleaned = removeMarkerText(remaining);
    // Trim any trailing underscores
    const trimmed = cleaned.replace(/__+$/, '').trim();
    if (trimmed) {
      parts.push(trimmed);
    }
  }
  
  // Final cleanup: remove __ that might appear before/after color blocks
  const cleanedParts: React.ReactNode[] = [];
  for (const part of parts) {
    if (typeof part === 'string') {
      // Clean trailing and leading __ from strings
      let cleaned = part.replace(/__+$/, '').replace(/^__+/, '').trim();
      
      if (cleaned) {
        cleanedParts.push(cleaned);
      }
    } else {
      cleanedParts.push(part);
    }
  }
  
  // Final filter: remove empty strings
  return cleanedParts.filter((part) => {
    if (typeof part === 'string') {
      return part.trim().length > 0;
    }
    return true;
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
      <div className={`max-w-[85%] lg:max-w-[80%] rounded-xl px-5 py-4 text-sm leading-relaxed ${
        isUser 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'bg-white border border-zinc-200 text-zinc-900 shadow-sm'
      }`}>
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message}</p>
        ) : (
          <div className="break-words markdown-content prose prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Paragraph with better spacing
                p: ({ children }) => (
                  <p className="mb-3 last:mb-0 text-zinc-800 leading-7 text-[15px]">{children}</p>
                ),
                // Bold text with better visual weight - but allow mixed content in headings
                strong: ({ children }) => {
                  // If this is inside an h3, we might want different styling
                  // But we can't access parent context easily, so we'll handle it in h3
                  return (
                    <strong className="font-semibold text-zinc-900">{children}</strong>
                  );
                },
                // Italic text
                em: ({ children }) => (
                  <em className="italic text-zinc-700">{children}</em>
                ),
                // Inline code with better styling and color swatch support
                code: ({ inline, className: codeClassName, children, ...props }: any) => {
                  const isInline = inline !== false;
                  const content = String(children);
                  
                  // Check if this code block contains colors (marked or unmarked)
                  const hasColorSwatchMarker = content.includes('__COLOR_SWATCH__') || content.includes('COLOR_SWATCH');
                  const directColorPattern = /([#][A-Fa-f0-9]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/;
                  const hasDirectColor = directColorPattern.test(content);
                  
                  if (hasColorSwatchMarker || hasDirectColor) {
                    // Use helper function to process colors
                    const parts = processColorsInText(content);
                    
                    return isInline ? (
                      <code className="bg-zinc-100 text-zinc-900 px-2 py-1 rounded-md text-xs font-mono font-medium border border-zinc-200 shadow-sm inline-flex items-center flex-wrap" {...props}>
                        {parts}
                      </code>
                    ) : (
                      <div className="my-4">
                        <code className="block bg-zinc-900 text-zinc-100 p-4 rounded-lg text-xs font-mono overflow-x-auto border border-zinc-700 shadow-inner" {...props}>
                          {parts}
                        </code>
                      </div>
                    );
                  }
                  
                  return isInline ? (
                    <code 
                      className="bg-zinc-100 text-zinc-900 px-2 py-1 rounded-md text-xs font-mono font-medium border border-zinc-200 shadow-sm" 
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <div className="my-4">
                      <code 
                        className="block bg-zinc-900 text-zinc-100 p-4 rounded-lg text-xs font-mono overflow-x-auto border border-zinc-700 shadow-inner" 
                        {...props}
                      >
                        {children}
                      </code>
                    </div>
                  );
                },
                // Preformatted blocks
                pre: ({ children }) => (
                  <pre className="my-4 overflow-x-auto">
                    {children}
                  </pre>
                ),
                // Unordered lists with better styling
                ul: ({ children }) => (
                  <ul className="list-disc list-outside mb-4 ml-5 space-y-2.5 text-zinc-800">
                    {children}
                  </ul>
                ),
                // Ordered lists
                ol: ({ children }) => (
                  <ol className="list-decimal list-outside mb-4 ml-5 space-y-2.5 text-zinc-800">
                    {children}
                  </ol>
                ),
                // List items with proper spacing and better formatting
                li: ({ children }) => {
                  // Try to detect if this is a property-style list item
                  // React children might be an array or ReactNode, so we need to handle it carefully
                  let textContent = '';
                  try {
                    const childrenArray = React.Children.toArray(children as React.ReactNode);
                    textContent = childrenArray.map(child => {
                      if (typeof child === 'string' || typeof child === 'number') {
                        return String(child);
                      }
                      if (React.isValidElement(child)) {
                        const childChildren = child.props?.children;
                        if (typeof childChildren === 'string' || typeof childChildren === 'number') {
                          return String(childChildren);
                        }
                      }
                      return '';
                    }).join('');
                  } catch {
                    // If parsing fails, just render normally
                    textContent = '';
                  }
                  
                  // Check if this looks like a property: value format
                  const propertyMatch = textContent.trim().match(/^([^:]+):\s*(.+)$/);
                  if (propertyMatch) {
                    const [, key, value] = propertyMatch;
                    
                    // Check if value contains colors (marked or unmarked)
                    const hasColorSwatchMarker = value.includes('__COLOR_SWATCH__') || value.includes('COLOR_SWATCH');
                    const directColorPattern = /([#][A-Fa-f0-9]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))/;
                    const hasDirectColor = directColorPattern.test(value);
                    
                    // Use helper function to process colors
                    const processedValue = hasColorSwatchMarker || hasDirectColor
                      ? processColorsInText(value)
                      : null;
                    
                    return (
                      <li className="pl-2 leading-7 my-1.5 flex items-start gap-1.5 flex-wrap">
                        <span className="font-medium text-zinc-900 flex-shrink-0">{key}:</span>
                        <span className={`text-zinc-700 font-mono text-xs bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200 ${
                          processedValue ? 'inline-flex items-center gap-1 flex-wrap' : ''
                        }`}>
                          {processedValue && processedValue.length > 0 ? processedValue : value.trim()}
                        </span>
                      </li>
                    );
                  }
                  return (
                    <li className="pl-2 leading-7 my-0.5">
                    {children}
                  </li>
                  );
                },
                // Blockquotes with better visual distinction
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-500 bg-blue-50/50 pl-5 pr-4 py-3 my-4 rounded-r-lg text-zinc-700 italic shadow-sm">
                    {children}
                  </blockquote>
                ),
                // Headings with better hierarchy
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold text-zinc-900 mb-3 mt-6 first:mt-0 border-b border-zinc-200 pb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold text-zinc-900 mb-2.5 mt-5 first:mt-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => {
                  // Handle h3 with mixed content - only the class name should be bold, rest should be lighter
                  // The markdown might wrap everything in strong, so we need to parse it carefully
                  const extractText = (node: any): string => {
                    if (typeof node === 'string' || typeof node === 'number') {
                      return String(node);
                    }
                    if (React.isValidElement(node)) {
                      const props = node.props as { children?: any };
                      if (props?.children) {
                        return extractText(props.children);
                      }
                    }
                    return '';
                  };

                  const fullText = extractText(children);
                  
                  // Pattern to match: .className (from "category" or category → root)
                  const classMatch = fullText.match(/^(\.?[^\s(]+)(.*)$/);
                  
                  if (classMatch) {
                    const [, className, rest] = classMatch;
                    return (
                      <h3 className="text-base mb-2 mt-4 first:mt-0 flex items-center gap-2 flex-wrap">
                        <span className="w-1 h-5 bg-blue-500 rounded-full flex-shrink-0"></span>
                        <span className="font-semibold text-zinc-900 font-mono">{className}</span>
                        {rest && (
                          <span className="font-normal text-zinc-500 text-sm">{rest.trim()}</span>
                        )}
                      </h3>
                    );
                  }
                  
                  // Fallback: render normally but with lighter weight for descriptive text
                  return (
                    <h3 className="text-base font-normal text-zinc-800 mb-2 mt-4 first:mt-0 flex items-center gap-2 flex-wrap">
                      <span className="w-1 h-5 bg-blue-500 rounded-full flex-shrink-0"></span>
                      <span className="flex items-center gap-2 flex-wrap">
                        {React.Children.map(children as React.ReactNode, (child, idx) => {
                          // If it's wrapped in strong, unwrap and style differently
                          if (React.isValidElement(child) && child.type === 'strong') {
                            const props = child.props as { children?: any };
                            const text = extractText(props?.children);
                            const classMatch = text.match(/^(\.?[^\s(]+)(.*)$/);
                            if (classMatch) {
                              const [, className, rest] = classMatch;
                              return (
                                <React.Fragment key={idx}>
                                  <span className="font-semibold text-zinc-900 font-mono">{className}</span>
                                  {rest && (
                                    <span className="font-normal text-zinc-500 text-sm">{rest.trim()}</span>
                                  )}
                                </React.Fragment>
                              );
                            }
                          }
                          return <span key={idx}>{child}</span>;
                        })}
                      </span>
                    </h3>
                  );
                },
                h4: ({ children }) => (
                  <h4 className="text-base font-semibold text-zinc-900 mb-2 mt-3 first:mt-0">
                    {children}
                  </h4>
                ),
                // Tables with better styling
                table: ({ children }) => (
                  <div className="my-4 overflow-x-auto rounded-lg border border-zinc-200 shadow-sm">
                    <table className="min-w-full divide-y divide-zinc-200">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-zinc-50">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="bg-white divide-y divide-zinc-100">
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-zinc-50 transition-colors">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-3 text-sm text-zinc-800">
                    {children}
                  </td>
                ),
                // Links
                a: ({ href, children }) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
                  >
                    {children}
                  </a>
                ),
                // Horizontal rule
                hr: () => (
                  <hr className="my-6 border-zinc-200" />
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
