import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

export function Select({
  label,
  error,
  hint,
  options = [],
  placeholder = 'Select...',
  className,
  ...props
}) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-900">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={clsx(
            'w-full px-3 py-2 text-sm rounded-md appearance-none',
            'bg-white border border-gray-200',
            'text-gray-900',
            'transition-colors duration-150',
            'hover:border-gray-300',
            'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 focus:border-transparent',
            error && 'border-red-500 focus:ring-red-500',
            'pr-10'
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}
    </div>
  );
}
