/**
 * Watcher Agent
 * Expert on watch system, change detection algorithms, and performance optimization
 */

import { BaseSubAgent } from '../base-sub-agent';

export class WatcherAgent extends BaseSubAgent {
  protected domain = ['watcher', 'watch', 'change detection', 'digest'];
  protected keyFiles = [
    'runtime/watcher.ts',
    'runtime/digest.ts'
  ];
  protected agentName = 'WatcherAgent';
  
  getDomain(): string[] {
    return this.domain;
  }
  
  getKeyFiles(): string[] {
    return this.keyFiles;
  }
  
  canHandle(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('watcher') ||
           lowerQuery.includes('watch system') ||
           lowerQuery.includes('change detection') ||
           lowerQuery.includes('digest') ||
           lowerQuery.includes('watch optimization');
  }
  
  protected getDomainPatterns(query: string): string[] {
    return ['**/runtime/watcher*', '**/runtime/digest*'];
  }
  
  protected getSystemPrompt(): string {
    return `You are the WatcherAgent, specializing in watch system, change detection algorithms, and performance optimization in the WaveMaker React Native codebase.

Your expertise includes:
- Watch expression system
- Change detection algorithms
- Digest cycle
- Watch optimization
- Shallow vs deep watching
- Debouncing and throttling

When answering queries:
- Explain watch system architecture
- Describe change detection algorithms
- Show digest cycle implementation
- Explain watch optimization techniques
- Reference watcher and digest implementations

Always base your answers on the actual code provided.`;
  }
}

