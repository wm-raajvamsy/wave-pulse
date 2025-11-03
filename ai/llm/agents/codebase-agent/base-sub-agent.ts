/**
 * Base Sub-Agent Pattern
 * Combines Information Retrieval and File Operations for domain-specific queries
 */

import { SubAgentResponse, QueryContext, FileSource, CrossReference } from './types';
import { executeTool, getAllToolSchemas } from '../../tools';
import { createGeminiClient } from '../../gemini';
import { SYSTEM_INSTRUCTION_WITH_TOOLS } from '../../prompts';
import { getAISeed } from '../../config';

/**
 * Sub-Agent Interface
 */
export interface SubAgent {
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

/**
 * Base Sub-Agent Implementation
 * Combines Information Retrieval + File Operations for domain-specific analysis
 */
export abstract class BaseSubAgent implements SubAgent {
  protected abstract domain: string[];
  protected abstract keyFiles: string[];
  protected abstract agentName: string;
  
  /**
   * Processes query using IR + FileOps pattern
   */
  async process(query: string, context: QueryContext): Promise<SubAgentResponse> {
    console.log(`[BaseSubAgent:${this.agentName}] process: Starting for query:`, query.substring(0, 50));
    
    const stepPrefix = `sub-agent-${this.agentName}`;
    
    try {
      // Step 1: Find relevant files in domain
      console.log(`[BaseSubAgent:${this.agentName}] process: Step 1 - Discovering files...`);
      this.updateSubAgentStep(context, `${stepPrefix}-discover-files`, `Analyzing query and discovering files...`, 'in-progress');
      const files = await this.discoverFiles(query, context);
      console.log(`[BaseSubAgent:${this.agentName}] process: Found ${files.length} files`);
      this.updateSubAgentStep(context, `${stepPrefix}-discover-files`, `Found ${files.length} relevant files`, 'completed');
      
      // Step 2: Read and analyze files
      console.log(`[BaseSubAgent:${this.agentName}] process: Step 2 - Reading files...`);
      this.updateSubAgentStep(context, `${stepPrefix}-read-files`, `Reading ${files.length} files...`, 'in-progress');
      const fileContents = await this.readFiles(files, context);
      console.log(`[BaseSubAgent:${this.agentName}] process: Read ${fileContents.size} files`);
      this.updateSubAgentStep(context, `${stepPrefix}-read-files`, `Read ${fileContents.size} files`, 'completed');
      
      // Step 3: Generate response using AI
      console.log(`[BaseSubAgent:${this.agentName}] process: Step 3 - Generating response...`);
      this.updateSubAgentStep(context, `${stepPrefix}-generate-response`, `Generating response...`, 'in-progress');
      const response = await this.generateResponse(query, fileContents, context);
      console.log(`[BaseSubAgent:${this.agentName}] process: Response generated, length:`, response?.length || 0);
      this.updateSubAgentStep(context, `${stepPrefix}-generate-response`, `Response generated`, 'completed');
      
      // Step 4: Extract sources and cross-references
      console.log(`[BaseSubAgent:${this.agentName}] process: Step 4 - Extracting sources...`);
      const sources = this.extractSources(files, fileContents);
      const crossReferences = this.findCrossReferences(files, fileContents);
      console.log(`[BaseSubAgent:${this.agentName}] process: Found ${sources.length} sources, ${crossReferences.length} cross-references`);
      
      return {
        content: response,
        sources,
        confidence: 0.9,
        insights: this.generateInsights(fileContents, query),
        crossReferences
      };
    } catch (error: any) {
      console.error(`[BaseSubAgent:${this.agentName}] process: Error:`, error);
      console.error(`[BaseSubAgent:${this.agentName}] process: Error stack:`, error instanceof Error ? error.stack : String(error));
      
      // Mark current step as failed
      const currentStep = `${stepPrefix}-discover-files`;
      this.updateSubAgentStep(context, currentStep, `Error: ${error.message}`, 'failed');
      
      throw error;
    }
  }
  
  /**
   * Helper: Update sub-agent step
   */
  private updateSubAgentStep(
    context: QueryContext,
    stepId: string,
    description: string,
    status: 'pending' | 'in-progress' | 'completed' | 'failed'
  ): void {
    if (!context.onStepUpdate || !context.researchSteps) {
      return; // No callback or steps array, skip
    }
    
    const steps = [...(context.researchSteps || [])];
    const existingIndex = steps.findIndex(s => s.id === stepId);
    
    if (existingIndex >= 0) {
      steps[existingIndex] = { ...steps[existingIndex], description, status };
    } else {
      steps.push({ id: stepId, description, status });
    }
    
    // Update context's researchSteps
    context.researchSteps = steps;
    
    // Emit update
    context.onStepUpdate({
      type: 'step',
      data: { researchSteps: steps }
    });
  }
  
