import React from 'react';

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
};

export default function Spinner({ size = 'md', color = '#121212' }: SpinnerProps) {
  const sizeMap = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className={`inline-block ${sizeMap[size]} animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]`} 
      style={{ color }}>
      <span className="sr-only">Loading...</span>
    </div>
  );
} 