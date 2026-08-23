import { useThemeStore } from '../../store/themeStore';

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500
        dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
    >
      {theme === 'light' ? (
        // Moon icon (click to go dark)
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
          <path d="M21.64 13a1 1 0 00-1.05-.14 8.05 8.05 0 01-3.37.73 8.15 8.15 0 01-8.14-8.14 8.05 8.05 0 01.73-3.37A1 1 0 008.75.2a10.16 10.16 0 1012.9 12.9 1 1 0 00-.01-.1z" />
        </svg>
      ) : (
        // Sun icon (click to go light)
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
          <path d="M12 4a1 1 0 01-1-1V1a1 1 0 012 0v2a1 1 0 01-1 1zm0 16a1 1 0 011 1v2a1 1 0 01-2 0v-2a1 1 0 011-1zm10-8a1 1 0 01-1 1h-2a1 1 0 010-2h2a1 1 0 011 1zM5 12a1 1 0 01-1 1H2a1 1 0 010-2h2a1 1 0 011 1zm14.07-7.07a1 1 0 010 1.41L17.66 7.76a1 1 0 11-1.41-1.41l1.41-1.42a1 1 0 011.41 0zM7.76 16.24a1 1 0 010 1.41l-1.41 1.42a1 1 0 11-1.42-1.42l1.42-1.41a1 1 0 011.41 0zm11.31 2.83a1 1 0 01-1.41 0l-1.41-1.42a1 1 0 111.41-1.41l1.41 1.41a1 1 0 010 1.42zM6.34 6.34a1 1 0 01-1.41 0L3.51 4.93A1 1 0 114.93 3.5l1.41 1.42a1 1 0 010 1.41zM12 6a6 6 0 100 12 6 6 0 000-12z" />
        </svg>
      )}
    </button>
  );
}