  /**
   * Executes a shell command directly on remote server via Java service
   * (using grep, find, cat, sed, etc.)
   */
  protected async executeShellCommand(command: string, context: QueryContext): Promise<string> {
    const projectLocation = context.basePath.replace('/node_modules/@wavemaker/app-rn-runtime', '').replace('/node_modules/@wavemaker/rn-codegen', '');
    
    console.log(`[BaseSubAgent:${this.agentName}] executeShellCommand: Executing on remote server via Java service`);
    console.log(`[BaseSubAgent:${this.agentName}] executeShellCommand: Command: ${command}`);
    console.log(`[BaseSubAgent:${this.agentName}] executeShellCommand: projectLocation: ${projectLocation}`);
    
    try {
      const result = await executeTool('execute_command', {
        command,
        projectLocation
      });
      
      console.log(`[BaseSubAgent:${this.agentName}] executeShellCommand: Result success: ${result.success}`);
      
      if (result.success && result.data?.output) {
        console.log(`[BaseSubAgent:${this.agentName}] executeShellCommand: Output length: ${result.data.output.length}`);
        return result.data.output;
      }
      console.error(`[BaseSubAgent:${this.agentName}] executeShellCommand: Failed - ${result.error || 'Unknown error'}`);
      throw new Error(result.error || 'Command execution failed');
    } catch (error) {
      console.error(`[BaseSubAgent:${this.agentName}] executeShellCommand error:`, error);
      throw error;
    }
  }

  /**
   * Uses grep to search for patterns in files (executes on remote server via Java service)
   */
  protected async grepFiles(pattern: string, directory: string, context: QueryContext, options: { recursive?: boolean; caseSensitive?: boolean; filePattern?: string } = {}): Promise<string[]> {
    const projectLocation = context.basePath.replace('/node_modules/@wavemaker/app-rn-runtime', '').replace('/node_modules/@wavemaker/rn-codegen', '');
    
    // Use grep with proper options for remote execution
    const caseFlag = options.caseSensitive ? '' : '-i';
    const filePattern = options.filePattern ? ` --include="${options.filePattern}"` : '';
    
    // Build grep command that works on remote server
    const command = `grep -r ${caseFlag} -l "${pattern}" "${directory}"${filePattern} 2>/dev/null | head -20 || true`;
    
    console.log(`[BaseSubAgent:${this.agentName}] grepFiles: Executing remote command: ${command}`);
    
    try {
      const output = await this.executeShellCommand(command, context);
      const filePaths = output.trim().split('\n').filter(f => f.length > 0 && !f.includes('Binary file'));
      console.log(`[BaseSubAgent:${this.agentName}] grepFiles: Found ${filePaths.length} files`);
      return filePaths;
    } catch (error) {
      console.error(`[BaseSubAgent:${this.agentName}] grepFiles error:`, error);
      return [];
    }
  }

  /**
   * Uses find to locate files matching patterns (executes on remote server via Java service)
   */
  protected async findFiles(pattern: string, directory: string, context: QueryContext, options: { maxDepth?: number; type?: 'f' | 'd' } = {}): Promise<string[]> {
    const projectLocation = context.basePath.replace('/node_modules/@wavemaker/app-rn-runtime', '').replace('/node_modules/@wavemaker/rn-codegen', '');
    
    const maxDepth = options.maxDepth ? `-maxdepth ${options.maxDepth}` : '';
    const type = options.type ? `-type ${options.type}` : '-type f';
    // Handle glob patterns properly
    const namePattern = pattern.includes('*') ? `-name "${pattern}"` : `-name "*${pattern}*"`;
    
    const command = `find "${directory}" ${maxDepth} ${type} ${namePattern} 2>/dev/null | head -30 || true`;
    
    console.log(`[BaseSubAgent:${this.agentName}] findFiles: Executing remote command: ${command}`);
    
    try {
      const output = await this.executeShellCommand(command, context);
      const filePaths = output.trim().split('\n').filter(f => f.length > 0);
      console.log(`[BaseSubAgent:${this.agentName}] findFiles: Found ${filePaths.length} files`);
      return filePaths;
    } catch (error) {
      console.error(`[BaseSubAgent:${this.agentName}] findFiles error:`, error);
      return [];
    }
  }

