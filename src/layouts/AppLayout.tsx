import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useLogout } from '../features/auth/useAuth';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useThemeStore } from '../store/themeStore';
import { useNotificationPolling } from '../hooks/useNotificationPolling';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { NotificationBell } from '../components/notifications/NotificationBell';
import { NotificationPanel } from '../components/notifications/NotificationPanel';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/board', label: 'Board' },
  { to: '/analytics', label: 'Analytics' },
];

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const navigate = useNavigate();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const setPanelOpenInStore = useNotificationStore((s) => s.setPanelOpen);
  const theme = useThemeStore((s) => s.theme);

  // Ensure <html class="dark"> matches the persisted theme as soon as the
  // authenticated shell mounts (covers the case where zustand/persist
  // rehydrates after first paint).
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useNotificationPolling();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const togglePanel = () => {
    const next = !isPanelOpen;
    setIsPanelOpen(next);
    setPanelOpenInStore(next);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setPanelOpenInStore(false);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 dark:bg-gray-900">
      <header className="border-b bg-white dark:border-gray-700 dark:bg-gray-800">
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3"
          aria-label="Main navigation"
        >
          <span className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
            SprintDesk
          </span>

          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <div className="relative">
              <NotificationBell onClick={togglePanel} />
              {isPanelOpen && <NotificationPanel onClose={closePanel} />}
            </div>

            {user && (
              <img
                src={user.image}
                alt={`${user.firstName} ${user.lastName}`}
                className="h-8 w-8 rounded-full"
              />
            )}
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
