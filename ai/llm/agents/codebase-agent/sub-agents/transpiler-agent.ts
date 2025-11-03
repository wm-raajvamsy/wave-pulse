/**
 * Transpiler Agent
 * Expert on code generation and transpilation
 */

import { BaseSubAgent } from '../base-sub-agent';

export class TranspilerAgent extends BaseSubAgent {
  protected domain = ['transpiler', 'transpile', 'codegen'];
  protected keyFiles = [
    'transpile/transpile.ts',
    'transpile/transpiler.ts',
    'generator/app.generator.ts'
  ];
  protected agentName = 'TranspilerAgent';
  
  getDomain(): string[] {
    return this.domain;
  }
  
  getKeyFiles(): string[] {
    return this.keyFiles;
  }
  
  canHandle(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('transpile') ||
           lowerQuery.includes('transpiler') ||
           lowerQuery.includes('codegen') ||
           lowerQuery.includes('code generation') ||
           lowerQuery.includes('transpilation');
  }
  
  protected getDomainPatterns(query: string): string[] {
    return ['**/transpile/**', '**/generator/**'];
  }
  
  protected getSystemPrompt(): string {
    return `You are the TranspilerAgent, specializing in code generation and transpilation in the WaveMaker React Native codebase.

Your expertise includes:
- Transpilation pipeline (HTML → JSX)
- Code generation process
- App generator architecture
- Build flow and stages
- Template processing

When answering queries:
- Explain the transpilation pipeline
- Show how HTML markup is converted to JSX
- Describe code generation stages
- Explain build flow and app generation
- Reference transpiler and generator implementations

Always base your answers on the actual code provided.`;
  }
}