  /**
   * Uses cat to read file content (executes on remote server via Java service)
   */
  protected async catFile(filePath: string, context: QueryContext): Promise<string> {
    const projectLocation = context.basePath.replace('/node_modules/@wavemaker/app-rn-runtime', '').replace('/node_modules/@wavemaker/rn-codegen', '');
    
    const command = `cat "${filePath}"`;
    
    console.log(`[BaseSubAgent:${this.agentName}] catFile: Executing remote command: ${command}`);
    
    try {
      const output = await this.executeShellCommand(command, context);
      console.log(`[BaseSubAgent:${this.agentName}] catFile: Read ${output.length} characters`);
      return output;
    } catch (error) {
      console.error(`[BaseSubAgent:${this.agentName}] catFile error:`, error);
      throw error;
    }
  }

  /**
   * Uses sed to extract specific lines or patterns from files
   */
  protected async sedExtract(filePath: string, pattern: string, context: QueryContext): Promise<string> {
    const projectLocation = context.basePath.replace('/node_modules/@wavemaker/app-rn-runtime', '').replace('/node_modules/@wavemaker/rn-codegen', '');
    
    // Extract lines matching pattern
    const command = `sed -n '${pattern}p' "${filePath}"`;
    
    try {
      const output = await this.executeShellCommand(command, context);
      return output;
    } catch (error) {
      console.error(`[BaseSubAgent:${this.agentName}] sedExtract error:`, error);
      return '';
    }
  }

