import React from 'react';

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function RetroButton({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled,
  ...props 
}: RetroButtonProps) {
  
  // Base styles for all retro buttons
  const baseStyles = "font-pixel border-2 border-indigo shadow-hard transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-hard";
  
  // Size variants
  const sizes = {
    sm: "text-[8px] px-3 py-1.5",
    md: "text-[10px] px-5 py-2.5",
    lg: "text-xs px-7 py-3.5",
  };

  // Color variants based on your Y2K palette
  const variants = {
    primary: "bg-neonCyan text-indigo hover:bg-white hover:text-indigo",
    secondary: "bg-violet text-lavender hover:bg-royal hover:text-glowYellow",
    danger: "bg-red-500 text-white hover:bg-red-600 hover:text-white",
  };

  return (
    <button 
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}