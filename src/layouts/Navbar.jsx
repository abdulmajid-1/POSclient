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
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-4 gap-4 sticky top-0 z-30 shadow-sm">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
      >
        <MdMenu size={22} />
      </button>

      {/* Date */}
      <div className="hidden sm:block flex-1">
        <p className="text-sm text-slate-500">{today}</p>
      </div>
      <div className="flex-1 sm:hidden" />

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? <MdLightMode size={20} /> : <MdDarkMode size={20} />}
        </button>

        {/* Notifications (placeholder) */}
        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors relative">
          <MdNotifications size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2 ml-1 pl-3 border-l border-slate-100">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {user?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-800 leading-none">{user?.name || 'Admin'}</p>
            <p className="text-xs text-slate-400 mt-0.5 capitalize">{user?.role || 'Admin'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
