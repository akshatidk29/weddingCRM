import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import useToastStore from '../../stores/toastStore';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'bg-white border-stone-200/60 text-stone-900',
  error: 'bg-white border-rose-200/60 text-stone-900',
  warning: 'bg-white border-amber-200/60 text-stone-900',
  info: 'bg-white border-stone-200/60 text-stone-900',
};

const iconStyles = {
  success: 'text-stone-600',
  error: 'text-rose-500',
  warning: 'text-amber-500',
  info: 'text-sky-500',
};

function Toast({ toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const Icon = icons[toast.type] || Info;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl shadow-sm border min-w-[320px] max-w-[450px] font-body bg-white backdrop-blur-md bg-opacity-95 ${styles[toast.type]} transform transition-all duration-300 translate-y-0 opacity-100`}
      role="alert"
    >
      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${iconStyles[toast.type]}`} />
      <p className="flex-1 text-[13px] font-medium leading-relaxed tracking-wide text-stone-700">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="flex-shrink-0 p-1 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto mx-auto animate-fade-in-down">
          <Toast toast={toast} />
        </div>
      ))}
    </div>
  );
}
