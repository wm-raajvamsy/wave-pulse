import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface LegendItem {
  label: string;
  color: string;
  border?: string;
}

interface LegendProps {
  items: LegendItem[];
  variant?: 'inline' | 'stacked';
  size?: 'sm' | 'md';
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Reusable legend component for displaying performance indicators.
 * Used in Timeline and Flame Graph for color coding explanations.
 */
export const Legend: React.FC<LegendProps> = ({
  items,
  variant = 'inline',
  size = 'sm'
}) => {
  const containerClass = variant === 'inline' 
    ? 'flex items-center gap-3' 
    : 'flex flex-col gap-2';
  
  const swatchSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  
  return (
    <div className={containerClass}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1">
          <div
            className={`${swatchSize} rounded`}
            style={{
              backgroundColor: item.color,
              border: item.border ? `1px solid ${item.border}` : undefined
            }}
          />
          <span className={textSize}>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

