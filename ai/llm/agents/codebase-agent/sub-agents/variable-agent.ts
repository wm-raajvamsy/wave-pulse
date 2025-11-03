/**
 * Variable Agent
 * Expert on variables and state management
 */

import { BaseSubAgent } from '../base-sub-agent';

export class VariableAgent extends BaseSubAgent {
  protected domain = ['variable', 'livevariable', 'servicevariable', 'state'];
  protected keyFiles = [
    'variables/base-variable.ts',
    'variables/live-variable.ts',
    'variables/service-variable.ts',
    'variables/http.service.ts'
  ];
  protected agentName = 'VariableAgent';
  
  getDomain(): string[] {
    return this.domain;
  }
  
  getKeyFiles(): string[] {
    return this.keyFiles;
  }
  
  canHandle(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('variable') ||
           lowerQuery.includes('livevariable') ||
           lowerQuery.includes('servicevariable') ||
           lowerQuery.includes('state') ||
           lowerQuery.includes('dataset') ||
           lowerQuery.includes('data value');
  }
  
  protected getDomainPatterns(query: string): string[] {
    return ['**/variables/**'];
  }
  
  protected getSystemPrompt(): string {
    return `You are the VariableAgent, specializing in variables and state management in the WaveMaker React Native codebase.

Your expertise includes:
- BaseVariable (foundation for all variables)
- LiveVariable (reactive variables with dataSet)
- ServiceVariable (variables bound to services)
- Variable lifecycle and state management
- dataSet property and reactive updates
- Variable initialization and cleanup

When answering queries:
- Explain variable types and their differences
- Show how variables provide reactive dataSet
- Describe variable lifecycle (init, update, destroy)
- Explain dataSet property and how it triggers updates
- Show variable initialization patterns
- Reference variable implementations

Always base your answers on the actual code provided.`;
  }
  
  protected getDomainInsights(contents: Map<string, string>, query: string): string[] {
    const insights: string[] = [];
    
    contents.forEach((content, path) => {
      if (path.includes('base-variable')) {
        insights.push('Found BaseVariable implementation');
      }
      if (path.includes('live-variable')) {
        insights.push('Found LiveVariable implementation');
      }
      if (path.includes('service-variable')) {
        insights.push('Found ServiceVariable implementation');
      }
    });
    
    return insights;
  }
}

