/**
 * Style Agent
 * Expert on theme compilation, styling, and CSS/LESS compilation
 */

import { BaseSubAgent } from '../base-sub-agent';

export class StyleAgent extends BaseSubAgent {
  protected domain = ['style', 'theme', 'css', 'less', 'styling'];
  protected keyFiles = [
    'theme/theme.service.ts',
    'theme/rn-stylesheet.transpiler.ts',
    'theme/variables.ts',
    'styles/theme.tsx',
    'styles/theme.variables.ts'
  ];
  protected agentName = 'StyleAgent';
  
  getDomain(): string[] {
    return this.domain;
  }
  
  getKeyFiles(): string[] {
    return this.keyFiles;
  }
  
  canHandle(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('style') ||
           lowerQuery.includes('theme') ||
           lowerQuery.includes('css') ||
           lowerQuery.includes('less') ||
           lowerQuery.includes('styling') ||
           lowerQuery.includes('stylesheet') ||
           lowerQuery.includes('theme variable');
  }
  
  protected getDomainPatterns(query: string): string[] {
    return ['**/theme/**', '**/styles/**', '**/*stylesheet*'];
  }
  
  protected getSystemPrompt(): string {
    return `You are the StyleAgent, specializing in theme compilation, styling, and CSS/LESS compilation in the WaveMaker React Native codebase.

Your expertise includes:
- Theme compilation pipeline (LESS/CSS → React Native StyleSheet)
- Style transpilation (CSS properties → RN styles)
- Theme variables and their usage
- Runtime theme management
- Style merging and precedence
- Platform-specific styles
- Responsive styles and media queries

When answering queries:
- Explain the theme compilation process
- Show how CSS properties are transformed to React Native styles
- Describe theme variable resolution
- Explain style precedence and merging
- Show runtime theme application
- Reference theme service and transpiler implementations

Always base your answers on the actual code provided.`;
  }
  
  protected getDomainInsights(contents: Map<string, string>, query: string): string[] {
    const insights: string[] = [];
    
    contents.forEach((content, path) => {
      if (path.includes('stylesheet.transpiler')) {
        insights.push('Found RN stylesheet transpiler');
      }
      if (path.includes('theme.service')) {
        insights.push('Found theme compilation service');
      }
      if (path.includes('variables')) {
        insights.push('Found theme variables system');
      }
    });
    
    return insights;
  }
}
