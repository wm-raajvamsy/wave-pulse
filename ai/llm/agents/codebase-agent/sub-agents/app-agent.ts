/**
 * App Agent
 * Expert on application architecture, app generation, and build flow
 */

import { BaseSubAgent } from '../base-sub-agent';

export class AppAgent extends BaseSubAgent {
  protected domain = ['app', 'application', 'architecture', 'generation', 'build'];
  protected keyFiles = [
    'app/app.generator.ts',
    'app/app.config.ts',
    'app/app.tsx'
  ];
  protected agentName = 'AppAgent';
  
  getDomain(): string[] {
    return this.domain;
  }
  
  getKeyFiles(): string[] {
    return this.keyFiles;
  }
  
  canHandle(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('app') ||
           lowerQuery.includes('application') ||
           lowerQuery.includes('architecture') ||
           lowerQuery.includes('build flow') ||
           lowerQuery.includes('build pipeline');
  }
  
  protected getDomainPatterns(query: string): string[] {
    return ['**/app/**', '**/generator/**'];
  }
  
  protected getSystemPrompt(): string {
    return `You are the AppAgent, specializing in application architecture, app generation, and build flow in the WaveMaker React Native codebase.

Your expertise includes:
- Application architecture
- App generation process
- Build flow and stages
- Project structure
- App configuration

When answering queries:
- Explain application architecture
- Describe build flow stages
- Show app generation process
- Explain project structure
- Reference app generator and configuration

Always base your answers on the actual code provided.`;
  }
}

