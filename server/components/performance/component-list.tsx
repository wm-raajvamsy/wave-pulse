"use client";

import React, { useState, useMemo } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Accordion, AccordionItem } from '@nextui-org/react';
import { FilterSection, TabContainer, EmptyState, getTimeColor } from './utils';

// ============================================================================
// TYPES
// ============================================================================

interface ComponentListProps {
  components: ComponentData[];
  onSelect: (component: ComponentData) => void;
}

interface ComponentData {
  componentId: string;
  componentName?: string;
  widgetName?: string;
  widgetType?: string;
  renderCount: number;
  totalRenderTime: number;
  avgRenderTime: number;
  stateUpdates?: any[];
  propUpdates?: any[];
}

type SortKey = 'componentName' | 'renderCount' | 'totalRenderTime' | 'stateUpdates' | 'propUpdates';
type SortDirection = 'asc' | 'desc';

interface ComponentGroup {
  name: string;
  components: ComponentData[];
  totalTime: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LAYOUT_WIDGETS = [
  'app-layoutgrid',
  'app-gridrow',
  'app-gridcolumn',
  'app-linearlayout',
  'app-linearlayoutitem'
] as const;

const SORT_ICONS = {
  NONE: '⇅',
  ASC: '↑',
  DESC: '↓'
} as const;

const GROUP_TIME_THRESHOLDS = {
  LOW: 100,
  MEDIUM: 500
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a component is a layout widget
 */
const isLayoutWidget = (comp: ComponentData): boolean => {
  const widgetName = (comp.widgetName || '').toLowerCase();
  const widgetType = (comp.widgetType || '').toLowerCase();
  const componentName = (comp.componentName || '').toLowerCase();
  
  return LAYOUT_WIDGETS.some(layoutName => 
    widgetName.includes(layoutName) || 
    widgetType.includes(layoutName) ||
    componentName.includes(layoutName)
  );
};

/**
 * Filter components by search text
 */
const filterComponents = (
  components: ComponentData[],
  filterText: string
): ComponentData[] => {
  if (!filterText) return components;
  
  const lowerFilter = filterText.toLowerCase();
  return components.filter(comp => 
    comp.widgetName?.toLowerCase().includes(lowerFilter) ||
    comp.componentName?.toLowerCase().includes(lowerFilter) ||
    comp.widgetType?.toLowerCase().includes(lowerFilter) ||
    comp.componentId?.toLowerCase().includes(lowerFilter)
  );
};

/**
 * Get sortable value from component
 */
const getSortValue = (comp: ComponentData, sortKey: SortKey): string | number => {
  switch (sortKey) {
    case 'componentName':
      return comp.widgetName || comp.componentName || comp.componentId || '';
    case 'stateUpdates':
      return comp.stateUpdates?.length || 0;
    case 'propUpdates':
      return comp.propUpdates?.length || 0;
    default:
      return comp[sortKey] || 0;
  }
};

/**
 * Sort components by key and direction
 */
const sortComponents = (
  components: ComponentData[],
  sortKey: SortKey,
  sortDirection: SortDirection
): ComponentData[] => {
  return [...components].sort((a, b) => {
    const aVal = getSortValue(a, sortKey);
    const bVal = getSortValue(b, sortKey);
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
};

/**
 * Calculate total render time for a group
 */
const calculateTotalTime = (components: ComponentData[]): number => {
  return components.reduce((total, comp) => total + (comp.totalRenderTime || 0), 0);
};

/**
 * Group components into Application and Layout categories
 */
const groupComponents = (components: ComponentData[]): ComponentGroup[] => {
  const applicationComponents: ComponentData[] = [];
  const layoutWidgets: ComponentData[] = [];
  
  components.forEach(comp => {
    if (isLayoutWidget(comp)) {
      layoutWidgets.push(comp);
    } else {
      applicationComponents.push(comp);
    }
  });
  
  const groups: ComponentGroup[] = [];
  
  // Application Components first
  if (applicationComponents.length > 0) {
    groups.push({
      name: 'Application Components',
      components: applicationComponents,
      totalTime: calculateTotalTime(applicationComponents)
    });
  }
  
  // Layout Widgets last
  if (layoutWidgets.length > 0) {
    groups.push({
      name: 'Layout Widgets',
      components: layoutWidgets,
      totalTime: calculateTotalTime(layoutWidgets)
    });
  }
  
  return groups;
};

/**
 * Get color class for group total time
 */
const getGroupTimeColor = (totalTime: number): string => {
  if (totalTime < GROUP_TIME_THRESHOLDS.LOW) return 'text-green-600';
  if (totalTime < GROUP_TIME_THRESHOLDS.MEDIUM) return 'text-orange-600';
  return 'text-red-600';
};

/**
 * Get display name for component
 */
const getComponentDisplayName = (comp: ComponentData): string => {
  return comp.widgetName || comp.componentName || comp.componentId || 'Unknown';
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ComponentList({ components, onSelect }: ComponentListProps) {
  const [filterText, setFilterText] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('renderCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filter and sort components
  const filteredAndSorted = useMemo(() => {
    const filtered = filterComponents(components, filterText);
    return sortComponents(filtered, sortKey, sortDirection);
  }, [components, filterText, sortKey, sortDirection]);

  // Calculate total time for filtered components
  const filteredTotalTime = useMemo(
    () => calculateTotalTime(filteredAndSorted),
    [filteredAndSorted]
  );

  // Group components
  const groupedComponents = useMemo(
    () => groupComponents(filteredAndSorted),
    [filteredAndSorted]
  );

  // Handle column sort
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  // Get sort icon
  const getSortIcon = (key: SortKey): string => {
    if (sortKey !== key) return SORT_ICONS.NONE;
    return sortDirection === 'asc' ? SORT_ICONS.ASC : SORT_ICONS.DESC;
  };

  // Render single component row
  const renderComponentRow = (comp: ComponentData) => (
    <TableRow 
      key={comp.componentId}
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => onSelect(comp)}
    >
      <TableCell>
        <div>
          <div className="font-medium text-sm">
            {getComponentDisplayName(comp)}
          </div>
          {comp.widgetType && (
            <div className="text-xs text-gray-500 mt-0.5">{comp.widgetType}</div>
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm text-gray-700">
        {comp.componentName || '-'}
      </TableCell>
      <TableCell>
        <span className="font-medium text-sm text-gray-800">{comp.renderCount}</span>
      </TableCell>
      <TableCell>
        <span className={`font-medium text-sm ${getTimeColor(comp.avgRenderTime || 0)}`}>
          {comp.totalRenderTime?.toFixed(2) || '0'}ms
        </span>
      </TableCell>
      <TableCell className="text-sm text-gray-600">
        {comp.stateUpdates?.length || 0}
      </TableCell>
      <TableCell className="text-sm text-gray-600">
        {comp.propUpdates?.length || 0}
      </TableCell>
    </TableRow>
  );

  return (
    <div className="flex flex-col">
      {/* Filter Section */}
      <FilterSection
        value={filterText}
        onChange={setFilterText}
        placeholder="Filter by component name, widget name, or type..."
        showingCount={filteredAndSorted.length}
        totalCount={components.length}
        itemLabel="components"
        totalTime={filteredTotalTime}
      />

      {/* Grouped Component Tables */}
      <TabContainer>
        <Accordion 
          variant="splitted"
          selectionMode="multiple"
          defaultExpandedKeys={groupedComponents.map(group => group.name)}
          className="px-0"
          itemClasses={{
            base: 'bg-transparent mb-1',
            title: 'text-sm font-medium',
            content: 'p-0',
            trigger: 'py-2 hover:bg-gray-50'
          }}
        >
        {groupedComponents.map((group) => (
          <AccordionItem
            key={group.name}
            title={
              <div className="flex items-center justify-between w-full pr-2">
                <span className="font-medium">{group.name}</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-500">{group.components.length} components</span>
                  <span className={`font-medium ${getGroupTimeColor(group.totalTime)}`}>
                    {group.totalTime.toFixed(2)}ms
                  </span>
                </div>
              </div>
            }
          >
            <Table 
              aria-label={`${group.name} performance table`}
              removeWrapper
              classNames={{
                th: 'bg-gray-50 text-xs font-medium text-gray-700',
                td: 'py-2 border-b border-gray-100'
              }}
            >
              <TableHeader>
                <TableColumn>
                  <button 
                    onClick={() => handleSort('componentName')}
                    className="text-xs font-medium hover:text-blue-600 transition-colors"
                  >
                    Widget Name {getSortIcon('componentName')}
                  </button>
                </TableColumn>
                <TableColumn>
                  <span className="text-xs">Component</span>
                </TableColumn>
                <TableColumn>
                  <button 
                    onClick={() => handleSort('renderCount')}
                    className="text-xs font-medium hover:text-blue-600 transition-colors"
                  >
                    Renders {getSortIcon('renderCount')}
                  </button>
                </TableColumn>
                <TableColumn>
                  <button 
                    onClick={() => handleSort('totalRenderTime')}
                    className="text-xs font-medium hover:text-blue-600 transition-colors"
                  >
                    Total Time {getSortIcon('totalRenderTime')}
                  </button>
                </TableColumn>
                <TableColumn>
                  <button 
                    onClick={() => handleSort('stateUpdates')}
                    className="text-xs font-medium hover:text-blue-600 transition-colors"
                  >
                    State {getSortIcon('stateUpdates')}
                  </button>
                </TableColumn>
                <TableColumn>
                  <button 
                    onClick={() => handleSort('propUpdates')}
                    className="text-xs font-medium hover:text-blue-600 transition-colors"
                  >
                    Props {getSortIcon('propUpdates')}
                  </button>
                </TableColumn>
              </TableHeader>
              <TableBody>
                {group.components.map((comp) => renderComponentRow(comp))}
              </TableBody>
            </Table>
          </AccordionItem>
        ))}
        </Accordion>
      </TabContainer>
    </div>
  );
}
