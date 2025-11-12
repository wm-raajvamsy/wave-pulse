import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface TabContainerProps {
  children: React.ReactNode;
  maxHeight?: string;
  minHeight?: string;
  className?: string;
  padding?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG = {
  MAX_HEIGHT: 'calc(100vh - 400px)',
  MIN_HEIGHT: '400px'
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Height-constrained scrollable container for tab content.
 * Provides consistent overflow behavior across all performance tabs.
 */
export const TabContainer: React.FC<TabContainerProps> = ({
  children,
  maxHeight = DEFAULT_CONFIG.MAX_HEIGHT,
  minHeight = DEFAULT_CONFIG.MIN_HEIGHT,
  className = '',
  padding = true
}) => {
  const paddingClass = padding ? 'p-1' : '';
  
  return (
    <div
      className={`overflow-auto ${paddingClass} ${className}`}
      style={{
        maxHeight,
        minHeight
      }}
    >
      {children}
    </div>
  );
};

