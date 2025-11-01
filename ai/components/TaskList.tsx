"use client";

import React, { useState } from 'react';

export interface TaskItem {
  id: string;
  title: string;
  status: 'completed' | 'in-progress' | 'pending';
  isExpandable?: boolean;
  children?: TaskItem[];
}

interface TaskListProps {
  tasks: TaskItem[];
  title?: string;
  className?: string;
}

const TaskIcon: React.FC<{ status: TaskItem['status'] }> = ({ status }) => {
  if (status === 'completed') {
    return (
      <div className="w-4 h-4 rounded-full border-2 border-zinc-400 flex items-center justify-center bg-zinc-50">
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  
  if (status === 'in-progress') {
    return (
      <div className="w-4 h-4 rounded-full border-2 border-zinc-400 bg-zinc-50 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
      </div>
    );
  }
  
  return (
    <div className="w-4 h-4 rounded-full border-2 border-zinc-300 bg-zinc-50"></div>
  );
};

const TaskItemComponent: React.FC<{ 
  task: TaskItem; 
  isLast: boolean;
  level?: number;
}> = ({ task, isLast, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex">
      {/* Timeline line */}
      <div className="flex flex-col items-center mr-3">
        <TaskIcon status={task.status} />
        {!isLast && (
          <div className="w-0.5 flex-1 bg-zinc-300 border-dashed" style={{ minHeight: '20px' }} />
        )}
      </div>
      
      {/* Task content */}
      <div className="flex-1 pb-4">
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => task.isExpandable && setIsExpanded(!isExpanded)}
        >
          <span className="font-medium text-xs">
            {task.title}
          </span>
          {task.isExpandable && (
            <svg 
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
        
        {task.children && isExpanded && (
          <div className="mt-2 ml-7 border-l-2 border-zinc-300 pl-4">
            {task.children.map((child, index) => (
              <TaskItemComponent
                key={child.id}
                task={child}
                isLast={index === task.children!.length - 1}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  title,
  className = ""
}) => {
  return (
    <div className={className}>
      {title && (
        <h3 className="text-sm font-semibold mb-4">{title}</h3>
      )}
      <div className="space-y-0">
        {tasks.map((task, index) => (
          <TaskItemComponent
            key={task.id}
            task={task}
            isLast={index === tasks.length - 1}
          />
        ))}
      </div>
    </div>
  );
};
