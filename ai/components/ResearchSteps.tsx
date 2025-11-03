"use client";

import React, { useState } from 'react';

export interface ResearchStep {
  id: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'failed';
}

interface ResearchStepsProps {
  steps: ResearchStep[];
  className?: string;
}

// Helper to format step descriptions
const formatStepDescription = (id: string, description: string): string => {
  // If description is already formatted, use it
  if (description && description !== id) {
    return description;
  }
  
  // Format common step IDs
  const stepNames: Record<string, string> = {
    // Information Retrieval Agent steps
    'query-analysis': 'Analyzing query',
    'current-page-state': 'Retrieving current page state',
    'get-page-name': 'Getting page name from timeline',
    'resolve-page-name': 'Resolving page name',
    'find-component-file': 'Finding component file',
    'read-component-file': 'Reading component file',
    'find-styles-file': 'Finding styles file',
    'read-styles-file': 'Reading styles file',
    'find-script-file': 'Finding script file',
    'read-script-file': 'Reading script file',
    'find-variables-file': 'Finding variables file',
    'read-variables-file': 'Reading variables file',
    'analyze-page-files': 'Analyzing page files',
    'synthesize-answer': 'Synthesizing answer',
    
    // Codebase Agent steps
    'query-analyzer': 'Analyzing query intent and domain',
    'file-discovery': 'Discovering relevant files',
    'code-analysis': 'Analyzing code structure',
    'sub-agent-execution': 'Executing sub-agents',
    'validation': 'Validating response',
    'final-response': 'Generating final response',
    
    // Codebase Agent sub-agent steps (format: sub-agent-{agentName})
    'sub-agent-BaseAgent': 'BaseAgent: Analyzing core infrastructure',
    'sub-agent-ComponentAgent': 'ComponentAgent: Analyzing widget components',
    'sub-agent-StyleAgent': 'StyleAgent: Analyzing theme and styles',
    'sub-agent-StyleDefinitionAgent': 'StyleDefinitionAgent: Analyzing style definitions',
    'sub-agent-ServiceAgent': 'ServiceAgent: Analyzing runtime services',
    'sub-agent-BindingAgent': 'BindingAgent: Analyzing data binding',
    'sub-agent-VariableAgent': 'VariableAgent: Analyzing variables',
    'sub-agent-WatcherAgent': 'WatcherAgent: Analyzing watch system',
    'sub-agent-MemoAgent': 'MemoAgent: Analyzing memoization',
    'sub-agent-FragmentAgent': 'FragmentAgent: Analyzing fragments',
    'sub-agent-TranspilerAgent': 'TranspilerAgent: Analyzing transpilation',
    'sub-agent-TransformerAgent': 'TransformerAgent: Analyzing transformations',
    'sub-agent-ParserAgent': 'ParserAgent: Analyzing parsing',
    'sub-agent-FormatterAgent': 'FormatterAgent: Analyzing formatting',
    'sub-agent-GenerationAgent': 'GenerationAgent: Analyzing code generation',
    'sub-agent-AppAgent': 'AppAgent: Analyzing app architecture',
  };
  
  // Check if it's a sub-agent step
  if (id.startsWith('sub-agent-')) {
    // Handle sub-agent operation steps (e.g., sub-agent-BaseAgent-discover-files)
    if (id.includes('-discover-files')) {
      const agentName = id.replace('sub-agent-', '').replace('-discover-files', '');
      return `${agentName}: Discovering files`;
    }
    if (id.includes('-read-files')) {
      const agentName = id.replace('sub-agent-', '').replace('-read-files', '');
      return `${agentName}: Reading files`;
    }
    if (id.includes('-generate-response')) {
      const agentName = id.replace('sub-agent-', '').replace('-generate-response', '');
      return `${agentName}: Generating response`;
    }
    
    // Handle simple sub-agent step (e.g., sub-agent-BaseAgent)
    const agentName = id.replace('sub-agent-', '');
    return stepNames[id] || `${agentName}: Processing query`;
  }
  
  return stepNames[id] || id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Helper to categorize steps
const categorizeStep = (id: string): { category: string; icon: string } => {
  // Codebase Agent categories (check these first as they're more specific)
  if (id === 'query-analyzer') {
    return { category: 'Query Analysis', icon: '🔍' };
  }
  if (id === 'file-discovery') {
    return { category: 'File Discovery', icon: '📁' };
  }
  if (id === 'code-analysis') {
    return { category: 'Code Analysis', icon: '🔬' };
  }
  if (id === 'sub-agent-execution') {
    return { category: 'Sub-Agent Execution', icon: '🤖' };
  }
  if (id === 'validation') {
    return { category: 'Validation', icon: '✅' };
  }
  if (id === 'final-response') {
    return { category: 'Response Generation', icon: '📝' };
  }
  
  // Sub-agent specific steps (if any are created)
  if (id.startsWith('sub-agent-')) {
    // Check if it's a sub-agent operation step
    if (id.includes('-discover-files') || id.includes('-read-files')) {
      return { category: 'File Operations', icon: '📁' };
    }
    if (id.includes('-generate-response')) {
      return { category: 'Response Generation', icon: '📝' };
    }
    return { category: 'Sub-Agent Execution', icon: '🤖' };
  }
  
  // Information Retrieval Agent categories
  if (id.includes('current-page') || id.includes('resolve-page') || id.includes('get-page-name')) {
    return { category: 'Page State', icon: '📄' };
  }
  if ((id.includes('file') || id.includes('find') || id.includes('read')) && !id.includes('file-discovery')) {
    return { category: 'File Operations', icon: '📁' };
  }
  if (id.includes('analyze') || id.includes('synthesize')) {
    return { category: 'Analysis', icon: '⚙️' };
  }
  if (id.includes('query') || id.includes('analysis')) {
    return { category: 'Query Analysis', icon: '🔍' };
  }
  
  return { category: 'Processing', icon: '🔄' };
};

export const ResearchSteps: React.FC<ResearchStepsProps> = ({
  steps,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const inProgressCount = steps.filter(s => s.status === 'in-progress').length;
  const failedCount = steps.filter(s => s.status === 'failed').length;
  const totalCount = steps.length;

  const StepIcon: React.FC<{ status: ResearchStep['status'] }> = ({ status }) => {
    if (status === 'completed') {
      return (
        <div className="w-5 h-5 rounded-full border-2 border-green-500 bg-green-50 flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    
    if (status === 'in-progress') {
      return (
        <div className="w-5 h-5 rounded-full border-2 border-blue-500 bg-blue-50 flex items-center justify-center flex-shrink-0 animate-pulse">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
        </div>
      );
    }
    
    if (status === 'failed') {
      return (
        <div className="w-5 h-5 rounded-full border-2 border-red-500 bg-red-50 flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      );
    }
    
    return (
      <div className="w-5 h-5 rounded-full border-2 border-zinc-300 bg-zinc-50 flex items-center justify-center flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-zinc-400"></div>
      </div>
    );
  };

  // Group steps by category and preserve order
  const groupedSteps: Array<{ category: string; icon: string; steps: ResearchStep[]; isCategory: boolean }> = [];
  const categoryMap = new Map<string, { icon: string; steps: ResearchStep[]; firstIndex: number }>();
  
  steps.forEach((step, index) => {
    const { category, icon } = categorizeStep(step.id);
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { icon, steps: [], firstIndex: index });
    }
    categoryMap.get(category)!.steps.push(step);
  });

  // Convert to array and sort by first occurrence
  const sortedCategories = Array.from(categoryMap.entries())
    .sort((a, b) => a[1].firstIndex - b[1].firstIndex);

  sortedCategories.forEach(([category, { icon, steps: categorySteps }]) => {
    groupedSteps.push({
      category,
      icon,
      steps: categorySteps,
      isCategory: categorySteps.length > 1, // Only show as category if multiple steps
    });
  });

  return (
    <div className={`bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer px-4 py-3 bg-gradient-to-r from-zinc-50 to-white hover:bg-zinc-50 transition-colors duration-150"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <h4 className="font-semibold text-sm text-zinc-800 flex items-center gap-2">
            <span className="text-zinc-500 text-xs transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
              ▼
            </span>
          Execution Steps
        </h4>
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <span className={`px-2 py-0.5 rounded-full ${completedCount > 0 ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
              {completedCount} completed
            </span>
            {inProgressCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {inProgressCount} in progress
              </span>
            )}
            {failedCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                {failedCount} failed
              </span>
            )}
          </div>
        </div>
        <div className="text-xs font-medium text-zinc-500">
          {completedCount}/{totalCount}
        </div>
      </div>
      
      {/* Progress Bar */}
      {isExpanded && (
        <div className="px-4 pt-2 pb-1">
          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Steps List */}
      {isExpanded && (
        <div className="px-4 py-3 max-h-96 overflow-y-auto">
          <div className="relative pl-10">
            {/* Timeline line - centered at 1.125rem (18px) from left */}
            <div className="absolute left-[1.125rem] top-0 bottom-0 w-0.5 bg-zinc-200" />
            
            <div className="space-y-3">
              {groupedSteps.map((group, groupIndex) => {
                const showCategoryHeader = group.isCategory && group.steps.length > 1;
                
                return (
                  <div key={`${group.category}-${groupIndex}`}>
                    {/* Category Header */}
                    {showCategoryHeader && (
                      <div className="mb-3 ml-0">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-700 uppercase tracking-wide bg-zinc-100 px-3 py-1.5 rounded-md">
                          <span>{group.icon}</span>
                          <span>{group.category}</span>
                          <span className="text-zinc-500 font-normal normal-case">
                            ({group.steps.filter(s => s.status === 'completed').length}/{group.steps.length})
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Steps List */}
                    <div className={showCategoryHeader ? 'ml-6 space-y-2' : 'space-y-2'}>
                      {group.steps.map((step, stepIndex) => {
                        const isLastStep = stepIndex === group.steps.length - 1;
                        const isLastGroup = groupIndex === groupedSteps.length - 1;
                        
                        return (
                          <div key={step.id} className="relative flex items-start">
                            {/* Icon - positioned exactly on timeline (1.125rem from container left = 18px) */}
                            {/* Container has pl-10 (40px), so icon at -left-[2.625rem] = 42px from container left, which is 2px right of timeline */}
                            {/* Timeline is at left-[1.125rem] = 18px from container left (which has pl-10) */}
                            {/* So timeline is at 18px + 40px = 58px from parent */}
                            {/* Icon needs to be at 58px - 20px (half icon width) = 38px from parent, which is -2px from container */}
                            <div className="absolute left-[1.125rem] top-0 z-10 flex-shrink-0 -translate-x-1/2">
                <StepIcon status={step.status as ResearchStep['status']} />
              </div>
                            
                            {/* Connector line - connects from icon center to next icon center */}
                            {!(isLastStep && isLastGroup) && (
                              <div className="absolute left-[1.125rem] top-5 w-0.5 h-6 bg-zinc-200 -translate-x-1/2" />
                            )}
                            
                            {/* Step Content */}
                            <div className="flex-1 min-w-0 pt-0.5 pb-1 ml-8 group hover:bg-zinc-50 -mx-2 px-2 py-1 rounded transition-colors duration-150">
                              <p className={`text-sm leading-relaxed ${
                                step.status === 'completed' 
                                  ? 'text-zinc-800' 
                                  : step.status === 'failed'
                                  ? 'text-red-700'
                                  : step.status === 'in-progress'
                                  ? 'text-blue-700 font-medium'
                                  : 'text-zinc-500'
                              }`}>
                                {formatStepDescription(step.id, step.description)}
              </p>
                              {step.status === 'failed' && (
                                <p className="text-xs text-red-600 mt-1.5">Failed to complete</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
