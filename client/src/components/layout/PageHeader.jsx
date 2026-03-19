import { clsx } from 'clsx';

export function PageHeader({
  title,
  description,
  actions,
  className,
  breadcrumbs,
}) {
  return (
    <div className={clsx('mb-8', className)}>
      {breadcrumbs && (
        <nav className="mb-3">
          <ol className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                {index > 0 && (
                  <span className="text-gray-400">/</span>
                )}
                {item.href ? (
                  <a
                    href={item.href}
                    className="text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="text-gray-600">
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-gray-600 max-w-2xl">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
