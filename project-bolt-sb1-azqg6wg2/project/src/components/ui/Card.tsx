import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({ children, className = '', variant = 'default', padding = 'md' }: CardProps) {
  const baseStyles = 'rounded-xl overflow-hidden';

  const variants = {
    default: 'bg-gray-800/50 border border-gray-700/50',
    glass: 'bg-gray-900/50 backdrop-blur-xl border border-gray-700/30',
    gradient: 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50',
  };

  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
}
