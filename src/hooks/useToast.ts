import { useToastStore } from '../store/toastStore';
import type { ToastVariant } from '../components/ui/Toast';

// Public API: components call `toast.success('Task added')` etc.
// Kept as a thin hook over the Zustand store so this file (not the store
// directly) is what's unit tested per the assignment's Task 06 requirement.
export function useToast() {
  const addToast = useToastStore((s) => s.addToast);
  const removeToast = useToastStore((s) => s.removeToast);

  return {
    toast: {
      success: (message: string, duration?: number) => addToast(message, 'success', duration),
      error: (message: string, duration?: number) => addToast(message, 'error', duration),
      info: (message: string, duration?: number) => addToast(message, 'info', duration),
      custom: (message: string, variant: ToastVariant, duration?: number) =>
        addToast(message, variant, duration),
    },
    dismiss: removeToast,
  };
}
