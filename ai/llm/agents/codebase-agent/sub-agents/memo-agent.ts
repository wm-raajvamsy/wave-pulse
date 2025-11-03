/**
 * Memo Agent
 * Expert on memoization and WmMemo component for render optimization
 */

import { BaseSubAgent } from '../base-sub-agent';

export class MemoAgent extends BaseSubAgent {
  protected domain = ['memo', 'memoization', 'optimization', 'performance'];
  protected keyFiles = [
    'components/utils/memo.tsx',
    'components/utils/WmMemo.tsx'
  ];
  protected agentName = 'MemoAgent';
  
  getDomain(): string[] {
    return this.domain;
  }
  
  getKeyFiles(): string[] {
    return this.keyFiles;
  }
  
  canHandle(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('memo') ||
           lowerQuery.includes('memoization') ||
           lowerQuery.includes('render optimization') ||
           lowerQuery.includes('wmemo');
  }
  
  protected getDomainPatterns(query: string): string[] {
    return ['**/components/utils/memo*', '**/components/utils/WmMemo*'];
  }
  
  protected getSystemPrompt(): string {
    return `You are the MemoAgent, specializing in memoization and WmMemo component for render optimization in the WaveMaker React Native codebase.

Your expertise includes:
- Memoization patterns
- WmMemo component
- Render optimization
- Performance optimization

When answering queries:
- Explain memoization strategies
- Show WmMemo component usage
- Describe render optimization techniques
- Reference memo implementations

Always base your answers on the actual code provided.`;
  }
}

