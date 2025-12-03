import { CALLS, EVENTS } from '@/wavepulse/constants';

// Type definitions for global wavepulse functions
declare global {
  var wavepulseSessionStore: {
    getSessionData: (channelId: string) => {
      networkLogs: any[];
      consoleLogs: any[];
      timelineLogs: any[];
    };
    clearNetworkLogs: (channelId: string) => void;
    clearConsoleLogs: (channelId: string) => void;
    clearTimelineLogs: (channelId: string) => void;
  };
  var wavepulseInvoke: (channelId: string, methodName: string, args?: any[], timeout?: number) => Promise<any>;
}

// Helper to invoke methods on mobile app via existing WebSocket connection
export async function invoke(channelId: string, methodName: string, args: any[] = [], timeout: number = 10000): Promise<any> {
  if (!global.wavepulseInvoke) {
    throw new Error('Server not initialized. Please restart the server.');
  }
  return global.wavepulseInvoke(channelId, methodName, args, timeout);
}

// Get session data (for event-based logs)
export function getSessionData(channelId: string) {
  if (!global.wavepulseSessionStore) {
    throw new Error('Session store not initialized. Please restart the server.');
  }
  return global.wavepulseSessionStore.getSessionData(channelId);
}

// Clear functions
export function clearNetworkLogs(channelId: string) {
  if (global.wavepulseSessionStore) {
    global.wavepulseSessionStore.clearNetworkLogs(channelId);
  }
}

export function clearConsoleLogs(channelId: string) {
  if (global.wavepulseSessionStore) {
    global.wavepulseSessionStore.clearConsoleLogs(channelId);
  }
}

export function clearTimelineLogs(channelId: string) {
  if (global.wavepulseSessionStore) {
    global.wavepulseSessionStore.clearTimelineLogs(channelId);
  }
}

// Helper to create JSON response
export function jsonResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Helper to create error response
export function errorResponse(message: string, status: number = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Re-export CALLS for convenience
export { CALLS, EVENTS };
