import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  Check, 
  X, 
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import api from '../services/api';

export const ManagerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'operations' | 'agents' | 'gaps' | 'scenarios'>('operations');
  const [loading, setLoading] = useState(true);

  // Operations metrics
  const [analytics, setAnalytics] = useState<any>({
    total_sessions: 0,
    avg_resolution_time: 0,
    avg_satisfaction: 0.0,
    escalation_rate: 0.0,
    policy_violations_count: 0,
    hallucination_attempts: 0,
    avg_rag_accuracy: 0.0,
    avg_agent_performance: 0.0,
    avg_empathy: 0.0,
    avg_professionalism: 0.0,
    avg_response_quality: 0.0
  });

  // Lists
  const [sessions, setSessions] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [trends, setTrends] = useState<any>({
    trend_points: [],
    escalation_triggers: [],
    agent_progressions: []
  });

  // Scenario Builder Form state
  const [newScenario, setNewScenario] = useState({
    name: '',
    industry: '',
    product: '',
    issue_type: '',
    difficulty: 'medium',
    customer_persona: '',
    customer_mood: '',
    goal: ''
  });

  // Action loaders
  const [faqLoading, setFaqLoading] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      const [analRes, sessRes, gapsRes, faqsRes, scenRes, monitorRes, alertsRes, trendsRes] = await Promise.all([
        api.get('/api/manager/analytics'),
        api.get('/api/sessions/'),
        api.get('/api/manager/gaps'),
        api.get('/api/manager/faqs'),
        api.get('/api/scenarios/'),
        api.get('/api/manager/monitoring'),
        api.get('/api/manager/alerts'),
        api.get('/api/manager/trends')
      ]);

      setAnalytics(analRes.data);
      setSessions(sessRes.data);
      setGaps(gapsRes.data);
      setFaqs(faqsRes.data);
      setScenarios(scenRes.data);
      setAgentLogs(monitorRes.data);
      setAlerts(alertsRes.data);
      setTrends(trendsRes.data);
    } catch (err) {
      console.error("Failed to load manager dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/scenarios/', newScenario);
      setNewScenario({
        name: '',
        industry: '',
        product: '',
        issue_type: '',
        difficulty: 'medium',
        customer_persona: '',
        customer_mood: '',
        goal: ''
      });
      loadData();
    } catch (err) {
      console.error("Failed to save scenario template:", err);
    }
  };

  const handleGenerateFAQ = async (gapId: string) => {
    try {
      setFaqLoading(prev => ({ ...prev, [gapId]: true }));
      await api.post(`/api/manager/gaps/${gapId}/faq`);
      loadData();
    } catch (err) {
      console.error("Failed to generate FAQ suggestion:", err);
    } finally {
      setFaqLoading(prev => ({ ...prev, [gapId]: false }));
    }
  };

  const handleApproveFAQ = async (faqId: string) => {
    try {
      await api.post(`/api/manager/faqs/${faqId}/approve`);
      loadData();
    } catch (err) {
      console.error("Failed to publish FAQ:", err);
    }
  };

  const handleRejectFAQ = async (faqId: string) => {
    try {
      await api.post(`/api/manager/faqs/${faqId}/reject`);
      loadData();
    } catch (err) {
      console.error("Failed to reject FAQ draft:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 text-xs animate-pulse">Loading operations analytics dashboard...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-900 pb-5">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Operations Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Review QA audits, pipeline latencies, scenario builds, and knowledge gap closures.</p>
        </div>
        
        <button
          onClick={loadData}
          className="mt-4 md:mt-0 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-800 transition-all flex items-center gap-1.5"
        >
          <Activity className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* Operations Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="glass border border-slate-900/60 p-4 rounded-xl flex items-center space-x-4">
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Performance Score</span>
            <span className="text-2xl font-bold font-display text-white">{analytics.avg_agent_performance}%</span>
          </div>
        </div>

        <div className="glass border border-slate-900/60 p-4 rounded-xl flex items-center space-x-4">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Compliance Rate</span>
            <span className="text-2xl font-bold font-display text-white">
              {analytics.total_sessions > 0 
                ? (100 - (analytics.policy_violations_count / analytics.total_sessions) * 100).toFixed(0) 
                : 100}%
            </span>
          </div>
        </div>

        <div className="glass border border-slate-900/60 p-4 rounded-xl flex items-center space-x-4">
          <div className="w-10 h-10 bg-rose-500/10 text-rose-400 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Escalation Rate</span>
            <span className="text-2xl font-bold font-display text-white">{analytics.escalation_rate}%</span>
          </div>
        </div>

        <div className="glass border border-slate-900/60 p-4 rounded-xl flex items-center space-x-4">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block uppercase">Customer Satisfaction</span>
            <span className="text-2xl font-bold font-display text-white">{analytics.avg_satisfaction} / 10</span>
          </div>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900/60 w-fit">
        {['operations', 'agents', 'gaps', 'scenarios'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === tab
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="min-h-[400px]">
        
        {/* PANEL 1: OPERATIONS & ANALYTICS */}
        {activeTab === 'operations' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* SVG Charts Column (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* QA Performance Trendlines */}
              <div className="glass border border-slate-900 p-5 rounded-2xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Weekly QA Performance Trends</h3>
                  <div className="flex space-x-3 text-[9px] font-bold uppercase">
                    <span className="flex items-center gap-1 text-indigo-400">
                      <span className="w-2 h-0.5 bg-indigo-500"></span> Satisfaction Score
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-2 h-0.5 bg-emerald-500"></span> Compliance Rate
                    </span>
                  </div>
                </div>
                
                <div className="relative h-48 w-full">
                  <svg className="w-full h-full" viewBox="0 0 500 150">
                    {/* Grid Lines */}
                    <line x1="40" y1="30" x2="480" y2="30" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="40" y1="80" x2="480" y2="80" stroke="#1e293b" strokeDasharray="3 3" />
                    <line x1="40" y1="130" x2="480" y2="130" stroke="#1e293b" strokeWidth="1.5" />

                    {/* Satisfaction Path */}
                    {trends.trend_points.length > 1 && (() => {
                      const points = trends.trend_points;
                      const pathCoords = points.map((p: any, idx: number) => {
                        const x = 50 + idx * (410 / (points.length - 1));
                        const y = 130 - (p.avg_satisfaction / 10) * 90;
                        return `${x},${y}`;
                      });
                      return (
                        <path 
                          d={`M ${pathCoords.join(' L ')}`} 
                          fill="none" 
                          stroke="#4f46e5" 
                          strokeWidth="2.5" 
                        />
                      );
                    })()}

                    {/* Compliance Path */}
                    {trends.trend_points.length > 1 && (() => {
                      const points = trends.trend_points;
                      const pathCoords = points.map((p: any, idx: number) => {
                        const x = 50 + idx * (410 / (points.length - 1));
                        const y = 130 - (p.avg_compliance / 100) * 90;
                        return `${x},${y}`;
                      });
                      return (
                        <path 
                          d={`M ${pathCoords.join(' L ')}`} 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="2" 
                          strokeDasharray="4 2"
                        />
                      );
                    })()}

                    {/* Value Dots & Labels */}
                    {trends.trend_points.map((p: any, idx: number) => {
                      const points = trends.trend_points;
                      const x = 50 + idx * (410 / (points.length - 1));
                      const ySat = 130 - (p.avg_satisfaction / 10) * 90;
                      const yComp = 130 - (p.avg_compliance / 100) * 90;
                      return (
                        <g key={idx}>
                          {/* Satisfaction Dot */}
                          <circle cx={x} cy={ySat} r="3.5" fill="#4f46e5" className="hover:r-5 transition-all" />
                          <text x={x} y={ySat - 8} textAnchor="middle" fill="#818cf8" fontSize="7" fontWeight="bold">
                            {p.avg_satisfaction}
                          </text>

                          {/* Compliance Label */}
                          <circle cx={x} cy={yComp} r="3" fill="#10b981" />
                          <text x={x} y={yComp + 10} textAnchor="middle" fill="#34d399" fontSize="7" fontWeight="bold">
                            {p.avg_compliance}%
                          </text>

                          {/* Date labels */}
                          <text x={x} y="145" textAnchor="middle" fill="#475569" fontSize="7">
                            {p.date.substring(5)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Common Escalation Triggers & Agent Progression Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Triggers Card */}
                <div className="glass border border-slate-900 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Common Escalation Triggers</h3>
                  
                  <div className="relative h-44 w-full">
                    <svg className="w-full h-full" viewBox="0 0 250 120">
                      {trends.escalation_triggers.slice(0, 3).map((trig: any, idx: number) => {
                        const barHeight = Math.min(80, (trig.count / 20) * 70);
                        const x = 30 + idx * 75;
                        const y = 90 - barHeight;
                        const barWidth = 25;
                        return (
                          <g key={idx}>
                            <rect 
                              x={x} y={y} 
                              width={barWidth} height={barHeight} 
                              rx="3" fill="#ef4444" fillOpacity="0.85" 
                            />
                            <text x={x + barWidth/2} y={y - 6} textAnchor="middle" fill="#f87171" fontSize="7" fontWeight="bold">
                              {trig.count}
                            </text>
                            {/* Intent short label */}
                            <text x={x + barWidth/2} y="105" textAnchor="middle" fill="#94a3b8" fontSize="6" fontWeight="semibold">
                              {trig.intent.split(' ')[0]}
                            </text>
                            <text x={x + barWidth/2} y="115" textAnchor="middle" fill="#475569" fontSize="5">
                              {trig.avg_frustration} Frustration
                            </text>
                          </g>
                        );
                      })}
                      <line x1="10" y1="90" x2="240" y2="90" stroke="#1e293b" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>

                {/* Agent Progression Delta Card */}
                <div className="glass border border-slate-900 p-5 rounded-2xl space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Agent QA Score Progress</h3>
                  
                  <div className="space-y-3 max-h-44 overflow-y-auto">
                    {trends.agent_progressions.map((prog: any, idx: number) => {
                      const isPositive = prog.delta >= 0;
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-900/60 pb-2 last:border-0 last:pb-0">
                          <div>
                            <p className="font-semibold text-white">{prog.agent_name}</p>
                            <p className="text-[9px] text-slate-500">QA Start: {prog.initial_score}/10</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-200">{prog.current_score}/10</p>
                            <span className={`text-[9px] font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isPositive ? '+' : ''}{prog.delta} delta
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Operations Analytics details table */}
              <div className="glass border border-slate-900 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-900/60 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Completed Sessions summary log</h3>
                </div>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/40 border-b border-slate-900 text-slate-400 font-semibold">
                        <th className="p-3">Session User</th>
                        <th className="p-3">Scenario Detail</th>
                        <th className="p-3">Customer Sentiment</th>
                        <th className="p-3">QA score</th>
                        <th className="p-3 text-right">Replay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60">
                      {sessions.filter(s => s.status === 'completed').slice(0, 5).map((s) => {
                        const summary = s.post_interaction_summary || {};
                        return (
                          <tr key={s.id} className="hover:bg-slate-900/10 text-slate-300">
                            <td className="p-3 font-semibold text-white">
                              {s.customer_persona}
                            </td>
                            <td className="p-3">
                              <p className="text-slate-300 font-medium">{s.product}</p>
                              <p className="text-[10px] text-slate-500">{s.industry} • {s.difficulty} difficulty</p>
                            </td>
                            <td className="p-3 italic">
                              {summary.sentiment_journey || 'Stable'}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-full font-bold">
                                {summary.satisfaction_score ? `${summary.satisfaction_score}/10` : 'Pending'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <Link 
                                to={`/sessions/${s.id}/replay`}
                                className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-all"
                              >
                                Replay timeline <ArrowUpRight className="w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Sidebar Alerts Notifications column (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="glass border border-slate-900 p-4 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Operational Alerts
                  </h3>
                  <span className="text-[9px] bg-rose-500/15 text-rose-400 font-bold px-2 py-0.5 rounded-full">
                    {alerts.length} Flagged
                  </span>
                </div>

                <div className="space-y-2.5 overflow-y-auto max-h-[420px] pr-1">
                  {alerts.length === 0 ? (
                    <p className="text-[10px] text-slate-500 text-center py-6">No active compliance or escalation warnings detected.</p>
                  ) : (
                    alerts.map((al) => (
                      <div key={al.id} className="p-3 bg-slate-900/30 border border-slate-900 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-[8px] font-bold uppercase tracking-widest ${
                            al.type === 'escalation' ? 'text-rose-400' : al.type === 'gap' ? 'text-amber-400' : 'text-indigo-400'
                          }`}>
                            {al.type}
                          </span>
                          <span className="text-[8px] text-slate-500">
                            {new Date(al.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-200">{al.title}</p>
                        <p className="text-[9px] text-slate-400 leading-normal">{al.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* PANEL 2: AI AGENT MONITORING */}
        {activeTab === 'agents' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="glass border border-slate-900 p-4 rounded-xl text-center space-y-2">
                <span className="text-[9px] text-slate-500 uppercase font-semibold tracking-wider block">Average graph latency</span>
                <span className="text-2xl font-bold font-display text-white">1,480 ms</span>
                <p className="text-[9px] text-slate-400 leading-tight">Total execution loop from agent submit to SSE analysis flush.</p>
              </div>

              <div className="glass border border-slate-900 p-4 rounded-xl text-center space-y-2">
                <span className="text-[9px] text-slate-500 uppercase font-semibold tracking-wider block">Active pipeline health</span>
                <span className="text-2xl font-bold font-display text-emerald-400">99.8%</span>
                <p className="text-[9px] text-slate-400 leading-tight">Zero system-critical handler compile crash records.</p>
              </div>

              <div className="glass border border-slate-900 p-4 rounded-xl text-center space-y-2">
                <span className="text-[9px] text-slate-500 uppercase font-semibold tracking-wider block">Mock fallback operations</span>
                <span className="text-2xl font-bold font-display text-amber-400">Online</span>
                <p className="text-[9px] text-slate-400 leading-tight">Structured dry-runs fallback enabled when API key is missing.</p>
              </div>

            </div>

            <div className="glass border border-slate-900 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-900/60">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Independent node latency profiling</h3>
              </div>
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/40 border-b border-slate-900 text-slate-400 font-semibold">
                      <th className="p-3">Agent node identifier</th>
                      <th className="p-3">Avg Latency</th>
                      <th className="p-3">Success rating</th>
                      <th className="p-3">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60">
                    {agentLogs.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/10 text-slate-300">
                        <td className="p-3 font-semibold text-white">
                          {item.agent}
                        </td>
                        <td className="p-3 font-mono">
                          {item.avg_time_ms} ms
                        </td>
                        <td className="p-3 text-emerald-400 font-bold">
                          {item.success_rate.toFixed(1)}%
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-bold text-[9px]">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PANEL 3: KNOWLEDGE GAPS & AUTO FAQ GENERATORS */}
        {activeTab === 'gaps' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Gaps List table (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="glass border border-slate-900 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-900/60">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Flagged search matching failures</h3>
                </div>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/40 border-b border-slate-900 text-slate-400 font-semibold">
                        <th className="p-3">Query Content</th>
                        <th className="p-3">Detected Intent</th>
                        <th className="p-3">Matches</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60">
                      {gaps.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-500 italic">No search matching failure records logged.</td>
                        </tr>
                      ) : (
                        gaps.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-900/10 text-slate-300">
                            <td className="p-3 font-semibold text-white">
                              "{item.question}"
                            </td>
                            <td className="p-3 capitalize">
                              {item.intent}
                            </td>
                            <td className="p-3 font-bold text-rose-400">
                              {item.frequency} times
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleGenerateFAQ(item.id)}
                                disabled={faqLoading[item.id]}
                                className="px-2.5 py-1 bg-indigo-600 disabled:bg-slate-800 text-white rounded-lg hover:bg-indigo-500 text-[10px] font-bold uppercase transition-all"
                              >
                                {faqLoading[item.id] ? "Drafting..." : "Draft FAQ"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Awaiting FAQ Draft Approvals (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="glass border border-slate-900 p-4 rounded-2xl space-y-4">
                <div className="border-b border-slate-900 pb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Awaiting supervisor approvals</h3>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[450px] pr-1">
                  {faqs.filter(f => f.status === 'pending').length === 0 ? (
                    <p className="text-[10px] text-slate-500 text-center py-6">No draft FAQ suggestions awaiting review.</p>
                  ) : (
                    faqs.filter(f => f.status === 'pending').map((draft) => (
                      <div key={draft.id} className="bg-slate-900/30 border border-slate-900 p-4.5 rounded-xl space-y-3">
                        <div className="flex justify-between items-center text-[9px] border-b border-slate-900 pb-2">
                          <span className="text-slate-500 font-bold uppercase tracking-wider">FAQ Draft Proposal</span>
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full font-medium capitalize">
                            {draft.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-[11px] leading-relaxed">
                          <p><span className="font-bold text-white block mb-0.5">Proposed Question:</span> "{draft.question}"</p>
                          <p><span className="font-bold text-slate-300 block mb-0.5">Proposed Answer:</span> "{draft.answer}"</p>
                          <p className="text-slate-400"><span className="font-bold text-slate-400 block mb-0.5">Policy Rationale:</span> "{draft.policy}"</p>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                          <button
                            onClick={() => handleApproveFAQ(draft.id)}
                            className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-[10px] font-bold uppercase flex items-center justify-center gap-1 transition-all"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve & Publish
                          </button>
                          <button
                            onClick={() => handleRejectFAQ(draft.id)}
                            className="py-1.5 px-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-600 hover:text-white text-[10px] font-bold uppercase flex items-center justify-center transition-all"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* PANEL 4: SCENARIO BUILDERS */}
        {activeTab === 'scenarios' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Template Creator Form (5 cols) */}
            <div className="lg:col-span-5">
              <div className="glass border border-slate-900 p-5 rounded-2xl space-y-4">
                <div className="border-b border-slate-900 pb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Save Reusable Training template</h3>
                </div>

                <form onSubmit={handleCreateScenario} className="space-y-3.5 text-xs text-slate-300">
                  <div className="space-y-1">
                    <label className="font-semibold block">Scenario Name</label>
                    <input
                      type="text"
                      required
                      value={newScenario.name}
                      onChange={(e) => setNewScenario(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Billing Dispute Escalation"
                      className="w-full bg-slate-900 border border-slate-800/80 rounded-xl py-2.5 px-3 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold block">Industry Vertical</label>
                      <input
                        type="text"
                        required
                        value={newScenario.industry}
                        onChange={(e) => setNewScenario(prev => ({ ...prev, industry: e.target.value }))}
                        placeholder="e.g. FinTech"
                        className="w-full bg-slate-900 border border-slate-800/80 rounded-xl py-2.5 px-3 text-xs placeholder-slate-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold block">Product Name</label>
                      <input
                        type="text"
                        required
                        value={newScenario.product}
                        onChange={(e) => setNewScenario(prev => ({ ...prev, product: e.target.value }))}
                        placeholder="e.g. Credit Card API"
                        className="w-full bg-slate-900 border border-slate-800/80 rounded-xl py-2.5 px-3 text-xs placeholder-slate-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold block">Issue Type</label>
                      <input
                        type="text"
                        required
                        value={newScenario.issue_type}
                        onChange={(e) => setNewScenario(prev => ({ ...prev, issue_type: e.target.value }))}
                        placeholder="e.g. Overcharged Fees"
                        className="w-full bg-slate-900 border border-slate-800/80 rounded-xl py-2.5 px-3 text-xs placeholder-slate-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold block">Difficulty</label>
                      <select
                        value={newScenario.difficulty}
                        onChange={(e) => setNewScenario(prev => ({ ...prev, difficulty: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-800/80 rounded-xl py-2.5 px-3 text-xs focus:outline-none"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold block">Customer Persona</label>
                      <input
                        type="text"
                        required
                        value={newScenario.customer_persona}
                        onChange={(e) => setNewScenario(prev => ({ ...prev, customer_persona: e.target.value }))}
                        placeholder="e.g. Angry Merchant"
                        className="w-full bg-slate-900 border border-slate-800/80 rounded-xl py-2.5 px-3 text-xs placeholder-slate-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold block">Customer Mood</label>
                      <input
                        type="text"
                        required
                        value={newScenario.customer_mood}
                        onChange={(e) => setNewScenario(prev => ({ ...prev, customer_mood: e.target.value }))}
                        placeholder="e.g. impatient"
                        className="w-full bg-slate-900 border border-slate-800/80 rounded-xl py-2.5 px-3 text-xs placeholder-slate-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold block">Customer Goal</label>
                    <textarea
                      required
                      value={newScenario.goal}
                      onChange={(e) => setNewScenario(prev => ({ ...prev, goal: e.target.value }))}
                      placeholder="e.g. Demands manager escalations and refund confirmation code."
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-800/80 rounded-xl py-2.5 px-3 text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 text-xs font-bold uppercase transition-all"
                  >
                    Save reusable template
                  </button>
                </form>
              </div>
            </div>

            {/* Scenario Templates List (7 cols) */}
            <div className="lg:col-span-7">
              <div className="glass border border-slate-900 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-900/60">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Saved templates library</h3>
                </div>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/40 border-b border-slate-900 text-slate-400 font-semibold">
                        <th className="p-3">Scenario Name</th>
                        <th className="p-3">Customer details</th>
                        <th className="p-3">Difficulty</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/60">
                      {scenarios.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-500 italic">No training scenarios configured.</td>
                        </tr>
                      ) : (
                        scenarios.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-900/10 text-slate-300">
                            <td className="p-3 font-semibold text-white">
                              {item.name}
                            </td>
                            <td className="p-3">
                              <p className="font-semibold text-slate-200">{item.customer_persona}</p>
                              <p className="text-[10px] text-slate-500">Goal: "{item.goal}"</p>
                            </td>
                            <td className="p-3 capitalize font-bold">
                              {item.difficulty}
                            </td>
                            <td className="p-3 text-right">
                              <Link
                                to="/sessions/new"
                                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg text-[10px] font-bold uppercase transition-all"
                              >
                                Launch
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
