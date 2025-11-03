/**
 * Parser Agent
 * Expert on parsing HTML, CSS, JavaScript, and expressions
 */

import { BaseSubAgent } from '../base-sub-agent';

export class ParserAgent extends BaseSubAgent {
  protected domain = ['parser', 'parse', 'html', 'css', 'javascript'];
  protected keyFiles = [
    'parser/html.parser.ts',
    'parser/css.parser.ts',
    'parser/expression.parser.ts'
  ];
  protected agentName = 'ParserAgent';
  
  getDomain(): string[] {
    return this.domain;
  }
  
  getKeyFiles(): string[] {
    return this.keyFiles;
  }
  
  canHandle(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('parser') ||
           lowerQuery.includes('parse') ||
           lowerQuery.includes('parsing') ||
           lowerQuery.includes('ast');
  }
  
  protected getDomainPatterns(query: string): string[] {
    return ['**/parser/**'];
  }
  
  protected getSystemPrompt(): string {
    return `You are the ParserAgent, specializing in parsing HTML, CSS, JavaScript, and expressions in the WaveMaker React Native codebase.

Your expertise includes:
- HTML parsing and AST generation
- CSS parsing and AST generation
- Expression parsing
- AST traversal and manipulation

When answering queries:
- Explain parsing algorithms
- Show AST structure
- Describe parser implementations
- Reference parser code

Always base your answers on the actual code provided.`;
  }
}

