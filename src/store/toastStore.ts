import { create } from 'zustand';
import type { ToastData, ToastVariant } from '../components/ui/Toast';

interface ToastState {
  toasts: ToastData[];
  addToast: (message: string, variant: ToastVariant, duration?: number) => string;
  removeToast: (id: string) => void;
}

let idCounter = 0;
const generateId = () => `toast-${Date.now()}-${idCounter++}`;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (message, variant, duration) => {
    const id = generateId();
    set((state) => ({ toasts: [...state.toasts, { id, message, variant, duration }] }));
    return id;
  },

  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
