import { clsx } from 'clsx';

export function Tabs({ children, className }) {
  return (
    <div className={clsx('border-b border-gray-200', className)}>
      <div className="flex gap-1">{children}</div>
    </div>
  );
}

export function Tab({ children, active, onClick, className }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-4 py-2.5 text-sm font-medium transition-colors relative',
        'hover:text-gray-900',
        active
          ? 'text-blue-600'
          : 'text-gray-500',
        className
      )}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
      )}
    </button>
  );
}

export function TabPanel({ children, className }) {
  return <div className={clsx('py-4', className)}>{children}</div>;
}
