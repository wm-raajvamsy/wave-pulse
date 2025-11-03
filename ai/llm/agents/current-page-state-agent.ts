/**
 * Current Page State Agent using LangGraph
 * Retrieves current page state including selected widget, page name, and element tree
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { executeTool } from '../tools';
import { CurrentPageStateAgentState } from './utils/types';
import { findSelectedWidget, findWidgetByName } from './utils/helpers';
// Import WidgetNode from server types - using relative path from ai/llm/agents/
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - TypeScript may not resolve this path correctly, but it works at runtime
import type { WidgetNode } from '../../../server/types';

/**
 * Get Element Tree Node
 * Gets the component tree from UI layer data
 */
async function getElementTreeNode(
  state: CurrentPageStateAgentState
): Promise<Partial<CurrentPageStateAgentState>> {
  const { channelId } = state;
  
  if (!channelId) {
    return {
      errors: [{ step: 'get-element-tree', error: 'channelId is required' }],
    };
  }
  
  try {
    const result = await executeTool('get_ui_layer_data', {
      channelId,
      dataType: 'components',
    });
    
    if (!result.success || !result.data?.componentTree) {
      return {
        errors: [{ 
          step: 'get-element-tree', 
          error: result.error || 'Component tree not available' 
        }],
      };
    }
    
    return {
      elementTree: result.data.componentTree,
    };
  } catch (error) {
    return {
      errors: [{ 
        step: 'get-element-tree', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }],
    };
  }
}

/**
 * Identify Target Widget Node
 * Parses query to identify which widget to fetch properties/styles for
 */
async function identifyTargetWidgetNode(
  state: CurrentPageStateAgentState
): Promise<Partial<CurrentPageStateAgentState>> {
  const { query, elementTree } = state;
  
  if (!elementTree) {
    return {
      errors: [{ step: 'identify-target-widget', error: 'Element tree not available' }],
    };
  }
  
  try {
    // Check if query mentions "selected widget" or "selected"
    const queryLower = query.toLowerCase();
    const mentionsSelected = queryLower.includes('selected widget') || 
                            queryLower.includes('selected');
    
    if (mentionsSelected) {
      // Find widget with selected: true
      const selectedWidget = findSelectedWidget(elementTree);
      if (selectedWidget) {
        return {
          targetWidgetId: selectedWidget.id,
          targetWidgetName: selectedWidget.name,
        };
      }
    }
    
    // Try to extract widget name from query
    // Look for common patterns like "button1", "widget name", etc.
    const widgetNameMatch = query.match(/(?:widget|button|label|input|text|image|container)\s+(\w+)/i);
    if (widgetNameMatch && widgetNameMatch[1]) {
      const widgetName = widgetNameMatch[1];
      const widget = findWidgetByName(elementTree, widgetName);
      if (widget) {
        return {
          targetWidgetId: widget.id,
          targetWidgetName: widget.name,
        };
      }
    }
    
    // If no specific widget mentioned, try to find selected widget
    const selectedWidget = findSelectedWidget(elementTree);
    if (selectedWidget) {
      return {
        targetWidgetId: selectedWidget.id,
        targetWidgetName: selectedWidget.name,
      };
    }
    
    // If still no widget found, return error
    return {
      errors: [{ 
        step: 'identify-target-widget', 
        error: 'Could not identify target widget from query. Please specify widget name or ensure a widget is selected.' 
      }],
    };
  } catch (error) {
    return {
      errors: [{ 
        step: 'identify-target-widget', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }],
    };
  }
}

/**
 * Get Widget Properties/Styles Node
 * Fetches properties/styles for the target widget
 */
async function getWidgetPropertiesStylesNode(
  state: CurrentPageStateAgentState
): Promise<Partial<CurrentPageStateAgentState>> {
  const { channelId, targetWidgetId, elementTree } = state;
  
  if (!channelId || !targetWidgetId) {
    return {
      errors: [{ 
        step: 'get-widget-properties-styles', 
        error: 'channelId and targetWidgetId are required' 
      }],
    };
  }
  
  try {
    // Check if widget already has properties/styles in current tree
    if (elementTree) {
      const widget = findWidgetById(elementTree, targetWidgetId);
      if (widget && widget.properties && widget.styles) {
        return {
          selectedWidget: {
            widgetId: widget.id,
            widgetName: widget.name,
            properties: widget.properties,
            styles: widget.styles,
          },
        };
      }
    }
    
    // Fetch properties/styles using the tool
    const result = await executeTool('get_widget_properties_styles', {
      channelId,
      widgetId: targetWidgetId,
    });
    
    if (!result.success || !result.data) {
      return {
        errors: [{ 
          step: 'get-widget-properties-styles', 
          error: result.error || 'Failed to fetch widget properties/styles' 
        }],
      };
    }
    
    return {
      selectedWidget: {
        widgetId: result.data.widgetId,
        widgetName: result.data.widgetName,
        properties: result.data.properties,
        styles: result.data.styles,
      },
    };
  } catch (error) {
    return {
      errors: [{ 
        step: 'get-widget-properties-styles', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }],
    };
  }
}

/**
 * Get Page Name Node
 * Gets page name from timeline PAGE_READY events (most recent)
 * Falls back to WmPage component name if timeline not available
 */
