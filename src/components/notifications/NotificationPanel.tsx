import { useEffect, useMemo, useRef } from 'react';
import { useNotificationStore, NOTIFICATION_PAGE_SIZE } from '../../store/notificationStore';
import { Button } from '../ui/Button';

interface NotificationPanelProps {
  onClose: () => void;
}

const typeIcons: Record<string, string> = {
  task: '✓',
  review: '👁',
  system: '🔔',
};

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const currentPage = useNotificationStore((s) => s.currentPage);
  const setPage = useNotificationStore((s) => s.setPage);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const sorted = useMemo(
    () => [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notifications],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / NOTIFICATION_PAGE_SIZE));
  const pageItems = sorted.slice(
    (currentPage - 1) * NOTIFICATION_PAGE_SIZE,
    currentPage * NOTIFICATION_PAGE_SIZE,
  );

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-full z-50 mt-2 w-80 max-h-[70vh] overflow-y-auto
        rounded-lg border border-gray-200 bg-white shadow-xl
        dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
        <button
          onClick={markAllAsRead}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Mark all as read
        </button>
      </div>

      {pageItems.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-400 dark:text-gray-500">No notifications.</p>
      ) : (
        <ul>
          {pageItems.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => markAsRead(n.id)}
                className={`flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left hover:bg-gray-50
                  dark:border-gray-700 dark:hover:bg-gray-700
                  ${!n.read ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''}`}
              >
                <span aria-hidden="true" className="mt-0.5 text-base">
                  {typeIcons[n.type] ?? '🔔'}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">{n.title}</span>
                  <span className="mt-0.5 block text-xs text-gray-500 line-clamp-2 dark:text-gray-400">
                    {n.message}
                  </span>
                </span>
                {!n.read && (
                  <span
                    aria-label="Unread"
                    className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500"
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
