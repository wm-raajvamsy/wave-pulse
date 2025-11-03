# Codebase Agent Implementation Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Query Processing Pipeline](#query-processing-pipeline)
5. [File Discovery System](#file-discovery-system)
6. [Code Analysis Engine](#code-analysis-engine)
7. [Sub-Agent Integration](#sub-agent-integration)
8. [Response Validation](#response-validation)
9. [Implementation Examples](#implementation-examples)
10. [Best Practices](#best-practices)

---

## Overview

The **Codebase Agent** is an intelligent information retrieval and analysis system designed to understand and explain the WaveMaker React Native codebase. It serves as the primary interface for querying codebase knowledge, analyzing implementations, and providing deep insights into how and why things work.

### Key Characteristics

- **Dual Base Paths**: Operates across both runtime and codegen codebases
- **Always Initialized**: Pre-loaded with `@rn-codebase` architecture knowledge
- **Multi-Tool Operations**: Uses grep, find, cat, sed for file operations
- **Sub-Agent Orchestration**: Coordinates with 16 specialized sub-agents
- **Intelligent Analysis**: Understands context, relationships, and implementations

### Base Paths

```typescript
const BASE_PATHS = {
  runtime: `/root/WaveMaker/WaveMaker-Studio/projects/${channelId}/generated-rn-app/node_modules/@wavemaker/app-rn-runtime`,
  codegen: `/root/WaveMaker/WaveMaker-Studio/projects/${channelId}/generated-rn-app/node_modules/@wavemaker/rn-codegen`
};
```

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Codebase Agent                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Query Analyzer                                        │   │
│  │  - Intent Detection                                    │   │
│  │  - Sub-Agent Selection                                 │   │
│  │  - Query Classification                                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  File Discovery Engine                                 │   │
│  │  - Semantic Search                                     │   │
│  │  - Pattern Matching                                    │   │
│  │  - Dependency Tracing                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Code Analysis Engine                                  │   │
│  │  - AST Parsing                                         │   │
│  │  - Symbol Resolution                                   │   │
│  │  - Flow Analysis                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Sub-Agent Orchestrator                                │   │
│  │  - Agent Selection                                     │   │
│  │  - Parallel Execution                                 │   │
│  │  - Response Aggregation                                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Response Validator                                    │   │
│  │  - Code Verification                                  │   │
│  │  - Consistency Checking                               │   │
│  │  - Source Citation                                    │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │ Runtime │  │ Codegen │  │  Tools  │
    │ Base    │  │ Base    │  │ grep,   │
    │ Path    │  │ Path    │  │ find,   │
    │         │  │         │  │ cat,    │
    │         │  │         │  │ sed     │
    └─────────┘  └─────────┘  └─────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │Sub-Agent│  │Sub-Agent│  │Sub-Agent│
    │  1-16   │  │  1-16   │  │  1-16   │
    └─────────┘  └─────────┘  └─────────┘
```

### Component Interaction Flow

```
User Query
    │
    ▼
Query Analyzer
    ├─→ Intent Detection
    ├─→ Sub-Agent Selection
    └─→ Query Classification
         │
         ├─→ Single Sub-Agent Path
         │   └─→ File Discovery
         │       └─→ Code Analysis
         │           └─→ Response Generation
         │
         └─→ Multi Sub-Agent Path
             ├─→ Parallel Sub-Agent Execution
             ├─→ Response Aggregation
             └─→ Cross-Validation
                 │
                 ▼
         Response Validator
             ├─→ Code Verification
             ├─→ Source Citation
             └─→ Final Response
```

---

## Core Components

### 1. Query Analyzer

**Purpose**: Understand user intent and route queries appropriately.

**Responsibilities**:
- Parse natural language queries
- Detect query intent (how, why, what, where)
- Identify relevant codebase areas
- Select appropriate sub-agents
- Determine analysis depth

**Implementation**:

```typescript
/**
 * AI-Based Query Analyzer with Parser Fallback
 * Uses AI with fixed seed and fine-tuned prompt for accurate query analysis
 */
class QueryAnalyzer {
  private aiClient: AIClient;
  private parser: QueryParser;
  private systemPrompt: string;
  
  constructor(aiClient: AIClient) {
    this.aiClient = aiClient;
    this.parser = new QueryParser();
    this.systemPrompt = this.buildSystemPrompt();
  }
  
  /**
   * Analyzes user query using AI, falls back to parser if AI fails
   */
  async analyzeQuery(query: string): Promise<QueryAnalysis> {
    try {
      // Attempt AI-based analysis
      const aiAnalysis = await this.analyzeWithAI(query);
      
      // Validate AI response
      if (this.validateAnalysis(aiAnalysis)) {
        return {
          ...aiAnalysis,
          confidence: 0.9,
          analysisMethod: 'ai'
        };
      } else {
        // AI response invalid, fall back to parser
        console.warn('AI analysis validation failed, falling back to parser');
        return this.fallbackToParser(query);
      }
    } catch (error) {
      // AI request failed, fall back to parser
      console.warn('AI analysis failed, falling back to parser:', error);
      return this.fallbackToParser(query);
    }
  }
  
  /**
   * Analyzes query using AI with fixed seed and fine-tuned prompt
   */
  private async analyzeWithAI(query: string): Promise<QueryAnalysis> {
    const prompt = this.buildQueryAnalysisPrompt(query);
    
    const response = await this.aiClient.complete({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,  // Low temperature for consistent results
      seed: 42,          // Fixed seed for reproducibility
      response_format: { type: 'json_object' }
    });
    
    const analysis = JSON.parse(response.content);
    return this.normalizeAnalysis(analysis);
  }
  
  /**
   * Builds system prompt for query analysis
   */
  private buildSystemPrompt(): string {
    return `You are an expert query analyzer for the WaveMaker React Native codebase.

Your task is to analyze user queries and extract structured information:

1. **Intent**: What does the user want to know?
   - 'how': How something works (implementation, process)
   - 'why': Why something is designed that way (reasoning, rationale)
   - 'what': What something is (definition, description)
   - 'where': Where something is located (file, location)
   - 'compare': Compare multiple concepts
   - 'general': General inquiry

2. **Domain**: Which codebase area does this query relate to?
   - 'component': Widget components (WmButton, WmText, etc.)
   - 'service': Runtime services (NavigationService, ModalService, etc.)
   - 'binding': Data binding and watchers
   - 'variable': Variables and state management
   - 'style': Theme compilation and styling
   - 'styledefinition': Style definitions and class names
   - 'transpiler': Code generation and transpilation
   - 'transformer': Widget transformation
   - 'fragment': Pages, partials, prefabs
   - 'base': BaseComponent and core infrastructure
   - 'app': Application architecture and generation

3. **Sub-Agents**: Which specialized agents should handle this query?
   Available agents: ComponentAgent, ServiceAgent, BindingAgent, VariableAgent,
   StyleAgent, StyleDefinitionAgent, TranspilerAgent, TransformerAgent,
   ParserAgent, FormatterAgent, GenerationAgent, FragmentAgent,
   WatcherAgent, MemoAgent, AppAgent, BaseAgent

4. **Base Path**: Which codebase should be searched?
   - 'runtime': @wavemaker/app-rn-runtime
   - 'codegen': @wavemaker/rn-codegen
   - 'both': Both codebases

5. **Analysis Depth**: How deep should the analysis be?
   - 'shallow': Quick answer, minimal details
   - 'deep': Detailed analysis with examples
   - 'comprehensive': Complete analysis with all aspects

6. **Keywords**: Important terms extracted from query

Return your analysis as a JSON object with these fields:
{
  "intent": "how|why|what|where|compare|general",
  "domain": ["domain1", "domain2"],
  "subAgents": ["Agent1", "Agent2"],
  "basePath": "runtime|codegen|both",
  "analysisDepth": "shallow|deep|comprehensive",
  "keywords": ["keyword1", "keyword2"],
  "requiresValidation": boolean,
  "reasoning": "brief explanation of your analysis"
}`;
  }
  
  /**
   * Builds query-specific prompt
   */
  private buildQueryAnalysisPrompt(query: string): string {
    return `Analyze the following query about the WaveMaker React Native codebase:

Query: "${query}"

Provide a structured analysis including:
- Intent (what the user wants to know)
- Domain(s) (which codebase areas are relevant)
- Sub-agents (which specialized agents should handle this)
- Base path (which codebase to search)
- Analysis depth (how detailed the answer should be)
- Keywords (important terms)
- Whether validation is required

Consider:
- Context clues in the query
- Technical terms and concepts mentioned
- Whether it's about implementation (how), design (why), or definition (what)
- Whether it spans multiple domains
- The complexity implied by the query`;
  }
  
  /**
   * Normalizes AI response to QueryAnalysis format
   */
  private normalizeAnalysis(analysis: any): QueryAnalysis {
    return {
      intent: analysis.intent || 'general',
      domain: Array.isArray(analysis.domain) ? analysis.domain : [analysis.domain || 'general'],
      subAgents: Array.isArray(analysis.subAgents) ? analysis.subAgents : ['BaseAgent'],
      basePath: analysis.basePath || 'both',
      analysisDepth: analysis.analysisDepth || 'deep',
      keywords: analysis.keywords || [],
      requiresValidation: analysis.requiresValidation || false,
      reasoning: analysis.reasoning,
      confidence: 0.9
    };
  }
  
  /**
   * Validates AI analysis response
   */
  private validateAnalysis(analysis: QueryAnalysis): boolean {
    // Check required fields
    if (!analysis.intent || !analysis.domain || !analysis.subAgents) {
      return false;
    }
    
    // Validate intent
    const validIntents = ['how', 'why', 'what', 'where', 'compare', 'general'];
    if (!validIntents.includes(analysis.intent)) {
      return false;
    }
    
    // Validate domain
    const validDomains = [
      'component', 'service', 'binding', 'variable', 'style',
      'styledefinition', 'transpiler', 'transformer', 'fragment',
      'base', 'app', 'parser', 'formatter', 'generation', 'watcher', 'memo'
    ];
    if (!analysis.domain.every(d => validDomains.includes(d))) {
      return false;
    }
    
    // Validate sub-agents
    const validAgents = [
      'ComponentAgent', 'ServiceAgent', 'BindingAgent', 'VariableAgent',
      'StyleAgent', 'StyleDefinitionAgent', 'TranspilerAgent', 'TransformerAgent',
      'ParserAgent', 'FormatterAgent', 'GenerationAgent', 'FragmentAgent',
      'WatcherAgent', 'MemoAgent', 'AppAgent', 'BaseAgent'
    ];
    if (!analysis.subAgents.every(agent => validAgents.includes(agent))) {
      return false;
    }
    
    // Validate base path
    if (!['runtime', 'codegen', 'both'].includes(analysis.basePath)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Falls back to parser-based analysis
   */
  private fallbackToParser(query: string): QueryAnalysis {
    const parserAnalysis = this.parser.analyzeQuery(query);
    return {
      ...parserAnalysis,
      analysisMethod: 'parser',
      confidence: parserAnalysis.confidence || 0.7
    };
  }
}

/**
 * Fallback Query Parser (original implementation)
 * Used when AI analysis fails or returns invalid results
 */
class QueryParser {
  /**
   * Analyzes user query and determines processing strategy
   */
  analyzeQuery(query: string): QueryAnalysis {
    const intent = this.detectIntent(query);
    const domain = this.identifyDomain(query);
    const subAgents = this.selectSubAgents(query, domain);
    const analysisDepth = this.determineDepth(query);
    
    return {
      intent,
      domain,
      subAgents,
      analysisDepth,
      basePath: this.getBasePath(domain),
      requiresValidation: this.requiresValidation(query),
      keywords: this.extractKeywords(query),
      confidence: 0.7  // Lower confidence for parser-based analysis
    };
  }
  
  /**
   * Detects query intent from natural language
   */
  detectIntent(query: string): QueryIntent {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('how') || lowerQuery.includes('how does')) {
      return 'how';
    }
    if (lowerQuery.includes('why') || lowerQuery.includes('why does')) {
      return 'why';
    }
    if (lowerQuery.includes('what') || lowerQuery.includes('what is')) {
      return 'what';
    }
    if (lowerQuery.includes('where') || lowerQuery.includes('where is')) {
      return 'where';
    }
    if (lowerQuery.includes('compare') || lowerQuery.includes('difference')) {
      return 'compare';
    }
    
    return 'general';
  }
  
  /**
   * Identifies codebase domain from keywords
   */
  identifyDomain(query: string): string[] {
    const domains: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Component-related keywords
    if (lowerQuery.match(/\b(component|widget|button|list|form)\b/)) {
      domains.push('component');
    }
    
    // Service-related keywords
    if (lowerQuery.match(/\b(service|navigation|modal|toast|storage)\b/)) {
      domains.push('service');
    }
    
    // Binding-related keywords
    if (lowerQuery.match(/\b(binding|watcher|watch|two-way|one-way)\b/)) {
      domains.push('binding');
    }
    
    // Variable-related keywords
    if (lowerQuery.match(/\b(variable|livevariable|servicevariable)\b/)) {
      domains.push('variable');
    }
    
    // Style-related keywords
    if (lowerQuery.match(/\b(style|theme|css|less|styling)\b/)) {
      domains.push('style');
    }
    
    // Style definition keywords
    if (lowerQuery.includes('class name') || 
        lowerQuery.includes('style definition') ||
        lowerQuery.includes('styledef') ||
        lowerQuery.includes('rnStyleSelector')) {
      domains.push('styledefinition');
    }
    
    // Transpilation-related keywords
    if (lowerQuery.match(/\b(transpile|transformer|codegen|generate)\b/)) {
      domains.push('transpiler');
    }
    
    return domains.length > 0 ? domains : ['general'];
  }
  
  /**
   * Selects appropriate sub-agents based on domain and query
   */
  selectSubAgents(query: string, domains: string[]): string[] {
    const agentMap: Record<string, string> = {
      'component': 'ComponentAgent',
      'service': 'ServiceAgent',
      'binding': 'BindingAgent',
      'variable': 'VariableAgent',
      'style': 'StyleAgent',
      'styledefinition': 'StyleDefinitionAgent',
      'style-definition': 'StyleDefinitionAgent',
      'transpiler': 'TranspilerAgent',
      'transformer': 'TransformerAgent',
      'parser': 'ParserAgent',
      'formatter': 'FormatterAgent',
      'generation': 'GenerationAgent',
      'fragment': 'FragmentAgent',
      'watcher': 'WatcherAgent',
      'memo': 'MemoAgent',
      'app': 'AppAgent',
      'base': 'BaseAgent'
    };
    
    const selectedAgents: string[] = [];
    
    // Primary agent based on domain
    domains.forEach(domain => {
      if (agentMap[domain]) {
        selectedAgents.push(agentMap[domain]);
      }
    });
    
    // Additional agents based on query context
    const lowerQuery = query.toLowerCase();
    
    // If query involves BaseComponent, always include BaseAgent
    if (lowerQuery.includes('basecomponent') || lowerQuery.includes('base component')) {
      if (!selectedAgents.includes('BaseAgent')) {
        selectedAgents.push('BaseAgent');
      }
    }
    
    // If query involves data flow, include BindingAgent
    if (lowerQuery.includes('data flow') || lowerQuery.includes('data binding')) {
      if (!selectedAgents.includes('BindingAgent')) {
        selectedAgents.push('BindingAgent');
      }
    }
    
    // If query involves style definitions, class names, or styledef files
    if (lowerQuery.includes('class name') || 
        lowerQuery.includes('style definition') ||
        lowerQuery.includes('styledef') ||
        lowerQuery.includes('rnStyleSelector') ||
        lowerQuery.includes('style element') ||
        (lowerQuery.includes('style') && (lowerQuery.includes('icon') || lowerQuery.includes('element')))) {
      if (!selectedAgents.includes('StyleDefinitionAgent')) {
        selectedAgents.push('StyleDefinitionAgent');
      }
    }
    
    return selectedAgents.length > 0 ? selectedAgents : ['BaseAgent'];
  }
  
  /**
   * Determines analysis depth based on query
   */
  determineDepth(query: string): AnalysisDepth {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('deep') || lowerQuery.includes('detailed') || lowerQuery.includes('comprehensive')) {
      return 'comprehensive';
    }
    if (lowerQuery.includes('quick') || lowerQuery.includes('simple')) {
      return 'shallow';
    }
    return 'deep';
  }
  
  /**
   * Determines which codebase to search based on domains
   */
  getBasePath(domains: string[]): 'runtime' | 'codegen' | 'both' {
    const codegenDomains = ['styledefinition', 'transpiler', 'transformer', 'generation', 'parser'];
    const runtimeDomains = ['component', 'service', 'binding', 'variable', 'watcher'];
    
    const hasCodegen = domains.some(d => codegenDomains.includes(d));
    const hasRuntime = domains.some(d => runtimeDomains.includes(d));
    
    if (hasCodegen && hasRuntime) return 'both';
    if (hasCodegen) return 'codegen';
    if (hasRuntime) return 'runtime';
    return 'both';
  }
  
  /**
   * Checks if query requires validation
   */
  requiresValidation(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('verify') || 
           lowerQuery.includes('validate') || 
           lowerQuery.includes('check') ||
           lowerQuery.includes('ensure');
  }
  
  /**
   * Extracts keywords from query
   */
  extractKeywords(query: string): string[] {
    // Simple keyword extraction
    const words = query.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'how', 'what', 'where', 'why', 'does', 'do', 'to', 'in', 'on', 'at'];
    return words.filter(word => word.length > 2 && !stopWords.includes(word));
  }
}

/**
 * QueryAnalysis interface
 */
interface QueryAnalysis {
  intent: QueryIntent;                    // 'how' | 'why' | 'what' | 'where' | 'compare' | 'general'
  domain: string[];                       // ['component', 'service', etc.]
  subAgents: string[];                   // ['ComponentAgent', 'BaseAgent']
  basePath: 'runtime' | 'codegen' | 'both';
  analysisDepth: 'shallow' | 'deep' | 'comprehensive';
  keywords: string[];                     // Extracted keywords
  requiresValidation: boolean;            // Whether response needs validation
  confidence?: number;                    // Confidence score (0-1)
  analysisMethod?: 'ai' | 'parser';     // Which method was used
  reasoning?: string;                     // AI reasoning (if available)
}

type QueryIntent = 'how' | 'why' | 'what' | 'where' | 'compare' | 'general';
type AnalysisDepth = 'shallow' | 'deep' | 'comprehensive';
```

### 2. File Discovery Engine

**Purpose**: Find relevant files based on query intent.

**Responsibilities**:
- Semantic file search
- Pattern matching
- Dependency tracing
- Cross-reference discovery

**Implementation**:

```typescript
class FileDiscoveryEngine {
  private basePaths: BasePaths;
  
  constructor(channelId: string) {
    this.basePaths = {
      runtime: `/root/WaveMaker/WaveMaker-Studio/projects/${channelId}/generated-rn-app/node_modules/@wavemaker/app-rn-runtime`,
      codegen: `/root/WaveMaker/WaveMaker-Studio/projects/${channelId}/generated-rn-app/node_modules/@wavemaker/rn-codegen`
    };
  }
  
  /**
   * Discovers files relevant to query
   */
  async discoverFiles(query: string, domain: string[], basePath: string): Promise<FileMatch[]> {
    const matches: FileMatch[] = [];
    
    // Strategy 1: Direct file name matching
    matches.push(...await this.findByName(query, basePath));
    
    // Strategy 2: Content-based search
    matches.push(...await this.findByContent(query, basePath));
    
    // Strategy 3: Symbol-based search
    matches.push(...await this.findBySymbol(query, basePath));
    
    // Strategy 4: Dependency tracing
    matches.push(...await this.findByDependency(query, basePath));
    
    // Deduplicate and rank
    return this.rankAndDeduplicate(matches);
  }
  
  /**
   * Finds files by name patterns
   */
  private async findByName(query: string, basePath: string): Promise<FileMatch[]> {
    const patterns = this.extractNamePatterns(query);
    const matches: FileMatch[] = [];
    
    for (const pattern of patterns) {
      // Use find command
      const result = await this.executeCommand(`find ${basePath} -name "*${pattern}*" -type f`);
      const files = result.stdout.split('\n').filter(f => f.trim());
      
      files.forEach(file => {
        matches.push({
          path: file,
          matchType: 'name',
          confidence: this.calculateConfidence(pattern, file),
          context: this.extractContext(file)
        });
      });
    }
    
    return matches;
  }
  
  /**
   * Finds files by content search
   */
  private async findByContent(query: string, basePath: string): Promise<FileMatch[]> {
    const keywords = this.extractKeywords(query);
    const matches: FileMatch[] = [];
    
    for (const keyword of keywords) {
      // Use grep recursively
      const result = await this.executeCommand(
        `grep -r -l --include="*.ts" --include="*.tsx" --include="*.js" "${keyword}" ${basePath}`
      );
      
      const files = result.stdout.split('\n').filter(f => f.trim());
      
      files.forEach(file => {
        matches.push({
          path: file,
          matchType: 'content',
          confidence: this.calculateContentConfidence(keyword, file),
          context: this.extractContext(file)
        });
      });
    }
    
    return matches;
  }
  
  /**
   * Finds files by symbol/class/function names
   */
  private async findBySymbol(query: string, basePath: string): Promise<FileMatch[]> {
    const symbols = this.extractSymbols(query);
    const matches: FileMatch[] = [];
    
    for (const symbol of symbols) {
      // Search for class declarations
      const classResult = await this.executeCommand(
        `grep -r -l "class ${symbol}" ${basePath} --include="*.ts" --include="*.tsx"`
      );
      
      // Search for interface declarations
      const interfaceResult = await this.executeCommand(
        `grep -r -l "interface ${symbol}" ${basePath} --include="*.ts" --include="*.tsx"`
      );
      
      // Search for type declarations
      const typeResult = await this.executeCommand(
        `grep -r -l "type ${symbol}" ${basePath} --include="*.ts" --include="*.tsx"`
      );
      
      const allFiles = [
        ...classResult.stdout.split('\n'),
        ...interfaceResult.stdout.split('\n'),
        ...typeResult.stdout.split('\n')
      ].filter(f => f.trim());
      
      allFiles.forEach(file => {
        matches.push({
          path: file,
          matchType: 'symbol',
          confidence: 0.9, // High confidence for symbol matches
          context: this.extractContext(file)
        });
      });
    }
    
    return matches;
  }
  
  /**
   * Traces dependencies to find related files
   */
  private async findByDependency(query: string, basePath: string): Promise<FileMatch[]> {
    const initialFiles = await this.findByName(query, basePath);
    const matches: FileMatch[] = [];
    
    for (const file of initialFiles.slice(0, 5)) { // Limit to top 5
      // Extract imports from file
      const imports = await this.extractImports(file.path);
      
      for (const importPath of imports) {
        const resolvedPath = this.resolveImportPath(importPath, file.path, basePath);
        if (resolvedPath && await this.fileExists(resolvedPath)) {
          matches.push({
            path: resolvedPath,
            matchType: 'dependency',
            confidence: 0.7,
            context: `Imported by ${file.path}`
          });
        }
      }
    }
    
    return matches;
  }
  
  /**
   * Extracts imports from TypeScript/JavaScript file
   */
  private async extractImports(filePath: string): Promise<string[]> {
    const content = await this.readFile(filePath);
    const imports: string[] = [];
    
    // Match import statements
    const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }
  
  /**
   * Executes shell command and returns result
   */
  private async executeCommand(command: string): Promise<CommandResult> {
    // Implementation using child_process or similar
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    try {
      const result = await execPromise(command);
      return {
        stdout: result.stdout,
        stderr: result.stderr,
        code: 0
      };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        code: error.code || 1
      };
    }
  }
}
```

### 3. Code Analysis Engine

**Purpose**: Analyze code and extract meaningful insights.

**Responsibilities**:
- Parse code structure
- Extract relationships
- Understand flow
- Identify patterns

**Implementation**:

```typescript
class CodeAnalysisEngine {
  /**
   * Analyzes code files and extracts insights
   */
  async analyzeCode(files: FileMatch[], query: string): Promise<CodeAnalysis> {
    const analysis: CodeAnalysis = {
      files: [],
      relationships: [],
      patterns: [],
      insights: []
    };
    
    for (const file of files.slice(0, 10)) { // Limit to top 10 files
      const fileAnalysis = await this.analyzeFile(file.path, query);
      analysis.files.push(fileAnalysis);
      
      // Extract relationships
      analysis.relationships.push(...fileAnalysis.relationships);
      
      // Extract patterns
      analysis.patterns.push(...fileAnalysis.patterns);
    }
    
    // Generate insights
    analysis.insights = this.generateInsights(analysis, query);
    
    return analysis;
  }
  
  /**
   * Analyzes individual file
   */
  private async analyzeFile(filePath: string, query: string): Promise<FileAnalysis> {
    const content = await this.readFile(filePath);
    const ast = this.parseAST(content);
    
    return {
      path: filePath,
      size: content.length,
      lines: content.split('\n').length,
      classes: this.extractClasses(ast),
      interfaces: this.extractInterfaces(ast),
      functions: this.extractFunctions(ast),
      imports: this.extractImports(ast),
      exports: this.extractExports(ast),
      relationships: this.extractRelationships(ast),
      patterns: this.identifyPatterns(ast),
      relevantSnippets: this.findRelevantSnippets(content, query)
    };
  }
  
  /**
   * Finds relevant code snippets based on query
   */
  private findRelevantSnippets(content: string, query: string): CodeSnippet[] {
    const snippets: CodeSnippet[] = [];
    const lines = content.split('\n');
    const keywords = this.extractKeywords(query);
    
    lines.forEach((line, index) => {
      const relevance = this.calculateRelevance(line, keywords);
      if (relevance > 0.5) {
        // Include context lines
        const start = Math.max(0, index - 5);
        const end = Math.min(lines.length, index + 10);
        
        snippets.push({
          startLine: start + 1,
          endLine: end + 1,
          code: lines.slice(start, end).join('\n'),
          relevance
        });
      }
    });
    
    return snippets.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
  }
  
  /**
   * Extracts class information from AST
   */
  private extractClasses(ast: any): ClassInfo[] {
    const classes: ClassInfo[] = [];
    
    // Traverse AST to find class declarations
    this.traverseAST(ast, {
      ClassDeclaration(node: any) {
        classes.push({
          name: node.id.name,
          extends: node.superClass?.name,
          methods: this.extractMethods(node),
          properties: this.extractProperties(node)
        });
      }
    });
    
    return classes;
  }
  
  /**
   * Generates insights from analysis
   */
  private generateInsights(analysis: CodeAnalysis, query: string): string[] {
    const insights: string[] = [];
    
    // Pattern-based insights
    if (analysis.patterns.some(p => p.type === 'Observer')) {
      insights.push('Uses Observer pattern for event handling');
    }
    
    if (analysis.patterns.some(p => p.type === 'Factory')) {
      insights.push('Uses Factory pattern for object creation');
    }
    
    // Relationship-based insights
    const relationships = analysis.relationships;
    if (relationships.some(r => r.type === 'extends' && r.target === 'BaseComponent')) {
      insights.push('Components extend BaseComponent for consistent lifecycle');
    }
    
    // Architecture insights
    if (query.toLowerCase().includes('how')) {
      insights.push(...this.generateHowInsights(analysis));
    }
    
    if (query.toLowerCase().includes('why')) {
      insights.push(...this.generateWhyInsights(analysis));
    }
    
    return insights;
  }
}
```

### 4. Sub-Agent Orchestrator

**Purpose**: Coordinate sub-agent execution and aggregate responses.

**Responsibilities**:
- Route queries to sub-agents
- Parallel execution
- Response aggregation
- Conflict resolution

**Implementation**:

```typescript
class SubAgentOrchestrator {
  private agents: Map<string, SubAgent>;
  
  constructor() {
    this.initializeAgents();
  }
  
  /**
   * Initializes all sub-agents
   */
  private initializeAgents() {
    this.agents = new Map([
      ['TransformerAgent', new TransformerAgent()],
      ['StyleAgent', new StyleAgent()],
      ['StyleDefinitionAgent', new StyleDefinitionAgent()],
      ['ServiceAgent', new ServiceAgent()],
      ['ComponentAgent', new ComponentAgent()],
      ['AppAgent', new AppAgent()],
      ['BaseAgent', new BaseAgent()],
      ['ParserAgent', new ParserAgent()],
      ['FormatterAgent', new FormatterAgent()],
      ['GenerationAgent', new GenerationAgent()],
      ['BindingAgent', new BindingAgent()],
      ['VariableAgent', new VariableAgent()],
      ['TranspilerAgent', new TranspilerAgent()],
      ['FragmentAgent', new FragmentAgent()],
      ['WatcherAgent', new WatcherAgent()],
      ['MemoAgent', new MemoAgent()]
    ]);
  }
  
  /**
   * Executes query with selected sub-agents
   */
  async execute(query: string, selectedAgents: string[], context: QueryContext): Promise<AgentResponse> {
    if (selectedAgents.length === 1) {
      // Single agent execution
      return await this.executeSingleAgent(query, selectedAgents[0], context);
    } else {
      // Multi-agent execution
      return await this.executeMultipleAgents(query, selectedAgents, context);
    }
  }
  
  /**
   * Executes query with single sub-agent
   */
  private async executeSingleAgent(
    query: string,
    agentName: string,
    context: QueryContext
  ): Promise<AgentResponse> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }
    
    const response = await agent.process(query, context);
    
    return {
      agent: agentName,
      response: response.content,
      sources: response.sources,
      confidence: response.confidence,
      crossReferences: await this.findCrossReferences(response, agentName)
    };
  }
  
  /**
   * Executes query with multiple sub-agents in parallel
   */
  private async executeMultipleAgents(
    query: string,
    agentNames: string[],
    context: QueryContext
  ): Promise<AgentResponse> {
    // Execute all agents in parallel
    const agentPromises = agentNames.map(agentName => {
      const agent = this.agents.get(agentName);
      if (!agent) {
        return Promise.resolve(null);
      }
      return agent.process(query, context).then(response => ({
        agentName,
        response
      }));
    });
    
    const agentResults = await Promise.all(agentPromises);
    
    // Filter out null results
    const validResults = agentResults.filter(r => r !== null) as Array<{
      agentName: string;
      response: any;
    }>;
    
    // Aggregate responses
    const aggregated = this.aggregateResponses(validResults, query);
    
    // Validate consistency
    const validation = await this.validateConsistency(validResults);
    
    return {
      agents: agentNames,
      response: aggregated.content,
      sources: this.mergeSources(validResults),
      confidence: this.calculateConfidence(validResults, validation),
      crossReferences: aggregated.crossReferences,
      validation: validation
    };
  }
  
  /**
   * Aggregates responses from multiple agents
   */
  private aggregateResponses(
    results: Array<{ agentName: string; response: any }>,
    query: string
  ): AggregatedResponse {
    const sections: ResponseSection[] = [];
    const insights: string[] = [];
    
    // Group by agent
    results.forEach(({ agentName, response }) => {
      sections.push({
        title: `${agentName} Analysis`,
        content: response.content,
        sources: response.sources
      });
      
      if (response.insights) {
        insights.push(...response.insights);
      }
    });
    
    // Generate summary
    const summary = this.generateSummary(sections, query);
    
    return {
      content: {
        summary,
        sections,
        insights
      },
      crossReferences: this.findCrossReferences(sections)
    };
  }
  
  /**
   * Finds cross-references between agent responses
   */
  private findCrossReferences(
    responses: ResponseSection[] | AgentResponse,
    excludeAgent?: string
  ): CrossReference[] {
    const references: CrossReference[] = [];
    
    // Extract file paths from all responses
    const allFiles = new Set<string>();
    const sections = Array.isArray(responses) ? responses : [responses as any];
    
    sections.forEach(section => {
      section.sources?.forEach((source: FileSource) => {
        allFiles.add(source.path);
      });
    });
    
    // Find relationships between files
    allFiles.forEach(file => {
      allFiles.forEach(otherFile => {
        if (file !== otherFile) {
          const relationship = this.findRelationship(file, otherFile);
          if (relationship) {
            references.push({
              from: file,
              to: otherFile,
              type: relationship.type,
              description: relationship.description
            });
          }
        }
      });
    });
    
    return references;
  }
  
  /**
   * Validates consistency across agent responses
   */
  private async validateConsistency(
    results: Array<{ agentName: string; response: any }>
  ): Promise<ValidationResult> {
    const inconsistencies: Inconsistency[] = [];
    const agreements: Agreement[] = [];
    
    // Compare responses for conflicting information
    for (let i = 0; i < results.length; i++) {
      for (let j = i + 1; j < results.length; j++) {
        const comparison = this.compareResponses(
          results[i].response,
          results[j].response
        );
        
        if (comparison.conflicts.length > 0) {
          inconsistencies.push({
            agents: [results[i].agentName, results[j].agentName],
            conflicts: comparison.conflicts,
            resolution: comparison.suggestedResolution
          });
        }
        
        if (comparison.agreements.length > 0) {
          agreements.push({
            agents: [results[i].agentName, results[j].agentName],
            points: comparison.agreements
          });
        }
      }
    }
    
    return {
      consistent: inconsistencies.length === 0,
      inconsistencies,
      agreements,
      confidence: this.calculateConsistencyConfidence(inconsistencies, agreements)
    };
  }
}
```

### 5. Response Validator

**Purpose**: Validate responses for accuracy and completeness.

**Responsibilities**:
- Code verification
- Source citation
- Consistency checking
- Completeness validation

**Implementation**:

```typescript
class ResponseValidator {
  /**
   * Validates agent response
   */
  async validate(response: AgentResponse, query: string): Promise<ValidationResult> {
    const validations: ValidationIssue[] = [];
    
    // Validate source citations
    validations.push(...await this.validateSources(response.sources));
    
    // Validate code snippets
    validations.push(...await this.validateCodeSnippets(response.response));
    
    // Validate completeness
    validations.push(...await this.validateCompleteness(response, query));
    
    // Validate consistency
    validations.push(...await this.validateConsistency(response));
    
    return {
      valid: validations.filter(v => v.severity === 'error').length === 0,
      issues: validations,
      confidence: this.calculateConfidence(validations)
    };
  }
  
  /**
   * Validates source file citations
   */
  private async validateSources(sources: FileSource[]): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    
    for (const source of sources) {
      // Check if file exists
      if (!await this.fileExists(source.path)) {
        issues.push({
          type: 'source',
          severity: 'error',
          message: `Source file not found: ${source.path}`,
          source
        });
        continue;
      }
      
      // Verify line numbers are valid
      if (source.lineStart) {
        const fileLines = await this.getFileLineCount(source.path);
        if (source.lineStart > fileLines || source.lineEnd > fileLines) {
          issues.push({
            type: 'source',
            severity: 'warning',
            message: `Line numbers out of range for ${source.path}`,
            source
          });
        }
      }
      
      // Verify code snippet matches file content
      if (source.codeSnippet) {
        const actualCode = await this.readFileLines(
          source.path,
          source.lineStart || 1,
          source.lineEnd || source.lineStart || 1
        );
        
        if (!this.codeMatches(actualCode, source.codeSnippet)) {
          issues.push({
            type: 'source',
            severity: 'warning',
            message: `Code snippet doesn't match file content for ${source.path}`,
            source
          });
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Validates code snippets in response
   */
  private async validateCodeSnippets(response: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const codeBlocks = this.extractCodeBlocks(response);
    
    for (const block of codeBlocks) {
      // Check syntax
      try {
        // Try to parse as TypeScript/JavaScript
        this.parseCode(block.code);
      } catch (error) {
        issues.push({
          type: 'code',
          severity: 'error',
          message: `Syntax error in code snippet: ${error}`,
          code: block.code
        });
      }
      
      // Check if code references exist
      const references = this.extractReferences(block.code);
      for (const ref of references) {
        if (!await this.referenceExists(ref, block.sourcePath)) {
          issues.push({
            type: 'code',
            severity: 'warning',
            message: `Reference not found: ${ref}`,
            code: block.code
          });
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Validates response completeness
   */
  private async validateCompleteness(
    response: AgentResponse,
    query: string
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const queryKeywords = this.extractKeywords(query);
    
    // Check if response addresses all query keywords
    const responseText = typeof response.response === 'string'
      ? response.response
      : JSON.stringify(response.response);
    
    const missingKeywords = queryKeywords.filter(
      keyword => !responseText.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (missingKeywords.length > 0) {
      issues.push({
        type: 'completeness',
        severity: 'warning',
        message: `Response may not address: ${missingKeywords.join(', ')}`,
        missingKeywords
      });
    }
    
    // Check if response has sufficient detail
    if (responseText.length < 100) {
      issues.push({
        type: 'completeness',
        severity: 'warning',
        message: 'Response may be too brief',
        responseLength: responseText.length
      });
    }
    
    return issues;
  }
}
```

---

## Query Processing Pipeline

### Complete Pipeline Flow

```
┌─────────────────────────────────────────────────────────────┐
│               QUERY PROCESSING PIPELINE                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. QUERY RECEIVED                                           │
│     User Query: "How does BaseComponent handle lifecycle?"  │
│                                                              │
│  2. QUERY ANALYSIS                                           │
│     ├─→ Intent: "how"                                        │
│     ├─→ Domain: ["component", "base"]                       │
│     ├─→ Sub-Agents: ["BaseAgent", "ComponentAgent"]         │
│     └─→ Base Path: "runtime"                                │
│                                                              │
│  3. FILE DISCOVERY                                           │
│     ├─→ Search: "BaseComponent"                             │
│     ├─→ Found: base.component.tsx                            │
│     ├─→ Found: component-lifecycle.md (docs)                 │
│     └─→ Found: base-fragment.component.tsx                   │
│                                                              │
│  4. CODE ANALYSIS                                            │
│     ├─→ Parse: base.component.tsx                            │
│     ├─→ Extract: lifecycle methods                          │
│     ├─→ Extract: componentDidMount, componentWillUnmount    │
│     └─→ Relationships: extends React.Component               │
│                                                              │
│  5. SUB-AGENT EXECUTION                                      │
│     ├─→ BaseAgent.process()                                 │
│     │   └─→ Provides: BaseComponent API details             │
│     └─→ ComponentAgent.process()                            │
│         └─→ Provides: Component lifecycle patterns           │
│                                                              │
│  6. RESPONSE AGGREGATION                                     │
│     ├─→ Merge: BaseAgent + ComponentAgent responses          │
│     ├─→ Cross-reference: Related files                       │
│     └─→ Generate: Comprehensive explanation                  │
│                                                              │
│  7. VALIDATION                                               │
│     ├─→ Verify: Source file citations                       │
│     ├─→ Check: Code snippet accuracy                         │
│     └─→ Validate: Completeness                              │
│                                                              │
│  8. RESPONSE GENERATION                                      │
│     ├─→ Format: Structured response                         │
│     ├─→ Include: Code examples                              │
│     ├─→ Add: Source citations                                │
│     └─→ Provide: Cross-references                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Pipeline Implementation

```typescript
class CodebaseAgent {
  private queryAnalyzer: QueryAnalyzer;
  private fileDiscovery: FileDiscoveryEngine;
  private codeAnalyzer: CodeAnalysisEngine;
  private orchestrator: SubAgentOrchestrator;
  private validator: ResponseValidator;
  
  constructor(channelId: string) {
    this.queryAnalyzer = new QueryAnalyzer();
    this.fileDiscovery = new FileDiscoveryEngine(channelId);
    this.codeAnalyzer = new CodeAnalysisEngine();
    this.orchestrator = new SubAgentOrchestrator();
    this.validator = new ResponseValidator();
  }
  
  /**
   * Main entry point for query processing
   */
  async processQuery(query: string): Promise<AgentResponse> {
    // Step 1: Analyze query
    const analysis = this.queryAnalyzer.analyzeQuery(query);
    
    // Step 2: Discover relevant files
    const basePath = this.getBasePath(analysis.basePath);
    const files = await this.fileDiscovery.discoverFiles(
      query,
      analysis.domain,
      basePath
    );
    
    // Step 3: Analyze code
    const codeAnalysis = await this.codeAnalyzer.analyzeCode(files, query);
    
    // Step 4: Execute sub-agents
    const context: QueryContext = {
      query,
      files,
      codeAnalysis,
      basePath
    };
    
    const response = await this.orchestrator.execute(
      query,
      analysis.subAgents,
      context
    );
    
    // Step 5: Validate response
    const validation = await this.validator.validate(response, query);
    
    // Step 6: Enhance response with validation results
    response.validation = validation;
    
    return response;
  }
  
  /**
   * Gets appropriate base path
   */
  private getBasePath(pathType: string): string {
    if (pathType === 'runtime') {
      return this.fileDiscovery.basePaths.runtime;
    } else if (pathType === 'codegen') {
      return this.fileDiscovery.basePaths.codegen;
    } else {
      // Both - search in runtime first, then codegen
      return this.fileDiscovery.basePaths.runtime;
    }
  }
}
```

---

## File Discovery System

### Discovery Strategies

The file discovery system uses multiple strategies to find relevant files:

#### Strategy 1: Name-Based Matching

```typescript
// Example: Query "How does WmButton work?"
// Searches for files matching patterns:
find runtime -name "*button*" -type f
find runtime -name "*Button*" -type f
find runtime -path "*/components/basic/button*"
```

#### Strategy 2: Content-Based Search

```typescript
// Example: Query "How does two-way binding work?"
// Searches for content:
grep -r "two-way binding" runtime
grep -r "twoWay" runtime
grep -r "dataValue.*bind" runtime
```

#### Strategy 3: Symbol-Based Search

```typescript
// Example: Query "How does BaseComponent work?"
// Searches for symbol declarations:
grep -r "class BaseComponent" runtime
grep -r "interface BaseComponent" runtime
grep -r "export.*BaseComponent" runtime
```

#### Strategy 4: Dependency Tracing

```typescript
// Example: Query "How does WmButton use BaseComponent?"
// 1. Finds WmButton file
// 2. Extracts imports: import { BaseComponent } from '...'
// 3. Resolves import path
// 4. Finds BaseComponent file
// 5. Traces dependencies recursively
```

### File Ranking Algorithm

```typescript
class FileRanker {
  /**
   * Ranks files by relevance to query
   */
  rankFiles(files: FileMatch[], query: string): RankedFile[] {
    return files.map(file => ({
      ...file,
      score: this.calculateScore(file, query)
    })).sort((a, b) => b.score - a.score);
  }
  
  /**
   * Calculates relevance score
   */
  private calculateScore(file: FileMatch, query: string): number {
    let score = 0;
    
    // Base confidence from discovery
    score += file.confidence * 30;
    
    // Name match bonus
    if (file.matchType === 'name') {
      score += 20;
    }
    
    // Symbol match bonus (highest)
    if (file.matchType === 'symbol') {
      score += 30;
    }
    
    // File path relevance
    const pathRelevance = this.calculatePathRelevance(file.path, query);
    score += pathRelevance * 20;
    
    // File size penalty (very large files are less relevant)
    const sizePenalty = Math.min(file.size / 10000, 10);
    score -= sizePenalty;
    
    return Math.min(score, 100);
  }
  
  /**
   * Calculates relevance based on file path
   */
  private calculatePathRelevance(path: string, query: string): number {
    const keywords = this.extractKeywords(query);
    const lowerPath = path.toLowerCase();
    
    let relevance = 0;
    keywords.forEach(keyword => {
      if (lowerPath.includes(keyword.toLowerCase())) {
        relevance += 1;
      }
    });
    
    // Core files get bonus
    if (path.includes('core/') || path.includes('base')) {
      relevance += 0.5;
    }
    
    return Math.min(relevance / keywords.length, 1);
  }
}
```

---

## Code Analysis Engine

### Analysis Capabilities

The code analysis engine provides deep insights into code structure:

#### 1. AST Parsing

```typescript
// Parses TypeScript/JavaScript files into AST
// Extracts:
// - Class declarations
// - Interface definitions
// - Function signatures
// - Import statements
// - Export statements
// - Type annotations
```

#### 2. Relationship Extraction

```typescript
// Identifies relationships:
// - Class inheritance (extends)
// - Interface implementation (implements)
// - Composition (has-a)
// - Dependency (imports)
// - Usage (calls, references)
```

#### 3. Pattern Recognition

```typescript
// Recognizes common patterns:
// - Observer Pattern
// - Factory Pattern
// - Singleton Pattern
// - Decorator Pattern
// - Strategy Pattern
```

#### 4. Flow Analysis

```typescript
// Analyzes data flow:
// - Variable definitions
// - Variable usage
// - Function call chains
// - Event propagation
// - State updates
```

---

## Sub-Agent Integration

### Sub-Agent Interface

All sub-agents implement a common interface:

```typescript
interface SubAgent {
  /**
   * Processes query and returns response
   */
  process(query: string, context: QueryContext): Promise<SubAgentResponse>;
  
  /**
   * Returns agent's domain/expertise
   */
  getDomain(): string[];
  
  /**
   * Returns key files this agent specializes in
   */
  getKeyFiles(): string[];
  
  /**
   * Checks if agent can handle query
   */
  canHandle(query: string): boolean;
}

interface SubAgentResponse {
  content: string | StructuredResponse;
  sources: FileSource[];
  confidence: number;
  insights?: string[];
  crossReferences?: CrossReference[];
}
```

### Sub-Agent Examples

#### BaseAgent Implementation

```typescript
class BaseAgent implements SubAgent {
  getDomain(): string[] {
    return ['basecomponent', 'core', 'lifecycle', 'infrastructure'];
  }
  
  getKeyFiles(): string[] {
    return [
      'src/core/base.component.tsx',
      'src/core/props.provider.ts',
      'src/core/event-notifier.ts',
      'src/core/wm-component-tree.ts'
    ];
  }
  
  canHandle(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('basecomponent') ||
           lowerQuery.includes('base component') ||
           lowerQuery.includes('core infrastructure') ||
           lowerQuery.includes('component lifecycle');
  }
  
  async process(query: string, context: QueryContext): Promise<SubAgentResponse> {
    // Find relevant files
    const files = await this.findFiles(query, context);
    
    // Analyze code
    const analysis = await this.analyzeFiles(files, query);
    
    // Generate response
    const response = this.generateResponse(query, analysis);
    
    return {
      content: response,
      sources: this.extractSources(files),
      confidence: 0.9,
      insights: this.generateInsights(analysis)
    };
  }
  
  private async findFiles(query: string, context: QueryContext): Promise<string[]> {
    const files: string[] = [];
    
    // Always include BaseComponent file
    files.push(`${context.basePath}/src/core/base.component.tsx`);
    
    // Search for related files based on query
    if (query.includes('lifecycle')) {
      files.push(`${context.basePath}/src/core/base.component.tsx`);
      // Extract lifecycle methods
    }
    
    if (query.includes('props') || query.includes('property')) {
      files.push(`${context.basePath}/src/core/props.provider.ts`);
    }
    
    if (query.includes('event')) {
      files.push(`${context.basePath}/src/core/event-notifier.ts`);
    }
    
    return files;
  }
  
  private generateResponse(query: string, analysis: any): string {
    if (query.includes('lifecycle')) {
      return this.generateLifecycleResponse(analysis);
    } else if (query.includes('props')) {
      return this.generatePropsResponse(analysis);
    } else {
      return this.generateGeneralResponse(analysis);
    }
  }
  
  private generateLifecycleResponse(analysis: any): string {
    return `
# BaseComponent Lifecycle

BaseComponent follows a well-defined lifecycle from creation to destruction:

## Lifecycle Phases

1. **Creation Phase**
   - Constructor initializes properties via PropsProvider
   - Sets up proxy object
   - Initializes component tree node

2. **Mounting Phase**
   - render() generates JSX
   - componentDidMount() called after mount
   - Safe to make API calls, setup subscriptions

3. **Update Phase**
   - onPropertyChange() called on prop changes
   - shouldComponentUpdate() determines re-render
   - componentDidUpdate() called after update

4. **Unmounting Phase**
   - componentWillUnmount() called before removal
   - Cleanup functions executed
   - Component marked as destroyed

## Key Methods

\`\`\`typescript
// From ${analysis.files[0].path}
class BaseComponent {
  constructor(markupProps: T, defaultClass: string) {
    // Initialization
  }
  
  componentDidMount() {
    // Component ready
  }
  
  componentWillUnmount() {
    // Cleanup
  }
  
  updateState(newPartialState: S) {
    // Safe state update
  }
}
\`\`\`
    `;
  }
}
```

#### ComponentAgent Implementation

```typescript
class ComponentAgent implements SubAgent {
  getDomain(): string[] {
    return ['component', 'widget', 'ui', 'rendering'];
  }
  
  getKeyFiles(): string[] {
    return [
      'src/components/basic/button/button.tsx',
      'src/components/basic/label/label.tsx',
      'src/components/data/list/list.tsx',
      'src/components/container/panel/panel.tsx'
    ];
  }
  
  canHandle(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('component') ||
           lowerQuery.includes('widget') ||
           lowerQuery.match(/\bwm\w+\b/); // Matches WmButton, WmLabel, etc.
  }
  
  async process(query: string, context: QueryContext): Promise<SubAgentResponse> {
    // Extract component name from query
    const componentName = this.extractComponentName(query);
    
    if (componentName) {
      return await this.processComponentQuery(componentName, query, context);
    } else {
      return await this.processGeneralQuery(query, context);
    }
  }
  
  private extractComponentName(query: string): string | null {
    // Match WmComponentName pattern
    const match = query.match(/\b(Wm[A-Z]\w+)\b/);
    return match ? match[1] : null;
  }
  
  private async processComponentQuery(
    componentName: string,
    query: string,
    context: QueryContext
  ): Promise<SubAgentResponse> {
    // Find component file
    const componentFile = await this.findComponentFile(componentName, context.basePath);
    
    if (!componentFile) {
      return {
        content: `Component ${componentName} not found`,
        sources: [],
        confidence: 0.1
      };
    }
    
    // Analyze component
    const analysis = await this.analyzeComponent(componentFile, query);
    
    return {
      content: this.generateComponentResponse(componentName, analysis, query),
      sources: [{ path: componentFile, lineStart: 1, lineEnd: analysis.totalLines }],
      confidence: 0.9,
      insights: this.generateComponentInsights(analysis)
    };
  }
  
  private async findComponentFile(
    componentName: string,
    basePath: string
  ): Promise<string | null> {
    // Convert WmButton -> button
    const fileName = componentName.replace(/^Wm/, '').toLowerCase();
    
    // Search in components directory
    const possiblePaths = [
      `${basePath}/src/components/basic/${fileName}/${fileName}.tsx`,
      `${basePath}/src/components/data/${fileName}/${fileName}.tsx`,
      `${basePath}/src/components/container/${fileName}/${fileName}.tsx`,
      `${basePath}/src/components/input/${fileName}/${fileName}.tsx`
    ];
    
    for (const path of possiblePaths) {
      if (await this.fileExists(path)) {
        return path;
      }
    }
    
    // Fallback: grep search
    const result = await this.executeCommand(
      `grep -r "class ${componentName}" ${basePath}/src/components`
    );
    
    const match = result.stdout.match(/^([^:]+):/);
    return match ? match[1] : null;
  }
  
  private generateComponentResponse(
    componentName: string,
    analysis: ComponentAnalysis,
    query: string
  ): string {
    return `
# ${componentName} Component

${componentName} is a React Native component that extends BaseComponent.

## Overview

${analysis.description || 'No description available'}

## Props

\`\`\`typescript
interface ${componentName}Props extends BaseProps {
${analysis.props.map(prop => `  ${prop.name}: ${prop.type};`).join('\n')}
}
\`\`\`

## Key Features

${analysis.features.map(f => `- ${f}`).join('\n')}

## Usage Example

\`\`\`typescript
<${componentName}
  ${analysis.props.slice(0, 3).map(p => `${p.name}={...}`).join('\n  ')}
/>
\`\`\`

## Implementation Details

${analysis.implementationDetails}
    `;
  }
}
```

#### StyleDefinitionAgent Implementation

```typescript
class StyleDefinitionAgent implements SubAgent {
  getDomain(): string[] {
    return ['styledefinition', 'style-definition', 'styledef', 'class-name', 'style-selector'];
  }
  
  getKeyFiles(): string[] {
    return [
      'src/theme/components/base-style-definition.ts',
      'src/theme/components/style-definition.provider.ts',
      'src/theme/components/basic/button.styledef.ts',
      'src/theme/components/input/text.styledef.ts',
      'src/theme/components/container/panel.styledef.ts'
    ];
  }
  
  canHandle(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('class name') ||
           lowerQuery.includes('style definition') ||
           lowerQuery.includes('styledef') ||
           lowerQuery.includes('rnStyleSelector') ||
           lowerQuery.includes('style element') ||
           (lowerQuery.includes('style') && (lowerQuery.includes('icon') || 
                                             lowerQuery.includes('text') || 
                                             lowerQuery.includes('element')));
  }
  
  async process(query: string, context: QueryContext): Promise<SubAgentResponse> {
    // Extract widget name from query
    const widgetName = this.extractWidgetName(query);
    
    if (widgetName) {
      return await this.processWidgetStyleQuery(widgetName, query, context);
    } else {
      return await this.processGeneralQuery(query, context);
    }
  }
  
  private extractWidgetName(query: string): string | null {
    // Match button, text, panel, etc.
    const widgetMatch = query.match(/\b(button|text|panel|label|icon|list|form)\b/i);
    return widgetMatch ? widgetMatch[1].toLowerCase() : null;
  }
  
  private async processWidgetStyleQuery(
    widgetName: string,
    query: string,
    context: QueryContext
  ): Promise<SubAgentResponse> {
    // Find style definition file
    const styleDefFile = await this.findStyleDefFile(widgetName, context.basePath);
    
    if (!styleDefFile) {
      return {
        content: `Style definition for ${widgetName} not found`,
        sources: [],
        confidence: 0.1
      };
    }
    
    // Analyze style definition
    const analysis = await this.analyzeStyleDefinition(styleDefFile, query);
    
    // Extract element name if query mentions specific element
    const elementName = this.extractElementName(query);
    
    return {
      content: this.generateStyleDefinitionResponse(
        widgetName, 
        elementName, 
        analysis, 
        query
      ),
      sources: [{ 
        path: styleDefFile, 
        lineStart: 1, 
        lineEnd: analysis.totalLines 
      }],
      confidence: 0.9,
      insights: this.generateStyleDefinitionInsights(analysis, elementName)
    };
  }
  
  private async findStyleDefFile(
    widgetName: string,
    basePath: string
  ): Promise<string | null> {
    // Style definitions are in codegen base path
    const codegenPath = basePath.replace('app-rn-runtime', 'rn-codegen');
    
    // Map widget names to categories
    const categoryMap: Record<string, string> = {
      'button': 'basic',
      'label': 'basic',
      'icon': 'basic',
      'text': 'input',
      'checkbox': 'input',
      'select': 'input',
      'panel': 'container',
      'tabs': 'container',
      'list': 'data',
      'form': 'data'
    };
    
    const category = categoryMap[widgetName] || 'basic';
    const styleDefPath = `${codegenPath}/src/theme/components/${category}/${widgetName}.styledef.ts`;
    
    if (await this.fileExists(styleDefPath)) {
      return styleDefPath;
    }
    
    // Fallback: search for styledef files
    const result = await this.executeCommand(
      `find ${codegenPath}/src/theme/components -name "*.styledef.ts" -type f | grep -i ${widgetName}`
    );
    
    const match = result.stdout.trim().split('\n')[0];
    return match || null;
  }
  
  private extractElementName(query: string): string | null {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('icon')) return 'icon';
    if (lowerQuery.includes('text')) return 'text';
    if (lowerQuery.includes('heading')) return 'heading';
    if (lowerQuery.includes('content')) return 'content';
    if (lowerQuery.includes('footer')) return 'footer';
    return null;
  }
  
  private async analyzeStyleDefinition(
    filePath: string,
    query: string
  ): Promise<StyleDefinitionAnalysis> {
    // Read file content
    const content = await this.readFile(filePath);
    
    // Parse StyleDefinition structure
    const styleDefs = this.parseStyleDefinitions(content);
    
    // Extract element-specific definitions if query mentions element
    const elementName = this.extractElementName(query);
    const relevantDefs = elementName 
      ? styleDefs.filter(def => 
          def.rnStyleSelector?.includes(elementName) ||
          def.className.includes(elementName)
        )
      : styleDefs;
    
    return {
      styleDefinitions: relevantDefs,
      totalLines: content.split('\n').length,
      hasVariants: styleDefs.some(def => def.className.includes('btn-primary') || 
                                           def.className.includes('variant')),
      hasStates: styleDefs.some(def => def.className.includes('focused') ||
                                      def.className.includes('disabled') ||
                                      def.className.includes('invalid')),
      themeVariables: this.extractThemeVariables(content)
    };
  }
  
  private parseStyleDefinitions(content: string): StyleDefinition[] {
    // Extract StyleDefinition objects from getStyleDefs()
    const getStyleDefsMatch = content.match(/getStyleDefs:\s*\(\)\s*=>\s*\(\[([\s\S]*?)\]\)/);
    if (!getStyleDefsMatch) return [];
    
    const defsContent = getStyleDefsMatch[1];
    const defMatches = defsContent.matchAll(/\{[^}]*className:\s*['"]([^'"]+)['"][^}]*\}/g);
    
    const definitions: StyleDefinition[] = [];
    for (const match of defMatches) {
      const className = match[1];
      const rnSelectorMatch = defsContent.match(
        new RegExp(`className:\\s*['"]${className.replace(/\./g, '\\.')}['"][^}]*rnStyleSelector:\\s*['"]([^'"]+)['"]`)
      );
      
      definitions.push({
        className,
        rnStyleSelector: rnSelectorMatch ? rnSelectorMatch[1] : undefined,
        style: this.extractStyleProperties(defsContent, className)
      });
    }
    
    return definitions;
  }
  
  private extractStyleProperties(content: string, className: string): Record<string, string> {
    const classBlockMatch = content.match(
      new RegExp(`className:\\s*['"]${className.replace(/\./g, '\\.')}['"][^}]*style:\\s*\{([^}]+)\}`)
    );
    
    if (!classBlockMatch) return {};
    
    const styleContent = classBlockMatch[1];
    const properties: Record<string, string> = {};
    
    const propMatches = styleContent.matchAll(/(['"]?)([^'":\s]+)\1:\s*(['"]?)([^'",}]+)\3/g);
    for (const match of propMatches) {
      properties[match[2]] = match[4].trim();
    }
    
    return properties;
  }
  
  private generateStyleDefinitionResponse(
    widgetName: string,
    elementName: string | null,
    analysis: StyleDefinitionAnalysis,
    query: string
  ): string {
    if (elementName) {
      return this.generateElementStyleResponse(widgetName, elementName, analysis);
    } else {
      return this.generateWidgetStyleResponse(widgetName, analysis);
    }
  }
  
  private generateElementStyleResponse(
    widgetName: string,
    elementName: string,
    analysis: StyleDefinitionAnalysis
  ): string {
    const elementDef = analysis.styleDefinitions.find(def =>
      def.rnStyleSelector?.includes(elementName) ||
      def.className.includes(elementName)
    );
    
    if (!elementDef) {
      return `Element '${elementName}' not found in ${widgetName} style definition`;
    }
    
    return `
# ${widgetName} ${elementName} Style Definition

## Class Name

The **class name** for styling ${elementName} in ${widgetName} is:

**\`${elementDef.className}\`**

## RN Style Selector

The ${elementName} styles map to React Native via:
- **rnStyleSelector**: \`${elementDef.rnStyleSelector || 'N/A'}\`
- In component code: \`this.styles.${elementName}\`

## Style Properties

\`\`\`typescript
{
    className: '${elementDef.className}',
    rnStyleSelector: '${elementDef.rnStyleSelector || 'N/A'}',
    style: {
${Object.entries(elementDef.style || {}).map(([key, value]) => 
  `        '${key}': '${value}'`
).join('\n')}
    }
}
\`\`\`

## Theme Variables

${analysis.themeVariables.length > 0 
  ? `This style definition uses theme variables:\n${analysis.themeVariables.map(v => `- \`${v}\``).join('\n')}`
  : 'No theme variables used in this style definition.'}

## Usage

\`\`\`typescript
// In ${widgetName} component
<Wm${this.capitalize(widgetName)}
  ${elementName === 'icon' ? 'iconclass="wm-icon-check"' : ''}
  style={this.styles.${elementName}}  // Uses ${elementDef.rnStyleSelector}
/>
\`\`\`
    `;
  }
  
  private generateWidgetStyleResponse(
    widgetName: string,
    analysis: StyleDefinitionAnalysis
  ): string {
    return `
# ${widgetName} Style Definition

## Overview

The ${widgetName} widget has ${analysis.styleDefinitions.length} style definitions:

${analysis.styleDefinitions.map(def => 
  `- **\`${def.className}\`** → \`${def.rnStyleSelector || 'N/A'}\``
).join('\n')}

## Style Structure

${analysis.hasVariants ? '## Variants\nThis widget supports style variants.\n' : ''}
${analysis.hasStates ? '## States\nThis widget supports state styles.\n' : ''}

## Theme Variables

${analysis.themeVariables.length > 0 
  ? `\n${analysis.themeVariables.map(v => `- \`${v}\``).join('\n')}`
  : '\nNo theme variables used.'}
    `;
  }
  
  private extractThemeVariables(content: string): string[] {
    const variableMatches = content.matchAll(/@(\w+)/g);
    const variables = new Set<string>();
    for (const match of variableMatches) {
      variables.add(`@${match[1]}`);
    }
    return Array.from(variables);
  }
  
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  private generateStyleDefinitionInsights(
    analysis: StyleDefinitionAnalysis,
    elementName: string | null
  ): string[] {
    const insights: string[] = [];
    
    if (elementName) {
      const elementDef = analysis.styleDefinitions.find(def =>
        def.rnStyleSelector?.includes(elementName) ||
        def.className.includes(elementName)
      );
      
      if (elementDef) {
        insights.push(`Element '${elementName}' uses class '${elementDef.className}'`);
        insights.push(`RN selector: '${elementDef.rnStyleSelector}'`);
      }
    }
    
    if (analysis.hasVariants) {
      insights.push('Widget supports multiple style variants');
    }
    
    if (analysis.hasStates) {
      insights.push('Widget supports state-based styling');
    }
    
    return insights;
  }
  
  private async fileExists(path: string): Promise<boolean> {
    // Implementation to check file existence
    return false;
  }
  
  private async executeCommand(command: string): Promise<{ stdout: string }> {
    // Implementation to execute shell command
    return { stdout: '' };
  }
  
  private async readFile(path: string): Promise<string> {
    // Implementation to read file
    return '';
  }
}

interface StyleDefinitionAnalysis {
  styleDefinitions: StyleDefinition[];
  totalLines: number;
  hasVariants: boolean;
  hasStates: boolean;
  themeVariables: string[];
}
```

---

## Response Validation

### Validation Strategies

#### 1. Source File Validation

```typescript
// Validates that all cited source files exist
// Checks line numbers are valid
// Verifies code snippets match file content
```

#### 2. Code Syntax Validation

```typescript
// Parses code snippets to ensure valid syntax
// Checks for undefined references
// Validates imports
```

#### 3. Consistency Validation

```typescript
// Compares responses from multiple agents
// Identifies conflicts
// Suggests resolutions
```

#### 4. Completeness Validation

```typescript
// Ensures all query keywords are addressed
// Checks response length
// Validates depth of explanation
```

---

## Implementation Examples

### Example 1: Simple Query - Single Agent

**Query**: "How does WmButton work?"

**Processing**:

```typescript
// Step 1: Query Analysis
{
  intent: 'how',
  domain: ['component'],
  subAgents: ['ComponentAgent'],
  basePath: 'runtime'
}

// Step 2: File Discovery
// Finds: src/components/basic/button/button.tsx

// Step 3: Code Analysis
// Extracts: class WmButton extends BaseComponent
// Extracts: Props interface, render method, event handlers

// Step 4: ComponentAgent Processing
{
  content: "WmButton is a React Native button component...",
  sources: [
    {
      path: 'src/components/basic/button/button.tsx',
      lineStart: 1,
      lineEnd: 150
    }
  ],
  confidence: 0.9
}

// Step 5: Validation
// ✓ Source file exists
// ✓ Code snippets valid
// ✓ Response complete

// Final Response
{
  response: "WmButton is a React Native button component that extends BaseComponent...",
  sources: [...],
  confidence: 0.9,
  validation: { valid: true }
}
```

### Example 2: Complex Query - Multiple Agents

**Query**: "How does two-way data binding work between WmText and variables?"

**Processing**:

```typescript
// Step 1: Query Analysis
{
  intent: 'how',
  domain: ['component', 'binding', 'variable'],
  subAgents: ['ComponentAgent', 'BindingAgent', 'VariableAgent'],
  basePath: 'runtime'
}

// Step 2: File Discovery
// Finds:
// - src/components/input/text/text.tsx (ComponentAgent)
// - src/runtime/watcher.ts (BindingAgent)
// - src/variables/base-variable.ts (VariableAgent)

// Step 3: Code Analysis
// Extracts: WmText component, datavalue prop, watch expressions, variable updates

// Step 4: Multi-Agent Execution

// ComponentAgent Response
{
  agent: 'ComponentAgent',
  response: "WmText component has a datavalue prop that binds to variables...",
  sources: ['src/components/input/text/text.tsx']
}

// BindingAgent Response
{
  agent: 'BindingAgent',
  response: "Two-way binding uses watcher expressions to track changes...",
  sources: ['src/runtime/watcher.ts', 'src/runtime/bind.ex.transformer.ts']
}

// VariableAgent Response
{
  agent: 'VariableAgent',
  response: "Variables provide reactive dataValue that updates automatically...",
  sources: ['src/variables/base-variable.ts']
}

// Step 5: Response Aggregation
{
  response: {
    summary: "Two-way binding connects WmText and variables through watchers...",
    sections: [
      { title: "Component Side", content: "..." },
      { title: "Binding Mechanism", content: "..." },
      { title: "Variable Side", content: "..." }
    ],
    flow: "User Input → WmText → Watcher → Variable → Backend → Variable → Watcher → WmText"
  },
  sources: [...all sources...],
  crossReferences: [
    {
      from: 'src/components/input/text/text.tsx',
      to: 'src/runtime/watcher.ts',
      type: 'uses',
      description: 'WmText uses watcher for reactive updates'
    }
  ]
}

// Step 6: Validation
{
  valid: true,
  inconsistencies: [],
  agreements: [
    {
      agents: ['ComponentAgent', 'BindingAgent'],
      points: ['Both agree on watcher usage']
    }
  ]
}

// Final Response
{
  response: "...",
  sources: [...],
  confidence: 0.95,
  validation: { valid: true }
}
```

### Example 3: Why Query - Deep Analysis

**Query**: "Why does BaseComponent use a PropsProvider instead of direct props?"

**Processing**:

```typescript
// Step 1: Query Analysis
{
  intent: 'why',
  domain: ['base', 'component'],
  subAgents: ['BaseAgent'],
  basePath: 'runtime',
  analysisDepth: 'deep'
}

// Step 2: File Discovery
// Finds:
// - src/core/base.component.tsx
// - src/core/props.provider.ts
// - Documentation files about PropsProvider

// Step 3: Deep Code Analysis
// Analyzes:
// - PropsProvider implementation
// - How BaseComponent uses PropsProvider
// - Benefits of this pattern
// - Alternatives considered

// Step 4: BaseAgent Processing
{
  content: `
# Why BaseComponent Uses PropsProvider

## Problem Statement

BaseComponent needs to handle props from multiple sources:
1. Default props (component defaults)
2. Markup props (from generated code)
3. Runtime props (dynamic updates)

## Solution: PropsProvider

PropsProvider provides a three-tier property resolution system:

### Benefits

1. **Priority Resolution**
   - Override values (highest priority)
   - Markup props (medium priority)
   - Default values (lowest priority)

2. **Change Detection**
   - Automatic dirty flag tracking
   - Efficient shouldComponentUpdate checks

3. **Proxy Pattern**
   - Clean API: component.props.caption
   - Automatic resolution
   - Runtime overrides

4. **Performance**
   - Shallow comparison
   - Batched updates
   - Minimal re-renders

## Code Evidence

\`\`\`typescript
// From src/core/props.provider.ts
class PropsProvider {
  private getter(target: any, prop: string) {
    // Priority 1: Override values
    if (prop in this.overrideValues) {
      return this.overrideValues[prop];
    }
    // Priority 2: Props
    if (prop in this.props) {
      return this.props[prop];
    }
    // Priority 3: Defaults
    return this.defaultValues[prop];
  }
}
\`\`\`

## Alternative Approaches Considered

### Direct Props (Not Used)
- Cannot handle runtime overrides
- No priority system
- Difficult change detection

### Separate State (Not Used)
- More complex API
- Duplicate data
- Synchronization issues

## Conclusion

PropsProvider enables flexible, performant prop management that supports
the complex needs of WaveMaker components while maintaining a clean API.
  `,
  sources: [
    {
      path: 'src/core/props.provider.ts',
      lineStart: 1,
      lineEnd: 200,
      codeSnippet: '...'
    },
    {
      path: 'src/core/base.component.tsx',
      lineStart: 50,
      lineEnd: 100,
      codeSnippet: '...'
    }
  ],
  confidence: 0.95,
  insights: [
    'PropsProvider enables three-tier priority system',
    'Proxy pattern provides clean API',
    'Efficient change detection improves performance'
  ]
}

// Final Response
{
  response: "...",
  sources: [...],
  confidence: 0.95,
  validation: { valid: true }
}
```

### Example 4: Transpilation Query - Codegen Agent

**Query**: "How does the transpiler convert HTML markup to React Native JSX?"

**Processing**:

```typescript
// Step 1: Query Analysis
{
  intent: 'how',
  domain: ['transpiler', 'transformer'],
  subAgents: ['TranspilerAgent', 'TransformerAgent'],
  basePath: 'codegen'
}

// Step 2: File Discovery
// Finds:
// - src/transpile/transpile.ts (TranspilerAgent)
// - src/transpile/components/basic/button.transformer.ts (TransformerAgent)
// - src/transpile/components/*.transformer.ts (TransformerAgent)

// Step 3: Code Analysis
// Extracts:
// - Transpilation pipeline
// - Transformer registry
// - Widget transformation logic

// Step 4: Multi-Agent Execution

// TranspilerAgent Response
{
  agent: 'TranspilerAgent',
  response: `
# Transpilation Process

The transpiler converts WaveMaker HTML markup to React Native JSX through
a multi-stage pipeline:

1. **Parse HTML** → AST
2. **Pre-process** → Normalize markup
3. **Transform** → Apply transformers
4. **Generate JSX** → Output code

## Pipeline

\`\`\`typescript
// From src/transpile/transpile.ts
class Transpiler {
  transpile(element: HTMLElement): TranspiledOutput {
    // 1. Pre-process
    this.preTranspile(element);
    
    // 2. Get transformer
    const transformer = this.transformers.get(element.tagName);
    
    // 3. Generate JSX
    result.markup += transformer.pre(element, context);
    
    // 4. Process children
    element.childNodes.forEach(child => {
      result.markup += this.transpile(child).markup;
    });
    
    return result;
  }
}
\`\`\`
  `,
  sources: ['src/transpile/transpile.ts']
}

// TransformerAgent Response
{
  agent: 'TransformerAgent',
  response: `
# Widget Transformers

Each widget type has a transformer that defines conversion logic:

## Button Transformer Example

\`\`\`typescript
// From src/transpile/components/basic/button.transformer.ts
export default {
  pre: (element, context) => {
    const attrs = context.transformer.transformAttrs(element, context);
    return \`<WmButton \${attrs}>\`;
  },
  
  post: (element, context) => {
    return \`</WmButton>\`;
  },
  
  imports: (element, context) => {
    return [{
      name: 'WmButton',
      from: '@wavemaker/app-rn-runtime/components/basic/button'
    }];
  }
};
\`\`\`

## Transformation Rules

- HTML attributes → React props
- Event handlers: on-tap → onTap
- Bind expressions: bind:caption → {expression}
- Style attributes → style props
  `,
  sources: [
    'src/transpile/components/basic/button.transformer.ts',
    'src/transpile/bind.ex.transformer.ts'
  ]
}

// Step 5: Response Aggregation
{
  response: {
    summary: "Transpilation converts HTML to JSX through transformer pipeline...",
    sections: [
      {
        title: "Transpilation Pipeline",
        content: "...",
        agent: "TranspilerAgent"
      },
      {
        title: "Widget Transformers",
        content: "...",
        agent: "TransformerAgent"
      }
    ],
    flow: `
HTML Markup
    ↓
Parse to AST
    ↓
Pre-process
    ↓
Apply Transformers
    ↓
Generate JSX
    ↓
React Native Code
    `
  },
  sources: [...],
  crossReferences: [
    {
      from: 'src/transpile/transpile.ts',
      to: 'src/transpile/components/basic/button.transformer.ts',
      type: 'uses',
      description: 'Transpiler uses widget transformers'
    }
  ]
}

// Final Response
{
  response: "...",
  sources: [...],
  confidence: 0.92,
  validation: { valid: true }
}
```

### Example 5: Style Query - Theme and Component Styles

**Query**: "What are the default button styles?"

**Processing**:

```typescript
// Step 1: Query Analysis
{
  intent: 'what',
  domain: ['style', 'component'],
  subAgents: ['StyleAgent', 'ComponentAgent'],
  basePath: 'runtime'
}

// Step 2: File Discovery
// Finds:
// - Theme files: theme/native-mobile/android/styles.js
// - Theme files: theme/native-mobile/ios/styles.js
// - Component style definitions: src/components/basic/button/button.style.ts
// - Widget style definitions: src/styles/components/button.styles.ts
// - LESS files: theme/styles.less (if available)

// Step 3: Code Analysis
// Extracts:
// - Default button class: 'app-button'
// - Style structure: root, text, icon styles
// - Theme variable references
// - Platform-specific styles

// Step 4: Multi-Agent Execution

// StyleAgent Response
{
  agent: 'StyleAgent',
  response: `
# Default Button Styles

Button styles are defined in the theme system with the class name \`app-button\`.

## Style Structure

\`\`\`typescript
// From theme/native-mobile/android/styles.js
const styles = StyleSheet.create({
  'app-button': {
    root: {
      backgroundColor: '#007bff',
      paddingTop: 10,
      paddingBottom: 10,
      paddingLeft: 20,
      paddingRight: 20,
      borderRadius: 5,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44
    },
    text: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '500',
      textAlign: 'center'
    },
    icon: {
      fontSize: 18,
      color: '#ffffff'
    }
  },
  'app-button-disabled': {
    root: {
      opacity: 0.5,
      backgroundColor: '#cccccc'
    }
  }
});
\`\`\`

## Default Styles

### Root Container
- **backgroundColor**: \`#007bff\` (primary blue)
- **padding**: 10px vertical, 20px horizontal
- **borderRadius**: 5px
- **minHeight**: 44px (for touch targets)
- **alignItems**: 'center'
- **justifyContent**: 'center'

### Text Styles
- **color**: \`#ffffff\` (white)
- **fontSize**: 16px
- **fontWeight**: '500' (medium)
- **textAlign**: 'center'

### Icon Styles
- **fontSize**: 18px
- **color**: \`#ffffff\` (white)

## Disabled State

When disabled, button uses \`app-button-disabled\` class:
- **opacity**: 0.5
- **backgroundColor**: \`#cccccc\` (gray)
  `,
  sources: [
    {
      path: 'theme/native-mobile/android/styles.js',
      lineStart: 1,
      lineEnd: 50,
      codeSnippet: '...'
    },
    {
      path: 'theme/native-mobile/ios/styles.js',
      lineStart: 1,
      lineEnd: 50,
      codeSnippet: '...'
    }
  ]
}

// ComponentAgent Response
{
  agent: 'ComponentAgent',
  response: `
# WmButton Default Class

WmButton component uses the default class \`app-button\` which is applied
automatically through BaseComponent's styling system.

## Usage

\`\`\`typescript
// From src/components/basic/button/button.tsx
class WmButton extends BaseComponent {
  constructor(props: ButtonProps) {
    super(props, 'app-button', {
      caption: 'Button',
      type: 'button'
    });
  }
}
\`\`\`

The \`app-button\` class is the default class name used by WmButton.
Styles are resolved in this order:
1. Default widget styles (\`app-button\`)
2. Locale-specific styles (\`app-button-en\`)
3. State styles (\`app-button-disabled\`)
4. Custom class styles (if classname prop provided)
5. Inline styles
  `,
  sources: [
    {
      path: 'src/components/basic/button/button.tsx',
      lineStart: 1,
      lineEnd: 50,
      codeSnippet: '...'
    }
  ]
}

// Step 5: Response Aggregation
{
  response: {
    summary: "Default button styles are defined in theme with class 'app-button'...",
    sections: [
      {
        title: "Default Styles",
        content: "Button styles include root container, text, and icon styles...",
        agent: "StyleAgent"
      },
      {
        title: "Component Usage",
        content: "WmButton uses 'app-button' as default class...",
        agent: "ComponentAgent"
      }
    ],
    keyPoints: [
      "Default class: 'app-button'",
      "Primary color: #007bff",
      "White text color",
      "Padding: 10px vertical, 20px horizontal",
      "Border radius: 5px",
      "Min height: 44px"
    ]
  },
  sources: [...all sources...],
  crossReferences: [
    {
      from: 'src/components/basic/button/button.tsx',
      to: 'theme/native-mobile/android/styles.js',
      type: 'uses',
      description: 'WmButton uses app-button styles from theme'
    }
  ]
}

// Step 6: Validation
{
  valid: true,
  issues: [],
  validation: {
    sourcesVerified: true,
    codeSnippetsValid: true,
    stylesFound: true
  }
}

// Final Response
{
  response: `
# Default Button Styles

The default button styles are defined in the theme system with the class name **\`app-button\`**.

## Default Style Values

### Container (root)
- Background Color: \`#007bff\` (primary blue)
- Padding: 10px vertical, 20px horizontal
- Border Radius: 5px
- Min Height: 44px
- Alignment: Center (both horizontal and vertical)

### Text
- Color: \`#ffffff\` (white)
- Font Size: 16px
- Font Weight: 500 (medium)
- Text Alignment: Center

### Icon
- Font Size: 18px
- Color: \`#ffffff\` (white)

## Source Files

- Theme Styles: \`theme/native-mobile/android/styles.js\` (lines 1-50)
- Theme Styles: \`theme/native-mobile/ios/styles.js\` (lines 1-50)
- Component: \`src/components/basic/button/button.tsx\` (uses \`app-button\` class)

## Usage

\`\`\`typescript
<WmButton caption="Click Me" />
// Automatically uses app-button styles
\`\`\`

\`\`\`typescript
<WmButton caption="Custom" classname="custom-button" />
// Uses custom-button styles, falls back to app-button defaults
\`\`\`
  `,
  sources: [
    {
      path: 'theme/native-mobile/android/styles.js',
      lineStart: 1,
      lineEnd: 50
    },
    {
      path: 'src/components/basic/button/button.tsx',
      lineStart: 1,
      lineEnd: 50
    }
  ],
  confidence: 0.93,
  validation: { valid: true }
}
```

### Example 6: Component-Specific Style Query - Icon Styles

**Query**: "How do I style icon inside a button? What is the class name?"

**Processing**:

```typescript
// Step 1: Query Analysis
{
  intent: 'how',
  domain: ['style', 'component'],
  subAgents: ['StyleDefinitionAgent', 'ComponentAgent'],
  basePath: 'codegen',  // Style definitions are in codegen
  keywords: ['icon', 'button', 'style', 'class name']
}

// Step 2: File Discovery
// Finds:
// - Style definition: src/theme/components/basic/button.styledef.ts (StyleDefinitionAgent)
// - Style definition: src/theme/components/basic/icon.styledef.ts (StyleDefinitionAgent)
// - Component: src/components/basic/button/button.tsx (ComponentAgent)
// - Style definition provider: src/theme/components/style-definition.provider.ts
// - Searches for: "icon" in button.styledef.ts
// - Searches for: rnStyleSelector containing "icon"
// - Searches for: className patterns with "icon"
// - Checks icon.styledef.ts for nested class patterns

// Step 3: Code Analysis
// Extracts:
// - Button style definition structure
// - Icon element definition from button.styledef.ts
// - rnStyleSelector: 'app-button.icon' (type: WmIcon)
// - className: '.app-button-icon' 
// - Icon style definition structure from icon.styledef.ts
// - Nested class patterns: '.app-button-icon .app-icon' (root), '.app-button-icon .app-icon-shape' (text)
// - WmButton render method showing icon rendering

// Step 4: Multi-Agent Execution

// StyleDefinitionAgent Response
{
  agent: 'StyleDefinitionAgent',
  response: `
# Button Icon Style Definition

Button icon styles are defined in the button style definition file using the
\`icon\` element selector.

## Style Definition Structure

\`\`\`typescript
// From src/theme/components/basic/button.styledef.ts
export default {
    getStyleDefs: () => ([
        // Root button styles
        {
            className: '.app-button',
            rnStyleSelector: 'app-button.root',
            studioStyleSelector: '.app-button',
            style: {
                'background-color': '@buttonPrimaryColor',
                'padding': '10px 20px',
                'border-radius': '5px'
            }
        },
        // Button text styles
        {
            className: '.app-button-text',
            rnStyleSelector: 'app-button.text',
            studioStyleSelector: '.app-button',
            style: {
                color: '@buttonPrimaryTextColor',
                'font-size': '16px'
            }
        },
        // Button icon styles - THIS IS THE KEY
        {
            className: '.app-button-icon',
            rnStyleSelector: 'app-button.icon',
            studioStyleSelector: '.app-button-icon',
            style: {
                color: '@buttonIconColor',
                'font-size': '@buttonIconSize',
                'margin-right': '8px'
            }
        }
    ])
} as ComponentStyle;
\`\`\`

## Class Name for Icon Container

The **class name** for styling the icon container inside buttons is:

**\`.app-button-icon\`**

This maps to the React Native style selector: **\`app-button.icon\`** (type: **WmIcon**)

## Nested Class Names for Icon Styling

To style the **icon component itself** (WmIcon) inside a button, you need to use **nested class names**:

### Icon Root Styles
- **Class Name**: \`.app-button-icon .app-icon\`
- **Purpose**: Style the root container of the icon component
- **Example**: Change icon container size, padding, etc.

### Icon Shape/Text Color
- **Class Name**: \`.app-button-icon .app-icon-shape\`
- **Purpose**: Style the icon shape/text color
- **Example**: Change icon color, font-size, etc.

### Icon Background
- **Class Name**: \`.app-button-icon .app-icon-background\`
- **Purpose**: Style the icon background

## How Nested Classes Work

The nested class pattern works because:
1. \`.app-button-icon\` targets the icon element within the button
2. \`.app-icon\`, \`.app-icon-shape\`, etc. target the internal elements of the WmIcon component
3. Combined: \`.app-button-icon .app-icon\` targets the icon root only when it's inside a button's icon element

## Style Definition Structure

\`\`\`typescript
// From src/theme/components/basic/button.styledef.ts
{
    className: '.app-button-icon',
    rnStyleSelector: 'app-button.icon',
    style: {
        // Container styles for icon positioning
        'margin-right': '8px'
    }
}

// From src/theme/components/basic/icon.styledef.ts
{
    className: '.app-icon',
    rnStyleSelector: 'app-icon.root',
    style: {
        // Icon root container styles
    }
},
{
    className: '.app-icon-shape',
    rnStyleSelector: 'app-icon.shape',
    style: {
        color: '@iconColor',
        'font-size': '@iconSize'
    }
}
\`\`\`

## Usage Examples

### Style Icon Container (margin, positioning)
\`\`\`css
.app-button-icon {
    margin-right: 8px;
}
\`\`\`

### Style Icon Root (container size, padding)
\`\`\`css
.app-button-icon .app-icon {
    padding: 4px;
    width: 24px;
    height: 24px;
}
\`\`\`

### Style Icon Color/Text
\`\`\`css
.app-button-icon .app-icon-shape {
    color: #ff0000;
    font-size: 20px;
}
\`\`\`

## RN Style Selector

The icon styles map to React Native via:
- **Button icon container**: \`app-button.icon\` → \`this.styles.icon\` (in WmButton)
- **Icon root**: \`app-icon.root\` → \`this.styles.root\` (in WmIcon)
- **Icon shape**: \`app-icon.shape\` → \`this.styles.shape\` (in WmIcon)

## Additional Icon Classes

- **\`.app-button-icon-only\`**: For icon-only buttons
  - rnStyleSelector: \`app-button.iconOnly\`
- **\`.app-button-icon-left\`**: Explicitly position icon on left
- **\`.app-button-icon-right\`**: Explicitly position icon on right
  `,
  sources: [
    {
      path: 'src/theme/components/basic/button.styledef.ts',
      lineStart: 1,
      lineEnd: 150,
      codeSnippet: '...'
    },
    {
      path: 'src/theme/components/basic/icon.styledef.ts',
      lineStart: 1,
      lineEnd: 100,
      codeSnippet: '...'
    },
    {
      path: 'src/theme/components/style-definition.provider.ts',
      lineStart: 1,
      lineEnd: 50,
      codeSnippet: '...'
    }
  ]
}

// ComponentAgent Response
{
  agent: 'ComponentAgent',
  response: `
# WmButton Icon Implementation

WmButton component uses the icon styles defined in the style definition.

## Icon Rendering

\`\`\`typescript
// From src/components/basic/button/button.tsx
renderWidget(props: ButtonProps) {
  return (
    <TouchableOpacity style={this.styles.root}>
      {props.iconclass && (
        <WmIcon
          iconclass={props.iconclass}
          style={this.styles.icon}  // Uses app-button.icon from style definition
        />
      )}
      <Text style={this.styles.text}>{props.caption}</Text>
    </TouchableOpacity>
  );
}
\`\`\`

The \`this.styles.icon\` comes from the merged button styles, which includes
the \`icon\` property defined in the button style definition (\`app-button.icon\`).
  `,
  sources: [
    {
      path: 'src/components/basic/button/button.tsx',
      lineStart: 80,
      lineEnd: 120,
      codeSnippet: '...'
    }
  ]
}

// Step 5: Response Aggregation
{
  response: {
    summary: "Icon styles in buttons are defined in button.styledef.ts with class '.app-button-icon'...",
    sections: [
      {
        title: "Style Definition Structure",
        content: "Icon styles defined in button.styledef.ts with rnStyleSelector 'app-button.icon'...",
        agent: "StyleDefinitionAgent"
      },
      {
        title: "Component Implementation",
        content: "WmButton applies icon styles via this.styles.icon...",
        agent: "ComponentAgent"
      }
    ],
    keyPoints: [
      "Class name: '.app-button-icon'",
      "RN Style Selector: 'app-button.icon'",
      "Style definition file: button.styledef.ts",
      "Component usage: this.styles.icon",
      "Theme variables: @buttonIconColor, @buttonIconSize"
    ],
    codeExamples: [
      {
        title: "Style Definition",
        code: "{ className: '.app-button-icon', rnStyleSelector: 'app-button.icon', style: {...} }"
      },
      {
        title: "Component Usage",
        code: '<WmButton caption="Submit" iconclass="wm-icon-check" />'
      }
    ]
  },
  sources: [...all sources...],
  crossReferences: [
    {
      from: 'src/components/basic/button/button.tsx',
      to: 'src/theme/components/basic/button.styledef.ts',
      type: 'uses',
      description: 'WmButton uses icon styles from button style definition'
    },
    {
      from: 'src/theme/components/basic/button.styledef.ts',
      to: 'src/theme/components/style-definition.provider.ts',
      type: 'registered in',
      description: 'Button style definition registered in provider'
    }
  ]
}

// Step 6: Validation
{
  valid: true,
  issues: [],
  validation: {
    sourcesVerified: true,
    classNamesFound: true,
    stylePropertiesVerified: true
  }
}

// Final Response
{
  response: `
# Styling Icons Inside Buttons

## Class Names

### Icon Container Class
The **class name** for styling the icon container inside buttons is:

**\`.app-button-icon\`**

This maps to React Native style selector: **\`app-button.icon\`** (component type: **WmIcon**)

### Nested Class Names for Icon Component

To style the **icon component itself** (WmIcon) inside a button, use **nested class names**:

#### Icon Root
- **Class Name**: \`.app-button-icon .app-icon\`
- **Purpose**: Style the root container of the icon component
- **Example**: Change icon container size, padding, alignment

#### Icon Shape/Text Color  
- **Class Name**: \`.app-button-icon .app-icon-shape\`
- **Purpose**: Style the icon shape/text color
- **Example**: Change icon color, font-size, stroke width

#### Icon Background
- **Class Name**: \`.app-button-icon .app-icon-background\`
- **Purpose**: Style the icon background

## How Nested Classes Work

The nested class pattern works because:
1. \`.app-button-icon\` targets the icon element slot within the button (rnStyleSelector: `app-button.icon`)
2. \`.app-icon\`, \`.app-icon-shape\`, etc. target the internal elements of the WmIcon component
3. Combined: \`.app-button-icon .app-icon\` targets the icon root only when it's inside a button's icon element

## Style Definition Structure

\`\`\`typescript
// From src/theme/components/basic/button.styledef.ts
{
    className: '.app-button-icon',
    rnStyleSelector: 'app-button.icon',  // Type: WmIcon component
    style: {
        // Container styles for icon positioning
        'margin-right': '8px'
    }
}

// From src/theme/components/basic/icon.styledef.ts
{
    className: '.app-icon',
    rnStyleSelector: 'app-icon.root',
    style: {
        // Icon root container styles
    }
},
{
    className: '.app-icon-shape',
    rnStyleSelector: 'app-icon.shape',
    style: {
        color: '@iconColor',
        'font-size': '@iconSize'
    }
}
\`\`\`

## RN Style Selector Mapping

The icon styles map to React Native via:
- **Button icon container**: \`app-button.icon\` → \`this.styles.icon\` (in WmButton component)
- **Icon root**: \`app-icon.root\` → \`this.styles.root\` (in WmIcon component)  
- **Icon shape**: \`app-icon.shape\` → \`this.styles.shape\` (in WmIcon component)

## Usage Examples

### Style Icon Container (margin, positioning)
\`\`\`css
.app-button-icon {
    margin-right: 8px;
}
\`\`\`

### Style Icon Root Container
\`\`\`css
.app-button-icon .app-icon {
    padding: 4px;
    width: 24px;
    height: 24px;
}
\`\`\`

### Style Icon Color/Text
\`\`\`css
.app-button-icon .app-icon-shape {
    color: #ff0000;
    font-size: 20px;
}
\`\`\`

## Usage

\`\`\`typescript
// Default icon styling (uses app-button-icon styles)
<WmButton
  caption="Submit"
  iconclass="wm-icon-check"
/>
// Icon automatically uses styles from app-button.icon selector
\`\`\`

## Implementation in Component

\`\`\`typescript
// From src/components/basic/button/button.tsx
{props.iconclass && (
  <WmIcon
    iconclass={props.iconclass}
    style={this.styles.icon}  // ← Uses app-button.icon from style definition
  />
)}
\`\`\`

The \`this.styles.icon\` comes from the merged button styles, which resolves
the \`app-button.icon\` selector defined in the button style definition.

## Custom Icon Classes

You can also use:
- **\`.app-button-icon-only\`**: For icon-only buttons
  - rnStyleSelector: \`app-button.iconOnly\`
- **\`.app-button-icon-left\`**: Explicitly position icon on left
- **\`.app-button-icon-right\`**: Explicitly position icon on right

## Source Files

- Button Style Definition: \`src/theme/components/basic/button.styledef.ts\` (lines 1-150)
- Icon Style Definition: \`src/theme/components/basic/icon.styledef.ts\` (lines 1-100)
- Component: \`src/components/basic/button/button.tsx\` (lines 80-120)
- Style Provider: \`src/theme/components/style-definition.provider.ts\`

## Theme Variables

Icon styles can use theme variables:
- \`@buttonIconColor\` - Icon color (from button context)
- \`@iconColor\` - General icon color (from icon component)
- \`@iconSize\` - Icon size
- \`@buttonIconSize\` - Button-specific icon size
  `,
  sources: [
    {
      path: 'src/theme/components/basic/button.styledef.ts',
      lineStart: 1,
      lineEnd: 150
    },
    {
      path: 'src/components/basic/button/button.tsx',
      lineStart: 80,
      lineEnd: 120
    },
    {
      path: 'src/theme/components/style-definition.provider.ts',
      lineStart: 1,
      lineEnd: 50
    }
  ],
  confidence: 0.95,
  validation: { valid: true }
}
```

---

## Best Practices

### 1. Query Formulation

**Good Queries**:
- "How does BaseComponent handle lifecycle?"
- "Why does WmButton use BaseComponent?"
- "What is the difference between Variable and LiveVariable?"
- "Where is the NavigationService implemented?"
- "What are the default button styles?"
- "How do I style icon inside a button? What is the class name?"

**Poor Queries**:
- "button" (too vague)
- "how" (too generic)
- "fix error" (not a codebase question)

### 2. Sub-Agent Selection

**Single Agent**:
- Use when query is focused on one domain
- Faster response
- More focused answer

**Multiple Agents**:
- Use when query spans multiple domains
- Provides comprehensive view
- Cross-validates information

### 3. File Discovery

**Prioritize**:
1. Core implementation files
2. Type definitions
3. Documentation files
4. Test files (for usage examples)

**Limit**:
- Top 10-15 files per query
- Avoid searching node_modules deeply
- Focus on src/ directories

### 4. Response Validation

**Always Validate**:
- Source file existence
- Code snippet accuracy
- Line number validity
- Cross-reference correctness

**Handle Validation Failures**:
- Regenerate response if critical errors
- Include warnings for minor issues
- Provide fallback sources

### 5. Performance Optimization

**Caching**:
- Cache file discovery results
- Cache AST parsing results
- Cache agent responses

**Parallelization**:
- Execute multiple agents in parallel
- Parallel file searches
- Concurrent code analysis

---

## Conclusion

The Codebase Agent provides a powerful system for understanding and analyzing the WaveMaker React Native codebase. Through intelligent query processing, comprehensive file discovery, deep code analysis, and coordinated sub-agent execution, it delivers accurate, well-sourced, and validated responses to complex codebase questions.

The agent's ability to work across both runtime and codegen codebases, coordinate multiple specialized sub-agents, and validate responses ensures high-quality information retrieval and analysis.

