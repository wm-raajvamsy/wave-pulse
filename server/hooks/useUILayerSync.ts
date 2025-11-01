"use client";

import { useContext, useEffect, useRef } from 'react';
import { UIAgentContext } from './hooks';
import { UILayerData } from '@/types';

const SYNC_INTERVAL = 2500; // Sync every 2.5 seconds
const DEBOUNCE_DELAY = 500; // Debounce data changes by 500ms

/**
 * Hook to sync UIAgent currentSessionData to server
 * @param channelId - Channel identifier
 */
export function useUILayerSync(channelId: string) {
  const uiAgent = useContext(UIAgentContext);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncDataRef = useRef<string>('');

  // Sync data to server
  const syncToServer = async () => {
    if (!uiAgent || !channelId) {
      return;
    }

    try {
      // Build UILayerData from currentSessionData
      const uiLayerData: UILayerData = {
        consoleLogs: uiAgent.currentSessionData.logs || [],
        networkRequests: uiAgent.currentSessionData.requests || [],
        componentTree: uiAgent.currentSessionData.componentTree || null,
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
  };

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
  }, [channelId, uiAgent]);

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
    channelId,
  ]);
}

