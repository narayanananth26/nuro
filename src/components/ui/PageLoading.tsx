import React from 'react';
import { CardSkeleton, TextSkeleton, TableRowSkeleton } from './skeleton';

type PageLoadingProps = {
  type?: 'default' | 'table' | 'dashboard' | 'form' | 'detail';
  className?: string;
};

export default function PageLoading({ type = 'default', className = '' }: PageLoadingProps) {
  switch (type) {
    case 'table':
      return (
        <div className={`space-y-4 ${className}`}>
          <TextSkeleton lines={1} className="max-w-xs" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <TableRowSkeleton key={i} cols={5} className="py-3" />
            ))}
          </div>
        </div>
      );
    
    case 'dashboard':
      return (
        <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      );
    
    case 'form':
      return (
        <div className={`max-w-lg mx-auto space-y-6 ${className}`}>
          <TextSkeleton lines={1} className="max-w-xs" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <TextSkeleton lines={1} className="max-w-[100px]" />
                <TextSkeleton lines={1} />
              </div>
            ))}
          </div>
          <div className="h-8" /> {/* Space for button */}
          <TextSkeleton lines={1} className="max-w-[200px] ml-auto" />
        </div>
      );
    
    case 'detail':
      return (
        <div className={`space-y-6 ${className}`}>
          <TextSkeleton lines={1} className="max-w-sm" />
          <div className="grid gap-4 md:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>
          <TextSkeleton lines={4} />
        </div>
      );
    
    default:
      return (
        <div className={`flex flex-col items-center justify-center h-full space-y-4 ${className}`}>
          <div className="w-16 h-16 border-4 border-[#2D2D2D] border-t-[#E3CF20] rounded-full animate-spin" />
          <TextSkeleton lines={1} className="max-w-[150px]" />
        </div>
      );
  }
} 