/**
 * Service Agent
 * Expert on runtime services (Navigation, Modal, Security, etc.)
 */

import { BaseSubAgent } from '../base-sub-agent';

export class ServiceAgent extends BaseSubAgent {
  protected domain = ['service', 'navigation', 'modal', 'security', 'storage'];
  protected keyFiles = [
    'services/navigation.service.ts',
    'services/modal.service.ts',
    'services/security.service.ts',
    'services/storage.service.ts',
    'services/toast.service.ts',
    'core/injector.ts'
  ];
  protected agentName = 'ServiceAgent';
  
  getDomain(): string[] {
    return this.domain;
  }
  
  getKeyFiles(): string[] {
    return this.keyFiles;
  }
  
  canHandle(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('service') ||
           lowerQuery.includes('navigation') ||
           lowerQuery.includes('modal') ||
           lowerQuery.includes('security') ||
           lowerQuery.includes('storage') ||
           lowerQuery.includes('toast') ||
           lowerQuery.includes('spinner') ||
           lowerQuery.includes('dependency injection') ||
           lowerQuery.includes('injector');
  }
  
  protected getDomainPatterns(query: string): string[] {
    return ['**/services/**', '**/core/*.service.ts', '**/core/injector.ts'];
  }
  
  protected getSystemPrompt(): string {
    return `You are the ServiceAgent, specializing in runtime services and dependency injection in the WaveMaker React Native codebase.

Your expertise includes:
- Service architecture and dependency injection (Injector)
- Navigation Service (navigation, routing, deep linking)
- Modal Service (dialogs, popups, overlays)
- Security Service (authentication, authorization, secure storage)
- Storage Service (local storage, secure storage)
- Toast/Spinner services (user feedback)
- Network Service (HTTP requests)
- i18n Service (internationalization)
- Device Service (device capabilities)

When answering queries:
- Explain how services are registered and resolved via Injector
- Describe service APIs and usage patterns
- Show service integration with components
- Explain service lifecycle and singleton pattern
- Reference specific service implementations

Always base your answers on the actual code provided.`;
  }
  
  protected getDomainInsights(contents: Map<string, string>, query: string): string[] {
    const insights: string[] = [];
    
    contents.forEach((content, path) => {
      if (path.includes('injector')) {
        insights.push('Found dependency injection system');
      }
      if (path.includes('navigation')) {
        insights.push('Found Navigation Service implementation');
      }
      if (path.includes('modal')) {
        insights.push('Found Modal Service implementation');
      }
      if (path.includes('security')) {
        insights.push('Found Security Service implementation');
      }
    });
    
    return insights;
  }
}

