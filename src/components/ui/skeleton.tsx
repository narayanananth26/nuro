import React from 'react';

type SkeletonProps = {
  width?: string;
  height?: string;
  className?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
};

export default function Skeleton({ 
  width = '100%', 
  height = '20px', 
  className = '', 
  rounded = 'md' 
}: SkeletonProps) {
  const roundedMap = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };

  return (
    <div 
      className={`animate-pulse bg-gradient-to-r from-[#2D2D2D] to-[#3D3D3D] ${roundedMap[rounded]} ${className}`}
      style={{ width, height }}
    />
  );
}

// Preset skeletons for common use cases
export function TextSkeleton({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          width={i === lines - 1 && lines > 1 ? '80%' : '100%'} 
          height="16px"
          rounded="md"
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 border border-[#2D2D2D] rounded-lg ${className}`}>
      <Skeleton height="24px" width="40%" rounded="md" className="mb-4" />
      <TextSkeleton lines={3} className="mb-3" />
      <div className="flex justify-between items-center">
        <Skeleton width="100px" height="32px" rounded="md" />
        <Skeleton width="100px" height="32px" rounded="md" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 4, className = '' }: { cols?: number; className?: string }) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton 
          key={i} 
          width={`${100 / cols}%`} 
          height="24px"
          rounded="sm"
        />
      ))}
    </div>
  );
} 