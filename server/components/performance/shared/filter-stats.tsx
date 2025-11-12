import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface FilterStatsProps {
  showing: number;
  total: number;
  itemLabel?: string;
  totalTime?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Display filter statistics with optional total time.
 * Shows count of visible items and cumulative performance metrics.
 */
export const FilterStats: React.FC<FilterStatsProps> = ({ 
  showing, 
  total, 
  itemLabel = 'items',
  totalTime 
}) => {
  return (
    <div className="text-xs text-gray-600 mt-1 flex items-center gap-3">
      <span>
        Showing {showing} of {total} {itemLabel}
      </span>
      {showing > 0 && totalTime !== undefined && (
        <span className="text-gray-500">
          | Total Time: <strong className="text-gray-700">
            {totalTime.toFixed(2)}ms
          </strong>
        </span>
      )}
    </div>
  );
};

