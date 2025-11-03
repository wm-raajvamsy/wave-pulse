/**
 * Style Definition Agent
 * Expert on style definitions, class names, and style selectors
 */

import { BaseSubAgent } from '../base-sub-agent';

export class StyleDefinitionAgent extends BaseSubAgent {
  protected domain = ['styledefinition', 'style-definition', 'styledef', 'class-name', 'style-selector'];
  protected keyFiles = [
    'theme/components/base-style-definition.ts',
    'theme/components/style-definition.provider.ts',
    'theme/components/basic/button.styledef.ts',
    'theme/components/input/text.styledef.ts',
    'theme/components/container/panel.styledef.ts'
  ];
  protected agentName = 'StyleDefinitionAgent';
  
  getDomain(): string[] {
    return this.domain;
  }
  
  getKeyFiles(): string[] {
    return this.keyFiles;
  }
  
  canHandle(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('class name') ||
           lowerQuery.includes('style definition') ||
           lowerQuery.includes('styledef') ||
           lowerQuery.includes('rnStyleSelector') ||
           lowerQuery.includes('style element') ||
           (lowerQuery.includes('style') && (lowerQuery.includes('icon') || 
                                             lowerQuery.includes('text') || 
                                             lowerQuery.includes('element')));
  }
  
  protected getDomainPatterns(query: string): string[] {
    const patterns: string[] = ['**/theme/components/**/*.styledef.ts'];
    
    // Extract widget name from query
    const widgetMatch = query.match(/\b(button|text|panel|label|icon|list|form)\b/i);
    if (widgetMatch) {
      const name = widgetMatch[1].toLowerCase();
      patterns.push(`**/theme/components/**/${name}.styledef.ts`);
    }
    
    return patterns;
  }
  
  protected getSystemPrompt(): string {
    return `You are the StyleDefinitionAgent, specializing in style definitions, class names, and style selectors in the WaveMaker React Native codebase.

Your expertise includes:
- Widget style definition files (.styledef.ts)
- StyleDefinition interface and ComponentStyle interface
- Style selector mappings (className, rnStyleSelector, studioStyleSelector)
- Nested class patterns for styling elements within widgets
- Theme variable usage in style definitions

When answering queries:
- Explain style definition structure
- Provide class names for styling specific elements
- Show rnStyleSelector mappings
- Explain nested class patterns (e.g., .app-button-icon .app-icon)
- Reference style definition files

Always reference the actual style definition files from the codegen codebase.`;
  }
  
  protected getDomainInsights(contents: Map<string, string>, query: string): string[] {
    const insights: string[] = [];
    
    // Check for style definitions
    contents.forEach((content, path) => {
      if (path.includes('.styledef.ts')) {
        const widgetName = path.split('/').pop()?.replace('.styledef.ts', '') || 'unknown';
        insights.push(`Found style definition for ${widgetName}`);
        
        // Count style definitions
        const defCount = (content.match(/className:/g) || []).length;
        if (defCount > 0) {
          insights.push(`${widgetName} has ${defCount} style definition(s)`);
        }
      }
    });
    
    return insights;
  }
  
  protected buildPrompt(query: string, fileContext: string, context: QueryContext): string {
    return `You are the StyleDefinitionAgent, expert on style definitions and class names.

User Query: "${query}"

Style Definition Files:
${fileContext}

Analyze the style definitions and provide:
- The exact class name(s) for styling the requested element
- The rnStyleSelector mapping
- Nested class patterns if applicable (e.g., for styling icon inside button)
- Style properties and theme variables used
- Code examples showing how to use these classes

Format your response in markdown with clear sections.`;
  }
}

