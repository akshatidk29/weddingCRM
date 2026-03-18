import { clsx } from 'clsx';

export function Card({ children, className = '', hover = false, glow = false }) {
  return (
    <div 
      className={clsx(
        'bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl',
        hover && 'hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300',
        glow && 'hover:shadow-lg hover:shadow-purple-500/10',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={clsx('px-6 py-4 border-b border-white/[0.06]', className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={clsx('p-6', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={clsx('text-lg font-semibold text-white', className)}>
      {children}
    </h3>
  );
}
