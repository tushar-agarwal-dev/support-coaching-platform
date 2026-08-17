import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  PlusCircle, 
  LogOut, 
  User, 
  Mic, 
  Menu, 
  X,
  Sun,
  Moon
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mainContentRef = React.useRef<HTMLDivElement>(null);
  
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  React.useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'New Session', path: '/sessions/new', icon: PlusCircle },
    { name: 'Knowledge Base', path: '/knowledge-base', icon: BookOpen },
  ];
  if (user?.role === 'manager' || user?.role === 'admin') {
    navItems.push({ name: 'Manager Portal', path: '/manager', icon: User });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentPathName = navItems.find(item => item.path === location.pathname)?.name || 'Dashboard';

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[50%] rounded-full bg-emerald-600/5 blur-[120px] pointer-events-none"></div>

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-900 bg-slate-950/80 backdrop-blur-md z-20 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-900">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              VantrixAI
            </span>
          </Link>
        </div>

        {/* User Badge */}
        <div className="p-4 mx-4 my-6 bg-slate-900/40 border border-slate-800/60 rounded-xl flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700/50">
            <User className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-400 capitalize flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {user?.role}
            </p>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500 font-semibold'
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-900">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors group"
          >
            <LogOut className="w-4 h-4 mr-3 text-rose-400 group-hover:text-rose-300" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-slate-900 bg-slate-950/90 backdrop-blur-md flex items-center justify-between px-6 z-30">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-white">VantrixAI</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-950/95 backdrop-blur-lg z-25 flex flex-col pt-20 px-6">
          <nav className="space-y-2 flex-grow">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-4 rounded-xl text-base font-semibold ${
                    isActive ? 'bg-indigo-600/15 text-indigo-400 border-l-4 border-indigo-500' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="py-6 border-t border-slate-900">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-4 rounded-xl text-base font-semibold text-rose-400 hover:bg-rose-500/10"
            >
              <LogOut className="w-5 h-5 mr-4" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div ref={mainContentRef} className="flex-1 flex flex-col min-w-0 overflow-y-auto pt-16 md:pt-0">
        {/* Top Navbar */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 border-b border-slate-900/60 bg-slate-950/20 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-slate-400 capitalize">Home</span>
            <span className="text-slate-600 text-sm">/</span>
            <span className="text-sm font-semibold text-white">{currentPathName}</span>
          </div>
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:text-white hover:border-slate-700 transition-all text-slate-400"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* System Health */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-900 border border-slate-800/60 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-semibold text-slate-300 tracking-wide">SYSTEM: ONLINE</span>
            </div>
          </div>
        </header>

        {/* Page Content Portal */}
        <main className="flex-1 p-6 md:p-8 z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
