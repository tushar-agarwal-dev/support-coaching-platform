import React from 'react';
import { Link } from 'react-router-dom';
import { useSessions } from '../hooks/useSessions';
import { useDocuments } from '../hooks/useDocuments';
import { 
  BookOpen, 
  FileText, 
  HelpCircle, 
  CheckCircle, 
  Hourglass, 
  Activity, 
  Plus, 
  Calendar,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { sessions, isLoading: sessionsLoading } = useSessions();
  const { documents, isLoading: docsLoading } = useDocuments();

  const activeSessions = sessions.filter(s => s.status === 'active');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  // Stats calculators
  const pdfDocs = documents.filter(d => d.file_type === 'pdf');
  const docxDocs = documents.filter(d => d.file_type === 'docx' || d.file_type === 'doc');
  const txtDocs = documents.filter(d => d.file_type === 'txt');
  
  const totalChunks = documents.reduce((acc, doc) => acc + (doc.chunk_count || 0), 0);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'hard': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'simulator': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'manual': return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'replay': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight text-white">Overview</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time stats and management logs for agent coaching sessions.</p>
        </div>
        <Link
          to="/sessions/new"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all duration-200 flex items-center justify-center space-x-2 shrink-0 self-start md:self-center"
        >
          <Plus className="w-5 h-5" />
          <span>New Coaching Session</span>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Sessions Card */}
        <div className="glass glass-hover rounded-xl p-5 border border-slate-900 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Coaching Sessions</span>
            <span className="text-3xl font-bold font-display text-white">{sessions.length}</span>
            <span className="text-xs text-slate-400 block mt-1">
              <span className="text-indigo-400 font-semibold">{activeSessions.length}</span> active • <span className="text-emerald-400 font-semibold">{completedSessions.length}</span> completed
            </span>
          </div>
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 text-indigo-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Knowledge Base Ingestion Card */}
        <div className="glass glass-hover rounded-xl p-5 border border-slate-900 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">KB Documents</span>
            <span className="text-3xl font-bold font-display text-white">{documents.length}</span>
            <span className="text-xs text-slate-400 block mt-1">
              {pdfDocs.length} PDFs • {docxDocs.length} DOCX • {txtDocs.length} TXTs
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 text-emerald-400">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Vector DB Chunks Card */}
        <div className="glass glass-hover rounded-xl p-5 border border-slate-900 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">ChromaDB Chunks</span>
            <span className="text-3xl font-bold font-display text-white">{totalChunks}</span>
            <span className="text-xs text-slate-400 block mt-1">
              Vector index dimension: 384d
            </span>
          </div>
          <div className="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center border border-sky-500/20 text-sky-400">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* System Status Card */}
        <div className="glass glass-hover rounded-xl p-5 border border-slate-900 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Engine Version</span>
            <span className="text-2xl font-bold font-display text-white">Phase 1</span>
            <span className="text-xs text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
              <CheckCircle className="w-3 h-3" /> Core APIs online
            </span>
          </div>
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 text-purple-400">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Sections: Recent Sessions and RAG Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Sessions List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-white">Recent Coaching Sessions</h2>
            <Link to="/sessions/new" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors">
              Configure session <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>

          {sessionsLoading ? (
            <div className="glass rounded-xl border border-slate-900 p-8 flex items-center justify-center min-h-[300px]">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500">Retrieving sessions history...</p>
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="glass rounded-xl border border-slate-900/60 p-12 text-center flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent pointer-events-none"></div>
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-800 mb-4">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-white text-base">No coaching sessions configured</h3>
              <p className="text-sm text-slate-400 max-w-sm mt-2 mb-6">
                Start your first coaching session. Customize interaction modes, customer personas, moods, and difficulty settings.
              </p>
              <Link
                to="/sessions/new"
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200"
              >
                Configure New Session
              </Link>
            </div>
          ) : (
            <div className="glass border border-slate-900/60 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/40 border-b border-slate-900/80 text-slate-400 font-semibold">
                      <th className="p-4 uppercase tracking-wider">Mode</th>
                      <th className="p-4 uppercase tracking-wider">Target Domain</th>
                      <th className="p-4 uppercase tracking-wider">Persona & Mood</th>
                      <th className="p-4 uppercase tracking-wider">Difficulty</th>
                      <th className="p-4 uppercase tracking-wider">Status</th>
                      <th className="p-4 uppercase tracking-wider">Date</th>
                      <th className="p-4 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/50">
                    {sessions.slice(0, 5).map((session) => (
                      <tr key={session.id} className="hover:bg-slate-900/10 text-slate-300 font-medium">
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wide ${getModeColor(session.interaction_mode)}`}>
                            {session.interaction_mode}
                          </span>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="text-white font-semibold truncate max-w-[130px]">{session.product}</p>
                            <p className="text-[10px] text-slate-500 truncate max-w-[130px]">{session.industry}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="text-slate-300 font-semibold">{session.customer_persona}</p>
                            <p className="text-[10px] text-slate-400 italic">Mood: {session.customer_mood}</p>
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${getDifficultyColor(session.difficulty)}`}>
                            {session.difficulty}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`flex items-center gap-1.5 text-[11px] ${session.status === 'active' ? 'text-indigo-400 font-bold' : 'text-slate-400 font-medium'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${session.status === 'active' ? 'bg-indigo-400 animate-pulse' : 'bg-slate-500'}`}></span>
                            {session.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-600" />
                            {new Date(session.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <Link
                            to={`/sessions/${session.id}/chat`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-lg text-[10px] font-bold uppercase transition-all duration-200"
                          >
                            Launch <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Knowledge Base Ingestion Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-white">RAG Knowledge Base</h2>
            <Link to="/knowledge-base" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors">
              Manage library <Plus className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="glass border border-slate-900 p-5 rounded-xl space-y-4">
            {docsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] text-slate-500">Checking document counts...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-slate-400">RAG knowledge base is empty.</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">Upload PDFs or Word documents to build semantic support coaching references.</p>
                <Link to="/knowledge-base" className="inline-block mt-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                  Upload file
                </Link>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2">
                  Document Processing Queue
                </div>
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {documents.slice(0, 4).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between bg-slate-900/40 border border-slate-800/50 p-3 rounded-lg text-xs">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="font-semibold text-slate-200 truncate">{doc.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase mt-0.5">{doc.file_type} • {(doc.file_size / 1024).toFixed(1)} KB</p>
                      </div>
                      
                      {/* Document Processing status indicator */}
                      <div>
                        {doc.status === 'completed' && (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            {doc.chunk_count} Chunks
                          </span>
                        )}
                        {doc.status === 'processing' && (
                          <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[10px] font-bold flex items-center gap-1 animate-pulse">
                            <Hourglass className="w-3 h-3 animate-spin text-indigo-400" />
                            Chunking
                          </span>
                        )}
                        {doc.status === 'pending' && (
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-[10px] font-bold flex items-center gap-1">
                            <Hourglass className="w-3 h-3 text-amber-400" />
                            Queued
                          </span>
                        )}
                        {doc.status === 'failed' && (
                          <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md text-[10px] font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            Failed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
