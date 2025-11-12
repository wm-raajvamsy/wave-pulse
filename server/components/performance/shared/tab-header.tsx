import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface TabHeaderProps {
  title: string;
  description?: string;
  legend?: React.ReactNode;
  actions?: React.ReactNode;
  legendPosition?: 'right' | 'below';
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Unified header section for all performance tabs.
 * Provides consistent title, description, legend, and actions layout.
 */
export const TabHeader: React.FC<TabHeaderProps> = ({
  title,
  description,
  legend,
  actions,
  legendPosition = 'right'
}) => {
  if (legendPosition === 'below') {
    return (
      <div className="border-b border-gray-300 pb-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-sm font-semibold">{title}</h4>
            {description && (
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
        {legend && <div>{legend}</div>}
      </div>
    );
  }

  return (
    <div className="border-b border-gray-300 pb-3 mb-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">{title}</h4>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {legend && <div>{legend}</div>}
          {actions && <div>{actions}</div>}
        </div>
      </div>
    </div>
  );
};

