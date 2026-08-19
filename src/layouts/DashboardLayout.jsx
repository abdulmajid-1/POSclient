import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MonthlyAlert from '../components/MonthlyAlert';

export default function DashboardLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userCollapsed, setUserCollapsed] = useState(false);
  const location = useLocation();
  const isPosPage = location.pathname === '/pos';

  // Auto-collapse sidebar on POS page; restore user preference when leaving
  useEffect(() => {
    if (isPosPage) {
      setCollapsed(true);
    } else {
      setCollapsed(userCollapsed);
    }
  }, [isPosPage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading AB Traders...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      <MonthlyAlert />
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isCollapsed={collapsed}
        onCollapseToggle={() => {
          const next = !collapsed;
          setCollapsed(next);
          if (!isPosPage) setUserCollapsed(next);
        }}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar 
          onMenuToggle={() => setSidebarOpen((prev) => !prev)} 
          isCollapsed={collapsed}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
