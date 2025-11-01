"use client";

import { useContext, useEffect, useRef, useCallback } from 'react';
import { UIAgentContext } from './hooks';
import { UILayerData, WidgetNode } from '@/types';
import { markSelectedElement } from '@/utils/componentTree';
import { CALLS } from '@/wavepulse/constants';

const SYNC_INTERVAL = 2500; // Sync every 2.5 seconds
const DEBOUNCE_DELAY = 500; // Debounce data changes by 500ms

/**
 * Hook to sync UIAgent currentSessionData to server
 * @param channelId - Channel identifier
 * @param selectedElementId - Optional ID of the currently selected element in the component tree
 */
export function useUILayerSync(channelId: string, selectedElementId?: string | null) {
  const uiAgent = useContext(UIAgentContext);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncDataRef = useRef<string>('');
  // Use ref to always have latest selectedElementId in closures (intervals/debounces)
  const selectedElementIdRef = useRef<string | null | undefined>(selectedElementId);
  // Cache for properties and styles to avoid refetching
  const widgetDataCacheRef = useRef<{
    widgetId: string | null;
    properties?: Record<string, any>;
    styles?: WidgetNode['styles'];
  }>({ widgetId: null });

  // Keep ref updated
  useEffect(() => {
    selectedElementIdRef.current = selectedElementId;
  }, [selectedElementId]);

  // Sync data to server - defined early so it can be used in effects
  const syncToServer = useCallback(async () => {
    if (!uiAgent || !channelId) {
      return;
    }

    try {
      // Mark the selected element in the component tree before syncing
      // Use ref to get latest value even when called from interval/debounce
      const currentSelectedId = selectedElementIdRef.current || null;
      const cachedData = widgetDataCacheRef.current;
      
      // Only attach properties/styles if they're for the currently selected widget
      const properties = cachedData.widgetId === currentSelectedId ? cachedData.properties : undefined;
      const styles = cachedData.widgetId === currentSelectedId ? cachedData.styles : undefined;
      
      const componentTree = markSelectedElement(
        uiAgent.currentSessionData.componentTree || null,
        currentSelectedId,
        properties,
        styles
      );

      // Build UILayerData from currentSessionData
      const uiLayerData: UILayerData = {
        consoleLogs: uiAgent.currentSessionData.logs || [],
        networkRequests: uiAgent.currentSessionData.requests || [],
        componentTree: componentTree,
        timelineLogs: uiAgent.currentSessionData.timelineLogs || [],
        timestamp: Date.now(),
      };

      // Serialize to check if data changed
      const serializedData = JSON.stringify(uiLayerData);
      
      // Only sync if data changed
      if (serializedData === lastSyncDataRef.current) {
        return;
      }

      lastSyncDataRef.current = serializedData;

      // Send to server
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const response = await fetch(`${baseUrl}/wavepulse/api/ui-layer-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId,
          data: uiLayerData,
        }),
      });

      if (!response.ok) {
        console.error('Failed to sync UI Layer data:', response.statusText);
      }
    } catch (error) {
      console.error('Error syncing UI Layer data:', error);
    }
  }, [uiAgent, channelId]);

  // Fetch properties and styles when selected widget changes
  useEffect(() => {
    if (!uiAgent || !selectedElementId) {
      widgetDataCacheRef.current = { widgetId: null };
      // Trigger sync to update server (remove properties/styles)
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        syncToServer();
      }, DEBOUNCE_DELAY);
      return;
    }

    // Only fetch if we don't have cached data for this widget
    if (widgetDataCacheRef.current.widgetId !== selectedElementId) {
      uiAgent.invoke(CALLS.WIDGET.GET_PROPERTIES_N_STYLES, [selectedElementId])
        .then((data: { properties?: Record<string, any>; styles?: WidgetNode['styles'] }) => {
          widgetDataCacheRef.current = {
            widgetId: selectedElementId,
            properties: data.properties,
            styles: data.styles,
          };
          // Trigger sync after properties/styles are fetched
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
          }
          debounceTimeoutRef.current = setTimeout(() => {
            syncToServer();
          }, DEBOUNCE_DELAY);
        })
        .catch((error: any) => {
          console.error('Failed to fetch widget properties and styles:', error);
          // Clear cache on error
          widgetDataCacheRef.current = { widgetId: null };
        });
    }
  }, [uiAgent, selectedElementId, syncToServer]);

  // Periodic sync
  useEffect(() => {
    if (!channelId || !uiAgent) {
      return;
    }

    // Initial sync
    syncToServer();

    // Set up periodic sync
    syncTimeoutRef.current = setInterval(() => {
      syncToServer();
    }, SYNC_INTERVAL);

    return () => {
      if (syncTimeoutRef.current) {
        clearInterval(syncTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [channelId, uiAgent, syncToServer]);

  // Debounced sync on data changes
  useEffect(() => {
    if (!channelId || !uiAgent) {
      return;
    }

    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new debounce timeout
    debounceTimeoutRef.current = setTimeout(() => {
      syncToServer();
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [
    uiAgent.currentSessionData.logs,
    uiAgent.currentSessionData.requests,
    uiAgent.currentSessionData.componentTree,
    uiAgent.currentSessionData.timelineLogs,
    selectedElementId,
    channelId,
    syncToServer,
  ]);
}

