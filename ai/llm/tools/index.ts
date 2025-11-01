import { GeminiToolSchema } from '../../types';
import { getUILayerData, getUILayerDataToolSchema } from './ui-layer';
import { selectWidgetByName, getWidgetSelectionToolSchema } from './widget-selection';
import {
  executeCommand,
  echoCommand,
  sedCommand,
  readFile,
  writeFile,
  appendToFile,
  grepFiles,
  findFiles,
  listDirectory,
  editFile,
  getAllFileSystemToolSchemas,
} from './file-system';

/**
 * Tool execution registry
 * Maps tool names to their execution functions
 */
export const toolExecutors: Record<string, (...args: any[]) => Promise<any>> = {
  get_ui_layer_data: async (args: { channelId: string; dataType?: string; filters?: any }) => {
    return getUILayerData(args.channelId, args.dataType as any, args.filters);
  },
  select_widget: async (args: { channelId: string; widgetName: string }) => {
    return selectWidgetByName(args.channelId, args.widgetName);
  },
  // File system tools
  execute_command: async (args: { command: string; projectLocation?: string }) => {
    return executeCommand(args.command, args.projectLocation);
  },
  echo_command: async (args: { text: string; options?: any; projectLocation?: string }) => {
    return echoCommand(args.text, args.options, args.projectLocation);
  },
  sed_command: async (args: { 
    script: string; 
    filePath?: string; 
    options?: any; 
    projectLocation?: string;
  }) => {
    return sedCommand(args.script, args.filePath, args.options, args.projectLocation);
  },
  read_file: async (args: { filePath: string; projectLocation?: string }) => {
    return readFile(args.filePath, args.projectLocation);
  },
  write_file: async (args: { filePath: string; content: string; projectLocation?: string }) => {
    return writeFile(args.filePath, args.content, args.projectLocation);
  },
  append_file: async (args: { filePath: string; content: string; projectLocation?: string }) => {
    return appendToFile(args.filePath, args.content, args.projectLocation);
  },
  grep_files: async (args: { 
    pattern: string; 
    filePath?: string; 
    options?: any; 
    projectLocation?: string;
  }) => {
    return grepFiles(args.pattern, args.filePath, args.options, args.projectLocation);
  },
  find_files: async (args: { 
    namePattern?: string;
    name_pattern?: string; // Support both camelCase and snake_case
    directory?: string; 
    options?: any; 
    projectLocation?: string;
  }) => {
    // Support both camelCase and snake_case parameter names
    const namePattern = args.namePattern || args.name_pattern;
    if (!namePattern) {
      return {
        success: false,
        error: 'namePattern is required',
      };
    }
    return findFiles(namePattern, args.directory, args.options, args.projectLocation);
  },
  list_directory: async (args: { 
    directory?: string; 
    options?: any; 
    projectLocation?: string;
  }) => {
    return listDirectory(args.directory, args.options, args.projectLocation);
  },
  edit_file: async (args: { 
    filePath: string; 
    searchText: string; 
    replaceText: string; 
    projectLocation?: string;
  }) => {
    return editFile(args.filePath, args.searchText, args.replaceText, args.projectLocation);
  },
};

/**
 * Get all tool schemas for Gemini
 */
export function getAllToolSchemas(): GeminiToolSchema[] {
  return [
    getUILayerDataToolSchema(),
    getWidgetSelectionToolSchema(),
    ...getAllFileSystemToolSchemas(),
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

