/**
 * Type definitions for Information Retrieval Agent system
 */

// Import WidgetNode from server types - using relative path from ai/llm/agents/utils/
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - TypeScript may not resolve this path correctly, but it works at runtime
import type { WidgetNode } from '../../../server/types';

/**
 * Information Retrieval Agent State
 */
export interface InformationRetrievalAgentState {
  // User Input
  userQuery: string;
  channelId?: string;
  projectLocation?: string;
  conversationHistory?: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string }> }>; // Chat history for context
  
  // Query Analysis
  queryAnalysis?: {
    requiresCodebase?: boolean; // Whether query requires codebase knowledge
    widgetReference?: string; // 'selected' | 'specific-name' | widget name
    action?: string; // 'tap' | 'click' | 'change' | etc.
    informationNeeded?: string[]; // 'properties' | 'styles' | 'events' | 'behavior'
    executionPlan?: string[];
  };
  
  // Current Page State Agent Results
  currentPageState?: {
    pageName?: string;
    activePageFromTabbar?: string;
    selectedWidget?: {
      widgetId: string;
      widgetName: string;
      properties?: Record<string, any>;
      styles?: Record<string, any>;
    };
    elementTree?: WidgetNode; // Basic info for all widgets
  };
  
  // Page Files
  pageFiles?: {
    component?: string; // Main.component.js content
    styles?: string;    // Main.styles.js content
    script?: string;    // Main.script.js content
    variables?: string; // Main.variables.js content
  };
  
  // Page Agent Analysis
  pageAgentAnalysis?: {
    fileRelations?: Record<string, any>;
    widgetLocations?: Record<string, any>;
    eventHandlers?: Record<string, any>;
    styleMappings?: Record<string, any>;
    propertyMappings?: Record<string, any>;
    understanding?: string; // Natural language understanding
  };
  
  // Subagent Invocations
  subagentResults?: {
    currentPageStateAgent?: any;
    pageAgent?: any;
  };
  
  // Final Answer
  finalAnswer?: string;
  
  // Execution Tracking
  researchSteps: Array<{
    id: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
  }>;
  
  // Error Handling
  errors: Array<{
    step: string;
    error: string;
    recoveryAction?: string;
  }>;
  
  // User Interaction
  userClarification?: {
    needed: boolean;
    question?: string;
    response?: string;
  };
  
  // Callbacks
  onStepUpdate?: (update: { type: 'step' | 'complete'; data?: any }) => void;
  
  // LangGraph compatibility
  [key: string]: any;
}

/**
 * Current Page State Agent State
 */
export interface CurrentPageStateAgentState {
  channelId?: string;
  query: string;
  elementTree?: WidgetNode; // Basic tree with id, name, tagName for all widgets
  targetWidgetId?: string; // Widget ID to fetch properties/styles for
  targetWidgetName?: string; // Widget name (for reference)
  selectedWidget?: {
    widgetId: string;
    widgetName: string;
    properties?: Record<string, any>;
    styles?: Record<string, any>;
  };
  activePageFromTabbar?: string;
  currentPageState?: any;
  errors: Array<{ step: string; error: string }>;
  
  // LangGraph compatibility
  [key: string]: any;
}

/**
 * Page Agent State
 */
export interface PageAgentState {
  pageFiles: {
    component?: string;
    styles?: string;
    script?: string;
    variables?: string;
  };
  currentPageState?: any;
  userQuery: string;
  analysis?: {
    fileRelations?: Record<string, any>;
    widgetLocations?: Record<string, any>;
    eventHandlers?: Record<string, any>;
    styleMappings?: Record<string, any>;
    propertyMappings?: Record<string, any>;
    understanding?: string;
  };
  
  // LangGraph compatibility
  [key: string]: any;
}