  /**
   * Discovers files relevant to query in agent's domain
   */
  protected async discoverFiles(query: string, context: QueryContext): Promise<string[]> {
    const files: string[] = [];
    
    console.log(`[BaseSubAgent:${this.agentName}] discoverFiles: Starting discovery`);
    console.log(`[BaseSubAgent:${this.agentName}] discoverFiles: basePath: ${context.basePath}`);
    console.log(`[BaseSubAgent:${this.agentName}] discoverFiles: keyFiles:`, this.keyFiles);
    
    // Start with key files - include all related files
    const keyFilePaths = this.keyFiles.map(f => {
      const basePath = `${context.basePath}/${f}`;
      const paths = [basePath];
      
      // If key file is .tsx, also look for related files (but don't prioritize)
      if (f.endsWith('.tsx')) {
        const componentJsPath = basePath.replace('.tsx', '.component.js');
        const stylesJsPath = basePath.replace('.tsx', '.styles.js');
        // Check if these files exist before adding
        paths.push(componentJsPath, stylesJsPath);
      }
      
      return paths;
    }).flat();
    files.push(...keyFilePaths);
    console.log(`[BaseSubAgent:${this.agentName}] discoverFiles: Added ${keyFilePaths.length} key files`);
    
    // Use find_files tool to search for domain-specific files
    const searchPatterns = this.getSearchPatterns(query);
    console.log(`[BaseSubAgent:${this.agentName}] discoverFiles: Search patterns:`, searchPatterns);
    
    const projectLocation = context.basePath.replace('/node_modules/@wavemaker/app-rn-runtime', '').replace('/node_modules/@wavemaker/rn-codegen', '');
    console.log(`[BaseSubAgent:${this.agentName}] discoverFiles: projectLocation: ${projectLocation}`);
    
    // Search within the basePath directory (runtime or codegen)
    const searchBasePath = context.basePath;
    
    // Use direct find command for better pattern matching
    for (const pattern of searchPatterns) {
      try {
        // Try direct find command first
        const findResults = await this.findFiles(pattern, searchBasePath, context, { maxDepth: 5 });
        if (findResults.length > 0) {
          console.log(`[BaseSubAgent:${this.agentName}] discoverFiles: Found ${findResults.length} files via find for pattern ${pattern}`);
          files.push(...findResults);
        }
        
        // Also try the tool wrapper as fallback
        const result = await executeTool('find_files', {
          namePattern: pattern,
          directory: searchBasePath,
          projectLocation: projectLocation,
          maxResults: 20
        });
        
        if (result.success && result.data?.files) {
          console.log(`[BaseSubAgent:${this.agentName}] discoverFiles: Found ${result.data.files.length} files via find_files tool for pattern ${pattern}`);
          // Filter out .map files and only include actual source files (including .template files)
          const sourceFiles = result.data.files.filter((f: string) => 
            !f.endsWith('.map') && 
            !f.endsWith('.d.ts') &&
            (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.template'))
          );
          files.push(...sourceFiles);
        } else {
          console.log(`[BaseSubAgent:${this.agentName}] discoverFiles: No files found for pattern ${pattern}`);
        }
      } catch (error) {
        console.error(`[BaseSubAgent:${this.agentName}] discoverFiles: Error searching pattern ${pattern}:`, error);
        // Continue with other patterns
      }
    }
    
    // Use AI to extract keywords from query
    console.log(`[BaseSubAgent:${this.agentName}] discoverFiles: Extracting search terms using AI...`);
    const keywords = await this.extractKeywords(query, context);
    console.log(`[BaseSubAgent:${this.agentName}] discoverFiles: AI-extracted keywords:`, keywords);
    
    // Search for each keyword using tools - search ALL file types
    for (const keyword of keywords.slice(0, 8)) {
      try {
        // Search in all source files (.ts, .tsx, .js, .jsx, .template) without prioritizing specific types
        const grepResults = await this.grepFiles(keyword, searchBasePath, context, {
          recursive: true,
          caseSensitive: false,
          filePattern: '*.{ts,tsx,js,jsx,template}'
        });
        if (grepResults.length > 0) {
          console.log(`[BaseSubAgent:${this.agentName}] discoverFiles: Found ${grepResults.length} files via grep for keyword ${keyword}`);
          files.push(...grepResults);
        }
        
        // Also search in common source directories that might contain actual implementations
        // Search all file types equally without prioritization
        const sourceDirs = [
          searchBasePath, // Search directly in basePath (app-rn-runtime IS the src folder)
          `${searchBasePath}/dist`,
          `${searchBasePath}/lib`,
          `${searchBasePath}/build`
        ];
        
        for (const dir of sourceDirs) {
          try {
            const dirGrepResults = await this.grepFiles(keyword, dir, context, {
              recursive: true,
              caseSensitive: false,
              filePattern: '*.{ts,tsx,js,jsx,template}' // Search all source file types including templates
            });
            if (dirGrepResults.length > 0) {
              console.log(`[BaseSubAgent:${this.agentName}] discoverFiles: Found ${dirGrepResults.length} files in ${dir} for keyword ${keyword}`);
              files.push(...dirGrepResults);
            }
          } catch (dirError) {
            // Directory might not exist, continue
          }
        }
        
        // Also try the tool wrapper as fallback
        const result = await executeTool('grep_files', {
          pattern: keyword,
          filePath: searchBasePath,
          options: {
            recursive: true,
            caseSensitive: false
          },
          projectLocation: projectLocation
        });
        
        if (result.success && result.data?.matches) {
          // Extract unique file paths from grep matches
          // Grep output format: "filepath:line:content" or "filepath:content"
          const filePaths = new Set<string>();
          for (const match of result.data.matches.slice(0, 30)) {
            const matchStr = String(match);
            const colonIndex = matchStr.indexOf(':');
            if (colonIndex > 0) {
              const filePath = matchStr.substring(0, colonIndex).trim();
              // Remove quotes if present
              const cleanPath = filePath.replace(/^["']+|["']+$/g, '');
            if (cleanPath && 
                !cleanPath.endsWith('.map') && 
                !cleanPath.endsWith('.d.ts') &&
                (cleanPath.endsWith('.ts') || cleanPath.endsWith('.tsx') || cleanPath.endsWith('.js') || cleanPath.endsWith('.jsx') || cleanPath.endsWith('.template'))) {
              filePaths.add(cleanPath);
            }
            }
          }
          // Limit to first 10 unique files
          const uniqueFiles = Array.from(filePaths).slice(0, 10);
          console.log(`[BaseSubAgent:${this.agentName}] discoverFiles: Found ${uniqueFiles.length} files via grep_files tool for keyword ${keyword}`);
          files.push(...uniqueFiles);
        }
      } catch (error) {
        console.error(`[BaseSubAgent:${this.agentName}] discoverFiles: Error grepping keyword ${keyword}:`, error);
        // Continue
      }
    }
    
    // Deduplicate
    const uniqueFiles = [...new Set(files)];
    console.log(`[BaseSubAgent:${this.agentName}] discoverFiles: Total unique files: ${uniqueFiles.length}`);
    console.log(`[BaseSubAgent:${this.agentName}] discoverFiles: File paths:`, uniqueFiles.slice(0, 5));
    
    return uniqueFiles;
  }
  
  /**
   * Reads file contents using cat command (direct shell access)
   */
  protected async readFiles(filePaths: string[], context: QueryContext): Promise<Map<string, string>> {
    const contents = new Map<string, string>();
    const projectLocation = context.basePath.replace('/node_modules/@wavemaker/app-rn-runtime', '').replace('/node_modules/@wavemaker/rn-codegen', '');
    
    console.log(`[BaseSubAgent:${this.agentName}] readFiles: Reading ${filePaths.length} files`);
    console.log(`[BaseSubAgent:${this.agentName}] readFiles: projectLocation: ${projectLocation}`);
    
    for (const filePath of filePaths.slice(0, 15)) { // Limit to 15 files
      try {
        console.log(`[BaseSubAgent:${this.agentName}] readFiles: Attempting to read: ${filePath}`);
        
        // Try direct cat command first (more reliable)
        try {
          const content = await this.catFile(filePath, context);
          if (content && content.trim().length > 0) {
            console.log(`[BaseSubAgent:${this.agentName}] readFiles: Successfully read ${filePath} via cat, content length: ${content.length}`);
            contents.set(filePath, content);
            continue;
          }
        } catch (catError) {
          console.log(`[BaseSubAgent:${this.agentName}] readFiles: cat failed, trying read_file tool:`, catError);
        }
        
        // Fallback to tool wrapper
        const result = await executeTool('read_file', {
          filePath,
          projectLocation: projectLocation
        });
        
        if (result.success && result.data?.content) {
          console.log(`[BaseSubAgent:${this.agentName}] readFiles: Successfully read ${filePath} via read_file tool, content length: ${result.data.content.length}`);
          contents.set(filePath, result.data.content);
        } else {
          console.error(`[BaseSubAgent:${this.agentName}] readFiles: Failed to read ${filePath}:`, result.error || 'Unknown error');
        }
      } catch (error) {
        console.error(`[BaseSubAgent:${this.agentName}] readFiles: Error reading ${filePath}:`, error);
        // Skip files that can't be read
      }
    }
    
    console.log(`[BaseSubAgent:${this.agentName}] readFiles: Successfully read ${contents.size} files`);
    
    return contents;
  }
  
  /**
   * Generates response using AI with file context
   */
  protected async generateResponse(
    query: string,
    fileContents: Map<string, string>,
    context: QueryContext
  ): Promise<string> {
    const ai = createGeminiClient();
    const modelName = (typeof process !== 'undefined' ? process.env?.GEMINI_MODEL : undefined) || 'gemini-2.5-flash-lite';
    
    console.log(`[BaseSubAgent:${this.agentName}] generateResponse: Starting for query: ${query.substring(0, 50)}`);
    console.log(`[BaseSubAgent:${this.agentName}] generateResponse: File contents count: ${fileContents.size}`);
    
    // Build context from file contents
    // Filter out only .map files and truly empty files
    const fileContext = Array.from(fileContents.entries())
      .filter(([path, content]) => {
        // Skip .map files (source maps)
        if (path.endsWith('.map')) {
          console.log(`[BaseSubAgent:${this.agentName}] generateResponse: Skipping .map file ${path}`);
          return false;
        }
        
        // Skip empty or whitespace-only files
        if (!content || content.trim().length === 0) {
          console.log(`[BaseSubAgent:${this.agentName}] generateResponse: Skipping empty file ${path}`);
          return false;
        }
        
        return true;
      })
      .map(([path, content]) => {
        // Include full content for files under 8000 chars, truncate larger files to preserve context
        const maxLength = 8000;
        const truncatedContent = content.length > maxLength 
          ? content.substring(0, maxLength) + `\n\n... (truncated, total length: ${content.length} chars)`
          : content;
        return `\n// File: ${path}\n${truncatedContent}`;
      })
      .join('\n\n');
    
    if (fileContext.length === 0) {
      console.warn(`[BaseSubAgent:${this.agentName}] generateResponse: No file content found! All files were filtered out or empty.`);
      // Return a helpful error message explaining the issue
      return `Unable to generate a comprehensive answer. The files found (${fileContents.size} files) were empty or couldn't be read. The discovered files were:

${Array.from(fileContents.keys()).slice(0, 5).map(f => `- ${f} (${fileContents.get(f)?.length || 0} chars)`).join('\n')}

Please ensure that:
1. The source files exist in the expected location
2. The files contain actual implementation code
3. The file paths are correct

If you can provide the actual source file paths or content, I can analyze them and provide a detailed answer.`;
    }
    
    const prompt = this.buildPrompt(query, fileContext, context);
    console.log(`[BaseSubAgent:${this.agentName}] generateResponse: Prompt length: ${prompt.length}, fileContext length: ${fileContext.length}`);
    
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        config: {
          temperature: 0.1,
          seed: getAISeed(),
          systemInstruction: {
            parts: [{ text: this.getSystemPrompt() }]
          }
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      });
      
      // Try multiple response formats
      let responseText = '';
      if (response.response?.text) {
        responseText = response.response.text;
      } else if (response.candidates && response.candidates[0]?.content?.parts) {
        responseText = response.candidates[0].content.parts
          .map(part => part.text || '')
          .join('');
      } else if (response.text) {
        responseText = typeof response.text === 'function' ? response.text() : response.text;
      } else if (response.candidates && response.candidates[0]?.text) {
        responseText = response.candidates[0].text;
      }
      
      console.log(`[BaseSubAgent:${this.agentName}] generateResponse: Response received, length: ${responseText.length}`);
      console.log(`[BaseSubAgent:${this.agentName}] generateResponse: Response preview: ${responseText.substring(0, 200)}`);
      
      if (!responseText || responseText.trim().length === 0) {
        console.error(`[BaseSubAgent:${this.agentName}] generateResponse: Empty response from AI`);
        console.error(`[BaseSubAgent:${this.agentName}] generateResponse: Response object keys:`, Object.keys(response || {}));
        console.error(`[BaseSubAgent:${this.agentName}] generateResponse: Response structure:`, JSON.stringify(response, null, 2).substring(0, 500));
        return 'Unable to generate response. The AI returned an empty response.';
      }
      
      return responseText;
    } catch (error: any) {
      console.error(`[BaseSubAgent:${this.agentName}] generateResponse: Error calling AI:`, error);
      console.error(`[BaseSubAgent:${this.agentName}] generateResponse: Error stack:`, error instanceof Error ? error.stack : String(error));
      return `Unable to generate response. Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
  
  /**
   * Gets search patterns for file discovery
   */
  protected getSearchPatterns(query: string): string[] {
    const patterns: string[] = [];
    
    // Extract component/widget names
    const componentMatch = query.match(/\bWm([A-Z]\w+)\b/);
    if (componentMatch) {
      const name = componentMatch[1];
      patterns.push(`**/${name.charAt(0).toLowerCase() + name.slice(1)}*`);
    }
    
    // Add domain-specific patterns
    patterns.push(...this.getDomainPatterns(query));
    
    return patterns;
  }
  
  /**
   * Gets domain-specific search patterns (override in subclasses)
   */
  protected getDomainPatterns(query: string): string[] {
    return [];
  }
  
  /**
   * Extracts keywords and semantic concepts from query using AI analysis
   * This method understands the query semantically and traces related concepts
   */
  protected async extractKeywords(query: string, context: QueryContext): Promise<string[]> {
    const ai = createGeminiClient();
    const modelName = (typeof process !== 'undefined' ? process.env?.GEMINI_MODEL : undefined) || 'gemini-2.5-flash-lite';
    
    const extractionPrompt = `You are analyzing a user query about the WaveMaker React Native codebase to determine what search terms would find relevant implementation files.

User Query: "${query}"

**CRITICAL**: Think like a developer debugging/tracing code. Break down the query into semantic concepts and trace the implementation flow:

1. **Identify the core concepts** mentioned in the query (e.g., features, behaviors, effects, events, components)
2. **Trace related implementation concepts**:
   - For any user action or event mentioned → think about React Native event handlers (onPress, onTouchStart, etc.) and components (TouchableOpacity, Pressable, etc.)
   - For any visual effect mentioned → think about styling props, theme variables, component properties
   - For any configuration or control mentioned → think about props, flags, style overrides, configuration options
   - For any component or widget mentioned → think about component names, import paths, implementation files
3. **Think about implementation flow**:
   - User action/event → Event handler → Component → Props/styling → Effect/behavior
   - Configuration → Component prop → Style override → Theme variable
   - Feature → Component implementation → Props → Styling → Behavior

Your task: Extract 5-8 search terms that would help find relevant code files. Include:
- **Event-related terms** (if query mentions user interactions): event handlers, touchable components, pressable components
- **Component names** (if query mentions widgets/components): exact component names, React Native component names
- **Prop names** (if query mentions configuration/control): prop names, configuration options, style properties
- **Implementation concepts** that would be in code: feature names, behavior names, effect names
- **Related React Native terms**: standard React Native APIs, components, props that relate to the query

Think about what the developer would search for in the codebase to find this feature. These terms should:
- Trace the implementation flow from user action → event → component → effect
- Include both generic terms (for broader search) and specific technical terms (for precise matches)
- Match what would actually appear in source code

Respond ONLY with a JSON array of strings, like: ["term1", "term2", "term3"]`;

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        config: {
          temperature: 0.1,
          seed: getAISeed(),
        },
        contents: [{
          role: 'user',
          parts: [{ text: extractionPrompt }]
        }]
      });
      
      let responseText = '';
      if (response.response?.text) {
        responseText = response.response.text;
      } else if (response.candidates && response.candidates[0]?.content?.parts) {
        responseText = response.candidates[0].content.parts
          .map(part => part.text || '')
          .join('');
      }
      
      // Try to parse JSON array
      try {
        // Extract JSON array from response (might have markdown code blocks)
        const jsonMatch = responseText.match(/\[.*?\]/s);
        if (jsonMatch) {
            const keywords = JSON.parse(jsonMatch[0]);
            if (Array.isArray(keywords) && keywords.length > 0) {
              console.log(`[BaseSubAgent:${this.agentName}] extractKeywords: AI extracted keywords:`, keywords);
              return keywords.slice(0, 8); // Limit to 8 keywords (increased for better semantic tracing)
            }
        }
      } catch (parseError) {
        console.warn(`[BaseSubAgent:${this.agentName}] extractKeywords: Failed to parse AI response, using fallback`);
      }
    } catch (error) {
      console.warn(`[BaseSubAgent:${this.agentName}] extractKeywords: AI extraction failed, using fallback:`, error);
    }
    
    // Fallback to simple extraction (no hardcoded concept expansion)
    const words = query.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'how', 'what', 'where', 'why', 'does', 'do', 'to', 'in', 'on', 'at', 'of'];
    const baseTerms = words.filter(word => word.length > 3 && !stopWords.includes(word));
    
    // Return base terms without hardcoded expansions - let AI handle semantic analysis
    return baseTerms.slice(0, 8);
  }
  
  /**
   * Extracts sources from files
   */
  protected extractSources(files: string[], contents: Map<string, string>): FileSource[] {
    return Array.from(contents.keys()).map(path => ({
      path,
      lineStart: 1,
      lineEnd: contents.get(path)?.split('\n').length || 1
    }));
  }
  
  /**
   * Finds cross-references between files
   */
  protected findCrossReferences(files: string[], contents: Map<string, string>): CrossReference[] {
    const references: CrossReference[] = [];
    const fileList = Array.from(files);
    
    // Find import relationships
    contents.forEach((content, file) => {
      const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
      let match;
      
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        const targetFile = this.resolveImportPath(importPath, file, files);
        
        if (targetFile) {
          references.push({
            from: file,
            to: targetFile,
            type: 'imports',
            description: `Imports from ${importPath}`
          });
        }
      }
    });
    
    return references;
  }
  
  /**
   * Resolves import path to actual file
   */
  protected resolveImportPath(importPath: string, fromFile: string, availableFiles: string[]): string | null {
    // Simple resolution - find file that matches import path
    const importName = importPath.split('/').pop()?.replace('.ts', '').replace('.tsx', '') || '';
    
    return availableFiles.find(f => 
      f.includes(importName) || f.endsWith(`${importName}.ts`) || f.endsWith(`${importName}.tsx`)
    ) || null;
  }
  
  /**
   * Generates insights from file contents
   */
  protected generateInsights(contents: Map<string, string>, query: string): string[] {
    const insights: string[] = [];
    
    // Count files analyzed
    insights.push(`Analyzed ${contents.size} file(s) in ${this.agentName} domain`);
    
    // Add domain-specific insights
    insights.push(...this.getDomainInsights(contents, query));
    
    return insights;
  }
  
  /**
   * Gets domain-specific insights (override in subclasses)
   */
  protected getDomainInsights(contents: Map<string, string>, query: string): string[] {
    return [];
  }
  
  /**
   * Builds prompt for AI (override in subclasses)
   */
  protected buildPrompt(query: string, fileContext: string, context: QueryContext): string {
    return `You are the ${this.agentName}, an expert on ${this.domain.join(', ')} in the WaveMaker React Native codebase.

User Query: "${query}"

Relevant Code Context:
${fileContext}

**CRITICAL INSTRUCTIONS - REVERSE ENGINEER AND TRACE IMPLEMENTATION:**

1. **UNDERSTAND THE QUERY SEMANTICALLY**: Break down the query into concepts:
   - Identify any user actions, events, or interactions mentioned → look for event handlers, touchable components
   - Identify any visual effects, behaviors, or features mentioned → look for styling props, component properties, theme variables
   - Identify any configuration, control, or customization mentioned → look for props, flags, style overrides, configuration options
   - Identify any components or widgets mentioned → look for component names, import paths, implementation files

2. **TRACE THE IMPLEMENTATION FLOW**: Think like a developer debugging:
   - **User Action** → **Event Handler** → **Component Props** → **Styling/Effect** → **Configuration**
   - Example flow: User interaction → onPress/onTouchStart handler → TouchableOpacity/Pressable component → styling/effect → configuration prop

3. **REVERSE ENGINEER FROM CONCEPT TO CODE**:
   - Start with the user's question concept
   - Trace backwards: What prop/configuration controls this? → What component uses it? → How is it implemented?
   - Search for ALL related terms in the code (not just exact matches)
   - Think about what React Native components, props, or APIs would be involved

4. **ACTUALLY INVESTIGATE THE CODE**: Read through the provided code files carefully. Look for:
   - Event handlers (onPress, onTouchStart, onTouchEnd, etc.)
   - Component implementations (TouchableOpacity, Pressable, TouchableNativeFeedback, etc.)
   - Props and configuration options (any prop names, boolean flags, style properties)
   - Style definitions and theme variables
   - Import statements and component usage

5. **NO ASSUMPTIONS**: Only provide answers based on what you actually find in the code. If you don't find evidence, trace through related concepts:
   - If exact term isn't found, think about what React Native or WaveMaker components/props would implement this
   - Search for related technical terms that would appear in code
   - Look for patterns, not just exact matches

6. **CITE SPECIFIC CODE**: Reference exact file paths, function names, prop names, and code snippets from the provided context.

7. **ANSWER THE QUESTION DIRECTLY**: Don't provide generic explanations - give a direct, actionable answer based on the code analysis, tracing how the feature works from user action to implementation.

Analyze the code thoroughly and provide a comprehensive answer to the user's query. Include:
- Direct answer to the question based on code analysis
- Explanation of how things work (with code evidence)
- Specific code examples from the provided context
- Exact file paths and references
- Step-by-step instructions if applicable

Format your response in markdown with clear sections.`;
  }
  
  /**
   * Gets system prompt (override in subclasses)
   */
  protected getSystemPrompt(): string {
    return `You are the ${this.agentName}, specializing in ${this.domain.join(', ')}.

Your role is to:
- **UNDERSTAND QUERIES SEMANTICALLY**: Break down user queries into concepts and dynamically trace related implementation terms based on the query content
- **REVERSE ENGINEER**: Think like a developer debugging - trace from user action → event → component → effect → configuration
- **THOROUGHLY INVESTIGATE** code - read through files carefully, searching for related terms, not just exact matches
- **TRACE IMPLEMENTATION FLOW**: 
  - For user interactions → search for event handlers, touchable/pressable components
  - For visual effects → search for styling props, component properties, theme variables
  - For configuration → search for props, flags, style overrides, configuration options
  - For components → search for component names, import paths, implementation files
- **PROVIDE EVIDENCE-BASED ANSWERS** - only answer based on what you find in the code
- Explain how things work WITH code evidence, tracing the flow from concept to implementation
- Provide accurate code examples with file paths
- Reference specific files, line numbers, and implementations

**CRITICAL**: 
- Never make assumptions based on general knowledge
- Always trace through related concepts if exact terms aren't found
- Think semantically: analyze what the query is asking about and determine what React Native/WaveMaker components, props, or APIs would be involved
- If you don't find evidence in the code, trace through related concepts before giving up
- Show the implementation flow: how does the feature work from user action to code implementation?`;
  }
  
  // Required abstract methods
  abstract getDomain(): string[];
  abstract getKeyFiles(): string[];
  abstract canHandle(query: string): boolean;
}

