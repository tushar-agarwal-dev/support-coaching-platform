import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import sharpHd3dCore from '../assets/sharp_hd_3d_core.jpg';
import { 
  Sparkles, 
  ArrowRight, 
  Github, 
  Linkedin, 
  Mail, 
  User, 
  Cpu,
  ShieldCheck,
  Activity,
  TrendingUp,
  Database,
  Layers,
  ChevronRight
} from 'lucide-react';

export const Landing: React.FC = () => {
  const { isAuthenticated, guestLogin } = useAuth();
  const navigate = useNavigate();
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleTryDemo = async () => {
    setIsDemoLoading(true);
    try {
      await guestLogin();
      navigate('/dashboard');
    } catch (err) {
      console.error("Demo registration failed:", err);
      alert("Failed to start Demo mode. Please check if your backend server is active.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-x-hidden">
      {/* Background Gradients & Glow Meshes */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[70%] rounded-full bg-indigo-600/10 blur-[130px] pointer-events-none animate-pulse-glow"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[60%] rounded-full bg-emerald-600/5 blur-[140px] pointer-events-none"></div>
      <div className="absolute top-[30%] left-[20%] w-[40%] h-[50%] rounded-full bg-purple-600/5 blur-[160px] pointer-events-none"></div>

      {/* Floating Header */}
      <header className="sticky top-4 z-30 mx-auto max-w-6xl w-[calc(100%-2rem)] flex items-center justify-between px-6 py-3 border border-white/5 bg-slate-950/70 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-950/60 transition-all duration-300">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Cpu className="w-4 h-4 text-white animate-pulse" />
          </div>
          <span className="font-display font-bold text-lg bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            VantrixAI
          </span>
        </div>
        
        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors duration-200 font-medium">Features</a>
          <a href="#workflow" className="text-sm text-slate-400 hover:text-white transition-colors duration-200 font-medium">Workflow</a>
          <a href="#creator" className="text-sm text-slate-400 hover:text-white transition-colors duration-200 font-medium">Developer</a>
        </nav>

        {/* Auth Trigger */}
        <div>
          {isAuthenticated ? (
            <Link 
              to="/dashboard" 
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-indigo-600/20"
            >
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center space-x-5">
              <Link 
                to="/login" 
                className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
              >
                Log In
              </Link>
              <button 
                onClick={handleTryDemo}
                disabled={isDemoLoading}
                className="px-5 py-2 bg-white hover:bg-slate-100 text-slate-950 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-white/5"
              >
                {isDemoLoading ? 'Loading...' : 'Try Demo'}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Sections */}
      <main className="flex-grow z-10">
        
        {/* SECTION 1: SCROLL-STOPPING 3D HERO SECTION */}
        <section id="intro" className="min-h-[calc(100vh-6rem)] flex items-center max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center w-full">
            
            {/* Left Column: Headline and Actions */}
            <div className="lg:col-span-7 text-left space-y-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Next-Gen Multi-Agent Systems
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight leading-[1.1] text-white">
                Empower Support Teams with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400">
                  Live AI Coaching
                </span>
              </h1>
              
              <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl">
                Deliver instant context verification, semantic search checks, tone alignment suggestions, and escalation risk warnings powered by graph-based LLM architectures.
              </p>
              
              {/* Interactive buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleTryDemo}
                  disabled={isDemoLoading}
                  className="flex items-center space-x-2 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all duration-300 shadow-xl shadow-indigo-600/30 transform hover:-translate-y-0.5"
                >
                  <span>{isDemoLoading ? 'Launching Session...' : 'Launch Live Demo'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <Link
                  to="/login"
                  className="glass-btn flex items-center space-x-2 px-7 py-3.5 text-white rounded-xl font-semibold transition-all"
                >
                  <span>Agent Login</span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
              </div>

              {/* Glassmorphic Stats Row */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/5 max-w-md">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-white font-display">150ms</div>
                  <div className="text-xs text-slate-500">Processing Latency</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-emerald-400 font-display">99.8%</div>
                  <div className="text-xs text-slate-500">Compliance Rate</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-indigo-400 font-display">0%</div>
                  <div className="text-xs text-slate-500">Hallucinations</div>
                </div>
              </div>
            </div>

            {/* Right Column: Glossy 3D Object Render */}
            <div className="lg:col-span-5 relative flex items-center justify-center h-[450px]">
              
              {/* Radial Glowing Sphere behind the 3D core */}
              <div className="absolute w-[350px] h-[350px] bg-gradient-to-tr from-indigo-500/20 via-purple-600/10 to-transparent blur-[120px] rounded-full animate-pulse-glow pointer-events-none"></div>
              
              {/* Outer Orbit Rings */}
              <div className="absolute w-[380px] h-[380px] border border-dashed border-indigo-500/10 rounded-full animate-orbit-ring pointer-events-none"></div>
              <div className="absolute w-[280px] h-[280px] border border-indigo-500/5 rounded-full animate-orbit-ring pointer-events-none" style={{ animationDirection: 'reverse', animationDuration: '20s' }}></div>
              
              {/* 3D Glossy Core Wrapper */}
              <div className="relative animate-float-3d w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center select-none">
                
                {/* Decorative border elements */}
                <div className="absolute inset-0 rounded-full border border-white/20 shadow-2xl z-0" style={{ backgroundColor: 'rgba(3, 7, 18, 0.4)' }}></div>
                
                {/* Glossy 3D Object Rendered via generate_image */}
                <img 
                  src={sharpHd3dCore} 
                  alt="Vantrix AI Core" 
                  className="w-[94%] h-[94%] object-cover rounded-full shadow-2xl border border-white/10 relative z-10"
                />
                
                {/* Floating telemetry metrics badge 1 */}
                <div className="absolute -top-3 -right-4 bg-slate-900/90 border border-emerald-500/30 px-3 py-1.5 rounded-xl shadow-lg flex items-center space-x-1.5 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono">Compliance: 100%</span>
                </div>

                {/* Floating telemetry metrics badge 2 */}
                <div className="absolute -bottom-4 -left-4 bg-slate-900/90 border border-indigo-500/30 px-3 py-1.5 rounded-xl shadow-lg flex items-center space-x-1.5 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase font-mono">Risk: 4.8% (Low)</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 2: PREMIUM FEATURES GRID */}
        <section id="features" className="py-24 border-t border-white/5 bg-slate-950/20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Advanced Features</span>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white">
                Everything you need to guide and audit operations
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                VantrixAI hooks directly into live support feeds to run context retrievals, compliance assessments, and post-interaction analytics.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Feature 1 */}
              <div className="bg-card text-card-foreground border border-border p-8 rounded-2xl space-y-5 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Live Conversation Coaching</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Generates tone-specific coaching choices (Empathetic, Professional, Concise) alongside policy verification checks.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-card text-card-foreground border border-border p-8 rounded-2xl space-y-5 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Database className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Vector RAG Recommendation</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Integrates with ChromaDB vector databases to fetch precise manual guidelines based on user queries, flagging compliance.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-card text-card-foreground border border-border p-8 rounded-2xl space-y-5 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Customer Simulator Rooms</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Train agents inside simulator environments configured with custom emotions, products, industries, and threat levels.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-card text-card-foreground border border-border p-8 rounded-2xl space-y-5 hover:border-rose-500/40 hover:shadow-xl hover:shadow-rose-500/5 hover:-translate-y-1 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-rose-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Real-Time Risk Detection</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Monitors conversation progression to calculate escalation risk probabilities, warning managers of legal or churn threats.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-card text-card-foreground border border-border p-8 rounded-2xl space-y-5 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Manager Audit Center</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Review agent compliance performance ratios, average call latency logs, active alerts, and auto FAQ draft publines.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-card text-card-foreground border border-border p-8 rounded-2xl space-y-5 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Multi-Agent Orchestration</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Runs turn-based LangGraph flows distributing states between Intent, Sentiment, Risk, Retrieval, Critique, and QA summary nodes.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION 3: WORKFLOW */}
        <section id="workflow" className="py-24 border-t border-white/5 bg-slate-950/40">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">LangGraph Architecture</span>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-white">
                How VantrixAI Orchestrates Decisions
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                Each incoming text message triggers an asynchronous graph iteration across dedicated model modules.
              </p>
            </div>
            
            <div className="relative border border-border bg-card text-card-foreground p-8 sm:p-10 rounded-2xl max-w-4xl mx-auto overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-3xl pointer-events-none"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 text-left">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">1</div>
                    <span className="text-xs bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full font-bold uppercase">Input Stage</span>
                  </div>
                  <h4 className="text-base font-bold text-white">Intent & Sentiment</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Parallel nodes analyze incoming dialogues to capture intention targets (Billing, Refunds, Tech Support) and frustration levels (0.0 - 10.0) in real time.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">2</div>
                    <span className="text-xs bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold uppercase">Context Stage</span>
                  </div>
                  <h4 className="text-base font-bold text-white">RAG Fetch & Risk Score</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Embeds queries to extract matched policy guidelines from ChromaDB while checking escalation risk warnings (Legal threats, customer churn).
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">3</div>
                    <span className="text-xs bg-purple-600/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full font-bold uppercase">Critique Stage</span>
                  </div>
                  <h4 className="text-base font-bold text-white">Coaching, Critique & Guard</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Formats responses using Llama-3, reviews suggestions with self-critique parameters, and blocks hallucinated variables before presentation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: DEVELOPER PROFILE */}
        <section id="creator" className="pt-24 pb-0 border-t border-white/5 bg-slate-950/20">
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-card text-card-foreground border border-border p-8 sm:p-12 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8 md:gap-12 backdrop-blur-md">
              <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/5 blur-3xl pointer-events-none animate-pulse-glow"></div>
              
              {/* Profile Avatar Frame */}
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shrink-0 shadow-lg">
                <User className="w-14 h-14 text-indigo-300" />
              </div>
              
              {/* Profile Info */}
              <div className="text-left space-y-4 relative z-10">
                <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Creator & Developer</span>
                <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-white">Tushar Agarwal</h3>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                  B.Tech Computer Science & Engineering, Class of 2028, JECRC University, Jaipur. Experienced in developing real-time multi-agent systems, semantic RAG vector retrieval pipelines, and premium React portals.
                </p>
                
                <div className="flex space-x-5 pt-2">
                  <a 
                    href="https://github.com/tusharagarwal-dev" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-colors duration-200"
                  >
                    <Github className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>
                  <a 
                    href="https://linkedin.com/in/tushar-agarwal-dev" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-colors duration-200"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span>LinkedIn</span>
                  </a>
                  <a 
                    href="mailto:tusharagarwal.dev@gmail.com" 
                    className="flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-colors duration-200"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="pt-8 pb-2 border-t border-white/5 bg-slate-950 text-center text-xs text-slate-500">
        <p>© 2026 VantrixAI - Development of AI-Powered Customer Support Assistant with Live Response Guidance. All rights reserved.</p>
      </footer>
    </div>
  );
};
