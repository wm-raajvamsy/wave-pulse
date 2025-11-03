/**
 * Sub-Agent Orchestrator
 * Coordinates sub-agent execution and aggregates responses
 */

import { SubAgent, BaseSubAgent } from './base-sub-agent';
import { AgentResponse, SubAgentResponse, QueryContext, CrossReference } from './types';
import { BaseAgent } from './sub-agents/base-agent';
import { ComponentAgent } from './sub-agents/component-agent';
import { StyleDefinitionAgent } from './sub-agents/style-definition-agent';
import { StyleAgent } from './sub-agents/style-agent';
import { ServiceAgent } from './sub-agents/service-agent';
import { BindingAgent } from './sub-agents/binding-agent';
import { VariableAgent } from './sub-agents/variable-agent';
import { TranspilerAgent } from './sub-agents/transpiler-agent';
import { TransformerAgent } from './sub-agents/transformer-agent';
import { ParserAgent } from './sub-agents/parser-agent';
import { FormatterAgent } from './sub-agents/formatter-agent';
import { GenerationAgent } from './sub-agents/generation-agent';
import { FragmentAgent } from './sub-agents/fragment-agent';
import { WatcherAgent } from './sub-agents/watcher-agent';
import { MemoAgent } from './sub-agents/memo-agent';
import { AppAgent } from './sub-agents/app-agent';

export class SubAgentOrchestrator {
  private agents: Map<string, SubAgent>;
  private onStepUpdate?: (update: { type: 'step' | 'complete'; data?: any }) => void;
  private researchSteps: Array<{ id: string; description: string; status: string }>;
  
  constructor(onStepUpdate?: (update: { type: 'step' | 'complete'; data?: any }) => void, researchSteps?: Array<{ id: string; description: string; status: string }>) {
    this.initializeAgents();
    this.onStepUpdate = onStepUpdate;
    this.researchSteps = researchSteps || [];
  }
  
  /**
   * Gets current research steps
   */
  getResearchSteps(): Array<{ id: string; description: string; status: string }> {
    return [...this.researchSteps];
  }
  
  /**
   * Helper: Update research step
   */
  private updateStep(
    stepId: string,
    description: string,
    status: 'pending' | 'in-progress' | 'completed' | 'failed'
  ): void {
    const steps = [...this.researchSteps];
    const existingIndex = steps.findIndex(s => s.id === stepId);
    
    if (existingIndex >= 0) {
      steps[existingIndex] = { ...steps[existingIndex], description, status };
    } else {
      steps.push({ id: stepId, description, status });
    }
    
    this.researchSteps = steps;
    
    if (this.onStepUpdate) {
      this.onStepUpdate({
        type: 'step',
        data: { researchSteps: steps }
      });
    }
  }
  
  /**
   * Syncs steps from context (called after sub-agent execution)
   */
  private syncStepsFromContext(context: QueryContext): void {
    if (context.researchSteps) {
      // Merge context steps into orchestrator's steps
      const contextSteps = context.researchSteps;
      const mergedSteps = [...this.researchSteps];
      
      contextSteps.forEach(contextStep => {
        const existingIndex = mergedSteps.findIndex(s => s.id === contextStep.id);
        if (existingIndex >= 0) {
          mergedSteps[existingIndex] = contextStep;
        } else {
          mergedSteps.push(contextStep);
        }
      });
      
      this.researchSteps = mergedSteps;
    }
  }
  
