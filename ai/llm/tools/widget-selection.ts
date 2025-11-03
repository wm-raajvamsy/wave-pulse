import { Type } from '@google/genai';
import { GeminiToolSchema, ToolExecutionResult } from '../../types';
import { getUILayerDataFromStore } from '../../../server/app/api/ui-layer-data/store';
import { findWidgetByName, findWidgetsByName } from '../../../server/utils/componentTree';

/**
 * Widget selection tool description for AI prompts
 */
export const WIDGET_SELECTION_TOOL_DESCRIPTION = `Select a widget in the element tree by its name. This tool allows you to find and select widgets so users can see them highlighted in the UI inspector. Use this when the user asks to "select", "show", "highlight", or "focus on" a specific widget by name. First, you may want to call get_ui_layer_data with dataType "components" to see the available widgets.`;

/**
 * Select a widget by name in the component tree
 * This function is called by the tool execution handler
 */
export async function selectWidgetByName(
  channelId: string,
  widgetName: string
): Promise<ToolExecutionResult> {
  try {
    if (!channelId) {
      return {
        success: false,
        error: 'channelId is required',
      };
    }

    if (!widgetName) {
      return {
        success: false,
        error: 'widgetName is required',
      };
    }

    // Get component tree from server store
    const data = getUILayerDataFromStore(channelId);
    
    if (!data || !data.componentTree) {
      return {
        success: false,
        error: 'Component tree not available. Make sure the app is connected.',
      };
    }

    // Try exact match first
    let widget = findWidgetByName(data.componentTree, widgetName);
    
    // If no exact match, try to find by partial name
    if (!widget) {
      const matches = findWidgetsByName(data.componentTree, widgetName);
      if (matches.length === 1) {
        widget = matches[0];
      } else if (matches.length > 1) {
        // Return info about multiple matches
        return {
          success: false,
          error: `Multiple widgets found matching "${widgetName}". Found ${matches.length} matches. Please be more specific.`,
          data: {
            matches: matches.map(w => ({
              id: w.id,
              name: w.name,
              tagName: w.tagName,
            })),
          },
        };
      }
    }

    if (!widget) {
      return {
        success: false,
        error: `Widget with name "${widgetName}" not found in the component tree.`,
      };
    }

    // Return widget information for client-side selection
    return {
      success: true,
      data: {
        widgetId: widget.id,
        widgetName: widget.name,
        tagName: widget.tagName,
        message: `Widget "${widget.name}" found. It will be selected in the element tree.`,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get Gemini tool schema for widget selection
 */
export function getWidgetSelectionToolSchema(): GeminiToolSchema {
  return {
    functionDeclarations: [
      {
        name: 'select_widget',
        description: WIDGET_SELECTION_TOOL_DESCRIPTION,
        parameters: {
          type: Type.OBJECT,
          properties: {
            channelId: {
              type: Type.STRING,
              description: 'Channel identifier for the connected application session. This is automatically provided when available.',
            },
            widgetName: {
              type: Type.STRING,
              description: 'The name of the widget to select. This should match the "name" property of the widget in the component tree. Use exact match when possible, or partial match if needed.',
            },
          },
          required: ['widgetName'],
        },
      },
    ],
  };
}

