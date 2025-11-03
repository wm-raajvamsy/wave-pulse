/**
 * Type definitions for Codebase Agent system
 */

/**
 * Query Analysis Result
 */
export interface QueryAnalysis {
  intent: 'how' | 'why' | 'what' | 'where' | 'compare' | 'general';
  domain: string[];
  subAgents: string[];
  basePath: 'runtime' | 'codegen' | 'both';
  analysisDepth: 'shallow' | 'deep' | 'comprehensive';
  keywords: string[];
  requiresValidation: boolean;
  confidence?: number;
  analysisMethod?: 'ai' | 'parser';
  reasoning?: string;
}

/**
 * File Match
 */
export interface FileMatch {
  path: string;
  matchType: 'name' | 'content' | 'symbol' | 'dependency';
  confidence: number;
  context?: string;
  size?: number;
}

/**
 * Code Snippet
 */
export interface CodeSnippet {
  startLine: number;
  endLine: number;
  code: string;
  relevance: number;
}

/**
 * File Analysis
 */
export interface FileAnalysis {
  path: string;
  size: number;
  lines: number;
  classes: ClassInfo[];
  interfaces: InterfaceInfo[];
  functions: FunctionInfo[];
  imports: string[];
  exports: string[];
  relationships: Relationship[];
  patterns: Pattern[];
  relevantSnippets: CodeSnippet[];
}

/**
 * Class Information
 */
export interface ClassInfo {
  name: string;
  extends?: string;
  methods: MethodInfo[];
  properties: PropertyInfo[];
}

/**
 * Interface Information
 */
export interface InterfaceInfo {
  name: string;
  properties: PropertyInfo[];
}

/**
 * Function Information
 */
export interface FunctionInfo {
  name: string;
  parameters: ParameterInfo[];
  returnType?: string;
}

/**
 * Method Information
 */
export interface MethodInfo {
  name: string;
  parameters: ParameterInfo[];
  returnType?: string;
}

/**
 * Property Information
 */
export interface PropertyInfo {
  name: string;
  type: string;
  optional?: boolean;
}

/**
 * Parameter Information
 */
export interface ParameterInfo {
  name: string;
  type: string;
  optional?: boolean;
}

/**
 * Relationship
 */
export interface Relationship {
  type: 'extends' | 'implements' | 'uses' | 'imports' | 'calls';
  target: string;
  source: string;
}

/**
 * Pattern
 */
export interface Pattern {
  type: 'Observer' | 'Factory' | 'Singleton' | 'Decorator' | 'Strategy';
  location: string;
  description: string;
}

/**
 * Code Analysis
 */
export interface CodeAnalysis {
  files: FileAnalysis[];
  relationships: Relationship[];
  patterns: Pattern[];
  insights: string[];
}

/**
 * Sub-Agent Response
 */
export interface SubAgentResponse {
  content: string | StructuredResponse;
  sources: FileSource[];
  confidence: number;
  insights?: string[];
  crossReferences?: CrossReference[];
}

/**
 * Structured Response
 */
export interface StructuredResponse {
  summary: string;
  sections: ResponseSection[];
  insights?: string[];
  flow?: string;
}

/**
 * Response Section
 */
export interface ResponseSection {
  title: string;
  content: string;
  sources?: FileSource[];
  agent?: string;
}

/**
 * File Source
 */
export interface FileSource {
  path: string;
  lineStart?: number;
  lineEnd?: number;
  codeSnippet?: string;
}

/**
 * Cross Reference
 */
export interface CrossReference {
  from: string;
  to: string;
  type: 'uses' | 'extends' | 'implements' | 'imports' | 'registered in';
  description: string;
}

/**
 * Agent Response
 */
export interface AgentResponse {
  agent?: string;
  agents?: string[];
  response: string | StructuredResponse;
  sources: FileSource[];
  confidence: number;
  crossReferences?: CrossReference[];
  validation?: ValidationResult;
}

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  inconsistencies?: Inconsistency[];
  agreements?: Agreement[];
  confidence?: number;
}

/**
 * Validation Issue
 */
export interface ValidationIssue {
  type: 'source' | 'code' | 'completeness' | 'consistency';
  severity: 'error' | 'warning';
  message: string;
  source?: FileSource;
  code?: string;
  missingKeywords?: string[];
  responseLength?: number;
}

/**
 * Inconsistency
 */
export interface Inconsistency {
  agents: string[];
  conflicts: string[];
  suggestedResolution?: string;
}

/**
 * Agreement
 */
export interface Agreement {
  agents: string[];
  points: string[];
}

/**
 * Query Context
 */
export interface QueryContext {
  query: string;
  files: FileMatch[];
  codeAnalysis?: CodeAnalysis;
  basePath: string;
  channelId?: string;
  onStepUpdate?: (update: { type: 'step' | 'complete'; data?: any }) => void;
  researchSteps?: Array<{ id: string; description: string; status: string }>;
}

/**
 * Codebase Agent State
 */
export interface CodebaseAgentState {
  // User Input
  userQuery: string;
  channelId?: string;
  
  // Query Analysis
  queryAnalysis?: QueryAnalysis;
  
  // File Discovery
  discoveredFiles?: FileMatch[];
  
  // Code Analysis
  codeAnalysis?: CodeAnalysis;
  
  // Sub-Agent Execution
  subAgentResponses?: Record<string, SubAgentResponse>;
  
  // Aggregated Response
  aggregatedResponse?: AgentResponse;
  
  // Validation
  validation?: ValidationResult;
  
  // Final Response
  finalResponse?: string;
  
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
  
  // Callbacks
  onStepUpdate?: (update: { type: 'step' | 'complete'; data?: any }) => void;
  
  // LangGraph compatibility
  [key: string]: any;
}

/**
 * Base Paths Configuration
 */
export interface BasePaths {
  runtime: string;
  codegen: string;
}

