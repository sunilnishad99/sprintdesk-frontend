import { createPortal } from 'react-dom';
import { useToastStore } from '../../store/toastStore';
import { Toast } from './Toast';

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return createPortal(
    <div
      className="pointer-events-none fixed top-4 right-4 z-[100] flex w-80 flex-col gap-2"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} onDismiss={removeToast} />
        </div>
      ))}
    </div>,
    document.body,
  );
}
