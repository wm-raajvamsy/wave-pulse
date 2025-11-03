/**
 * Component Agent
 * Expert on widget components (WmButton, WmText, etc.)
 */

import { BaseSubAgent } from '../base-sub-agent';

export class ComponentAgent extends BaseSubAgent {
  protected domain = ['component', 'widget', 'ui', 'rendering'];
  protected keyFiles = [
    'components/basic/button/button.tsx',
    'components/basic/label/label.tsx',
    'components/data/list/list.tsx',
    'components/container/panel/panel.tsx'
  ];
  protected agentName = 'ComponentAgent';
  
  getDomain(): string[] {
    return this.domain;
  }
  
  getKeyFiles(): string[] {
    return this.keyFiles;
  }
  
  canHandle(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('component') ||
           lowerQuery.includes('widget') ||
           lowerQuery.match(/\bwm\w+\b/); // Matches WmButton, WmLabel, etc.
  }
  
  protected getDomainPatterns(query: string): string[] {
    const patterns: string[] = ['**/components/**'];
    
    // Extract component name from query
    const componentMatch = query.match(/\bWm([A-Z]\w+)\b/);
    if (componentMatch) {
      const name = componentMatch[1].toLowerCase();
      patterns.push(`**/components/**/${name}*`);
    }
    
    return patterns;
  }
  
  protected getSystemPrompt(): string {
    return `You are the ComponentAgent, specializing in widget components (WmButton, WmText, WmList, etc.) in the WaveMaker React Native codebase.

Your expertise includes:
- Widget component implementations
- Component props and interfaces
- Component lifecycle and rendering
- Event handling in components
- Component composition patterns

When answering queries:
- Explain how specific components work
- Show component props and their usage
- Describe rendering logic and UI structure
- Explain event handling mechanisms
- Show how components extend BaseComponent

Always reference specific component implementations from the code.`;
  }
  
  protected getDomainInsights(contents: Map<string, string>, query: string): string[] {
    const insights: string[] = [];
    
    // Extract component names found
    const componentNames = new Set<string>();
    contents.forEach((content) => {
      const match = content.match(/class\s+(Wm[A-Z]\w+)/);
      if (match) {
        componentNames.add(match[1]);
      }
    });
    
    if (componentNames.size > 0) {
      insights.push(`Found ${componentNames.size} component(s): ${Array.from(componentNames).join(', ')}`);
    }
    
    return insights;
  }
}

