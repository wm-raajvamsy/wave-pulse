"use client";

import React, { useState } from 'react';

export interface ResearchStep {
  id: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
}

interface ResearchStepsProps {
  steps: ResearchStep[];
  className?: string;
}

export const ResearchSteps: React.FC<ResearchStepsProps> = ({
  steps,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const StepIcon: React.FC<{ status: ResearchStep['status'] }> = ({ status }) => {
    if (status === 'completed') {
      return (
        <div className="w-4 h-4 rounded-full border-2 border-zinc-400 flex items-center justify-center bg-zinc-50 flex-shrink-0">
          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }
    
    if (status === 'in-progress') {
      return (
        <div className="w-4 h-4 rounded-full border-2 border-zinc-400 bg-zinc-50 flex items-center justify-center flex-shrink-0">
          <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
        </div>
      );
    }
    
    return (
      <div className="w-4 h-4 rounded-full border-2 border-zinc-300 bg-zinc-50 flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-zinc-400"></div>
      </div>
    );
  };

  return (
    <div className={className}>
      <div 
        className="flex items-center justify-between cursor-pointer py-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="font-medium text-xs flex items-center gap-2">
          <span>{isExpanded ? '▼' : '▶'}</span>
          Research steps
        </h4>
      </div>
      <p className="text-xs text-gray-500 mb-4 ml-6">
        These may change as the research progresses.
      </p>
      
      {isExpanded && (
        <div className="space-y-4 ml-6">
          {steps.map((step) => (
            <div key={step.id} className="flex gap-3">
              <StepIcon status={step.status} />
              <p className="text-xs flex-1">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
