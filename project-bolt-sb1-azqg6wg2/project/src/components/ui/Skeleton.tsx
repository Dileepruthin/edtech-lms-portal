import { ReactNode } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({ className = '', variant = 'text', width, height }: SkeletonProps) {
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1em' : undefined),
  };

  return (
    <div
      className={`animate-pulse bg-gray-700/50 ${variants[variant]} ${className}`}
      style={style}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 space-y-4">
      <Skeleton variant="rectangular" height={120} />
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="80%" />
      <div className="flex justify-between pt-2">
        <Skeleton variant="text" width="30%" height={20} />
        <Skeleton variant="circular" width={32} height={32} />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 pb-3 border-b border-gray-700">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="text" className="flex-1" height={16} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          {Array.from({ length: 5 }).map((_, j) => (
            <Skeleton key={j} variant="text" className="flex-1" height={16} />
          ))}
        </div>
      ))}
    </div>
  );
}
