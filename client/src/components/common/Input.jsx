import { clsx } from 'clsx';

export function Input({
  label,
  error,
  hint,
  className,
  inputClassName,
  icon: Icon,
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
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          className={clsx(
            'w-full px-3 py-2 text-sm rounded-md',
            'bg-white border border-gray-200',
            'text-gray-900 placeholder:text-gray-400',
            'transition-colors duration-150',
            'hover:border-gray-300',
            'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 focus:border-transparent',
            error && 'border-red-500 focus:ring-red-500',
            Icon && 'pl-10',
            inputClassName
          )}
          {...props}
        />
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

export function Textarea({
  label,
  error,
  hint,
  className,
  rows = 4,
  ...props
}) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-900">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={clsx(
          'w-full px-3 py-2 text-sm rounded-md',
          'bg-white border border-gray-200',
          'text-gray-900 placeholder:text-gray-400',
          'transition-colors duration-150 resize-none',
          'hover:border-gray-300',
          'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-0 focus:border-transparent',
          error && 'border-red-500 focus:ring-red-500'
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}
    </div>
  );
}
