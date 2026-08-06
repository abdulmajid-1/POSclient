import { MdMenu, MdNotifications, MdLightMode, MdDarkMode } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ onMenuToggle }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const today = new Date().toLocaleDateString('en-SA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 flex items-center px-4 gap-4 sticky top-0 z-30 shadow-sm transition-colors duration-200">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
      >
        <MdMenu size={22} />
      </button>

      {/* Date */}
      <div className="hidden sm:block flex-1">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{today}</p>
      </div>
      <div className="flex-1 sm:hidden" />

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        {/* <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700 transition-all duration-200 shadow-sm"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
        </button> */}

        {/* Notifications (placeholder) */}
        <button className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all duration-200 relative">
          <MdNotifications size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2.5 ml-1 pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-none">{user?.name || 'Admin'}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 capitalize">{user?.role || 'Admin'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
