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
    <div className={`bg-zinc-50 border border-zinc-200 rounded-lg p-4 ${className}`}>
      <div 
        className="flex items-center justify-between cursor-pointer mb-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 className="font-medium text-sm text-zinc-800 flex items-center gap-2">
          <span className="text-zinc-500">{isExpanded ? '▼' : '▶'}</span>
          Execution Steps
        </h4>
      </div>
      
      {isExpanded && (
        <div className="space-y-3 ml-6">
          {steps.map((step) => (
            <div key={step.id} className="flex items-start gap-3">
              <div className="mt-0.5">
                <StepIcon status={step.status as ResearchStep['status']} />
              </div>
              <p className="text-sm text-zinc-700 flex-1 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
