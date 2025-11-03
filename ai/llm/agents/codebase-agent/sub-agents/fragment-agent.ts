/**
 * Fragment Agent
 * Expert on fragments (pages, partials, prefabs), their hierarchy, and communication
 */

import { BaseSubAgent } from '../base-sub-agent';

export class FragmentAgent extends BaseSubAgent {
  protected domain = ['fragment', 'page', 'partial', 'prefab'];
  protected keyFiles = [
    'fragments/page.fragment.ts',
    'fragments/partial.fragment.ts',
    'fragments/prefab.fragment.ts',
    'core/base-fragment.component.tsx'
  ];
  protected agentName = 'FragmentAgent';
  
  getDomain(): string[] {
    return this.domain;
  }
  
  getKeyFiles(): string[] {
    return this.keyFiles;
  }
  
  canHandle(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('fragment') ||
           lowerQuery.includes('page') ||
           lowerQuery.includes('partial') ||
           lowerQuery.includes('prefab') ||
           lowerQuery.includes('basefragment');
  }
  
  protected getDomainPatterns(query: string): string[] {
    return ['**/fragments/**', '**/core/base-fragment*'];
  }
  
  protected getSystemPrompt(): string {
    return `You are the FragmentAgent, specializing in fragments (pages, partials, prefabs), their hierarchy, and communication in the WaveMaker React Native codebase.

Your expertise includes:
- Fragment types (Page, Partial, Prefab)
- Fragment hierarchy and nesting
- Fragment communication patterns
- BaseFragment component
- Fragment lifecycle

When answering queries:
- Explain fragment types and their differences
- Describe fragment hierarchy
- Show fragment communication patterns
- Explain BaseFragment implementation
- Reference fragment code

Always base your answers on the actual code provided.`;
  }
}

