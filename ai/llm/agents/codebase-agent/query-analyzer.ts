/**
 * AI-Based Query Analyzer with Parser Fallback
 * Uses AI with fixed seed and fine-tuned prompt for accurate query analysis
 */

import { createGeminiClient } from '../../gemini';
import { getAISeed } from '../../config';
import { QueryAnalysis } from './types';
import { COMMON_CONTEXT_PROMPT } from '../../prompts/common-context';

export class QueryAnalyzer {
  private systemPrompt: string;
  
  constructor() {
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
    const ai = createGeminiClient();
    const modelName = (typeof process !== 'undefined' ? process.env?.GEMINI_MODEL : undefined) || 'gemini-2.5-flash-lite';
    
    console.log('[QueryAnalyzer] Analyzing query with AI:', query.substring(0, 50));
    
    // Use Gemini API directly for JSON response
    const response = await ai.models.generateContent({
      model: modelName,
      config: {
        temperature: 0.1,
        seed: getAISeed(),
        responseMimeType: 'application/json' as const
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: this.systemPrompt + '\n\n' + prompt }]
        }
      ]
    });
    
    // Parse JSON response - extract text from candidates
    let responseText = '';
    if (response.candidates && response.candidates[0]?.content?.parts) {
      responseText = response.candidates[0].content.parts
        .map(part => part.text || '')
        .join('');
    }
    
    console.log('[QueryAnalyzer] AI raw response:', responseText.substring(0, 200));
    console.log('[QueryAnalyzer] Extracted response text, length:', responseText.length);
    
    let analysis;
    
    try {
      analysis = JSON.parse(responseText);
      console.log('[QueryAnalyzer] AI parsed analysis:', JSON.stringify(analysis, null, 2));
    } catch (e) {
      console.warn('[QueryAnalyzer] JSON parsing failed, extracting structured data:', e);
      // If JSON parsing fails, try to extract structured data
      analysis = this.extractStructuredData(responseText);
      console.log('[QueryAnalyzer] Extracted analysis:', JSON.stringify(analysis, null, 2));
    }
    
    const normalized = this.normalizeAnalysis(analysis);
    console.log('[QueryAnalyzer] Normalized analysis:', JSON.stringify(normalized, null, 2));
    
    return normalized;
  }
  
  /**
   * Builds system prompt for query analysis
   */
  private buildSystemPrompt(): string {
    return `${COMMON_CONTEXT_PROMPT}

---

## CODEBASE QUERY ANALYSIS TASK

You are an expert query analyzer for the WaveMaker React Native codebase.

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
   
   **BaseAgent** (runtime - @wavemaker/app-rn-runtime):
   - Specializes in: BaseComponent, lifecycle, core infrastructure, PropsProvider, event system
   - Handles queries about: BaseComponent, component lifecycle, PropsProvider, core infrastructure, event-notifier, component tree
   - Example queries: "How does BaseComponent handle lifecycle?", "What is PropsProvider?", "How does event notification work?"
   - Keywords: basecomponent, base component, lifecycle, core infrastructure, propsprovider, props provider, event-notifier
   
   **ComponentAgent** (runtime - @wavemaker/app-rn-runtime):
   - Specializes in: Widget components (WmButton, WmText, WmList, etc.), component props, rendering, event handling
   - Handles queries about: Widget components, component props, component rendering, component events, UI components
   - Example queries: "How does WmButton work?", "What props does WmText accept?", "How are components rendered?"
   - Keywords: component, widget, WmButton, WmText, WmList, rendering, UI
   
   **StyleAgent** (runtime - @wavemaker/app-rn-runtime):
   - Specializes in: Theme compilation, CSS/LESS compilation, theme variables, style transpilation
   - Handles queries about: Theme compilation, CSS to RN styles, theme variables, style precedence, platform-specific styles
   - Example queries: "How does theme compilation work?", "What are the default button styles?", "How are CSS properties converted to RN styles?"
   - Keywords: style, theme, css, less, styling, stylesheet, theme variable, theme compilation
   
   **StyleDefinitionAgent** (codegen - @wavemaker/rn-codegen):
   - Specializes in: Style definitions (.styledef.ts files), class names, style selectors, nested class patterns
   - Handles queries about: Class names for styling, style definitions, styledef files, rnStyleSelector, nested styling (e.g., icon inside button)
   - Example queries: "What is the class name for styling icon inside button?", "How do I style icon inside a button?", "What is the style definition for button?"
   - Keywords: class name, style definition, styledef, rnStyleSelector, style element, nested class
   
   **ServiceAgent** (runtime - @wavemaker/app-rn-runtime):
   - Specializes in: Runtime services (Navigation, Modal, Security, Storage, Toast), dependency injection
   - Handles queries about: Services, navigation, modals, security, storage, toast, dependency injection, injector
   - Example queries: "How does NavigationService work?", "How to use ModalService?", "What is dependency injection?"
   - Keywords: service, navigation, modal, security, storage, toast, spinner, dependency injection, injector
   
   **BindingAgent** (runtime - @wavemaker/app-rn-runtime):
   - Specializes in: Data binding, watch system, change detection, bind expressions, two-way binding
   - Handles queries about: Data binding, watch system, bind expressions, two-way binding, change detection, digest cycle
   - Example queries: "How does data binding work?", "What is the watch system?", "How are bind expressions transformed?"
   - Keywords: binding, watch, watcher, two-way, one-way, data binding, bind expression, change detection, digest
   
   **VariableAgent** (runtime - @wavemaker/app-rn-runtime):
   - Specializes in: Variables, state management, LiveVariable, ServiceVariable, BaseVariable
   - Handles queries about: Variables, LiveVariable, ServiceVariable, state management, dataSet, variable lifecycle
   - Example queries: "How do variables work?", "What is LiveVariable?", "How does dataSet property work?"
   - Keywords: variable, livevariable, servicevariable, state, dataset, data value
   
   **WatcherAgent** (runtime - @wavemaker/app-rn-runtime):
   - Specializes in: Watch system, change detection algorithms, digest cycle, watch optimization
   - Handles queries about: Watch system, change detection, digest cycle, watch optimization, shallow vs deep watching
   - Example queries: "How does the watch system work?", "What is the digest cycle?", "How is watch optimization done?"
   - Keywords: watcher, watch system, change detection, digest, watch optimization
   
   **MemoAgent** (runtime - @wavemaker/app-rn-runtime):
   - Specializes in: Memoization, WmMemo component, render optimization, performance
   - Handles queries about: Memoization, WmMemo, render optimization, performance optimization
   - Example queries: "How does WmMemo work?", "What is memoization?", "How to optimize renders?"
   - Keywords: memo, memoization, optimization, performance, render optimization, wmemo
   
   **FragmentAgent** (runtime - @wavemaker/app-rn-runtime):
   - Specializes in: Fragments (pages, partials, prefabs), fragment hierarchy, fragment communication
   - Handles queries about: Fragments, pages, partials, prefabs, fragment hierarchy, BaseFragment
   - Example queries: "What are fragments?", "How do pages and partials differ?", "How do fragments communicate?"
   - Keywords: fragment, page, partial, prefab, basefragment
   
   **TranspilerAgent** (codegen - @wavemaker/rn-codegen):
   - Specializes in: Code generation, transpilation, HTML to JSX conversion, transpilation pipeline
   - Handles queries about: Transpilation, code generation, HTML to JSX, transpilation pipeline, codegen
   - Example queries: "How does transpilation work?", "How is HTML converted to JSX?", "What is the transpilation pipeline?"
   - Keywords: transpile, transpiler, codegen, code generation, transpilation
   
   **TransformerAgent** (codegen - @wavemaker/rn-codegen):
   - Specializes in: Widget transformation, AST transformations, code transformations
   - Handles queries about: Transformations, widget transformations, AST transformations
   - Example queries: "How are widgets transformed?", "What transformations are applied?"
   - Keywords: transformer, transformation, widget transformation
   
   **ParserAgent** (codegen - @wavemaker/rn-codegen):
   - Specializes in: Parsing, HTML parsing, markup parsing
   - Handles queries about: Parsing, HTML parsing, markup parsing
   - Example queries: "How is HTML parsed?", "What is the parsing process?"
   - Keywords: parser, parsing, html parsing, markup parsing
   
   **FormatterAgent** (codegen - @wavemaker/rn-codegen):
   - Specializes in: Code formatting, code beautification
   - Handles queries about: Code formatting, formatting rules
   - Example queries: "How is code formatted?", "What formatting rules are applied?"
   - Keywords: formatter, formatting, code formatting
   
   **GenerationAgent** (codegen - @wavemaker/rn-codegen):
   - Specializes in: Code generation from templates, Handlebars templates, app generation
   - Handles queries about: Code generation, templates, Handlebars, app generation
   - Example queries: "How does code generation work?", "What templates are used?", "How is the app generated?"
   - Keywords: generation, generate, template, handlebars, app generation
   
   **AppAgent** (codegen - @wavemaker/rn-codegen):
   - Specializes in: Application architecture, app generation, build flow, project structure
   - Handles queries about: Application architecture, app generation, build flow, project structure, app configuration
   - Example queries: "What is the application architecture?", "How does app generation work?", "What is the build flow?"
   - Keywords: app, application, architecture, generation, build flow, build pipeline
   
   **Agent Selection Rules:**
   - Always select at least one agent. If unsure, default to BaseAgent.
   - For queries about lifecycle, BaseComponent, core infrastructure → BaseAgent
   - For queries about widgets/components → ComponentAgent
   - For queries about class names, style definitions, styledef files → StyleDefinitionAgent
   - For queries about theme compilation, CSS to RN styles → StyleAgent
   - For queries about services → ServiceAgent
   - For queries about data binding, watch system → BindingAgent
   - For queries about variables → VariableAgent
   - For queries about pages/partials/prefabs → FragmentAgent
   - For queries about code generation, transpilation → TranspilerAgent or GenerationAgent
   - Multiple agents can be selected if the query spans multiple domains

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
- Sub-agents (which specialized agents should handle this) - **CRITICAL: Always select at least one agent. If unsure, use BaseAgent.**
- Base path (which codebase to search)
- Analysis depth (how detailed the answer should be)
- Keywords (important terms)
- Whether validation is required

Consider:
- Context clues in the query
- Technical terms and concepts mentioned
- Whether it's about implementation (how), design (why), or definition (what)
- Whether it spans multiple domains
- The complexity implied by the query
- Match keywords from the query to the agent keywords listed above

IMPORTANT RULES:
1. **Always select at least one sub-agent** - never return an empty subAgents array
2. If the query mentions "lifecycle" or "BaseComponent", select BaseAgent
3. If the query mentions "class name" or "style definition", select StyleDefinitionAgent
4. If unsure which agent to select, default to BaseAgent
5. You can select multiple agents if the query spans multiple domains

Return ONLY valid JSON with this exact structure:
{
  "intent": "how",
  "domain": ["base"],
  "subAgents": ["BaseAgent"],
  "basePath": "runtime",
  "analysisDepth": "deep",
  "keywords": ["basecomponent", "lifecycle"],
  "requiresValidation": false,
  "reasoning": "Query asks about BaseComponent lifecycle, which is handled by BaseAgent"
}

No markdown formatting, no code blocks, just raw JSON.`;
  }
  
  /**
   * Normalizes AI response to QueryAnalysis format
   */
  private normalizeAnalysis(analysis: any): QueryAnalysis {
    // Normalize subAgents - ensure it's always a non-empty array
    let subAgents: string[] = [];
    if (Array.isArray(analysis.subAgents)) {
      subAgents = analysis.subAgents.length > 0 ? analysis.subAgents : ['BaseAgent'];
    } else if (analysis.subAgents) {
      subAgents = [analysis.subAgents];
    } else {
      subAgents = ['BaseAgent']; // Default fallback
    }
    
    // Normalize domain - ensure it's always a non-empty array
    let domain: string[] = [];
    if (Array.isArray(analysis.domain)) {
      domain = analysis.domain.length > 0 ? analysis.domain : ['general'];
    } else if (analysis.domain) {
      domain = [analysis.domain];
    } else {
      domain = ['general'];
    }
    
    return {
      intent: analysis.intent || 'general',
      domain,
      subAgents,
      basePath: analysis.basePath || 'both',
      analysisDepth: analysis.analysisDepth || 'deep',
      keywords: analysis.keywords || [],
      requiresValidation: analysis.requiresValidation || false,
      reasoning: analysis.reasoning,
      confidence: 0.9
    };
  }
  
  /**
   * Extracts structured data from unstructured text
   */
  private extractStructuredData(content: string): any {
    const analysis: any = {
      intent: 'general',
      domain: [],
      subAgents: [],
      keywords: []
    };
    
    const lowerContent = content.toLowerCase();
    
    // Extract intent
    if (lowerContent.includes('how')) analysis.intent = 'how';
    else if (lowerContent.includes('why')) analysis.intent = 'why';
    else if (lowerContent.includes('what')) analysis.intent = 'what';
    else if (lowerContent.includes('where')) analysis.intent = 'where';
    else if (lowerContent.includes('compare')) analysis.intent = 'compare';
    
    // Extract domain keywords
    if (lowerContent.includes('basecomponent') || 
        lowerContent.includes('base component') ||
        lowerContent.includes('lifecycle')) {
      analysis.domain.push('base');
      analysis.subAgents.push('BaseAgent');
    }
    if (lowerContent.includes('component') || lowerContent.includes('widget')) {
      analysis.domain.push('component');
      if (!analysis.subAgents.includes('ComponentAgent')) {
        analysis.subAgents.push('ComponentAgent');
      }
    }
    if (lowerContent.includes('service')) {
      analysis.domain.push('service');
      if (!analysis.subAgents.includes('ServiceAgent')) {
        analysis.subAgents.push('ServiceAgent');
      }
    }
    if (lowerContent.includes('style') || lowerContent.includes('theme')) {
      analysis.domain.push('style');
      if (!analysis.subAgents.includes('StyleAgent')) {
        analysis.subAgents.push('StyleAgent');
      }
    }
    
    // Ensure at least one agent is selected
    if (analysis.subAgents.length === 0) {
      analysis.subAgents.push('BaseAgent');
      analysis.domain.push('base');
    }
    
    // Extract keywords
    const words = content.match(/\b[A-Z][a-z]+\w+\b/g) || [];
    analysis.keywords = [...new Set(words)].slice(0, 10);
    
    return analysis;
  }
  
  /**
   * Validates AI analysis response
   */
  private validateAnalysis(analysis: QueryAnalysis): boolean {
    // Check required fields
    if (!analysis.intent || !analysis.domain || !analysis.subAgents) {
      return false;
    }
    
    // Check that arrays are not empty
    if (!Array.isArray(analysis.domain) || analysis.domain.length === 0) {
      return false;
    }
    
    if (!Array.isArray(analysis.subAgents) || analysis.subAgents.length === 0) {
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
      'base', 'app', 'parser', 'formatter', 'generation', 'watcher', 'memo', 'general'
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
    const parser = new QueryParser();
    const parserAnalysis = parser.analyzeQuery(query);
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
  
  detectIntent(query: string): QueryAnalysis['intent'] {
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
  
  identifyDomain(query: string): string[] {
    const domains: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Base/BaseComponent-related keywords (check first, as it's foundational)
    if (lowerQuery.includes('basecomponent') || 
        lowerQuery.includes('base component') ||
        lowerQuery.includes('lifecycle') ||
        lowerQuery.includes('core infrastructure') ||
        lowerQuery.match(/\b(basecomponent|lifecycle|propsprovider|props provider)\b/)) {
      domains.push('base');
    }
    
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
  
  determineDepth(query: string): QueryAnalysis['analysisDepth'] {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('deep') || lowerQuery.includes('detailed') || lowerQuery.includes('comprehensive')) {
      return 'comprehensive';
    }
    if (lowerQuery.includes('quick') || lowerQuery.includes('simple')) {
      return 'shallow';
    }
    return 'deep';
  }
  
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
  
  requiresValidation(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    return lowerQuery.includes('verify') || 
           lowerQuery.includes('validate') || 
           lowerQuery.includes('check') ||
           lowerQuery.includes('ensure');
  }
  
  extractKeywords(query: string): string[] {
    // Simple keyword extraction
    const words = query.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'how', 'what', 'where', 'why', 'does', 'do', 'to', 'in', 'on', 'at'];
    return words.filter(word => word.length > 2 && !stopWords.includes(word));
  }
}

