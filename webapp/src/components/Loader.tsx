interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullPage?: boolean;
  inline?: boolean;
  className?: string;
}

export function Loader({ size = 'md', text, fullPage, inline, className = '' }: LoaderProps) {
  const sizeMap = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const borderMap = { sm: 'border-[2px]', md: 'border-[3px]', lg: 'border-4' };

  const spinner = (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div
        className={`${sizeMap[size]} ${borderMap[size]} border-primary-200 border-t-primary-600 rounded-full animate-spin`}
      />
      {text && <p className="text-sm text-gray-400 font-medium">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        {spinner}
      </div>
    );
  }

  if (inline) {
    return (
      <div className="flex items-center justify-center py-12">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/** Table row skeleton loader */
export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-100">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-4 bg-gray-100 rounded-lg"
              style={{ width: `${Math.max(60, 100 - c * 10)}px` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Card skeleton loader (for grid layouts like Roles/Permissions) */
export function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded-lg w-2/3" />
              <div className="h-3 bg-gray-100 rounded-lg w-1/3" />
            </div>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-5 bg-gray-100 rounded-full w-14" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