  /**
   * Initializes all sub-agents
   */
  private initializeAgents() {
    this.agents = new Map([
      ['BaseAgent', new BaseAgent()],
      ['ComponentAgent', new ComponentAgent()],
      ['StyleAgent', new StyleAgent()],
      ['StyleDefinitionAgent', new StyleDefinitionAgent()],
      ['ServiceAgent', new ServiceAgent()],
      ['BindingAgent', new BindingAgent()],
      ['VariableAgent', new VariableAgent()],
      ['TranspilerAgent', new TranspilerAgent()],
      ['TransformerAgent', new TransformerAgent()],
      ['ParserAgent', new ParserAgent()],
      ['FormatterAgent', new FormatterAgent()],
      ['GenerationAgent', new GenerationAgent()],
      ['FragmentAgent', new FragmentAgent()],
      ['WatcherAgent', new WatcherAgent()],
      ['MemoAgent', new MemoAgent()],
      ['AppAgent', new AppAgent()]
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
    const stepId = `sub-agent-${agentName}`;
    console.log(`[SubAgentOrchestrator] executeSingleAgent: Starting execution for ${agentName}`);
    
    // Emit step update for individual sub-agent
    this.updateStep(stepId, `${agentName}: Processing query...`, 'in-progress');
    
    const agent = this.agents.get(agentName);
    if (!agent) {
      const errorMsg = `Agent ${agentName} not found`;
      this.updateStep(stepId, `${agentName}: ${errorMsg}`, 'failed');
      throw new Error(errorMsg);
    }
    
    console.log(`[SubAgentOrchestrator] executeSingleAgent: Agent found, calling process...`);
    try {
      const response = await agent.process(query, context);
      
      // Sync steps from sub-agent (includes discover-files, read-files, generate-response steps)
      this.syncStepsFromContext(context);
      
      console.log(`[SubAgentOrchestrator] executeSingleAgent: Response received from ${agentName}:`, {
        hasContent: !!response.content,
        contentType: typeof response.content,
        sourcesCount: response.sources?.length || 0,
        confidence: response.confidence
      });
      
      // Mark sub-agent step as completed
      this.updateStep(stepId, `${agentName}: Analysis complete`, 'completed');
      
      return {
        agent: agentName,
        response: response.content,
        sources: response.sources,
        confidence: response.confidence,
        crossReferences: response.crossReferences
      };
    } catch (error: any) {
      const errorMsg = `Error executing ${agentName}: ${error.message}`;
      console.error(`[SubAgentOrchestrator] executeSingleAgent: ${errorMsg}`, error);
      console.error(`[SubAgentOrchestrator] executeSingleAgent: Error stack:`, error instanceof Error ? error.stack : String(error));
      
      // Mark sub-agent step as failed
      this.updateStep(stepId, `${agentName}: ${errorMsg}`, 'failed');
      
      throw error;
    }
  }
  
  /**
   * Executes query with multiple sub-agents in parallel
   */
  private async executeMultipleAgents(
    query: string,
    agentNames: string[],
    context: QueryContext
  ): Promise<AgentResponse> {
    // Initialize steps for all sub-agents
    agentNames.forEach(agentName => {
      const stepId = `sub-agent-${agentName}`;
      this.updateStep(stepId, `${agentName}: Queued for execution...`, 'pending');
    });
    
    // Execute all agents in parallel
    const agentPromises = agentNames.map(async (agentName) => {
      const stepId = `sub-agent-${agentName}`;
      const agent = this.agents.get(agentName);
      if (!agent) {
        this.updateStep(stepId, `${agentName}: Agent not found`, 'failed');
        return Promise.resolve(null);
      }
      
      // Mark as in-progress
      this.updateStep(stepId, `${agentName}: Processing query...`, 'in-progress');
      
      try {
        const response = await agent.process(query, context);
        
        // Sync steps from sub-agent (includes discover-files, read-files, generate-response steps)
        this.syncStepsFromContext(context);
        
        // Mark as completed
        this.updateStep(stepId, `${agentName}: Analysis complete`, 'completed');
        return {
          agentName,
          response
        };
      } catch (error: any) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.updateStep(stepId, `${agentName}: ${errorMsg}`, 'failed');
        return null;
      }
    });
    
    const agentResults = await Promise.all(agentPromises);
    
    // Filter out null results
    const validResults = agentResults.filter(r => r !== null) as Array<{
      agentName: string;
      response: SubAgentResponse;
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
    results: Array<{ agentName: string; response: SubAgentResponse }>,
    query: string
  ): { content: any; crossReferences: CrossReference[] } {
    const sections: any[] = [];
    const insights: string[] = [];
    
    // Group by agent
    results.forEach(({ agentName, response }) => {
      sections.push({
        title: `${agentName} Analysis`,
        content: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
        sources: response.sources,
        agent: agentName
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
   * Generates summary from sections
   */
  private generateSummary(sections: any[], query: string): string {
    return `Analysis of "${query}" across ${sections.length} specialized agent(s). Each agent provides domain-specific insights and code examples.`;
  }
  
  /**
   * Finds cross-references between agent responses
   */
  private findCrossReferences(sections: any[]): CrossReference[] {
    const references: CrossReference[] = [];
    const allFiles = new Set<string>();
    
    // Collect all file paths
    sections.forEach(section => {
      section.sources?.forEach((source: any) => {
        allFiles.add(source.path);
      });
    });
    
    // Find relationships between files
    const fileArray = Array.from(allFiles);
    for (let i = 0; i < fileArray.length; i++) {
      for (let j = i + 1; j < fileArray.length; j++) {
        const relationship = this.findRelationship(fileArray[i], fileArray[j]);
        if (relationship) {
          references.push({
            from: fileArray[i],
            to: fileArray[j],
            type: relationship.type,
            description: relationship.description
          });
        }
      }
    }
    
    return references;
  }
  
  /**
   * Finds relationship between two files
   */
  private findRelationship(file1: string, file2: string): { type: CrossReference['type']; description: string } | null {
    // Simple heuristic: check if one file imports or references the other
    const file1Name = file1.split('/').pop()?.replace(/\.(ts|tsx)$/, '') || '';
    const file2Name = file2.split('/').pop()?.replace(/\.(ts|tsx)$/, '') || '';
    
    // Check if files are in related directories
    if (file1.includes('runtime') && file2.includes('codegen')) {
      return {
        type: 'uses',
        description: 'Runtime uses codegen generated code'
      };
    }
    
    return null;
  }
  
  /**
   * Merges sources from all agents
   */
  private mergeSources(
    results: Array<{ agentName: string; response: SubAgentResponse }>
  ): any[] {
    const sources: any[] = [];
    const seen = new Set<string>();
    
    results.forEach(({ response }) => {
      response.sources.forEach(source => {
        if (!seen.has(source.path)) {
          seen.add(source.path);
          sources.push(source);
        }
      });
    });
    
    return sources;
  }
  
  /**
   * Validates consistency across agent responses
   */
  private async validateConsistency(
    results: Array<{ agentName: string; response: SubAgentResponse }>
  ): Promise<any> {
    const inconsistencies: any[] = [];
    const agreements: any[] = [];
    
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
            conflicts: comparison.conflicts
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
      agreements
    };
  }
  
  /**
   * Compares two responses
   */
  private compareResponses(response1: SubAgentResponse, response2: SubAgentResponse): {
    conflicts: string[];
    agreements: string[];
  } {
    const conflicts: string[] = [];
    const agreements: string[] = [];
    
    // Simple comparison: check if they reference same files
    const files1 = new Set(response1.sources.map(s => s.path));
    const files2 = new Set(response2.sources.map(s => s.path));
    
    const commonFiles = [...files1].filter(f => files2.has(f));
    if (commonFiles.length > 0) {
      agreements.push(`Both reference ${commonFiles.length} common file(s)`);
    }
    
    return { conflicts, agreements };
  }
  
  /**
   * Calculates overall confidence
   */
  private calculateConfidence(
    results: Array<{ agentName: string; response: SubAgentResponse }>,
    validation: any
  ): number {
    if (results.length === 0) return 0;
    
    const avgConfidence = results.reduce((sum, r) => sum + r.response.confidence, 0) / results.length;
    
    // Reduce confidence if there are inconsistencies
    if (validation && !validation.consistent) {
      return avgConfidence * 0.8;
    }
    
    return avgConfidence;
  }
}

