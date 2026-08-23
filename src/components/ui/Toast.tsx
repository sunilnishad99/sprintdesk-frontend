import { useEffect } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastProps extends ToastData {
  onDismiss: (id: string) => void;
}

const variantClasses: Record<ToastVariant, string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const variantIcons: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

export function Toast({ id, message, variant, duration = 4000, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 rounded-md border px-4 py-3 shadow-md
        animate-[fadeIn_0.2s_ease-out] ${variantClasses[variant]}`}
    >
      <span aria-hidden="true" className="text-sm font-bold">
        {variantIcons[variant]}
      </span>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
        className="text-sm opacity-60 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
