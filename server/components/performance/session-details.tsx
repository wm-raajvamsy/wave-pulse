"use client";

import React, { useState } from 'react';
import { Button, Tabs, Tab } from '@nextui-org/react';
import ComponentList from './component-list';
import ComponentDetails from './component-details';
import TimelineView from './timeline-view';
import FlameGraph from './flame-graph';
import { TabContainer, getTimeColor } from './utils';
import { exportSession } from './exporters';

interface SessionDetailsProps {
  session: any;
  onClose: () => void;
}

export default function SessionDetails({ session, onClose }: SessionDetailsProps) {
  const [selectedComponent, setSelectedComponent] = useState<any>(null);

  // Export handlers using the new exporter system
  const handleExportJSON = () => {
    exportSession(session, 'json', { includeRawData: true });
  };

  const handleExportHTML = () => {
    exportSession(session, 'html');
  };

  return (
    <div className="flex flex-col h-full overflow-auto bg-white">
      {/* Header */}
      <div className="border-b border-gray-300 p-3 flex items-center justify-between bg-gray-50">
        <div>
          <h2 className="text-sm font-semibold">Session Details</h2>
          <p className="text-xs text-gray-600 font-mono mt-1">{session.sessionId}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="flat" 
            className="text-xs"
            onPress={handleExportHTML}
            startContent={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          >
            Export HTML
          </Button>
          <Button 
            size="sm" 
            variant="flat" 
            className="text-xs"
            onPress={handleExportJSON}
            startContent={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
            }
          >
            Export JSON
          </Button>
          <Button 
            size="sm" 
            variant="light" 
            onPress={onClose}
            startContent={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          >
            Close
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
          {/* Tabs for different views */}
          <Tabs 
            aria-label="Session views" 
            variant="underlined"
            classNames={{
              tabList: 'border-b border-gray-300',
              tab: 'text-sm',
              panel: 'pt-3'
            }}
          >
            <Tab key="overview" title="Overview">
              <TabContainer maxHeight="calc(100vh - 300px)">
                <div className="space-y-3">
                  {/* Summary Stats - Compact Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="border border-gray-200 rounded p-2 bg-white">
                      <p className="text-xs text-gray-500">Total Components</p>
                      <p className="text-xl font-bold text-gray-800 mt-0.5">{session.summary?.totalComponents || 0}</p>
                    </div>
                    <div className="border border-gray-200 rounded p-2 bg-white">
                      <p className="text-xs text-gray-500">Total Renders</p>
                      <p className="text-xl font-bold text-gray-800 mt-0.5">{session.summary?.totalRenders || 0}</p>
                    </div>
                    <div className="border border-gray-200 rounded p-2 bg-white">
                      <p className="text-xs text-gray-500">Total Render Time</p>
                      <p className="text-xl font-bold text-gray-800 mt-0.5">
                        {session.summary?.totalRenderTime?.toFixed(2) || 0}ms
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded p-2 bg-white">
                      <p className="text-xs text-gray-500">Session Duration</p>
                      <p className="text-xl font-bold text-gray-800 mt-0.5">
                        {session.duration ? `${(session.duration / 1000).toFixed(2)}s` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Performance Insights - Compact */}
                  {session.summary && (
                    <div className="border border-blue-200 bg-blue-50 rounded p-3">
                      <h4 className="text-xs font-semibold mb-2 text-gray-700">Performance Insights</h4>
                      <div className="text-xs space-y-2 text-gray-700">
                        <div className="flex items-center justify-between border-b border-blue-100 pb-1.5">
                          <span className="font-semibold text-gray-600">Most Rendered:</span>
                          <span className="font-medium text-right">{session.summary.mostRenderedComponent}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-blue-100 pb-1.5">
                          <span className="font-semibold text-gray-600">Slowest Component:</span>
                          <span className="font-medium text-right">{session.summary.slowestComponent}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-600">Total Render Time:</span>
                          <span className="font-medium">{session.summary.totalRenderTime?.toFixed(2)}ms</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timeline Statistics - Compact Grid with Borders */}
                  <div className="border border-gray-200 bg-white rounded p-3">
                    <h4 className="text-xs font-semibold mb-2 text-gray-700">Timeline Statistics</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="border border-gray-200 rounded p-2 bg-gray-50">
                        <div className="text-gray-500 mb-0.5">Total Events</div>
                        <div className="font-bold text-gray-800">{session.summary?.totalRenders || 0}</div>
                      </div>
                      <div className="border border-gray-200 rounded p-2 bg-gray-50">
                        <div className="text-gray-500 mb-0.5">Avg Render Time</div>
                        <div className="font-bold text-gray-800">{session.summary?.avgRenderTime?.toFixed(2) || 0}ms</div>
                      </div>
                      <div className="border border-gray-200 rounded p-2 bg-gray-50">
                        <div className="text-gray-500 mb-0.5">State Updates</div>
                        <div className="font-bold text-gray-800">{session.summary?.totalStateUpdates || 0}</div>
                      </div>
                      <div className="border border-gray-200 rounded p-2 bg-gray-50">
                        <div className="text-gray-500 mb-0.5">Prop Updates</div>
                        <div className="font-bold text-gray-800">{session.summary?.totalPropUpdates || 0}</div>
                      </div>
                      <div className="border border-gray-200 rounded p-2 bg-gray-50">
                        <div className="text-gray-500 mb-0.5">Lifecycle Calls</div>
                        <div className="font-bold text-gray-800">{session.summary?.totalLifecycleCalls || 0}</div>
                      </div>
                    </div>
                  </div>

                  {/* Top 5 Components - Compact & Clickable */}
                  <div className="border border-gray-200 bg-white rounded p-3">
                    <h4 className="text-xs font-semibold mb-2 text-gray-700">Top 5 Components by Render Count</h4>
                    <div className="space-y-1">
                      {(session.components || [])
                        .sort((a: any, b: any) => b.renderCount - a.renderCount)
                        .slice(0, 5)
                        .map((comp: any, idx: number) => (
                          <div 
                            key={comp.componentId} 
                            className="flex items-center justify-between text-xs py-1.5 px-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors rounded"
                            onClick={() => setSelectedComponent(comp)}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-gray-400 font-mono text-xs flex-shrink-0">{idx + 1}.</span>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold truncate">{comp.widgetName || comp.componentName}</div>
                                {comp.widgetType && <div className="text-xs text-gray-500 truncate">{comp.widgetType}</div>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs flex-shrink-0 ml-2">
                              <span className="text-gray-600">{comp.renderCount} renders</span>
                              <span className={`font-semibold ${getTimeColor(comp.avgRenderTime || 0)}`}>
                                {comp.totalRenderTime?.toFixed(2)}ms total
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </TabContainer>
            </Tab>
            
            <Tab key="components" title="Components">
              <div>
                <ComponentList 
                  components={session.components || []}
                  onSelect={setSelectedComponent}
                />
              </div>
            </Tab>
            
            <Tab key="timeline" title="Timeline">
              <div>
                <TimelineView session={session} />
              </div>
            </Tab>
            
            <Tab key="flame" title="Flame Graph">
              <div>
                <FlameGraph session={session} />
              </div>
            </Tab>
          </Tabs>
      </div>

      {/* Component details sidebar */}
      {selectedComponent && (
        <ComponentDetails 
          component={selectedComponent}
          onClose={() => setSelectedComponent(null)}
        />
      )}
    </div>
  );
}

