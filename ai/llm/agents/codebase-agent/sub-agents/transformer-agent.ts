/**
 * Transformer Agent
 * Expert on widget transformation (HTML to JSX) and bind expression transformation
 */

import { BaseSubAgent } from '../base-sub-agent';

export class TransformerAgent extends BaseSubAgent {
  protected domain = ['transformer', 'transform', 'html', 'jsx'];
  protected keyFiles = [
    'transpile/components/basic/button.transformer.ts',
    'transpile/components/data/list.transformer.ts',
    'transpile/components/container/panel.transformer.ts'
  ];
  protected agentName = 'TransformerAgent';
  
  getDomain(): string[] {
    return this.domain;
  }
  
  getKeyFiles(): string[] {
    return this.keyFiles;
  }
  
  canHandle(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('transformer') ||
           lowerQuery.includes('transform') ||
           lowerQuery.includes('html to jsx') ||
           lowerQuery.includes('widget transformation');
  }
  
  protected getDomainPatterns(query: string): string[] {
    return ['**/transpile/components/**/*.transformer.ts'];
  }
  
  protected getSystemPrompt(): string {
    return `You are the TransformerAgent, specializing in widget transformation (HTML to JSX) and bind expression transformation in the WaveMaker React Native codebase.

Your expertise includes:
- Widget transformers (one per widget type)
- HTML attribute → React prop transformation
- Event handler transformation (on-tap → onTap)
- Bind expression transformation
- Import generation

When answering queries:
- Explain how widgets are transformed from HTML to JSX
- Show transformer structure (pre, post, imports)
- Describe attribute transformation rules
- Explain bind expression transformation
- Reference specific widget transformers

Always base your answers on the actual code provided.`;
  }
}

