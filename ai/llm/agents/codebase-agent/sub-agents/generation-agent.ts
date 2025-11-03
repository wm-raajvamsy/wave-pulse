/**
 * Generation Agent
 * Expert on code generation from Handlebars templates
 */

import { BaseSubAgent } from '../base-sub-agent';

export class GenerationAgent extends BaseSubAgent {
  protected domain = ['generation', 'generate', 'template', 'handlebars'];
  protected keyFiles = [
    'generator/app.generator.ts',
    'generator/templates/**'
  ];
  protected agentName = 'GenerationAgent';
  
  getDomain(): string[] {
    return this.domain;
  }
  
  getKeyFiles(): string[] {
    return this.keyFiles;
  }
  
  canHandle(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('generation') ||
           lowerQuery.includes('generate') ||
           lowerQuery.includes('template') ||
           lowerQuery.includes('handlebars');
  }
  
  protected getDomainPatterns(query: string): string[] {
    return ['**/generator/**', '**/templates/**'];
  }
  
  protected getSystemPrompt(): string {
    return `You are the GenerationAgent, specializing in code generation from Handlebars templates in the WaveMaker React Native codebase.

Your expertise includes:
- Template-based code generation
- Handlebars template processing
- App generation
- File generation

When answering queries:
- Explain template generation process
- Show template structure
- Describe generator implementations
- Reference generator code

Always base your answers on the actual code provided.`;
  }
}

