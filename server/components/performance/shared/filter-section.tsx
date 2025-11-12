import React from 'react';
import { Input } from '@nextui-org/react';
import { FilterStats } from './filter-stats';

// ============================================================================
// TYPES
// ============================================================================

interface FilterSectionProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  showingCount: number;
  totalCount: number;
  itemLabel: string;
  totalTime?: number;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Complete filter section with search input and statistics.
 * Used in Components and Timeline tabs for consistent filtering UI.
 */
export const FilterSection: React.FC<FilterSectionProps> = ({
  value,
  onChange,
  placeholder,
  showingCount,
  totalCount,
  itemLabel,
  totalTime,
  className = ''
}) => {
  return (
    <div className={`border-b border-gray-200 p-2 bg-white ${className}`}>
      <Input
        size="sm"
        placeholder={placeholder}
        value={value}
        onValueChange={onChange}
        classNames={{
          input: 'text-sm',
          inputWrapper: 'h-8'
        }}
      />
      <FilterStats
        showing={showingCount}
        total={totalCount}
        itemLabel={itemLabel}
        totalTime={totalTime}
      />
    </div>
  );
};

