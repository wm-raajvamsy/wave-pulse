import { GeminiToolSchema } from '../../types';
import { getUILayerData, getUILayerDataToolSchema } from './ui-layer';

/**
 * Tool execution registry
 * Maps tool names to their execution functions
 */
export const toolExecutors: Record<string, (...args: any[]) => Promise<any>> = {
  get_ui_layer_data: async (args: { channelId: string; dataType?: string; filters?: any }) => {
    return getUILayerData(args.channelId, args.dataType as any, args.filters);
  },
};

/**
 * Get all tool schemas for Gemini
 */
export function getAllToolSchemas(): GeminiToolSchema[] {
  return [
    getUILayerDataToolSchema(),
  ];
}

/**
 * Execute a tool by name
 */
export async function executeTool(toolName: string, args: any): Promise<any> {
  const executor = toolExecutors[toolName];
  if (!executor) {
    throw new Error(`Tool ${toolName} not found`);
  }
  return executor(args);
}

