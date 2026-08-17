import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { SessionConfig } from './pages/SessionConfig';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { ChatConsole } from './pages/ChatConsole';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { ReplayTimeline } from './pages/ReplayTimeline';
import { Landing } from './pages/Landing';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  useEffect(() => {
    const root = window.document.documentElement;
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Landing page */}
            <Route path="/" element={<Landing />} />

            {/* Guest/Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Private Dashboard routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/sessions/new" element={<SessionConfig />} />
              <Route path="/sessions/:sessionId/chat" element={<ChatConsole />} />
              <Route path="/sessions/:sessionId/replay" element={<ReplayTimeline />} />
              <Route path="/knowledge-base" element={<KnowledgeBase />} />
              <Route path="/manager" element={<ManagerDashboard />} />
              <Route path="*" element={<Dashboard />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
