import React from 'react';

interface RetroWindowProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  controls?: boolean; // Toggle the red/yellow/green dots
}

export function RetroWindow({ 
  title, 
  children, 
  className = '', 
  controls = true 
}: RetroWindowProps) {
  return (
    <div className={`relative bg-violet border-2 border-indigo shadow-hard ${className}`}>
      {/* Title Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-royal border-b-2 border-indigo">
        <h3 className="font-pixel text-[10px] sm:text-xs text-glowYellow uppercase tracking-wider truncate">
          {title}
        </h3>
        
        {controls && (
          <div className="flex gap-1.5 shrink-0 ml-4">
            <div className="w-3 h-3 rounded-full bg-red-500 border border-indigo shadow-hard-sm"></div>
            <div className="w-3 h-3 rounded-full bg-glowYellow border border-indigo shadow-hard-sm"></div>
            <div className="w-3 h-3 rounded-full bg-neonCyan border border-indigo shadow-hard-sm"></div>
          </div>
        )}
      </div>
      
      {/* Content Area */}
      <div className="p-4 sm:p-6 min-h-[100px]">
        {children}
      </div>
    </div>
  );
}