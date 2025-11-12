"use client";

import React, { useMemo, useState } from 'react';
import { TabHeader, FilterSection, TabContainer, EmptyState, Legend, LegendItem } from './utils';

// ============================================================================
// TYPES
// ============================================================================

interface TimelineViewProps {
  session: {
    components?: ComponentData[];
    startTime: number;
    duration?: number;
  };
}

interface ComponentData {
  componentId: string;
  widgetName?: string;
  componentName?: string;
  widgetType?: string;
  renders?: RenderData[];
}

interface RenderData {
  timestamp: number;
  duration: number;
  reason?: string;
}

interface TimelineEvent {
  id: string;
  componentName: string;
  componentId: string;
  widgetType?: string;
  startTime: number;
  duration: number;
  reason: string;
  renderIndex: number;
}

interface TimeRange {
  min: number;
  max: number;
  range: number;
}

interface ReasonStyle {
  bg: string;
  text: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = {
  FAST: '#dcfce7',      // green-100
  MODERATE: '#fed7aa',  // orange-200
  SLOW: '#fecaca'       // red-200
} as const;

const BORDER_COLORS = {
  FAST: '#16a34a',      // green-600
  MODERATE: '#ea580c',  // orange-600
  SLOW: '#dc2626'       // red-600
} as const;

const THRESHOLDS = {
  FAST: 16,    // < 16ms is considered fast (60fps = 16.67ms per frame)
  MODERATE: 50 // < 50ms is moderate, >= 50ms is slow
} as const;

const LAYOUT_CONFIG = {
  GRID_COLUMNS: '2fr 80px 100px 90px 90px 3fr',
  MIN_WIDTH: 1000,
  TIME_RANGE_PADDING: 0.05, // 5% padding on each side
  MIN_BAR_WIDTH_PERCENT: 0.3
} as const;

const PERFORMANCE_LEGEND: LegendItem[] = [
  { label: '< 16ms', color: COLORS.FAST, border: BORDER_COLORS.FAST },
  { label: '16-50ms', color: COLORS.MODERATE, border: BORDER_COLORS.MODERATE },
  { label: '> 50ms', color: COLORS.SLOW, border: BORDER_COLORS.SLOW }
];

const REASON_STYLES: Record<string, ReasonStyle> = {
  mount: { bg: 'bg-green-100', text: 'text-green-700' },
  state: { bg: 'bg-blue-100', text: 'text-blue-700' },
  'state-change': { bg: 'bg-blue-100', text: 'text-blue-700' },
  props: { bg: 'bg-orange-100', text: 'text-orange-700' },
  'prop-change': { bg: 'bg-orange-100', text: 'text-orange-700' },
  'parent-render': { bg: 'bg-purple-100', text: 'text-purple-700' },
  default: { bg: 'bg-gray-100', text: 'text-gray-700' }
} as const;

const GRID_LINE_COUNT = 5;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get color scheme based on render duration
 */
const getDurationColors = (duration: number): { bg: string; border: string } => {
  if (duration < THRESHOLDS.FAST) {
    return { bg: COLORS.FAST, border: BORDER_COLORS.FAST };
  }
  if (duration < THRESHOLDS.MODERATE) {
    return { bg: COLORS.MODERATE, border: BORDER_COLORS.MODERATE };
  }
  return { bg: COLORS.SLOW, border: BORDER_COLORS.SLOW };
};

/**
 * Get styling classes for render reason tag
 */
const getReasonStyles = (reason: string): ReasonStyle => {
  return REASON_STYLES[reason] || REASON_STYLES.default;
};

/**
 * Calculate total duration from event list
 */
const calculateTotalDuration = (events: TimelineEvent[]): number => {
  return events.reduce((sum, event) => sum + event.duration, 0);
};

/**
 * Calculate the time range for the timeline with padding
 */
const calculateTimeRange = (events: TimelineEvent[]): TimeRange => {
  if (events.length === 0) {
    return { min: 0, max: 0, range: 0 };
  }
  
  const minTime = Math.min(...events.map(e => e.startTime));
  const maxTime = Math.max(...events.map(e => e.startTime + e.duration));
  const range = maxTime - minTime;
  
  // Add padding on each side for visual clarity
  const padding = range * LAYOUT_CONFIG.TIME_RANGE_PADDING;
  
  return {
    min: Math.max(0, minTime - padding),
    max: maxTime + padding,
    range: range + (padding * 2)
  };
};

/**
 * Transform component data into timeline events
 */
const prepareTimelineEvents = (
  components: ComponentData[],
  startTime: number
): TimelineEvent[] => {
  const events: TimelineEvent[] = [];

  components.forEach((comp) => {
    const componentName = comp.widgetName || comp.componentName || comp.componentId;
    
    comp.renders?.forEach((render, index) => {
      const relativeTime = render.timestamp - startTime;
      events.push({
        id: `${comp.componentId}-${index}`,
        componentName,
        componentId: comp.componentId,
        widgetType: comp.widgetType,
        startTime: relativeTime,
        duration: render.duration,
        reason: render.reason || 'unknown',
        renderIndex: index
      });
    });
  });

  // Sort chronologically
  return events.sort((a, b) => a.startTime - b.startTime);
};

/**
 * Filter events based on search text
 */
const filterEvents = (
  events: TimelineEvent[],
  searchText: string
): TimelineEvent[] => {
  if (!searchText) return events;
  
  const lowerSearch = searchText.toLowerCase();
  return events.filter(event =>
    event.componentName.toLowerCase().includes(lowerSearch) ||
    event.widgetType?.toLowerCase().includes(lowerSearch) ||
    event.reason.toLowerCase().includes(lowerSearch)
  );
};

/**
 * Format tooltip content for timeline bar
 */
const formatTooltip = (event: TimelineEvent): string => {
  return [
    event.componentName,
    `Duration: ${event.duration.toFixed(2)}ms`,
    `Start: ${event.startTime.toFixed(1)}ms`,
    `Reason: ${event.reason}`
  ].join('\n');
};

/**
 * Calculate position for timeline bar
 */
const calculateBarPosition = (
  event: TimelineEvent,
  timeRange: TimeRange
): { left: number; width: number } => {
  const leftPercent = ((event.startTime - timeRange.min) / timeRange.range) * 100;
  const widthPercent = Math.max(
    (event.duration / timeRange.range) * 100,
    LAYOUT_CONFIG.MIN_BAR_WIDTH_PERCENT
  );
  
  return {
    left: Math.max(0, leftPercent),
    width: widthPercent
  };
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ReasonTagProps {
  reason: string;
}

const ReasonTag: React.FC<ReasonTagProps> = ({ reason }) => {
  const styles = getReasonStyles(reason);
  
  return (
    <span className={`text-xs px-2 py-0.5 rounded inline-block ${styles.bg} ${styles.text}`}>
      {reason}
    </span>
  );
};

interface TimelineBarProps {
  event: TimelineEvent;
  timeRange: TimeRange;
}

const TimelineBar: React.FC<TimelineBarProps> = ({ event, timeRange }) => {
  const colors = getDurationColors(event.duration);
  const { left, width } = calculateBarPosition(event, timeRange);
  
  return (
    <div className="relative h-8 flex items-center">
      {/* Background track with grid lines */}
      <div className="absolute inset-y-1 inset-x-0 bg-gray-100 rounded-sm border border-gray-200">
        <div className="absolute inset-0 flex justify-between px-0.5">
          {Array.from({ length: GRID_LINE_COUNT }, (_, i) => (
            <div key={i} className="w-px bg-gray-300 opacity-30" />
          ))}
        </div>
      </div>
      
      {/* Timeline bar */}
      <div
        className="absolute rounded border-2 shadow-sm transition-all hover:shadow-md hover:z-10 cursor-pointer"
        style={{
          left: `${left}%`,
          width: `${width}%`,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          minWidth: '4px',
          height: '65%',
          top: '17.5%'
        }}
        title={formatTooltip(event)}
      />
    </div>
  );
};

interface TimelineRowProps {
  event: TimelineEvent;
  timeRange: TimeRange;
}

const TimelineRow: React.FC<TimelineRowProps> = ({ event, timeRange }) => {
  const colors = getDurationColors(event.duration);
  
  return (
    <div
      className="grid gap-3 p-2 text-xs hover:bg-gray-50 items-center"
      style={{ gridTemplateColumns: LAYOUT_CONFIG.GRID_COLUMNS }}
    >
      {/* Component Name */}
      <div className="truncate" title={event.componentName}>
        <div className="font-semibold text-gray-800">{event.componentName}</div>
        {event.widgetType && (
          <div className="text-xs text-gray-500">{event.widgetType}</div>
        )}
      </div>

      {/* Render Index */}
      <div className="text-center text-gray-600">
        {event.renderIndex + 1}
      </div>

      {/* Reason */}
      <div className="flex justify-center">
        <ReasonTag reason={event.reason} />
      </div>

      {/* Start Time */}
      <div className="text-right text-gray-600">
        {event.startTime.toFixed(1)}
      </div>

      {/* Duration */}
      <div className="text-right font-semibold" style={{ color: colors.border }}>
        {event.duration.toFixed(2)}ms
      </div>

      {/* Timeline Bar */}
      <TimelineBar event={event} timeRange={timeRange} />
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TimelineView({ session }: TimelineViewProps) {
  const [filterText, setFilterText] = useState('');

  // Prepare all timeline events from session data
  const timelineEvents = useMemo(
    () => prepareTimelineEvents(session.components || [], session.startTime),
    [session.components, session.startTime]
  );

  // Filter events based on search
  const filteredEvents = useMemo(
    () => filterEvents(timelineEvents, filterText),
    [timelineEvents, filterText]
  );

  // Calculate total time for filtered events
  const filteredTotalTime = useMemo(
    () => calculateTotalDuration(filteredEvents),
    [filteredEvents]
  );

  // Calculate time range (always based on all events for consistent zoom)
  const timeRange = useMemo(
    () => calculateTimeRange(timelineEvents),
    [timelineEvents]
  );

  // Handle empty state
  if (timelineEvents.length === 0) {
    return <EmptyState message="No render data to display" />;
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <TabHeader
        title="Render Timeline"
        description="Zoomed to show actual render activity"
        legend={<Legend items={PERFORMANCE_LEGEND} />}
      />
      
      {/* Filter Section */}
      <FilterSection
        value={filterText}
        onChange={setFilterText}
        placeholder="Filter by component name, type, or reason..."
        showingCount={filteredEvents.length}
        totalCount={timelineEvents.length}
        itemLabel="events"
        totalTime={filteredTotalTime}
      />

      {/* Timeline Grid */}
      <TabContainer padding={false}>
        <div style={{ minWidth: `${LAYOUT_CONFIG.MIN_WIDTH}px` }}>
          {/* Column Headers */}
          <div 
            className="grid gap-3 bg-gray-100 border-b border-gray-300 p-2 text-xs font-semibold sticky top-0 z-10" 
            style={{ gridTemplateColumns: LAYOUT_CONFIG.GRID_COLUMNS }}
          >
            <div>COMPONENT NAME</div>
            <div className="text-center">RENDER #</div>
            <div className="text-center">REASON</div>
            <div className="text-right">START (ms)</div>
            <div className="text-right">DURATION</div>
            <div>
              <div className="flex justify-between items-center">
                <span>TIMELINE</span>
                <span className="text-xs font-normal text-gray-500">
                  {timeRange.min.toFixed(0)}ms — {timeRange.max.toFixed(0)}ms
                </span>
              </div>
            </div>
          </div>

          {/* Event Rows */}
          <div className="divide-y divide-gray-200">
            {filteredEvents.map((event) => (
              <TimelineRow 
                key={event.id} 
                event={event} 
                timeRange={timeRange} 
              />
            ))}
          </div>
        </div>
      </TabContainer>
    </div>
  );
}
