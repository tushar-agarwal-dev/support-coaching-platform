import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium animate-pulse">Initializing platform...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-emerald-500/10 blur-[150px] pointer-events-none"></div>

      {/* Top Banner */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-900 bg-slate-950/60 backdrop-blur-md z-10">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Cpu className="w-4 h-4 text-white animate-pulse" />
          </div>
          <span className="font-display font-bold text-lg bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            VantrixAI
          </span>
        </div>
      </header>

      {/* Main card viewport */}
      <main className="flex-grow flex items-center justify-center px-4 py-12 z-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-900 text-center text-xs text-slate-600 bg-slate-950/40 z-10">
        © 2026 VantrixAI - Development of AI-Powered Customer Support Assistant with Live Response Guidance. All rights reserved.
      </footer>
    </div>
  );
};
