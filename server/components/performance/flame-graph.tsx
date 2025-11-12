"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { TabHeader, EmptyState, Legend, LegendItem } from './utils';

// ============================================================================
// TYPES
// ============================================================================

interface FlameGraphProps {
  session: {
    components?: ComponentData[];
  };
}

interface ComponentData {
  widgetName?: string;
  componentName?: string;
  componentId?: string;
  totalRenderTime?: number;
  renderCount?: number;
  avgRenderTime?: number;
  widgetType?: string;
}

interface HierarchyNode {
  name: string;
  value: number;
  renderCount: number;
  avgTime: number;
  widgetType: string;
}

interface HierarchyData {
  name: string;
  children: HierarchyNode[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SVG_CONFIG = {
  WIDTH: 900,
  HEIGHT: 600,
  MARGIN: { top: 20, right: 20, bottom: 20, left: 20 }
} as const;

const TEXT_CONFIG = {
  MIN_WIDTH_FOR_LABEL: 50,
  MIN_HEIGHT_FOR_METRICS: 35,
  LABEL_PADDING: 4,
  LABEL_Y_OFFSET: 16,
  METRICS_Y_OFFSET: 30,
  CHARS_PER_PIXEL: 7
} as const;

const COLORS = {
  GRADIENT: ['#bbf7d0', '#86efac', '#fde68a', '#fdba74', '#fca5a5', '#f87171'],
  BORDERS: {
    LOW: '#16a34a',
    MEDIUM: '#ea580c',
    HIGH: '#dc2626',
    DEFAULT: '#d1d5db',
    HOVER: '#000'
  },
  FILL: {
    DEFAULT: '#f3f4f6'
  },
  TEXT: {
    PRIMARY: '#1f2937',
    SECONDARY: '#4b5563'
  }
} as const;

const BORDER_THRESHOLDS = {
  LOW: 0.33,
  MEDIUM: 0.67
} as const;

const STROKE_WIDTH = {
  DEFAULT: 2,
  HOVER: 3
} as const;

const FLAME_LEGEND: LegendItem[] = [
  { label: 'Low', color: '#bbf7d0', border: '#16a34a' },
  { label: 'Medium', color: '#fdba74', border: '#ea580c' },
  { label: 'High', color: '#fca5a5', border: '#dc2626' }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const prepareHierarchyData = (components: ComponentData[]): HierarchyData => {
  const componentData = components
    .filter((comp) => (comp.renderCount || 0) > 0)
    .map((comp) => ({
      name: comp.widgetName || comp.componentName || comp.componentId || 'Unknown',
      value: comp.totalRenderTime || 0,
      renderCount: comp.renderCount || 0,
      avgTime: comp.avgRenderTime || 0,
      widgetType: comp.widgetType || 'N/A'
    }))
    .sort((a, b) => b.value - a.value);

  return {
    name: 'Root',
    children: componentData
  };
};

const getBorderColor = (totalTime: number, maxTime: number): string => {
  const ratio = totalTime / maxTime;
  if (ratio < BORDER_THRESHOLDS.LOW) return COLORS.BORDERS.LOW;
  if (ratio < BORDER_THRESHOLDS.MEDIUM) return COLORS.BORDERS.MEDIUM;
  return COLORS.BORDERS.HIGH;
};

const truncateText = (text: string, maxWidth: number): string => {
  const maxChars = Math.floor(maxWidth / TEXT_CONFIG.CHARS_PER_PIXEL);
  return text.length > maxChars ? text.slice(0, maxChars) + '...' : text;
};

const shouldShowLabel = (width: number): boolean => {
  return width >= TEXT_CONFIG.MIN_WIDTH_FOR_LABEL;
};

const shouldShowMetrics = (width: number, height: number): boolean => {
  return width >= TEXT_CONFIG.MIN_WIDTH_FOR_LABEL && height >= TEXT_CONFIG.MIN_HEIGHT_FOR_METRICS;
};

const createTooltipContent = (data: HierarchyNode): string => {
  const widgetTypeHtml = data.widgetType && data.widgetType !== 'N/A'
    ? `<div style="color: #9ca3af; font-size: 10px; margin-bottom: 4px;">${data.widgetType}</div>`
    : '';

  return `
    <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${data.name}</div>
    ${widgetTypeHtml}
    <div style="color: #6b7280;">Total Time: <strong>${data.value?.toFixed(2)}ms</strong></div>
    <div style="color: #6b7280;">Avg Time: <strong>${data.avgTime?.toFixed(2)}ms</strong></div>
    <div style="color: #6b7280;">Renders: <strong>${data.renderCount}×</strong></div>
  `;
};

const getTooltipPosition = (
  event: MouseEvent,
  tooltipWidth = 200,
  tooltipHeight = 120
): { left: string; top: string } => {
  const padding = 10;
  const { pageX, pageY } = event;
  const { innerWidth, innerHeight } = window;

  let left = pageX + padding;
  let top = pageY + padding;

  // Check right edge
  if (left + tooltipWidth > innerWidth) {
    left = pageX - tooltipWidth - padding;
  }

  // Check bottom edge
  if (top + tooltipHeight > innerHeight) {
    top = pageY - tooltipHeight - padding;
  }

  // Ensure tooltip doesn't go off left edge
  if (left < 0) {
    left = padding;
  }

  // Ensure tooltip doesn't go off top edge
  if (top < 0) {
    top = padding;
  }

  return {
    left: `${left}px`,
    top: `${top}px`
  };
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function FlameGraph({ session }: FlameGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const hierarchyData = useMemo(
    () => prepareHierarchyData(session.components || []),
    [session.components]
  );

  useEffect(() => {
    if (!svgRef.current || hierarchyData.children.length === 0) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const chartWidth = SVG_CONFIG.WIDTH - SVG_CONFIG.MARGIN.left - SVG_CONFIG.MARGIN.right;
    const chartHeight = SVG_CONFIG.HEIGHT - SVG_CONFIG.MARGIN.top - SVG_CONFIG.MARGIN.bottom;

    const g = svg
      .attr('width', SVG_CONFIG.WIDTH)
      .attr('height', SVG_CONFIG.HEIGHT)
      .append('g')
      .attr('transform', `translate(${SVG_CONFIG.MARGIN.left},${SVG_CONFIG.MARGIN.top})`);

    // Create hierarchy
    const root = d3
      .hierarchy(hierarchyData)
      .sum((d: any) => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create treemap layout
    d3.treemap<HierarchyData>()
      .size([chartWidth, chartHeight])
      .padding(1)
      .round(true)(root as any);

    // Color scale
    const maxTotalTime = d3.max(hierarchyData.children, (d) => d.value) || 1;
    const colorScale = d3
      .scaleSequential()
      .domain([0, maxTotalTime])
      .interpolator(d3.interpolateRgbBasis([...COLORS.GRADIENT]));

    // Create cells
    const cell = g
      .selectAll('g')
      .data(root.leaves())
      .join('g')
      .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`);

    // Helper to get fill color
    const getFillColor = (d: any) => 
      d.data.renderCount ? colorScale(d.data.value) : COLORS.FILL.DEFAULT;

    // Helper to get stroke color
    const getStrokeColor = (d: any) =>
      d.data.renderCount ? getBorderColor(d.data.value, maxTotalTime) : COLORS.BORDERS.DEFAULT;

    // Add clip paths to prevent text overflow
    cell
      .append('clipPath')
      .attr('id', (d: any, i: number) => `clip-${i}`)
      .append('rect')
      .attr('width', (d: any) => Math.max(0, d.x1 - d.x0 - 2))
      .attr('height', (d: any) => Math.max(0, d.y1 - d.y0 - 2))
      .attr('x', 1)
      .attr('y', 1);

    // Add rectangles
    cell
      .append('rect')
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('fill', getFillColor)
      .attr('stroke', getStrokeColor)
      .attr('stroke-width', STROKE_WIDTH.DEFAULT)
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d: any) {
        d3.select(this)
          .attr('stroke', COLORS.BORDERS.HOVER)
          .attr('stroke-width', STROKE_WIDTH.HOVER);

        const position = getTooltipPosition(event);
        d3.select('body')
          .append('div')
          .attr('class', 'flame-graph-tooltip')
          .style('position', 'absolute')
          .style('background', 'white')
          .style('border', '1px solid #d1d5db')
          .style('padding', '8px 12px')
          .style('border-radius', '6px')
          .style('pointer-events', 'none')
          .style('z-index', '1000')
          .style('box-shadow', '0 4px 6px rgba(0,0,0,0.1)')
          .style('font-size', '12px')
          .style('line-height', '1.5')
          .html(createTooltipContent(d.data))
          .style('left', position.left)
          .style('top', position.top);
      })
      .on('mouseout', function (event, d: any) {
        d3.select(this)
          .attr('stroke', getStrokeColor)
          .attr('stroke-width', STROKE_WIDTH.DEFAULT);

        d3.selectAll('.flame-graph-tooltip').remove();
      });

    // Helper to add text with common attributes
    const addCellText = (
      yOffset: number,
      fill: string,
      fontSize: string,
      textFn: (d: any) => string,
      fontWeight?: string
    ) => {
      const text = cell
        .append('text')
        .attr('x', TEXT_CONFIG.LABEL_PADDING)
        .attr('y', yOffset)
        .attr('fill', fill)
        .attr('font-size', fontSize)
        .attr('clip-path', (d: any, i: number) => `url(#clip-${i})`)
        .style('pointer-events', 'none')
        .text(textFn);

      if (fontWeight) {
        text.attr('font-weight', fontWeight);
      }

      return text;
    };

    // Add component name label
    addCellText(
      TEXT_CONFIG.LABEL_Y_OFFSET,
      COLORS.TEXT.PRIMARY,
      '11px',
      (d: any) => {
        const width = d.x1 - d.x0;
        return shouldShowLabel(width) ? truncateText(d.data.name, width) : '';
      },
      '600'
    );

    // Add render count and time
    addCellText(
      TEXT_CONFIG.METRICS_Y_OFFSET,
      COLORS.TEXT.SECONDARY,
      '10px',
      (d: any) => {
        const width = d.x1 - d.x0;
        const height = d.y1 - d.y0;
        return shouldShowMetrics(width, height) 
          ? `${d.data.renderCount}× | ${d.data.value?.toFixed(1)}ms`
          : '';
      }
    );

    // Cleanup on unmount
    return () => {
      d3.selectAll('.flame-graph-tooltip').remove();
    };
  }, [hierarchyData]);

  if (hierarchyData.children.length === 0) {
    return <EmptyState message="No render data to display" />;
  }

  return (
    <div className="w-full">
      <TabHeader
        title="Flame Graph"
        description="Size & Color: Total render time (larger/redder = slower) | Hover for details"
        legend={<Legend items={FLAME_LEGEND} size="md" />}
      />
      <div className="flex justify-center overflow-auto">
        <svg ref={svgRef} />
      </div>
    </div>
  );
}
