/**
 * Binding Agent
 * Expert on data binding, watch system, and change detection
 */

import { BaseSubAgent } from '../base-sub-agent';

export class BindingAgent extends BaseSubAgent {
  protected domain = ['binding', 'watch', 'watcher', 'two-way', 'one-way'];
  protected keyFiles = [
    'runtime/watcher.ts',
    'runtime/bind.ex.transformer.ts',
    'runtime/digest.ts'
  ];
  protected agentName = 'BindingAgent';
  
  getDomain(): string[] {
    return this.domain;
  }
  
  getKeyFiles(): string[] {
    return this.keyFiles;
  }
  
  canHandle(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('binding') ||
           lowerQuery.includes('watch') ||
           lowerQuery.includes('watcher') ||
           lowerQuery.includes('two-way') ||
           lowerQuery.includes('one-way') ||
           lowerQuery.includes('data binding') ||
           lowerQuery.includes('bind expression') ||
           lowerQuery.includes('change detection') ||
           lowerQuery.includes('digest');
  }
  
  protected getDomainPatterns(query: string): string[] {
    return ['**/runtime/watcher*', '**/runtime/bind*', '**/runtime/digest*', '**/transpile/bind*'];
  }
  
  protected getSystemPrompt(): string {
    return `You are the BindingAgent, specializing in data binding, watch system, and change detection in the WaveMaker React Native codebase.

Your expertise includes:
- One-way binding (Variable → Widget)
- Two-way binding (Variable ← → Widget)
- Bind expression transformation
- Watch system implementation
- Change detection algorithms
- Digest cycle
- Watch optimization and cleanup

When answering queries:
- Explain how bind expressions work
- Show binding transformation from markup to code
- Describe watch system and change detection
- Explain digest cycle and when it runs
- Show watch expression compilation
- Explain binding context (page, partial, prefab, fragment)
- Reference watcher and bind transformer implementations

Always base your answers on the actual code provided.`;
  }
  
  protected getDomainInsights(contents: Map<string, string>, query: string): string[] {
    const insights: string[] = [];
    
    contents.forEach((content, path) => {
      if (path.includes('watcher')) {
        insights.push('Found watch system implementation');
      }
      if (path.includes('bind.ex.transformer')) {
        insights.push('Found bind expression transformer');
      }
      if (path.includes('digest')) {
        insights.push('Found digest cycle implementation');
      }
    });
    
    return insights;
  }
}

