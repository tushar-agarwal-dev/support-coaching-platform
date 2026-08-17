import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessions } from '../hooks/useSessions';
import { InteractionMode, DifficultyLevel } from '../types/session';
import { 
  Play, 
  Sparkles, 
  Cpu, 
  Keyboard, 
  RefreshCw,
  Compass,
  User,
  HeartCrack,
  AlertCircle
} from 'lucide-react';

export const SessionConfig: React.FC = () => {
  const navigate = useNavigate();
  const { createSession, isCreating } = useSessions();

  const [mode, setMode] = useState<InteractionMode>('simulator');
  const [industry, setIndustry] = useState('FinTech');
  const [product, setProduct] = useState('Payment Gateway API');
  const [issueType, setIssueType] = useState('Failed Transaction Refusal');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [customerPersona, setCustomerPersona] = useState('Corporate Account CFO');
  const [customerMood, setCustomerMood] = useState('Impulsive & Angry');
  
  const [error, setError] = useState<string | null>(null);
  const [preloadedTranscript, setPreloadedTranscript] = useState<any[] | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (!Array.isArray(parsed)) {
            throw new Error('Transcript file must contain a JSON array of messages.');
          }
          for (const item of parsed) {
            if (!item.role || !item.content || !['customer', 'agent'].includes(item.role.toLowerCase())) {
              throw new Error('Each message in transcript must have role ("customer" or "agent") and content.');
            }
          }
          // Normalize roles
          const normalized = parsed.map(m => ({
            role: m.role.toLowerCase() as 'customer' | 'agent',
            content: m.content
          }));
          setPreloadedTranscript(normalized);
        } else {
          const lines = text.split('\n');
          const parsed: any[] = [];
          for (const line of lines) {
            const clean = line.trim();
            if (!clean) continue;
            if (clean.toLowerCase().startsWith('customer:')) {
              parsed.push({ role: 'customer', content: clean.substring(9).trim() });
            } else if (clean.toLowerCase().startsWith('agent:')) {
              parsed.push({ role: 'agent', content: clean.substring(6).trim() });
            } else {
              if (parsed.length > 0) {
                parsed[parsed.length - 1].content += ' ' + clean;
              } else {
                parsed.push({ role: 'customer', content: clean });
              }
            }
          }
          if (parsed.length === 0) {
            throw new Error('Could not parse any messages from transcript file.');
          }
          setPreloadedTranscript(parsed);
        }
      } catch (err: any) {
        console.error(err);
        setError(`Error parsing transcript file: ${err.message}`);
        setPreloadedTranscript(null);
        setUploadFileName('');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'replay' && (!preloadedTranscript || preloadedTranscript.length === 0)) {
      setError('Please upload a valid transcript file to initialize Replay Mode.');
      return;
    }

    try {
      const newSession = await createSession({
        interaction_mode: mode,
        industry,
        product,
        issue_type: issueType,
        difficulty,
        customer_persona: customerPersona,
        customer_mood: customerMood,
        preloaded_transcript: mode === 'replay' ? preloadedTranscript : null
      });
      navigate(`/sessions/${newSession.id}/chat`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to initialize session configuration. Please verify settings.');
    }
  };

  const industries = ['FinTech', 'SaaS & Cloud Services', 'E-Commerce / Retail', 'Telecommunications', 'Healthcare / Biotech', 'Travel & Hospitality'];
  const moods = ['Angry & Demanding', 'Anxious & Confused', 'Neutral / Fact-based', 'Cooperative but Hurried', 'Skeptical & Disappointed'];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-display font-bold text-3xl tracking-tight text-white">New Coaching Session</h1>
        <p className="text-slate-400 text-sm mt-1">Configure active environments and simulated customer profile states for training.</p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Mode Selection */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Interaction Mode Selection */}
          <div className="glass rounded-xl p-6 border border-slate-900 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              1. Choose Interaction Mode
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Simulator Card */}
              <button
                type="button"
                onClick={() => setMode('simulator')}
                className={`flex flex-col items-center text-center p-5 rounded-xl border transition-all duration-200 ${
                  mode === 'simulator'
                    ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${mode === 'simulator' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-900 text-slate-500'}`}>
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold block">AI Simulator</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Live simulated roleplay with AI customer agent.</span>
              </button>

              {/* Manual Card */}
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`flex flex-col items-center text-center p-5 rounded-xl border transition-all duration-200 ${
                  mode === 'manual'
                    ? 'bg-sky-600/10 border-sky-500 text-white shadow-lg shadow-sky-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${mode === 'manual' ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-900 text-slate-500'}`}>
                  <Keyboard className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold block">Manual Feed</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Agent inputs customer transcripts in real time.</span>
              </button>

              {/* Replay Card */}
              <button
                type="button"
                onClick={() => setMode('replay')}
                className={`flex flex-col items-center text-center p-5 rounded-xl border transition-all duration-200 ${
                  mode === 'replay'
                    ? 'bg-purple-600/10 border-purple-500 text-white shadow-lg shadow-purple-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${mode === 'replay' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-900 text-slate-500'}`}>
                  <RefreshCw className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold block">Transcript Replay</span>
                <span className="text-[10px] text-slate-500 mt-1 block">Step-by-step coaching analysis of preloaded dialogues.</span>
              </button>
            </div>

            {/* Transcript File Upload Zone */}
            {mode === 'replay' && (
              <div className="mt-4 p-5 rounded-xl border border-dashed border-purple-500/30 bg-purple-500/5 space-y-3">
                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider block">Upload Historical Transcript</span>
                <p className="text-[11px] text-slate-400">
                  Select a JSON transcript array or standard text file containing dialogue exchanges.
                </p>
                <div className="flex items-center space-x-4">
                  <label className="cursor-pointer bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow transition-all duration-150">
                    Choose Transcript File
                    <input 
                      type="file" 
                      accept=".json,.txt" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>
                  {uploadFileName ? (
                    <span className="text-xs text-slate-300 font-mono font-medium">{uploadFileName} ({preloadedTranscript?.length || 0} turns loaded)</span>
                  ) : (
                    <span className="text-xs text-slate-500">No file uploaded (.json or .txt)</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Domain & Scope Parameters */}
          <div className="glass rounded-xl p-6 border border-slate-900 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              2. Domain & Scope Configuration
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Industry Vertical</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  {industries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Product / Service Name</label>
                <input
                  type="text"
                  required
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  placeholder="e.g. Payment Gateway APIs"
                  className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Customer Issue Type / Scenario</label>
                <input
                  type="text"
                  required
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  placeholder="e.g. Dispute resolution, subscription billing error, login loop"
                  className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Customer Persona & Difficulty */}
        <div className="space-y-6">
          {/* Persona Card */}
          <div className="glass rounded-xl p-6 border border-slate-900 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              3. Customer Profile
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Customer Persona</label>
                <input
                  type="text"
                  required
                  value={customerPersona}
                  onChange={(e) => setCustomerPersona(e.target.value)}
                  placeholder="e.g. Frustrated Small Business Owner"
                  className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl py-3 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Initial Customer Mood</label>
                <select
                  value={customerMood}
                  onChange={(e) => setCustomerMood(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  {moods.map(md => (
                    <option key={md} value={md}>{md}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Difficulty setting */}
          <div className="glass rounded-xl p-6 border border-slate-900 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <HeartCrack className="w-4 h-4 text-indigo-400" />
              4. Coaching Difficulty
            </h2>

            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((level) => {
                const isSelected = difficulty === level;
                let activeStyle = '';
                if (level === 'easy') activeStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
                if (level === 'medium') activeStyle = 'border-amber-500 bg-amber-500/10 text-amber-400';
                if (level === 'hard') activeStyle = 'border-rose-500 bg-rose-500/10 text-rose-400';

                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all capitalize ${
                      isSelected
                        ? activeStyle
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isCreating}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-semibold py-4 rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isCreating ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Initialize Platform Environment</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
