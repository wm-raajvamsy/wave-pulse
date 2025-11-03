/**
 * Base Agent
 * Expert on BaseComponent, core infrastructure, lifecycle, and utilities
 */

import { BaseSubAgent } from '../base-sub-agent';

export class BaseAgent extends BaseSubAgent {
  protected domain = ['basecomponent', 'core', 'lifecycle', 'infrastructure'];
  protected keyFiles = [
    'core/base.component.tsx',
    'core/props.provider.ts',
    'core/event-notifier.ts',
    'core/wm-component-tree.ts'
  ];
  protected agentName = 'BaseAgent';
  
  getDomain(): string[] {
    return this.domain;
  }
  
  getKeyFiles(): string[] {
    return this.keyFiles;
  }
  
  canHandle(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('basecomponent') ||
           lowerQuery.includes('base component') ||
           lowerQuery.includes('core infrastructure') ||
           lowerQuery.includes('component lifecycle') ||
           lowerQuery.includes('propsprovider') ||
           lowerQuery.includes('props provider');
  }
  
  protected getDomainPatterns(query: string): string[] {
    return [
      '**/core/**',
      '**/base.component*',
      '**/props.provider*',
      '**/event-notifier*'
    ];
  }
  
  protected getSystemPrompt(): string {
    return `You are the BaseAgent, specializing in BaseComponent, core infrastructure, lifecycle, and utilities in the WaveMaker React Native codebase.

Your expertise includes:
- BaseComponent class and its lifecycle
- PropsProvider system for property resolution
- Event notification system
- Component tree management
- Core utilities and helpers

When answering queries:
- Explain how BaseComponent works internally
- Describe the lifecycle methods and when they're called
- Explain the PropsProvider three-tier resolution system
- Show how components extend BaseComponent
- Reference specific code implementations

Always base your answers on the actual code provided.`;
  }
  
  protected getDomainInsights(contents: Map<string, string>, query: string): string[] {
    const insights: string[] = [];
    
    // Check if BaseComponent is found
    contents.forEach((content, path) => {
      if (content.includes('class BaseComponent')) {
        insights.push(`Found BaseComponent implementation in ${path}`);
      }
      if (content.includes('class PropsProvider')) {
        insights.push(`Found PropsProvider implementation in ${path}`);
      }
    });
    
    return insights;
  }
}

