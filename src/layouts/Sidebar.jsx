import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdDashboard, MdInventory, MdPointOfSale, MdHistory,
  MdMoneyOff, MdAssessment, MdSettings, MdLogout, MdKeyboardReturn, MdPerson, MdReceipt,
  MdChevronLeft, MdChevronRight, MdMenu
} from 'react-icons/md';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: MdDashboard },
  { to: '/inventory', label: 'Inventory', icon: MdInventory },
  { to: '/pos', label: 'POS / Billing', icon: MdPointOfSale },
  { to: '/sales', label: 'Sales History', icon: MdHistory },
  { to: '/suppliers', label: 'Suppliers', icon: MdPerson },
  { to: '/customers', label: 'Customers', icon: MdPerson },
  { to: '/expenses', label: 'Expenses', icon: MdMoneyOff },
  { to: '/returns', label: 'Returns', icon: MdKeyboardReturn },
  { to: '/reports', label: 'Reports', icon: MdAssessment },
  { to: '/quick-bill', label: 'Quick Bill', icon: MdReceipt },
  { to: '/settings', label: 'Settings', icon: MdSettings },
];

export default function Sidebar({ isOpen, onClose, isCollapsed, onCollapseToggle }) {
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

      <aside className={`fixed top-0 left-0 h-full bg-slate-900 dark:bg-[#0B0F19] border-r border-slate-800 z-50 flex flex-col transition-all duration-300 lg:translate-x-0 lg:static lg:z-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${isCollapsed ? 'w-20' : 'w-64'}`}>
        
        {/* Logo & Toggle */}
        <div className={`flex items-center justify-between border-b border-slate-700/50 py-5 ${isCollapsed ? 'px-5' : 'px-6'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">
              A
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in whitespace-nowrap">
                <p className="text-white font-bold text-base leading-none">AB Traders</p>
                <p className="text-slate-400 text-xs mt-0.5">Business Suite</p>
              </div>
            )}
          </div>
          
          {/* Desktop Collapse Toggle */}
          <button 
            onClick={onCollapseToggle}
            className="hidden lg:flex w-6 h-6 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            {isCollapsed ? <MdChevronRight size={18} /> : <MdChevronLeft size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              title={isCollapsed ? label : ''}
              className={({ isActive }) => `sidebar-link relative group ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon size={22} className="shrink-0" />
              {!isCollapsed && <span className="animate-fade-in whitespace-nowrap">{label}</span>}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="fixed left-20 ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div className={`border-t border-slate-700/50 pt-4 pb-4 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          <div className={`flex items-center gap-3 mb-2 overflow-hidden ${isCollapsed ? 'justify-center px-0' : 'px-3 py-2'}`}>
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-white text-sm font-medium truncate">{user?.name || 'Admin'}</p>
                <p className="text-slate-400 text-xs truncate">{user?.email || ''}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title={isCollapsed ? 'Logout' : ''}
            className={`sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 ${isCollapsed ? 'justify-center px-0' : ''}`}
          >
            <MdLogout size={22} className="shrink-0" />
            {!isCollapsed && <span className="animate-fade-in">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
