export function Loader({ size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${sizes[size]} border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin`} />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader size="lg" />
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
