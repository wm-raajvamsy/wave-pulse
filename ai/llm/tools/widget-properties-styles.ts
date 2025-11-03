import { Type } from '@google/genai';
import { GeminiToolSchema, ToolExecutionResult } from '../../types';
import { getUILayerDataFromStore } from '../../../server/app/api/ui-layer-data/store';
import { findWidgetById } from '../../../server/utils/componentTree';

/**
 * Widget properties/styles tool description for AI prompts
 */
export const WIDGET_PROPERTIES_STYLES_TOOL_DESCRIPTION = `Get properties and styles for a widget by its ID. This tool directly fetches widget properties and styles without needing to select the widget first. Use this when you need widget properties/styles and you already know the widget ID from the component tree.`;

/**
 * Get widget properties and styles by widget ID
 * This tool directly fetches properties/styles for a widget without needing selection
 */
export async function getWidgetPropertiesStyles(
  channelId: string,
  widgetId: string
): Promise<ToolExecutionResult> {
  try {
    console.log('[get_widget_properties_styles] Starting fetch:', { channelId, widgetId });
    
    if (!channelId) {
      console.log('[get_widget_properties_styles] Error: channelId is required');
      return {
        success: false,
        error: 'channelId is required',
      };
    }

    if (!widgetId) {
      console.log('[get_widget_properties_styles] Error: widgetId is required');
      return {
        success: false,
        error: 'widgetId is required',
      };
    }

    // Get current tree from server store
    const data = getUILayerDataFromStore(channelId);
    
    if (!data || !data.componentTree) {
      console.log('[get_widget_properties_styles] Error: Component tree not available');
      return {
        success: false,
        error: 'Component tree not available. Make sure the app is connected.',
      };
    }

    // Check if widget already has properties/styles
    const widget = findWidgetById(data.componentTree, widgetId);
    console.log('[get_widget_properties_styles] Found widget:', widget ? {
      id: widget.id,
      name: widget.name,
      tagName: widget.tagName,
      hasProperties: !!widget.properties,
      hasStyles: !!widget.styles,
    } : 'null');
    
    if (!widget) {
      console.log('[get_widget_properties_styles] Error: Widget not found');
      return {
        success: false,
        error: `Widget with id "${widgetId}" not found in component tree.`,
      };
    }

    // If properties/styles already available, return them
    // For tabbar and other widgets, properties are more important than styles
    // Return success if properties exist (styles may be optional)
    if (widget.properties) {
      console.log('[get_widget_properties_styles] Widget already has properties, returning them (styles may be optional)');
      return {
        success: true,
        data: {
          widgetId: widget.id,
          widgetName: widget.name,
          properties: widget.properties,
          styles: widget.styles || {}, // Styles are optional
        },
      };
    }

    // TODO: Trigger client-side fetch via WebSocket/API
    // For now, we'll use a workaround: trigger via select_widget mechanism
    // The client-side selection will trigger the fetch of properties/styles
    
    // Note: In a production implementation, we would:
    // 1. Send a WebSocket message to the client to trigger uiAgent.invoke()
    // 2. Or create an API endpoint that triggers the client-side fetch
    // 3. Poll the server store until properties/styles are available
    
    // For now, we'll use select_widget as a workaround to trigger the fetch
    // Then poll until properties/styles are available
    
    // Trigger selection to fetch properties/styles (client-side will handle this)
    // Note: This is a workaround - ideally we'd have direct API/WebSocket trigger
    console.log('[get_widget_properties_styles] Widget does not have properties/styles, triggering fetch via selectWidgetByName:', widget.name);
    const { selectWidgetByName } = await import('./widget-selection');
    const selectResult = await selectWidgetByName(channelId, widget.name);
    console.log('[get_widget_properties_styles] selectWidgetByName result:', selectResult);
    
    if (!selectResult.success) {
      console.log('[get_widget_properties_styles] Error: selectWidgetByName failed');
      return {
        success: false,
        error: `Failed to select widget: ${selectResult.error || 'Unknown error'}`,
      };
    }
    
    // Poll for properties/styles to be synced
    const maxAttempts = 5;
    const delayMs = 2000; // 2 seconds between attempts
    
    console.log('[get_widget_properties_styles] Polling for properties/styles (max attempts:', maxAttempts, ')');
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`[get_widget_properties_styles] Poll attempt ${attempt}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      const updatedData = getUILayerDataFromStore(channelId);
      if (updatedData?.componentTree) {
        const updatedWidget = findWidgetById(updatedData.componentTree, widgetId);
        console.log(`[get_widget_properties_styles] Attempt ${attempt} - Widget status:`, updatedWidget ? {
          id: updatedWidget.id,
          name: updatedWidget.name,
          hasProperties: !!updatedWidget.properties,
          hasStyles: !!updatedWidget.styles,
          propertiesKeys: updatedWidget.properties ? Object.keys(updatedWidget.properties) : [],
        } : 'not found');
        
        // For tabbar and other widgets, properties are more important than styles
        // Return success if properties exist (styles may be optional)
        if (updatedWidget?.properties) {
          console.log('[get_widget_properties_styles] Success! Properties available after', attempt, 'attempts');
          return {
            success: true,
            data: {
              widgetId: updatedWidget.id,
              widgetName: updatedWidget.name,
              properties: updatedWidget.properties,
              styles: updatedWidget.styles || {}, // Styles are optional
            },
          };
        }
      }
    }
    
    // Timeout - properties/styles not available
    console.log('[get_widget_properties_styles] Timeout: Properties/styles not available after', maxAttempts, 'attempts');
    return {
      success: false,
      error: 'Timeout waiting for properties/styles to be available. Widget may need to be selected first, or the client may not be connected.',
    };
  } catch (error) {
    console.error('[get_widget_properties_styles] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get Gemini tool schema for widget properties/styles
 */
export function getWidgetPropertiesStylesToolSchema(): GeminiToolSchema {
  return {
    functionDeclarations: [
      {
        name: 'get_widget_properties_styles',
        description: WIDGET_PROPERTIES_STYLES_TOOL_DESCRIPTION,
        parameters: {
          type: Type.OBJECT,
          properties: {
            channelId: {
              type: Type.STRING,
              description: 'Channel identifier for the connected application session. This is automatically provided when available.',
            },
            widgetId: {
              type: Type.STRING,
              description: 'The ID of the widget to get properties/styles for. This can be obtained from the component tree via get_ui_layer_data.',
            },
          },
          required: ['widgetId'],
        },
      },
    ],
  };
}

