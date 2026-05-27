interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'gradient';
  showLabel?: boolean;
  label?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const variants = {
    default: 'bg-cyan-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    gradient: 'bg-gradient-to-r from-cyan-500 to-blue-600',
  };

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-gray-400">{label || 'Progress'}</span>
          <span className="text-gray-300">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-700/50 rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`${sizes[size]} ${variants[variant]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
