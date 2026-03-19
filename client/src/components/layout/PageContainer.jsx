/**
 * PageContainer - Consistent page wrapper following the design system
 * Used for all internal pages to maintain consistent styling
 */

export function PageContainer({ children, className = '' }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Outfit:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Playfair Display', Georgia, serif; }
        .font-body { font-family: 'Outfit', sans-serif; }
      `}</style>
      <div className={`font-body min-h-screen bg-[#faf9f7] ${className}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-8 sm:py-12">
          {children}
        </div>
      </div>
    </>
  );
}

export function PageHeader({ 
  title, 
  subtitle, 
  actions,
  backLink,
  backLabel = 'Back'
}) {
  return (
    <div className="mb-10 sm:mb-12">
      {backLink && (
        <a 
          href={backLink}
          className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-600 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </a>
      )}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-stone-500 text-base sm:text-lg max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export function PageSection({ 
  title, 
  subtitle,
  action,
  children,
  className = '' 
}) {
  return (
    <section className={`mb-10 sm:mb-14 ${className}`}>
      {(title || action) && (
        <div className="flex items-end justify-between mb-6">
          <div>
            {title && (
              <h2 className="font-display text-xl sm:text-2xl font-bold text-stone-900">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-stone-400">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function SectionCard({ children, className = '', padding = 'md' }) {
  const paddingClasses = {
    none: '',
    sm: 'p-4 sm:p-5',
    md: 'p-5 sm:p-6 lg:p-8',
    lg: 'p-6 sm:p-8 lg:p-10'
  };

  return (
    <div className={`bg-white rounded-2xl border border-stone-200/60 shadow-sm ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, sublabel, icon: Icon, trend }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/60 p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] sm:text-xs font-semibold tracking-[0.15em] text-stone-400 uppercase mb-2">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-stone-900">{value}</p>
          {sublabel && (
            <p className={`text-xs sm:text-sm mt-1 ${
              trend === 'up' ? 'text-emerald-600' : 
              trend === 'down' ? 'text-rose-500' : 
              'text-stone-400'
            }`}>
              {sublabel}
            </p>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 sm:p-3 rounded-xl bg-stone-50">
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-stone-400" />
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}) {
  return (
    <div className="text-center py-12 sm:py-16">
      {Icon && (
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-stone-100 mb-4">
          <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-stone-400" />
        </div>
      )}
      <h3 className="font-display text-lg sm:text-xl font-semibold text-stone-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm sm:text-base text-stone-400 max-w-sm mx-auto mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}
