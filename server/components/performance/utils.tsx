// ============================================================================
// SHARED UTILITIES FOR PERFORMANCE COMPONENTS
// ============================================================================

/**
 * Time thresholds for performance classification
 */
export const TIME_THRESHOLDS = {
  FAST: 16,    // < 16ms is considered fast (60fps = 16.67ms per frame)
  MODERATE: 50 // < 50ms is moderate, >= 50ms is slow
} as const;

/**
 * Layout configuration for consistent tab heights
 */
export const LAYOUT_CONFIG = {
  MAX_HEIGHT: 'calc(100vh - 400px)',
  MIN_HEIGHT: '400px'
} as const;

// ============================================================================
// COLOR UTILITIES
// ============================================================================

/**
 * Get color class for render time based on thresholds
 */
export const getTimeColor = (time: number): string => {
  if (time < TIME_THRESHOLDS.FAST) return 'text-green-600';
  if (time < TIME_THRESHOLDS.MODERATE) return 'text-orange-600';
  return 'text-red-600';
};

/**
 * Get background color class for time
 */
export const getTimeBgColor = (time: number): string => {
  if (time < TIME_THRESHOLDS.FAST) return 'bg-green-50';
  if (time < TIME_THRESHOLDS.MODERATE) return 'bg-orange-50';
  return 'bg-red-50';
};

/**
 * Get border color class for time
 */
export const getTimeBorderColor = (time: number): string => {
  if (time < TIME_THRESHOLDS.FAST) return 'border-green-200';
  if (time < TIME_THRESHOLDS.MODERATE) return 'border-orange-200';
  return 'border-red-200';
};

// ============================================================================
// FORMAT UTILITIES
// ============================================================================

/**
 * Format duration in milliseconds with appropriate precision
 */
export const formatDuration = (ms: number): string => {
  return `${ms.toFixed(2)}ms`;
};

/**
 * Format large numbers with commas for readability
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

/**
 * Calculate percentage with proper rounding
 */
export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
};

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Re-export shared components for convenience
export { FilterStats } from './shared/filter-stats';
export { TabContainer } from './shared/tab-container';
export { TabHeader } from './shared/tab-header';
export { FilterSection } from './shared/filter-section';
export { Legend } from './shared/legend';
export { EmptyState } from './shared/empty-state';
export type { LegendItem } from './shared/legend';

