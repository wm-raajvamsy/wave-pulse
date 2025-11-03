/**
 * Continuation prompt builder for agent tool execution
 * Constructs prompts to guide the agent after tool execution
 */

export interface ContinuationPromptContext {
  originalUserMessage: string;
  toolResults: Array<{ name: string; result: any }>;
  filePaths: string[];
  hasComponentTree: boolean;
  hasFindFiles: boolean;
  failedUILayerData: Array<{ name: string; result: any }>;
  componentTreeResult?: { name: string; result: any };
  readFileResult?: { name: string; result: any };
}

/**
 * Build continuation prompt based on context
 */
export function buildContinuationPrompt(context: ContinuationPromptContext): string {
  const {
    originalUserMessage,
    toolResults,
    filePaths,
    hasComponentTree,
    hasFindFiles,
    failedUILayerData,
    componentTreeResult,
    readFileResult,
  } = context;

  let continuationPrompt = '';

  // Always include original user request
  if (originalUserMessage) {
    continuationPrompt = `The user's original request was: "${originalUserMessage}". `;
  }

  // Detect query patterns
  const mentionsSelectedWidget = originalUserMessage.toLowerCase().includes('selected widget') || 
                                   originalUserMessage.toLowerCase().includes('the widget');
  
  const mentionsFile = /\.(component\.js|js|tsx|ts|jsx|component\.tsx?)[\s"'`]/.test(originalUserMessage) ||
                       originalUserMessage.toLowerCase().includes('component.js') ||
                       originalUserMessage.toLowerCase().includes('find') && originalUserMessage.toLowerCase().includes('file');

  // Handle widget property queries (e.g., "get caption of button1")
  const widgetPropertyQuery = originalUserMessage.match(/\b(get|what is|show|tell me|find)\s+(?:the\s+)?(caption|name|show|disabled|scrollable|classname|property|properties)\s+(?:of|for)\s+(\w+)/i);
  const widgetNameQuery = originalUserMessage.match(/\b(get|what is|show|tell me|find)\s+(?:the\s+)?(\w+)\s+(?:widget|element|component)/i);
  
  if (widgetPropertyQuery || widgetNameQuery) {
    const widgetName = widgetPropertyQuery ? widgetPropertyQuery[3] : (widgetNameQuery ? widgetNameQuery[2] : null);
    const propertyName = widgetPropertyQuery ? widgetPropertyQuery[2] : null;
    
    if (widgetName && hasComponentTree && componentTreeResult) {
      const componentTree = componentTreeResult.result.componentTree;
      
      // Find widget by name in the tree
      const findWidgetByName = (node: any, name: string): any => {
        if (node.name === name) return node;
        if (node.children && Array.isArray(node.children)) {
          for (const child of node.children) {
            const found = findWidgetByName(child, name);
            if (found) return found;
          }
        }
        return null;
      };
      
      const targetWidget = componentTree ? findWidgetByName(componentTree, widgetName) : null;
      
      if (targetWidget) {
        if (propertyName) {
          // User is asking for a specific property value
          const propertyValue = targetWidget.properties?.[propertyName.toLowerCase()];
          if (propertyValue !== undefined) {
            continuationPrompt += `CRITICAL: The user asked for the "${propertyName}" property of widget "${widgetName}". I found this widget in the component tree. The "${propertyName}" property value is: ${JSON.stringify(propertyValue)}. You MUST provide this value directly to the user in your response. `;
          } else {
            // Check if it's in the properties object with different casing
            const properties = targetWidget.properties || {};
            const propertyKeys = Object.keys(properties);
            const matchingKey = propertyKeys.find(k => k.toLowerCase() === propertyName.toLowerCase());
            if (matchingKey) {
              continuationPrompt += `CRITICAL: The user asked for the "${propertyName}" property of widget "${widgetName}". I found this widget in the component tree. The "${matchingKey}" property value is: ${JSON.stringify(properties[matchingKey])}. You MUST provide this value directly to the user in your response. `;
            } else {
              continuationPrompt += `CRITICAL: The user asked for the "${propertyName}" property of widget "${widgetName}". I found this widget in the component tree, but the "${propertyName}" property is not present in the properties object. The available properties are: ${propertyKeys.join(', ') || 'none'}. Inform the user that this property is not available. `;
            }
          }
        } else {
          // User is asking about the widget in general
          continuationPrompt += `CRITICAL: The user asked about widget "${widgetName}". I found this widget in the component tree. You MUST provide information about this widget. If they asked about properties, list all properties from the properties object. If they asked about styles, list all styles from the styles object. `;
        }
      } else {
        continuationPrompt += `CRITICAL: The user asked about widget "${widgetName}", but I could not find this widget in the component tree. Available widgets include: ${extractWidgetNames(componentTree).join(', ')}. Inform the user that this widget was not found. `;
      }
    } else if (widgetName && !hasComponentTree) {
      continuationPrompt += `CRITICAL: The user asked about widget "${widgetName}", but I need to get the component tree first. You MUST call get_ui_layer_data with dataType "components" to get the component tree, then find the widget "${widgetName}" and extract the requested information. `;
    }
  }

  // Prevent retrying failed get_ui_layer_data calls
  if (failedUILayerData.length > 0 && !hasComponentTree) {
    continuationPrompt += `WARNING: get_ui_layer_data failed with "No data found for this channelId". Do NOT retry this call. The component tree data is not currently available. If you already have widget information from a previous successful get_ui_layer_data call, use that. Otherwise, proceed with the file operations using the widget name you identified. `;
  }

  // If user mentioned a file but find_files hasn't been called, remind agent
  if (mentionsFile && !hasFindFiles && filePaths.length === 0) {
    continuationPrompt += `CRITICAL: The user mentioned a file. You MUST first call find_files to locate the exact file path before attempting to read or edit it. Do NOT guess the file path - use find_files to get the correct full path. NEVER call read_file with just a filename - always find the file first and use the full path returned by find_files. `;
  }

  // If find_files was called but read_file wasn't called with those paths
  if (hasFindFiles && filePaths.length > 0) {
    const readFilePaths = toolResults
      .filter(tr => tr.name === 'read_file' && tr.result?.filePath)
      .map(tr => tr.result.filePath);
    
    const missingPaths = filePaths.filter(path => !readFilePaths.includes(path));
    if (missingPaths.length > 0) {
      continuationPrompt += `IMPORTANT: You found these files: ${filePaths.join(', ')}. You MUST now call read_file using the EXACT paths from the find_files results. Do NOT use shortened paths or just filenames. Use the complete paths returned by find_files. `;
    }
  }

  // If user mentioned "selected widget" but we haven't gotten component tree yet and it hasn't failed
  if (mentionsSelectedWidget && !hasComponentTree && failedUILayerData.length === 0) {
    continuationPrompt += `CRITICAL: The user mentioned "selected widget". You MUST first call get_ui_layer_data with dataType "components" to get the component tree and identify which widget is currently selected. `;
  }

  // Handle selected widget queries
  if (componentTreeResult && mentionsSelectedWidget) {
    const componentTree = componentTreeResult.result.componentTree;
    const selectedWidget = findSelectedWidget(componentTree);
    
    if (selectedWidget) {
      const captionValue = selectedWidget.properties?.caption ?? '';
      continuationPrompt += `IMPORTANT: The selected widget in the component tree is "${selectedWidget.name}" (id: ${selectedWidget.id}). `;
      if (captionValue !== undefined) {
        continuationPrompt += `This widget already has a caption attribute with value "${captionValue}". When editing the file, you MUST search for the EXISTING caption attribute pattern (e.g., caption="${captionValue}" or caption="") and replace ONLY that attribute value. DO NOT search for name="${selectedWidget.name}" and add a new caption - this will create duplicates. `;
      }
    } else {
      continuationPrompt += `REMINDER: You have component tree data from get_ui_layer_data. Look for widgets with "selected: true" or check which widget is currently selected in the tree. Use that widget's "name" property to find it in the file content. `;
    }
  }

  // Handle widget property edits
  const mentionsPropertyEdit = originalUserMessage.toLowerCase().match(/\b(caption|show|disabled|name|classname)\s*=/i) ||
                               originalUserMessage.toLowerCase().includes('modify') ||
                               originalUserMessage.toLowerCase().includes('change') ||
                               originalUserMessage.toLowerCase().includes('set');

  if (readFileResult && readFileResult.result?.content && mentionsPropertyEdit) {
    const content = readFileResult.result.content;
    if (componentTreeResult) {
      const componentTree = componentTreeResult.result.componentTree;
      const selectedWidget = findSelectedWidget(componentTree);
      if (selectedWidget && content.includes(`name="${selectedWidget.name}"`)) {
        const widgetPattern = new RegExp(`name="${selectedWidget.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'g');
        const match = content.match(widgetPattern);
        if (match && match[0]) {
          const widgetTag = match[0];
          const existingAttrs = ['caption', 'show', 'disabled', 'name', 'classname'].filter(attr => 
            widgetTag.includes(`${attr}=`)
          );
          
          if (existingAttrs.length > 0) {
            continuationPrompt += `CRITICAL: The file content shows that the widget name="${selectedWidget.name}" already has these attributes: ${existingAttrs.join(', ')}. When modifying any property, you MUST search for the EXISTING attribute pattern (e.g., ${existingAttrs.map(a => `${a}="..."`).join(', ')}) and replace ONLY that attribute value. Do NOT search for name="${selectedWidget.name}" and add a new attribute - this creates duplicate attributes. Always replace existing attributes, never add new ones. `;
          }
        }
      }
    }
  }

  // Handle file paths
  if (filePaths.length > 0) {
    continuationPrompt += `CRITICAL: The file paths from previous tool results are: ${filePaths.join(', ')}. You MUST use these EXACT file paths (copy them verbatim) for ANY file operations like read_file, edit_file, or write_file. Do NOT modify, shorten, or guess these paths. Copy the entire path exactly as shown. `;
  } else if (mentionsFile && !hasFindFiles) {
    continuationPrompt += `IMPORTANT: You need to call find_files first to get the exact file path. The user mentioned a file, but you don't have the file path yet. `;
  }

  // Final instruction
  continuationPrompt += 'Based on the tool results above, continue with the next steps to complete the request. If all steps are complete, provide a final response confirming completion.';

  if (!originalUserMessage && filePaths.length === 0) {
    continuationPrompt = 'Continue with the next steps if needed, or provide a final response.';
  }

  return continuationPrompt;
}

/**
 * Helper function to find selected widget in component tree
 */
function findSelectedWidget(node: any): any {
  if (node.selected === true) return node;
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      const found = findSelectedWidget(child);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Helper function to extract widget names from component tree
 */
function extractWidgetNames(node: any, names: string[] = []): string[] {
  if (node.name) {
    names.push(node.name);
  }
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      extractWidgetNames(child, names);
    }
  }
  return names;
}