async function getPageNameNode(
  state: CurrentPageStateAgentState
): Promise<Partial<CurrentPageStateAgentState>> {
  const { channelId, elementTree } = state;

  if (!elementTree) {
    console.log('[Current Page State Agent] getPageNameNode: Element tree not available');
    return {
      errors: [{ step: 'get-page-name', error: 'Element tree not available' }],
    };
  }

  try {
    // Method 1: Get page name from timeline PAGE_READY events (most reliable)
    if (channelId) {
      console.log('[Current Page State Agent] getPageNameNode: Getting page name from timeline events');
      
      const timelineResult = await executeTool('get_ui_layer_data', {
        channelId,
        dataType: 'timeline',
      });

      if (timelineResult.success && timelineResult.data?.timelineLogs) {
        const timelineLogs = timelineResult.data.timelineLogs;
        
        // Find the most recent PAGE_READY event
        const pageReadyEvents = timelineLogs
          .filter((event: any) => event.name === 'PAGE_READY')
          .sort((a: any, b: any) => (b.timestamp || b.endTime || 0) - (a.timestamp || a.endTime || 0));
        
        if (pageReadyEvents.length > 0) {
          const mostRecentPageReady = pageReadyEvents[0];
          const pageName = mostRecentPageReady.data?.name;
          
          if (pageName) {
            console.log('[Current Page State Agent] getPageNameNode: Found page name from timeline:', pageName);
            return {
              activePageFromTabbar: pageName,
            };
          }
        }
        
        console.log('[Current Page State Agent] getPageNameNode: No PAGE_READY events found in timeline');
      } else {
        console.log('[Current Page State Agent] getPageNameNode: Timeline data not available:', {
          success: timelineResult.success,
          hasData: !!timelineResult.data,
        });
      }
    }

    // Fallback: try to get page name from WmPage component
    const pageName = extractPageNameFromTree(elementTree);
    if (pageName) {
      console.log('[Current Page State Agent] getPageNameNode: Using fallback - page name from WmPage:', pageName);
      return {
        activePageFromTabbar: pageName,
      };
    }

    console.log('[Current Page State Agent] getPageNameNode: Could not determine page name');
    return {
      activePageFromTabbar: undefined,
    };
  } catch (error) {
    console.error('[Current Page State Agent] getPageNameNode: Error:', error);
    
    // Fallback on error too
    const pageName = extractPageNameFromTree(elementTree);
    if (pageName) {
      console.log('[Current Page State Agent] getPageNameNode: Using fallback after error - page name from WmPage:', pageName);
      return {
        activePageFromTabbar: pageName,
      };
    }
    
    return {
      errors: [{
        step: 'get-page-name',
        error: error instanceof Error ? error.message : 'Unknown error'
      }],
    };
  }
}

/**
 * Extract page name from the WmPage component in the tree
 */
function extractPageNameFromTree(elementTree: WidgetNode | null | undefined): string | null {
  if (!elementTree) return null;

  // Check if this is the WmPage component
  const tagName = elementTree.tagName?.toLowerCase() || '';
  if (tagName === 'wmpage' && elementTree.name) {
    return elementTree.name;
  }

  // Recursively search children
  if (elementTree.children && Array.isArray(elementTree.children)) {
    for (const child of elementTree.children) {
      const pageName = extractPageNameFromTree(child);
      if (pageName) return pageName;
    }
  }

  return null;
}

/**
 * Assemble State Node
 * Combines all gathered information into currentPageState
 */
async function assembleStateNode(
  state: CurrentPageStateAgentState
): Promise<Partial<CurrentPageStateAgentState>> {
  const { elementTree, selectedWidget, activePageFromTabbar } = state;
  
  console.log('[Current Page State Agent] assembleStateNode: Assembling state:', {
    hasElementTree: !!elementTree,
    hasSelectedWidget: !!selectedWidget,
    activePageFromTabbar,
    selectedWidgetName: selectedWidget?.widgetName,
  });
  
  return {
    currentPageState: {
      pageName: activePageFromTabbar,
      activePageFromTabbar,
      selectedWidget,
      elementTree,
    },
  };
}

/**
 * Helper function to find widget by ID in tree
 * Handles string conversion for ID comparison
 */
function findWidgetById(tree: WidgetNode, widgetId: string): WidgetNode | null {
  if (!tree) return null;
  
  // Convert both IDs to strings for comparison (handles type mismatches)
  const nodeId = String(tree.id);
  const searchId = String(widgetId);
  
  if (nodeId === searchId) {
    return tree;
  }
  
  if (tree.children && Array.isArray(tree.children)) {
    for (const child of tree.children) {
      const found = findWidgetById(child, widgetId);
      if (found) return found;
    }
  }
  
  return null;
}

/**
 * Create Current Page State Agent
 */
export function createCurrentPageStateAgent(
  channelId?: string,
  projectLocation?: string
) {
  const workflow = new StateGraph<CurrentPageStateAgentState>({
    channels: {
      channelId: { reducer: (x, y) => y ?? x },
      query: { reducer: (x, y) => y ?? x },
      elementTree: { reducer: (x, y) => y ?? x },
      targetWidgetId: { reducer: (x, y) => y ?? x },
      targetWidgetName: { reducer: (x, y) => y ?? x },
      selectedWidget: { reducer: (x, y) => y ?? x },
      activePageFromTabbar: { reducer: (x, y) => y ?? x },
      currentPageState: { reducer: (x, y) => y ?? x },
      errors: { reducer: (x, y) => y ? [...(x || []), ...y] : x },
    },
  } as any)
    .addNode('get-element-tree', getElementTreeNode as any)
    .addNode('identify-target-widget', identifyTargetWidgetNode as any)
    .addNode('get-widget-properties-styles', getWidgetPropertiesStylesNode as any)
    .addNode('get-page-name', getPageNameNode as any)
    .addNode('assemble-state', assembleStateNode as any)
    
    .addEdge(START, 'get-element-tree')
    .addEdge('get-element-tree', 'identify-target-widget')
    .addEdge('identify-target-widget', 'get-widget-properties-styles')
    .addEdge('get-widget-properties-styles', 'get-page-name')
    .addEdge('get-page-name', 'assemble-state')
    .addEdge('assemble-state', END);

  return workflow;
}

