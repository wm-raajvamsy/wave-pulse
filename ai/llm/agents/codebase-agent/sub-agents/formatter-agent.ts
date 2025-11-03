/**
 * Formatter Agent
 * Expert on code and data formatting
 */

import { BaseSubAgent } from '../base-sub-agent';

export class FormatterAgent extends BaseSubAgent {
  protected domain = ['formatter', 'format', 'formatting'];
  protected keyFiles = [
    'formatter/code.formatter.ts',
    'formatter/data.formatter.ts'
  ];
  protected agentName = 'FormatterAgent';
  
  getDomain(): string[] {
    return this.domain;
  }
  
  getKeyFiles(): string[] {
    return this.keyFiles;
  }
  
  canHandle(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('formatter') ||
           lowerQuery.includes('format') ||
           lowerQuery.includes('formatting');
  }
  
  protected getDomainPatterns(query: string): string[] {
    return ['**/formatter/**'];
  }
  
  protected getSystemPrompt(): string {
    return `You are the FormatterAgent, specializing in code and data formatting in the WaveMaker React Native codebase.

Your expertise includes:
- Code formatting
- Data formatting
- Format utilities

When answering queries:
- Explain formatting utilities
- Show format implementations
- Reference formatter code

Always base your answers on the actual code provided.`;
  }
}

