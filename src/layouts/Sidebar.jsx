import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdDashboard, MdInventory, MdPointOfSale, MdHistory,
  MdMoneyOff, MdAssessment, MdSettings, MdLogout, MdKeyboardReturn, MdPerson
} from 'react-icons/md';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: MdDashboard },
  { to: '/inventory', label: 'Inventory', icon: MdInventory },
  { to: '/pos', label: 'POS / Billing', icon: MdPointOfSale },
  { to: '/sales', label: 'Sales History', icon: MdHistory },
  { to: '/suppliers', label: 'Suppliers', icon: MdPerson },
  { to: '/expenses', label: 'Expenses', icon: MdMoneyOff },
  { to: '/returns', label: 'Returns', icon: MdKeyboardReturn },
  { to: '/reports', label: 'Reports', icon: MdAssessment },
  { to: '/settings', label: 'Settings', icon: MdSettings },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-slate-900 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/50">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
            A
          </div>
          <div>
            <p className="text-white font-bold text-base leading-none">AB Traders</p>
            <p className="text-slate-400 text-xs mt-0.5">Business Suite</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="px-3 pb-4 border-t border-slate-700/50 pt-4">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name || 'Admin'}</p>
              <p className="text-slate-400 text-xs truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <MdLogout size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
