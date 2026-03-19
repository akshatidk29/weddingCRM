import { clsx } from 'clsx';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 p-3 rounded-full bg-gray-100">
          <Icon className="h-6 w-6 text-gray-400" />
        </div>
      )}
      {title && (
        <h3 className="text-base font-medium text-gray-900 mb-1">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
