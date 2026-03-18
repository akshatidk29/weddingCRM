import { clsx } from 'clsx';

export function Input({ 
  label, 
  error, 
  className = '', 
  icon: Icon,
  ...props 
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-400">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        )}
        <input
          className={clsx(
            'w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl',
            'text-white placeholder-gray-500',
            'focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20',
            'transition-all duration-200',
            Icon && 'pl-10',
            error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

export function Select({ 
  label, 
  error, 
  options = [], 
  className = '',
  placeholder = 'Select...',
  ...props 
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-400">
          {label}
        </label>
      )}
      <select
        className={clsx(
          'w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl',
          'text-white',
          'focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20',
          'transition-all duration-200',
          error && 'border-red-500/50',
          className
        )}
        {...props}
      >
        <option value="" className="bg-gray-900">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value} className="bg-gray-900">
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

export function Textarea({ 
  label, 
  error, 
  className = '',
  rows = 3,
  ...props 
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-400">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={clsx(
          'w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl',
          'text-white placeholder-gray-500',
          'focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20',
          'transition-all duration-200 resize-none',
          error && 'border-red-500/50',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
