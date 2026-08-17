import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles, 
  BookOpen, 
  ShieldCheck, 
  AlertOctagon,
  Activity, 
  Clock,
  ArrowRight,
  FileText
} from 'lucide-react';
import api from '../services/api';

export const ReplayTimeline: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReplayData = async () => {
      try {
        const res = await api.get(`/api/chat/state/${sessionId}`);
        setTimeline(res.data.replay_timeline || []);
        
        const sessionRes = await api.get(`/api/sessions/`);
        const found = sessionRes.data.find((s: any) => s.id === sessionId);
        setSession(found);
      } catch (err) {
        console.error("Failed to load replay timeline:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReplayData();
  }, [sessionId]);

  // Autoplay handler
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveIndex((prev) => {
          if (prev < timeline.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 3000); // 3 seconds per step
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeline.length]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 text-xs animate-pulse">Loading replay snapshot timeline...</p>
        </div>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-12 h-12 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-white">No replay snapshots logged</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-2 mb-6">
          This session does not contain step-by-step history logs. Replay is only available on training calls initiated in Phase 4.
        </p>
        <Link to="/dashboard" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase transition-all">
          Return to overview
        </Link>
      </div>
    );
  }

  const currentStep = timeline[activeIndex] || {};
  const currentAnalysis = currentStep.analysis || {};
  const intent = currentAnalysis.intent || {};
  const sentiment = currentAnalysis.sentiment || {};
  const compliance = currentAnalysis.compliance || { compliant: true };
  const risk = currentAnalysis.risk || { risk_percent: 0, risk_level: 'low' };
  const recommendations = currentAnalysis.knowledge || [];
  const logs = currentAnalysis.logs || {};

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <div className="flex items-center space-x-4">
          <Link to="/manager" className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:text-white hover:border-slate-700 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display font-bold text-xl text-white">Session Replay</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Replaying training call for: <span className="text-slate-300 font-semibold">{session?.customer_persona}</span>
            </p>
          </div>
        </div>

        {/* Replay Controls Panel */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1.5 space-x-2">
          <button
            onClick={() => {
              setActiveIndex(0);
              setIsPlaying(false);
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <span className="text-[10px] font-mono text-slate-400 px-2 select-none border-l border-slate-800">
            Step {activeIndex + 1} / {timeline.length}
          </span>
        </div>
      </div>

      {/* Grid panels */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
        
        {/* LEFT COLUMN: Timeline dialogue steps (4 Cols) */}
        <div className="glass rounded-2xl border border-slate-900 flex flex-col min-h-0 lg:col-span-4">
          <div className="p-3 border-b border-slate-900 bg-slate-950/40">
            <h2 className="text-[10px] font-bold text-white uppercase tracking-wider">Conversation Timeline Steps</h2>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 min-h-0">
            {timeline.map((step, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveIndex(idx);
                  setIsPlaying(false);
                }}
                className={`w-full text-left p-3 border rounded-xl transition-all flex items-start space-x-2.5 ${
                  activeIndex === idx
                    ? 'border-indigo-500 bg-indigo-600/5 text-white shadow-lg'
                    : 'border-slate-800 bg-slate-950/20 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  step.role === 'agent' ? 'bg-indigo-400' : 'bg-emerald-400'
                }`}></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-wider mb-1">
                    <span>{step.role === 'agent' ? 'Agent response' : 'Customer input'}</span>
                    <span className="opacity-60">{new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed line-clamp-3">"{step.content}"</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CENTER COLUMN: Current step dialogue snapshot (4 Cols) */}
        <div className="glass rounded-2xl border border-slate-900 p-4 flex flex-col min-h-0 lg:col-span-4 space-y-4">
          
          <div className="border-b border-slate-900 pb-3 flex items-center justify-between">
            <h2 className="text-[10px] font-bold text-white uppercase tracking-wider">Selected Message snapshot</h2>
            <span className="text-[8px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full text-slate-400 font-mono">
              Step {activeIndex + 1}
            </span>
          </div>

          {/* Dialogue Message Text Bubble */}
          <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl space-y-2">
            <span className={`text-[8px] font-bold uppercase tracking-widest block ${
              currentStep.role === 'agent' ? 'text-indigo-400' : 'text-emerald-400'
            }`}>
              {currentStep.role === 'agent' ? 'Agent message' : 'Customer message'}
            </span>
            <p className="text-xs font-medium leading-relaxed text-slate-200">
              "{currentStep.content}"
            </p>
          </div>

          {/* AI Suggestions Review at this step */}
          {currentStep.role === 'agent' && currentAnalysis.suggestions && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">AI Suggestions Review</span>
              
              {currentAnalysis.suggestions.slice(0, 2).map((sug: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-950 border border-slate-900 rounded-xl space-y-1.5">
                  <div className="flex justify-between items-center text-[8px] font-bold uppercase">
                    <span className="text-indigo-400">{sug.type} coaching option</span>
                    <span className="text-slate-500 font-mono">{(sug.confidence * 100).toFixed(0)}% Match</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-normal">"{sug.reply}"</p>
                  <p className="text-[9px] text-slate-500 leading-normal italic">Reason: {sug.reasoning}</p>
                </div>
              ))}
            </div>
          )}

          {currentStep.role === 'customer' && (
            <div className="flex-grow flex flex-col justify-center items-center text-center p-6">
              <ArrowRight className="w-8 h-8 text-slate-700 mb-2 animate-pulse" />
              <p className="text-[10px] text-slate-400">Customer message entry step.</p>
              <p className="text-[9px] text-slate-500 mt-1 max-w-[200px]">Click on any "Agent response" step to view the coaching analysis snapshots.</p>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: AI state analyzer snapshots (4 Cols) */}
        <div className="glass rounded-2xl border border-slate-900 p-4 flex flex-col min-h-0 lg:col-span-4 space-y-4">
          
          <div className="border-b border-slate-900 pb-3">
            <h2 className="text-[10px] font-bold text-white uppercase tracking-wider">AI analysis at this step</h2>
          </div>

          {currentStep.role === 'customer' || !currentStep.analysis ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center">
              <Sparkles className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-[10px] text-slate-500">Select an agent response to load the QA analysis logs.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0 text-xs">
              
              {/* Intent Classifier details */}
              <div className="bg-slate-900/40 border border-slate-900 p-3 rounded-xl space-y-2">
                <span className="text-[8px] font-bold text-slate-400 uppercase block tracking-widest">Intent Classification</span>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-500 block">Primary Intent</span>
                    <span className="text-white font-semibold truncate block">{intent.primary_intent || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Category</span>
                    <span className="text-white font-semibold capitalize block">{intent.category || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Sentiment & Risk rating */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/40 border border-slate-900 p-3 rounded-xl text-center space-y-1">
                  <span className="text-[8px] text-slate-500 block uppercase">Frustration Score</span>
                  <span className="text-base font-bold font-display text-white">{sentiment.frustration_score?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="bg-slate-900/40 border border-slate-900 p-3 rounded-xl text-center space-y-1">
                  <span className="text-[8px] text-slate-500 block uppercase">Escalation Risk</span>
                  <span className="text-base font-bold font-display text-rose-400">{risk.risk_percent?.toFixed(0)}%</span>
                </div>
              </div>

              {/* Policy compliance logs */}
              <div className={`p-3 border rounded-xl flex items-start gap-2.5 text-[10px] ${
                compliance.compliant 
                  ? 'border-emerald-500/20 bg-emerald-500/5 text-slate-300'
                  : 'border-rose-500/20 bg-rose-500/5 text-slate-300'
              }`}>
                {compliance.compliant ? (
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertOctagon className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                )}
                <div>
                  <p className="font-bold text-white uppercase text-[8px] tracking-wide">
                    {compliance.compliant ? 'Policy approved' : 'Policy Warning Flagged'}
                  </p>
                  <p className="text-[9px] text-slate-400 leading-normal mt-0.5">
                    {compliance.compliant ? 'No SOP or promise violations identified.' : compliance.violation_reason}
                  </p>
                </div>
              </div>

              {/* Knowledge Base Citations */}
              <div className="space-y-2">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" /> RAG Citations
                </span>
                
                {recommendations.map((rec: any, rIdx: number) => (
                  <div key={rIdx} className="bg-slate-950 border border-slate-900 p-2.5 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-[8px]">
                      <span className="text-slate-300 font-bold flex items-center gap-1">
                        <FileText className="w-3 h-3 text-indigo-400" /> {rec.document_name}
                      </span>
                      <span className="text-slate-500">Page {rec.page_number}</span>
                    </div>
                    <p className="text-[10px] italic text-slate-400 line-clamp-2">"{rec.text}"</p>
                  </div>
                ))}
              </div>

              {/* Latency Logs */}
              <div className="border-t border-slate-900 pt-3">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" /> Node latencies
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono text-slate-500">
                  {Object.entries(logs).map(([nodeName, logItem]: [string, any]) => (
                    <div key={nodeName} className="flex justify-between p-1 bg-slate-950 rounded border border-slate-900">
                      <span className="truncate max-w-[90px]">{nodeName.replace("_", " ")}</span>
                      <span className="text-slate-400 font-bold">{logItem.duration_ms}ms</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
