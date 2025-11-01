import { UILayerData } from '@/types';

// In-memory storage for UI Layer data, keyed by channelId
export const uiLayerDataStore = new Map<string, UILayerData>();

/**
 * Get UI Layer data for a channel
 * @param channelId - Channel identifier
 * @returns UILayerData or null if not found
 */
export function getUILayerDataFromStore(channelId: string): UILayerData | null {
  return uiLayerDataStore.get(channelId) || null;
}

/**
 * Store UI Layer data for a channel
 * @param channelId - Channel identifier
 * @param data - UI Layer data to store
 */
export function setUILayerDataToStore(channelId: string, data: UILayerData): void {
  uiLayerDataStore.set(channelId, {
    ...data,
    timestamp: Date.now(),
  });
}

