import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppNotification } from '../types/notification';
import { notificationService } from '../api/notificationService';

interface NotificationState {
  notifications: AppNotification[];
  isPanelOpen: boolean;
  isHydrated: boolean;
  currentPage: number;

  hydrateInitial: () => void;
  addFromPosts: (posts: { id: number; title: string; body: string }[]) => AppNotification[]; // returns newly-added ones
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setPanelOpen: (open: boolean) => void;
  setPage: (page: number) => void;
}

const PAGE_SIZE = 20;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      isPanelOpen: false,
      isHydrated: false,
      currentPage: 1,

      hydrateInitial: () => {
        if (get().isHydrated) return; // don't overwrite persisted read/unread state on reload
        set({ notifications: notificationService.getInitialNotifications(), isHydrated: true });
      },

      addFromPosts: (posts) => {
        const existingIds = new Set(get().notifications.map((n) => n.id));
        const fresh: AppNotification[] = posts
          .filter((p) => !existingIds.has(`post-${p.id}`))
          .map((p) => ({
            id: `post-${p.id}`,
            title: 'New activity',
            message: p.title,
            type: 'system',
            read: false,
            createdAt: new Date().toISOString(),
          }));

        if (fresh.length > 0) {
          set((state) => ({ notifications: [...fresh, ...state.notifications] }));
        }
        return fresh;
      },

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      setPanelOpen: (open) => set({ isPanelOpen: open }),
      setPage: (page) => set({ currentPage: page }),
    }),
    {
      name: 'sprintdesk_notifications',
      partialize: (state) => ({
        notifications: state.notifications,
        isHydrated: state.isHydrated,
      }),
    },
  ),
);

export const NOTIFICATION_PAGE_SIZE = PAGE_SIZE;
