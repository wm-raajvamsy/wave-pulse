import { Type } from '@google/genai';
import { GeminiToolSchema, ToolExecutionResult } from '../../types';
import { getUILayerDataFromStore } from '../../../server/app/api/ui-layer-data/store';
import { UI_LAYER_DATA_TOOL_DESCRIPTION } from '../prompts';

/**
 * Get UI Layer data from server store
 * This function is called by the tool execution handler
 */
export async function getUILayerData(
  channelId: string,
  dataType?: 'console' | 'network' | 'components' | 'timeline' | 'storage' | 'info' | 'all',
  filters?: {
    logLevel?: 'debug' | 'info' | 'error' | 'log' | 'warn';
    limit?: number;
    method?: string;
    status?: string;
  }
): Promise<ToolExecutionResult> {
  try {
    if (!channelId) {
      return {
        success: false,
        error: 'channelId is required',
      };
    }

    // Get data directly from server store (server-side execution)
    const data = getUILayerDataFromStore(channelId);
    
    if (!data) {
      return {
        success: false,
        error: 'No data found for this channelId',
      };
    }

    // Filter data based on dataType
    let filteredData: any = {};
    
    if (dataType === 'all' || !dataType) {
      filteredData = data;
    } else {
      switch (dataType) {
        case 'console':
          filteredData = { consoleLogs: data.consoleLogs || [] };
          break;
        case 'network':
          filteredData = { networkRequests: data.networkRequests || [] };
          break;
        case 'components':
          filteredData = { componentTree: data.componentTree || null };
          break;
        case 'timeline':
          filteredData = { timelineLogs: data.timelineLogs || [] };
          break;
        case 'storage':
          filteredData = { storage: data.storage || {} };
          break;
        case 'info':
          filteredData = { 
            appInfo: data.appInfo || null,
            platformInfo: data.platformInfo || null
          };
          break;
      }
    }

    // Apply filters if provided
    if (filters) {
      if (filteredData.consoleLogs && filters.logLevel) {
        filteredData.consoleLogs = filteredData.consoleLogs.filter(
          (log: any) => log.type === filters.logLevel
        );
      }
      
      if (filteredData.networkRequests) {
        if (filters.method) {
          filteredData.networkRequests = filteredData.networkRequests.filter(
            (req: any) => req.method?.toLowerCase() === filters.method?.toLowerCase()
          );
        }
        if (filters.status) {
          filteredData.networkRequests = filteredData.networkRequests.filter(
            (req: any) => req.status === filters.status
          );
        }
      }

      // Apply limit
      if (filters.limit) {
        if (filteredData.consoleLogs) {
          filteredData.consoleLogs = filteredData.consoleLogs.slice(-filters.limit);
        }
        if (filteredData.networkRequests) {
          filteredData.networkRequests = filteredData.networkRequests.slice(-filters.limit);
        }
      }
    }

    return {
      success: true,
      data: filteredData,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get Gemini tool schema for UI Layer data
 */
export function getUILayerDataToolSchema(): GeminiToolSchema {
  return {
    functionDeclarations: [
      {
        name: 'get_ui_layer_data',
        description: UI_LAYER_DATA_TOOL_DESCRIPTION,
        parameters: {
          type: Type.OBJECT,
          properties: {
            channelId: {
              type: Type.STRING,
              description: 'Channel identifier for the connected application session. This is automatically provided when available.',
            },
            dataType: {
              type: Type.STRING,
              enum: ['console', 'network', 'components', 'timeline', 'storage', 'info', 'all'],
              description: 'Type of data to retrieve. "console" for console logs, "network" for network requests, "components" for UI component tree and properties, "timeline" for performance timeline events (including APP_STARTUP which shows application load time), "storage" for application storage (localStorage, sessionStorage, etc.), "info" for application info (app name, version, theme, locale) and platform info (OS, version, device), or "all" for everything.',
            },
            filters: {
              type: Type.OBJECT,
              properties: {
                logLevel: {
                  type: Type.STRING,
                  enum: ['debug', 'info', 'error', 'log', 'warn'],
                  description: 'Filter console logs by log level (only applies when dataType is "console" or "all")',
                },
                limit: {
                  type: Type.NUMBER,
                  description: 'Limit the number of results returned (applies to logs or requests)',
                },
                method: {
                  type: Type.STRING,
                  description: 'Filter network requests by HTTP method (GET, POST, etc.)',
                },
                status: {
                  type: Type.STRING,
                  description: 'Filter network requests by HTTP status code',
                },
              },
              description: 'Optional filters to apply to the data',
            },
          },
          required: [],
        },
      },
    ],
  };
}

