import { clsx } from 'clsx';
import { ChevronUp, ChevronDown } from 'lucide-react';

export function Table({ children, className }) {
  return (
    <div className="overflow-x-auto">
      <table className={clsx('w-full', className)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className }) {
  return (
    <thead className={clsx('border-b border-gray-200', className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }) {
  return <tbody className={className}>{children}</tbody>;
}

export function TableRow({ children, className, onClick, hover = true }) {
  return (
    <tr
      className={clsx(
        'border-b border-gray-200 last:border-0',
        hover && 'hover:bg-gray-50 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  children,
  className,
  sortable,
  sorted,
  sortDirection,
  onSort,
}) {
  return (
    <th
      className={clsx(
        'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
        sortable && 'cursor-pointer select-none hover:text-gray-900',
        className
      )}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortable && (
          <span className="flex flex-col">
            <ChevronUp
              className={clsx(
                'h-3 w-3 -mb-1',
                sorted && sortDirection === 'asc'
                  ? 'text-blue-600'
                  : 'text-gray-400'
              )}
            />
            <ChevronDown
              className={clsx(
                'h-3 w-3',
                sorted && sortDirection === 'desc'
                  ? 'text-blue-600'
                  : 'text-gray-400'
              )}
            />
          </span>
        )}
      </div>
    </th>
  );
}

export function TableCell({ children, className }) {
  return (
    <td className={clsx('px-4 py-3 text-sm text-gray-600', className)}>
      {children}
    </td>
  );
}

export function TableEmpty({ message = 'No data found', colSpan = 1 }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-12 text-center text-sm text-gray-400"
      >
        {message}
      </td>
    </tr>
  );
}
