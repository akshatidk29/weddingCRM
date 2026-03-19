import { clsx } from 'clsx';
import { getInitials } from '../../utils/helpers';

export function Avatar({ name, src, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx(
          'rounded-full object-cover',
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <div className={clsx(
      'rounded-full bg-linear-to-br from-purple-500 to-violet-600 flex items-center justify-center font-semibold text-white',
      sizes[size],
      className
    )}>
      {getInitials(name)}
    </div>
  );
}
