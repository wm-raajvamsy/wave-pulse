/**
 * Page Agent using LangGraph
 * Analyzes page files and understands relationships between components, styles, scripts, and variables
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { createGeminiClient } from '../gemini';
import { PageAgentState } from './utils/types';
import { getAISeed } from '../config';

/**
 * Parse Files Node
 * Parses component.js, script.js, style.js, and variables.js files
 */
async function parseFilesNode(
  state: PageAgentState
): Promise<Partial<PageAgentState>> {
  const { pageFiles } = state;
  
  if (!pageFiles) {
    return {
      analysis: {
        understanding: 'No page files provided for analysis.',
      },
    };
  }
  
  // Store parsed files (they're already strings, just store them)
  // In a more sophisticated implementation, we could parse AST here
  return {
    // Files are already parsed as strings, we'll analyze them in mapping nodes
  };
}

/**
 * Map File Relationships Node
 * Identifies how files reference each other
 */
async function mapFileRelationshipsNode(
  state: PageAgentState
): Promise<Partial<PageAgentState>> {
  const { pageFiles } = state;
  
  if (!pageFiles) {
    return {};
  }
  
  const fileRelations: Record<string, any> = {};
  
  // Check component.js for imports
  if (pageFiles.component) {
    const componentImportsScript = /import.*from.*['"]\.\.?\/.*script/i.test(pageFiles.component);
    const componentReferencesStyles = /import.*styles|Styles|className/i.test(pageFiles.component);
    
    fileRelations.componentImportsScript = componentImportsScript;
    fileRelations.componentReferencesStyles = componentReferencesStyles;
  }
  
  // Check script.js for variable usage
  if (pageFiles.script) {
    const scriptUsesVariables = /import.*variables|Variables/i.test(pageFiles.script);
    fileRelations.scriptUsesVariables = scriptUsesVariables;
  }
  
  return {
    analysis: {
      ...state.analysis,
      fileRelations,
    },
  };
}

/**
 * Locate Widgets Node
 * Finds widget locations in component.js
 */
async function locateWidgetsNode(
  state: PageAgentState
): Promise<Partial<PageAgentState>> {
  const { pageFiles, currentPageState } = state;
  
  if (!pageFiles?.component) {
    return {};
  }
  
  const widgetLocations: Record<string, any> = {};
  const componentContent = pageFiles.component;
  const lines = componentContent.split('\n');
  
  // Find widget instances - look for common patterns like <WidgetName, WidgetName name="..."
  const widgetPattern = /<(\w+)(?:\s+name=["'](\w+)["'])?/g;
  let match;
  
  while ((match = widgetPattern.exec(componentContent)) !== null) {
    const widgetTag = match[1];
    const widgetName = match[2] || widgetTag.toLowerCase();
    const lineNumber = componentContent.substring(0, match.index).split('\n').length;
    
    if (!widgetLocations[widgetName]) {
      widgetLocations[widgetName] = {
        tagName: widgetTag,
        file: 'component.js',
        line: lineNumber,
        instances: [],
      };
    }
    
    widgetLocations[widgetName].instances.push({
      line: lineNumber,
      fullMatch: match[0],
    });
  }
  
  // Also check for selected widget from currentPageState
  if (currentPageState?.selectedWidget?.widgetName) {
    const selectedWidgetName = currentPageState.selectedWidget.widgetName;
    if (!widgetLocations[selectedWidgetName]) {
      // Try to find it by searching for the widget name
      const searchPattern = new RegExp(`(?:name=["'])?${selectedWidgetName}(?:["'])?`, 'i');
      const widgetMatch = componentContent.match(searchPattern);
      if (widgetMatch) {
        const lineNumber = componentContent.substring(0, widgetMatch.index || 0).split('\n').length;
        widgetLocations[selectedWidgetName] = {
          tagName: 'Unknown',
          file: 'component.js',
          line: lineNumber,
          instances: [{ line: lineNumber }],
        };
      }
    }
  }
  
  return {
    analysis: {
      ...state.analysis,
      widgetLocations,
    },
  };
}

/**
 * Map Event Handlers Node
 * Extracts event handlers from both script.js AND component.js (inline handlers)
 */
async function mapEventHandlersNode(
  state: PageAgentState
): Promise<Partial<PageAgentState>> {
  const { pageFiles, currentPageState } = state;
  
  const eventHandlers: Record<string, any> = {};
  
  // 1. Extract event handlers from script.js (function-based handlers)
  if (pageFiles?.script) {
    const scriptContent = pageFiles.script;
    
    // Find event handler functions - look for patterns like onButton1Tap, onWidgetNameEvent
    const eventHandlerPattern = /(?:function\s+)?(on\w+)\s*[=:]?\s*\([^)]*\)\s*[=>{]/g;
    let match;
    
    while ((match = eventHandlerPattern.exec(scriptContent)) !== null) {
      const handlerName = match[1];
      const lineNumber = scriptContent.substring(0, match.index).split('\n').length;
      
      // Extract widget name from handler name (e.g., onButton1Tap -> button1)
      const widgetNameMatch = handlerName.match(/on(\w+)(Tap|Click|Change|Press|Select)/i);
      const widgetName = widgetNameMatch ? widgetNameMatch[1].toLowerCase() : handlerName;
      
      // Extract function body
      const functionStart = match.index;
      let braceCount = 0;
      let functionBody = '';
      let inFunction = false;
      
      for (let i = functionStart; i < scriptContent.length; i++) {
        const char = scriptContent[i];
        if (char === '{') {
          braceCount++;
          inFunction = true;
        }
        if (inFunction) {
          functionBody += char;
        }
        if (char === '}') {
          braceCount--;
          if (braceCount === 0 && inFunction) {
            break;
          }
        }
      }
      
      eventHandlers[widgetName] = {
        event: handlerName,
        handler: handlerName,
        function: functionBody || handlerName,
        location: 'script.js',
        line: lineNumber,
      };
    }
    
    // Also check for selected widget's event handlers in script.js
    if (currentPageState?.selectedWidget?.widgetName) {
      const selectedWidgetName = currentPageState.selectedWidget.widgetName;
      const handlerPattern = new RegExp(`on${selectedWidgetName}\\w+`, 'i');
      const handlerMatch = scriptContent.match(handlerPattern);
      if (handlerMatch && !eventHandlers[selectedWidgetName]) {
        const lineNumber = scriptContent.substring(0, handlerMatch.index || 0).split('\n').length;
        eventHandlers[selectedWidgetName] = {
          event: handlerMatch[0],
          handler: handlerMatch[0],
          function: handlerMatch[0],
          location: 'script.js',
          line: lineNumber,
        };
      }
    }
  }
  
  // 2. Extract INLINE event handlers from component.js (JSX inline handlers)
  if (pageFiles?.component) {
    const componentContent = pageFiles.component;
    
    // Helper function to extract balanced braces content
    const extractBracedContent = (str: string, startIndex: number): { content: string; endIndex: number } | null => {
      if (str[startIndex] !== '{') return null;
      
      let braceCount = 0;
      let i = startIndex;
      
      while (i < str.length) {
        if (str[i] === '{') braceCount++;
        if (str[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            return {
              content: str.substring(startIndex + 1, i), // Exclude outer braces
              endIndex: i + 1
            };
          }
        }
        i++;
      }
      
      return null;
    };
    
    // Find all widgets with name attributes and extract inline event handlers
    // This handles multi-line JSX tags properly
    const widgetNamePattern = /name=["'](\w+)["']/g;
    let nameMatch;
    
    while ((nameMatch = widgetNamePattern.exec(componentContent)) !== null) {
      const widgetName = nameMatch[1];
      const nameStart = nameMatch.index;
      
      // Find the start of this widget tag (look backwards for <)
      let tagStart = nameStart;
      while (tagStart > 0 && componentContent[tagStart] !== '<') tagStart--;
      
      // Find the end of this widget tag (handle multi-line tags)
      // Look for /> or > that closes the tag, handling nested braces
      let tagEnd = nameStart;
      let braceCount = 0;
      let inString = false;
      let stringChar = '';
      
      while (tagEnd < componentContent.length) {
        const char = componentContent[tagEnd];
        
        // Handle strings (to avoid matching braces inside strings)
        if (!inString && (char === '"' || char === "'")) {
          inString = true;
          stringChar = char;
        } else if (inString && char === stringChar && componentContent[tagEnd - 1] !== '\\') {
          inString = false;
        }
        
        if (!inString) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
          
          // Found closing tag: /> or > (when braceCount is 0 or negative)
          if (char === '>' && componentContent[tagEnd - 1] === '/') {
            tagEnd++;
            break;
          } else if (char === '>' && braceCount <= 0) {
            tagEnd++;
            break;
          }
        }
        
        tagEnd++;
      }
      
      // Extract the widget tag (may span multiple lines)
      const widgetTag = componentContent.substring(tagStart, Math.min(tagEnd, componentContent.length));
      
      // Look for event handlers: onTap={...}, onClick={...}, etc.
      const eventPatterns = ['onTap', 'onClick', 'onChange', 'onPress', 'onSelect', 'onFocus', 'onBlur'];
      
      for (const eventPattern of eventPatterns) {
        const eventIndex = widgetTag.indexOf(eventPattern);
        if (eventIndex === -1) continue;
        
        // Find the ={ part
        const equalsIndex = widgetTag.indexOf('=', eventIndex);
        if (equalsIndex === -1) continue;
        
        // Find the opening brace (handle whitespace)
        let braceIndex = equalsIndex + 1;
        while (braceIndex < widgetTag.length && /\s/.test(widgetTag[braceIndex])) braceIndex++;
        if (braceIndex >= widgetTag.length || widgetTag[braceIndex] !== '{') continue;
        
        // Extract balanced brace content (from the full component content, not just tag)
        // This handles multi-line handlers properly
        const absoluteBraceIndex = tagStart + braceIndex;
        const braceResult = extractBracedContent(componentContent, absoluteBraceIndex);
        if (!braceResult) continue;
        
        const handlerBody = braceResult.content.trim();
        const lineNumber = componentContent.substring(0, tagStart).split('\n').length;
        
        console.log(`[Page Agent] Found inline event handler for ${widgetName}: ${eventPattern} at line ${lineNumber}`);
        console.log(`[Page Agent] Handler body: ${handlerBody.substring(0, 100)}${handlerBody.length > 100 ? '...' : ''}`);
        
        // Only add if we don't already have this handler
        if (!eventHandlers[widgetName]) {
          eventHandlers[widgetName] = {
            event: eventPattern,
            handler: `inline ${eventPattern}`,
            function: handlerBody,
            location: 'component.js',
            line: lineNumber,
            isInline: true,
          };
        } else if (!eventHandlers[widgetName].inlineHandler) {
          eventHandlers[widgetName].inlineHandler = {
            event: eventPattern,
            body: handlerBody,
            location: 'component.js',
            line: lineNumber,
          };
        }
        
        break; // Only process first event handler found for this widget
      }
    }
    
    // Special handling for selected widget - ensure we catch it even if pattern matching missed it
    if (currentPageState?.selectedWidget?.widgetName && !eventHandlers[currentPageState.selectedWidget.widgetName]) {
      const selectedWidgetName = currentPageState.selectedWidget.widgetName;
      
      // Search for the widget name again with same logic as above
      const selectedPattern = new RegExp(`name=["']${selectedWidgetName}["']`, 'g');
      const selectedMatch = selectedPattern.exec(componentContent);
      
      if (selectedMatch) {
        const nameStart = selectedMatch.index;
        
        // Find tag boundaries (same logic as above)
        let tagStart = nameStart;
        while (tagStart > 0 && componentContent[tagStart] !== '<') tagStart--;
        
        let tagEnd = nameStart;
        let braceCount = 0;
        let inString = false;
        let stringChar = '';
        
        while (tagEnd < componentContent.length) {
          const char = componentContent[tagEnd];
          if (!inString && (char === '"' || char === "'")) {
            inString = true;
            stringChar = char;
          } else if (inString && char === stringChar && componentContent[tagEnd - 1] !== '\\') {
            inString = false;
          }
          if (!inString) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
            if (char === '>' && componentContent[tagEnd - 1] === '/') {
              tagEnd++;
              break;
            } else if (char === '>' && braceCount <= 0) {
              tagEnd++;
              break;
            }
          }
          tagEnd++;
        }
        
        const widgetTag = componentContent.substring(tagStart, Math.min(tagEnd, componentContent.length));
        
        // Look for event handlers
        const eventPatterns = ['onTap', 'onClick', 'onChange', 'onPress', 'onSelect'];
        for (const eventPattern of eventPatterns) {
          const eventIndex = widgetTag.indexOf(eventPattern);
          if (eventIndex === -1) continue;
          
          const equalsIndex = widgetTag.indexOf('=', eventIndex);
          if (equalsIndex === -1) continue;
          
          let braceIndex = equalsIndex + 1;
          while (braceIndex < widgetTag.length && /\s/.test(widgetTag[braceIndex])) braceIndex++;
          if (braceIndex >= widgetTag.length || widgetTag[braceIndex] !== '{') continue;
          
          const absoluteBraceIndex = tagStart + braceIndex;
          const braceResult = extractBracedContent(componentContent, absoluteBraceIndex);
          if (!braceResult) continue;
          
          const handlerBody = braceResult.content.trim();
          const lineNumber = componentContent.substring(0, tagStart).split('\n').length;
          
          eventHandlers[selectedWidgetName] = {
            event: eventPattern,
            handler: `inline ${eventPattern}`,
            function: handlerBody,
            location: 'component.js',
            line: lineNumber,
            isInline: true,
          };
          break;
        }
      }
    }
  }
  
  console.log(`[Page Agent] Event handlers extracted:`, JSON.stringify(eventHandlers, null, 2));
  
  return {
    analysis: {
      ...state.analysis,
      eventHandlers,
    },
  };
}

/**
 * Map Styles Node
 * Maps style classes to widgets from style.js
 */
async function mapStylesNode(
  state: PageAgentState
): Promise<Partial<PageAgentState>> {
  const { pageFiles } = state;
  
  if (!pageFiles?.styles) {
    return {};
  }
  
  const styleMappings: Record<string, any> = {};
  const stylesContent = pageFiles.styles;
  
  // Find style definitions - look for patterns like export const widgetNameStyles = {...}
  const stylePattern = /export\s+(?:const|let|var)\s+(\w+Styles?)\s*=\s*({[\s\S]*?});/g;
  let match;
  
  while ((match = stylePattern.exec(stylesContent)) !== null) {
    const styleClassName = match[1];
    const styleProperties = match[2];
    
    // Extract widget name from style class name (e.g., button1Styles -> button1)
    const widgetNameMatch = styleClassName.match(/(\w+)Styles?/i);
    const widgetName = widgetNameMatch ? widgetNameMatch[1].toLowerCase() : styleClassName;
    
    // Try to parse style properties (simplified - in production would use proper parser)
    const properties: Record<string, any> = {};
    try {
      // Extract key-value pairs from style object
      const propMatches = styleProperties.match(/(\w+):\s*([^,}]+)/g);
      if (propMatches) {
        propMatches.forEach(prop => {
          const [key, value] = prop.split(':').map(s => s.trim());
          if (key && value) {
            properties[key] = value.replace(/['"]/g, '');
          }
        });
      }
    } catch (e) {
      // If parsing fails, just store the raw string
      properties.raw = styleProperties;
    }
    
    styleMappings[widgetName] = {
      styleClass: styleClassName,
      location: 'style.js',
      properties,
    };
  }
  
  return {
    analysis: {
      ...state.analysis,
      styleMappings,
    },
  };
}

/**
 * Map Properties Node
 * Extracts widget properties from component.js
 */
async function mapPropertiesNode(
  state: PageAgentState
): Promise<Partial<PageAgentState>> {
  const { pageFiles, currentPageState } = state;
  
  if (!pageFiles?.component) {
    return {};
  }
  
  const propertyMappings: Record<string, any> = {};
  const componentContent = pageFiles.component;
  
  // Find widget properties - look for widget tags with attributes
  const widgetPattern = /<(\w+)([^>]*)>/g;
  let match;
  
  while ((match = widgetPattern.exec(componentContent)) !== null) {
    const widgetTag = match[1];
    const attributes = match[2];
    
    // Extract name attribute
    const nameMatch = attributes.match(/name=["'](\w+)["']/);
    const widgetName = nameMatch ? nameMatch[1] : widgetTag.toLowerCase();
    
    // Extract all properties/attributes
    const properties: Record<string, any> = {};
    const attributePattern = /(\w+)=["']([^"']+)["']/g;
    let attrMatch;
    
    while ((attrMatch = attributePattern.exec(attributes)) !== null) {
      properties[attrMatch[1]] = attrMatch[2];
    }
    
    if (!propertyMappings[widgetName]) {
      propertyMappings[widgetName] = {
        properties: {},
        location: 'component.js',
      };
    }
    
    propertyMappings[widgetName].properties = {
      ...propertyMappings[widgetName].properties,
      ...properties,
    };
  }
  
  // Also include properties from currentPageState if available
  if (currentPageState?.selectedWidget?.properties) {
    const selectedWidgetName = currentPageState.selectedWidget.widgetName;
    if (!propertyMappings[selectedWidgetName]) {
      propertyMappings[selectedWidgetName] = {
        properties: {},
        location: 'component.js',
      };
    }
    propertyMappings[selectedWidgetName].properties = {
      ...propertyMappings[selectedWidgetName].properties,
      ...currentPageState.selectedWidget.properties,
    };
  }
  
  return {
    analysis: {
      ...state.analysis,
      propertyMappings,
    },
  };
}

/**
 * Build Understanding Node
 * Uses LLM to generate natural language understanding of the page
 */
async function buildUnderstandingNode(
  state: PageAgentState
): Promise<Partial<PageAgentState>> {
  const { pageFiles, currentPageState, userQuery, analysis } = state;
  
  if (!analysis) {
    return {
      analysis: {
        understanding: 'Unable to analyze page files.',
      },
    };
  }
  
  try {
    const ai = createGeminiClient();
    const modelName = (typeof process !== 'undefined' ? process.env?.GEMINI_MODEL : undefined) || 'gemini-2.5-flash-lite';
    
    const prompt = `Analyze the following WaveMaker React Native page files and provide a comprehensive understanding of how they work together.

Page Files Content (READ THESE CAREFULLY):
${pageFiles.component ? `\n=== Component File ===\n\`\`\`javascript\n${pageFiles.component.substring(0, 8000)}${pageFiles.component.length > 8000 ? '\n... (truncated - see full content in analysis)' : ''}\n\`\`\`\n` : 'Component file not available'}
${pageFiles.script ? `\n=== Script File ===\n\`\`\`javascript\n${pageFiles.script}\n\`\`\`\n` : 'Script file not available'}
${pageFiles.styles ? `\n=== Styles File ===\n\`\`\`javascript\n${pageFiles.styles.substring(0, 3000)}${pageFiles.styles.length > 3000 ? '\n... (truncated)' : ''}\n\`\`\`\n` : 'Styles file not available'}
${pageFiles.variables ? `\n=== Variables File ===\n\`\`\`javascript\n${pageFiles.variables}\n\`\`\`\n` : 'Variables file not available'}

Extracted Analysis (Summary):
File Relationships:
${JSON.stringify(analysis.fileRelations || {}, null, 2)}

Widget Locations:
${JSON.stringify(analysis.widgetLocations || {}, null, 2)}

Event Handlers (extracted):
${JSON.stringify(analysis.eventHandlers || {}, null, 2)}

Style Mappings:
${JSON.stringify(analysis.styleMappings || {}, null, 2)}

Property Mappings:
${JSON.stringify(analysis.propertyMappings || {}, null, 2)}

Selected Widget: ${currentPageState?.selectedWidget?.widgetName || 'None'}

User Query: ${userQuery}

CRITICAL: Read the Component File content above directly. Look for:
1. Widget definitions with name attributes (e.g., name="button1")
2. Inline event handlers in JSX (e.g., onTap={() => { ... }}, onClick={...})
3. The actual code implementation, not just the extracted summaries

Provide a natural language explanation of:
1. How the files are structured and related
2. What widgets exist and where they are located in the component file
3. What event handlers are available - CHECK THE COMPONENT FILE DIRECTLY for inline handlers like onTap={...}
4. How styles are applied to widgets
5. What properties are set on widgets
6. Specifically, explain what happens when the user interacts with the selected widget (${currentPageState?.selectedWidget?.widgetName || 'N/A'}) - look for inline event handlers in the component file

Be specific and reference actual code locations, widget names, and handler functions. If you see inline event handlers in the component file, describe what they do.`;

    const response = await ai.models.generateContent({
      model: modelName,
      config: {
        temperature: 0.7,
        seed: getAISeed(),
      },
      contents: [{
        role: 'user',
        parts: [{ text: prompt }],
      }],
    });
    
    let understanding = '';
    if (response.candidates && response.candidates[0]?.content?.parts) {
      understanding = response.candidates[0].content.parts
        .map(part => part.text || '')
        .join('');
    } else if (response.text && typeof response.text === 'function') {
      try {
        understanding = response.text();
      } catch (e) {
        console.error('[Page Agent] Error calling response.text():', e);
      }
    } else if (response.text && typeof response.text === 'string') {
      understanding = response.text;
    }
    
    return {
      analysis: {
        ...analysis,
        understanding: understanding || 'Unable to generate understanding.',
      },
    };
  } catch (error) {
    return {
      analysis: {
        ...analysis,
        understanding: `Error generating understanding: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
    };
  }
}

/**
 * Create Page Agent
 */
export function createPageAgent(
  channelId?: string,
  projectLocation?: string
) {
  const workflow = new StateGraph<PageAgentState>({
    channels: {
      pageFiles: { reducer: (x, y) => y ? { ...x, ...y } : x },
      currentPageState: { reducer: (x, y) => y ?? x },
      userQuery: { reducer: (x, y) => y ?? x },
      analysis: { reducer: (x, y) => y ? { ...x, ...y } : x },
    },
  } as any)
    .addNode('parse-files', parseFilesNode as any)
    .addNode('map-file-relationships', mapFileRelationshipsNode as any)
    .addNode('locate-widgets', locateWidgetsNode as any)
    .addNode('map-event-handlers', mapEventHandlersNode as any)
    .addNode('map-styles', mapStylesNode as any)
    .addNode('map-properties', mapPropertiesNode as any)
    .addNode('build-understanding', buildUnderstandingNode as any)
    
    .addEdge(START, 'parse-files')
    .addEdge('parse-files', 'map-file-relationships')
    .addEdge('parse-files', 'locate-widgets')
    .addEdge('parse-files', 'map-event-handlers')
    .addEdge('parse-files', 'map-styles')
    .addEdge('parse-files', 'map-properties')
    .addEdge('map-file-relationships', 'build-understanding')
    .addEdge('locate-widgets', 'build-understanding')
    .addEdge('map-event-handlers', 'build-understanding')
    .addEdge('map-styles', 'build-understanding')
    .addEdge('map-properties', 'build-understanding')
    .addEdge('build-understanding', END);

  return workflow;
}

