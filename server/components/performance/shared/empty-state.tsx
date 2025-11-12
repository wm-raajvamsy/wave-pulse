import React from 'react';
import { Button } from '@nextui-org/react';

// ============================================================================
// TYPES
// ============================================================================

interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  height?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Consistent empty state display for when there's no data to show.
 * Used across all performance tabs.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  icon,
  action,
  height = 'h-96'
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${height} text-gray-500 text-sm gap-3`}>
      {icon && <div className="text-gray-400 text-4xl">{icon}</div>}
      <p>{message}</p>
      {action && (
        <Button
          size="sm"
          variant="flat"
          onPress={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

