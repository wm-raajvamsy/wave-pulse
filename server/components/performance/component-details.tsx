"use client";

import React from 'react';
import { Card, CardBody, CardHeader, Button, Accordion, AccordionItem, Chip } from '@nextui-org/react';

interface ComponentDetailsProps {
  component: any;
  onClose: () => void;
}

export default function ComponentDetails({ component, onClose }: ComponentDetailsProps) {
  const getRenderReasonColor = (reason: string) => {
    switch (reason) {
      case 'mount': return 'primary';
      case 'state-change': return 'warning';
      case 'prop-change': return 'secondary';
      case 'parent-render': return 'default';
      default: return 'default';
    }
  };

  const getRenderTimeColor = (duration: number) => {
    if (duration < 16) return 'success';
    if (duration < 50) return 'warning';
    return 'danger';
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-white border-l border-gray-300 shadow-lg z-50 flex flex-col overflow-hidden">
      <div className="flex justify-between items-start border-b border-gray-300 p-3 bg-gray-50">
        <div className="flex-1">
          <h3 className="text-sm font-semibold">
            {component.widgetName || component.componentName || component.componentId || 'Unknown'}
          </h3>
          {component.componentName && component.widgetName && (
            <p className="text-xs text-gray-600 mt-1">Component: {component.componentName}</p>
          )}
          {component.widgetType && (
            <p className="text-xs text-gray-500 mt-1">{component.widgetType}</p>
          )}
        </div>
        <Button size="sm" variant="light" onPress={onClose}>
          ✕
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {/* Statistics */}
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between items-center border-b border-gray-200 pb-1">
            <span className="text-gray-600">Total Renders:</span>
            <span className="font-semibold">{component.renderCount}</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-200 pb-1">
            <span className="text-gray-600">Total Render Time:</span>
            <span className={`font-semibold ${
              (component.avgRenderTime || 0) < 16 ? 'text-green-600' : 
              (component.avgRenderTime || 0) < 50 ? 'text-orange-600' : 'text-red-600'
            }`}>
              {component.totalRenderTime?.toFixed(2) || 0}ms
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-200 pb-1">
            <span className="text-gray-600">Min:</span>
            <span className="text-xs">{component.minRenderTime?.toFixed(2) || 0}ms</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-200 pb-1">
            <span className="text-gray-600">Max:</span>
            <span className="text-xs">{component.maxRenderTime?.toFixed(2) || 0}ms</span>
          </div>
          <div className="flex justify-between items-center border-b border-gray-200 pb-1">
            <span className="text-gray-600">Avg:</span>
            <span className="text-xs">
              {component.avgRenderTime?.toFixed(2) || 0}ms
            </span>
          </div>
        </div>

        {/* Detailed Information */}
        <Accordion 
          variant="splitted"
          isCompact
          className="px-0"
          itemClasses={{
            base: 'bg-transparent',
            title: 'text-sm',
            content: 'text-xs'
          }}
        >
          {/* Renders */}
          <AccordionItem 
            key="renders" 
            title={`Renders (${component.renders?.length || 0})`}
          >
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {component.renders?.map((render: any, idx: number) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded p-2">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      render.reason === 'mount' ? 'bg-green-100 text-green-700' :
                      render.reason === 'state' ? 'bg-blue-100 text-blue-700' :
                      render.reason === 'props' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {render.reason}
                    </span>
                    <span className={`text-xs font-semibold ${
                      render.duration < 16 ? 'text-green-600' :
                      render.duration < 50 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {render.duration?.toFixed(2)}ms
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {new Date(render.timestamp).toLocaleTimeString()}
                  </div>
                  {render.changedProps && render.changedProps.length > 0 && (
                    <div className="text-xs mt-1">
                      <span className="font-semibold">Props:</span> {render.changedProps.join(', ')}
                    </div>
                  )}
                  {render.changedState && render.changedState.length > 0 && (
                    <div className="text-xs mt-1">
                      <span className="font-semibold">State:</span> {render.changedState.join(', ')}
                    </div>
                  )}
                </div>
              )) || <p className="text-xs text-gray-500">No render data</p>}
            </div>
          </AccordionItem>

          {/* Lifecycle Calls */}
          <AccordionItem 
            key="lifecycle" 
            title={`Lifecycle Calls (${component.lifecycleCalls?.length || 0})`}
          >
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {component.lifecycleCalls?.map((call: any, idx: number) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded p-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold">{call.method}</span>
                    <span className="text-xs text-gray-600">{call.duration?.toFixed(2)}ms</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(call.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              )) || <p className="text-xs text-gray-500">No lifecycle calls</p>}
            </div>
          </AccordionItem>

          {/* State Updates */}
          <AccordionItem 
            key="state" 
            title={`State Updates (${component.stateUpdates?.length || 0})`}
          >
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {component.stateUpdates?.map((update: any, idx: number) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded p-2">
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(update.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold">Keys:</span> {update.stateKeys?.join(', ') || 'N/A'}
                  </div>
                  {update.newValues && (
                    <div className="text-xs mt-1 font-mono bg-white border border-gray-200 p-1 rounded">
                      {JSON.stringify(update.newValues, null, 2)}
                    </div>
                  )}
                </div>
              )) || <p className="text-xs text-gray-500">No state updates</p>}
            </div>
          </AccordionItem>

          {/* Prop Updates */}
          <AccordionItem 
            key="props" 
            title={`Prop Updates (${component.propUpdates?.length || 0})`}
          >
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {component.propUpdates?.map((update: any, idx: number) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded p-2">
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(update.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="text-xs">
                    <span className="font-semibold">Props:</span> {update.changedProps?.join(', ') || 'N/A'}
                  </div>
                  {update.newValues && (
                    <div className="text-xs mt-1 font-mono bg-white border border-gray-200 p-1 rounded">
                      {JSON.stringify(update.newValues, null, 2)}
                    </div>
                  )}
                </div>
              )) || <p className="text-xs text-gray-500">No prop updates</p>}
            </div>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

