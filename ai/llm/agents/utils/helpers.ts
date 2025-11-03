/**
 * Helper utilities for Information Retrieval Agent system
 */

// Import WidgetNode from server types - using relative path from ai/llm/agents/utils/
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - TypeScript may not resolve this path correctly, but it works at runtime
import type { WidgetNode } from '../../../server/types';

/**
 * Step management helpers
 */
export function addStep(
  steps: Array<{ id: string; description: string; status: string }>,
  step: { id: string; description: string; status: string }
): Array<{ id: string; description: string; status: string }> {
  return [...steps, step];
}

export function updateStep(
  steps: Array<{ id: string; description: string; status: string }>,
  stepId: string,
  status: string
): Array<{ id: string; description: string; status: string }> {
  const updated = [...steps];
  const index = updated.findIndex(s => s.id === stepId);
  
  if (index >= 0) {
    updated[index] = { ...updated[index], status };
  } else {
    updated.push({ id: stepId, description: stepId, status });
  }
  
  return updated;
}

/**
 * Widget finding helpers
 */
export function findSelectedWidget(elementTree: WidgetNode | null | undefined): WidgetNode | null {
  if (!elementTree) return null;
  
  if (elementTree.selected === true) {
    return elementTree;
  }
  
  if (elementTree.children && Array.isArray(elementTree.children)) {
    for (const child of elementTree.children) {
      const found = findSelectedWidget(child);
      if (found) return found;
    }
  }
  
  return null;
}

export function findTabbar(elementTree: WidgetNode | null | undefined): WidgetNode | null {
  if (!elementTree) return null;
  
  const tagName = elementTree.tagName?.toLowerCase() || '';
  const name = elementTree.name?.toLowerCase() || '';
  
  // Check for WmTabbar or any widget with tabbar in tagName/name
  if (tagName === 'wmtabbar' || tagName.includes('tabbar') || name.includes('tabbar')) {
    return elementTree;
  }
  
  if (elementTree.children && Array.isArray(elementTree.children)) {
    for (const child of elementTree.children) {
      const found = findTabbar(child);
      if (found) return found;
    }
  }
  
  return null;
}

export function findWidgetByName(
  elementTree: WidgetNode | null | undefined,
  widgetName: string
): WidgetNode | null {
  if (!elementTree) return null;
  
  if (elementTree.name === widgetName) {
    return elementTree;
  }
  
  if (elementTree.children && Array.isArray(elementTree.children)) {
    for (const child of elementTree.children) {
      const found = findWidgetByName(child, widgetName);
      if (found) return found;
    }
  }
  
  return null;
}

/**
 * File extraction helpers
 */
export function extractPageFiles(toolResults: Array<{ name: string; result: any }>) {
  const files: Record<string, string> = {};
  
  for (const result of toolResults) {
    if (result.name === 'read_file' && result.result?.content) {
      const filePath = result.result.filePath || '';
      const fileName = filePath.split('/').pop() || '';
      
      if (fileName.endsWith('.component.js')) {
        files.component = result.result.content;
      } else if (fileName.endsWith('.style.js')) {
        files.styles = result.result.content;
      } else if (fileName.endsWith('.script.js')) {
        files.script = result.result.content;
      } else if (fileName.endsWith('.variables.js')) {
        files.variables = result.result.content;
      }
    }
  }
  
  return files;
}

/**
 * Error handling helpers
 */
export function handleError(
  step: string,
  error: Error | string,
  recoveryAction?: string
): { step: string; error: string; recoveryAction?: string } {
  return {
    step,
    error: error instanceof Error ? error.message : error,
    recoveryAction,
  };
}

/**
 * Determine recovery action based on error
 */
export function determineRecoveryAction(step: string, error: Error): string | undefined {
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('not found')) {
    if (step.includes('file')) {
      return 'Try alternative file names or check project structure';
    }
    if (step.includes('widget')) {
      return 'Check if widget exists in element tree or try alternative widget name';
    }
  }
  
  if (errorMessage.includes('timeout')) {
    return 'Retry operation or check if client is connected';
  }
  
  return undefined;
}

