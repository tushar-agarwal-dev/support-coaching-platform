import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  Sparkles, 
  BookOpen, 
  Activity, 
  Hourglass, 
  FileText, 
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  AlertOctagon,
  Copy,
  ChevronRight,
  Info,
  Clock,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';

interface Message {
  role: 'agent' | 'customer';
  content: string;
  timestamp: string;
}

interface RAGRecommendation {
  text: string;
  score: number;
  document_name: string;
  page_number: number;
  chunk_id: string;
  confidence_score: number;
}

interface ResponseSuggestion {
  type: string;
  reply: string;
  reasoning: string;
  confidence: number;
}

interface SelfCritiqueItem {
  mode: string;
  original_reply: string;
  improved_reply: string;
  improvements: string[];
  confidence: number;
}

interface ComplianceResult {
  compliant: boolean;
  violation_reason: string;
  severity: string;
  confidence: number;
}

interface HallucinationResult {
  is_hallucinated: boolean;
  flagged_claims: string[];
}

interface EscalationRiskResult {
  risk_percent: number;
  risk_level: string;
  reasons: string[];
  recommended_action: string;
}

interface AgentLogItem {
  status: 'waiting' | 'running' | 'completed';
  duration_ms: number;
}

interface AIAnalysis {
  intent: {
    primary_intent?: string;
    secondary_intent?: string;
    urgency?: string;
    category?: string;
    confidence_score?: number;
  };
  sentiment: {
    emotion?: string;
    frustration_score?: number;
    satisfaction_trend?: string;
    confidence?: number;
  };
  knowledge: RAGRecommendation[];
  suggestions: ResponseSuggestion[];
  critique: SelfCritiqueItem[];
  compliance: ComplianceResult;
  hallucination: HallucinationResult;
  risk: EscalationRiskResult;
  logs: Record<string, AgentLogItem>;
}

export const ChatConsole: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<any>(null);
  const [history, setHistory] = useState<Message[]>([]);
  
  // Input fields and loading states
  const [agentInput, setAgentInput] = useState('');
  const [streamingCustomerMessage, setStreamingCustomerMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  // Manual/Replay specific states
  const [manualRole, setManualRole] = useState<'agent' | 'customer'>('agent');
  const [customerInput, setCustomerInput] = useState('');
  const [replayIndex, setReplayIndex] = useState(0);
  const [isProcessingReplay, setIsProcessingReplay] = useState(false);

  // AI State & Suggestions selection
  const [selectedSuggestionType, setSelectedSuggestionType] = useState<string>('empathetic');
  const [analysis, setAnalysis] = useState<AIAnalysis>({
    intent: {},
    sentiment: {},
    knowledge: [],
    suggestions: [],
    critique: [],
    compliance: { compliant: true, violation_reason: 'None', severity: 'low', confidence: 0.98 },
    hallucination: { is_hallucinated: false, flagged_claims: [] },
    risk: { risk_percent: 15.0, risk_level: 'low', reasons: [], recommended_action: 'Proceed normally' },
    logs: {}
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize and load state
  useEffect(() => {
    const initSession = async () => {
      try {
        const sessionRes = await api.get(`/api/sessions/`);
        const found = sessionRes.data.find((s: any) => s.id === sessionId);
        setSession(found);

        // Fetch logs
        const startRes = await api.post(`/api/chat/start?session_id=${sessionId}`);
        setHistory(startRes.data.history);

        if (found?.preloaded_transcript) {
          setReplayIndex(startRes.data.history.length);
        }

        const stateRes = await api.get(`/api/chat/state/${sessionId}`);
        if (stateRes.data.analysis) {
          const analysisData = stateRes.data.analysis;
          setAnalysis({
            intent: analysisData.intent || {},
            sentiment: analysisData.sentiment || {},
            knowledge: analysisData.knowledge || [],
            suggestions: analysisData.suggestions || [],
            critique: analysisData.critique || [],
            compliance: {
              compliant: analysisData.compliance?.compliant ?? true,
              violation_reason: analysisData.compliance?.violation_reason ?? 'None',
              severity: analysisData.compliance?.severity ?? 'low',
              confidence: analysisData.compliance?.confidence ?? 0.98
            },
            hallucination: {
              is_hallucinated: analysisData.hallucination?.is_hallucinated ?? false,
              flagged_claims: analysisData.hallucination?.flagged_claims ?? []
            },
            risk: {
              risk_percent: analysisData.risk?.risk_percent ?? 15.0,
              risk_level: analysisData.risk?.risk_level ?? 'low',
              reasons: analysisData.risk?.reasons ?? [],
              recommended_action: analysisData.risk?.recommended_action ?? 'Proceed normally'
            },
            logs: analysisData.logs || {}
          });
        }
      } catch (err) {
        console.error("Failed to load session:", err);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, streamingCustomerMessage, statusMessage]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentInput.trim()) return;

    const messageToSend = agentInput;
    setAgentInput('');
    setStatusMessage('Routing agent message...');
    
    // Add agent message locally
    const localAgentMsg: Message = {
      role: 'agent',
      content: messageToSend,
      timestamp: new Date().toISOString()
    };
    setHistory(prev => [...prev, localAgentMsg]);
    setStreamingCustomerMessage('');

    // Reset logs to show "running" in the viewer
    setAnalysis(prev => ({
      ...prev,
      logs: {
        intent_detector: { status: 'running', duration_ms: 0 },
        sentiment_analyst: { status: 'running', duration_ms: 0 },
        escalation_risk: { status: 'running', duration_ms: 0 },
        knowledge_recommender: { status: 'waiting', duration_ms: 0 },
        coaching_suggestions: { status: 'waiting', duration_ms: 0 },
        self_critique: { status: 'waiting', duration_ms: 0 },
        policy_compliance: { status: 'waiting', duration_ms: 0 }
      }
    }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/chat/message?session_id=${sessionId}&message=${encodeURIComponent(messageToSend)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.body) throw new Error("No stream content body.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event:')) {
            const eventType = trimmed.replace('event:', '').trim();
            if (eventType === 'typing') {
              setIsTyping(true);
            }
          } else if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.replace('data:', '').trim();
            try {
              const data = JSON.parse(dataStr);
              
              if (data.status) {
                setStatusMessage(data.message);
                if (data.status !== 'typing') setIsTyping(false);
              } else if (data.node) {
                // Real-time agent update event from LangGraph workflow stream!
                setAnalysis(prev => ({
                  ...prev,
                  intent: data.state.current_intent || prev.intent,
                  sentiment: data.state.sentiment || prev.sentiment,
                  knowledge: data.state.retrieved_knowledge || prev.knowledge,
                  suggestions: data.state.coaching_suggestions || prev.suggestions,
                  critique: data.state.self_critique || prev.critique,
                  compliance: {
                    compliant: data.state.policy_compliance?.compliant ?? prev.compliance.compliant,
                    violation_reason: data.state.policy_compliance?.violation_reason ?? prev.compliance.violation_reason,
                    severity: data.state.policy_compliance?.severity ?? prev.compliance.severity,
                    confidence: data.state.policy_compliance?.confidence ?? prev.compliance.confidence
                  },
                  hallucination: {
                    is_hallucinated: data.state.hallucination_guard?.is_hallucinated ?? prev.hallucination.is_hallucinated,
                    flagged_claims: data.state.hallucination_guard?.flagged_claims ?? prev.hallucination.flagged_claims
                  },
                  risk: {
                    risk_percent: data.state.escalation_risk?.risk_percent ?? prev.risk.risk_percent,
                    risk_level: data.state.escalation_risk?.risk_level ?? prev.risk.risk_level,
                    reasons: data.state.escalation_risk?.reasons ?? prev.risk.reasons,
                    recommended_action: data.state.escalation_risk?.recommended_action ?? prev.risk.recommended_action
                  },
                  logs: data.state.agent_logs || prev.logs
                }));
              } else if (data.text) {
                setIsTyping(false);
                setStatusMessage(null);
                setStreamingCustomerMessage(prev => prev + data.text);
              } else if (data.latest_message) {
                // Graph complete and finalized simulated customer reply appended
                if (data.latest_message.role === 'customer') {
                  setHistory(prev => [...prev, data.latest_message]);
                }
                setStreamingCustomerMessage('');
                setStatusMessage(null);
              }
            } catch (err) {
              console.error("Error parsing chunk payload:", err, dataStr);
            }
          }
        }
      }
    } catch (err) {
      console.error("SSE connection failure:", err);
      setStatusMessage("Failed to connect to agent server.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendCustomerMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInput.trim()) return;

    const messageToSend = customerInput;
    setCustomerInput('');
    setStatusMessage('Routing customer message...');
    
    // Add customer message locally
    const localCustomerMsg: Message = {
      role: 'customer',
      content: messageToSend,
      timestamp: new Date().toISOString()
    };
    setHistory(prev => [...prev, localCustomerMsg]);

    // Reset logs to show "running" in the viewer
    setAnalysis(prev => ({
      ...prev,
      logs: {
        intent_detector: { status: 'running', duration_ms: 0 },
        sentiment_analyst: { status: 'running', duration_ms: 0 },
        escalation_risk: { status: 'running', duration_ms: 0 },
        knowledge_recommender: { status: 'waiting', duration_ms: 0 },
        coaching_suggestions: { status: 'waiting', duration_ms: 0 },
        self_critique: { status: 'waiting', duration_ms: 0 },
        policy_compliance: { status: 'waiting', duration_ms: 0 }
      }
    }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/chat/customer-message?session_id=${sessionId}&message=${encodeURIComponent(messageToSend)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.body) throw new Error("No stream content body.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('event:')) {
            const eventType = trimmed.replace('event:', '').trim();
            if (eventType === 'typing') {
              setIsTyping(true);
            }
          } else if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.replace('data:', '').trim();
            try {
              const data = JSON.parse(dataStr);
              
              if (data.status) {
                setStatusMessage(data.message);
                if (data.status !== 'typing') setIsTyping(false);
              } else if (data.node) {
                setAnalysis(prev => ({
                  ...prev,
                  intent: data.state.current_intent || prev.intent,
                  sentiment: data.state.sentiment || prev.sentiment,
                  knowledge: data.state.retrieved_knowledge || prev.knowledge,
                  suggestions: data.state.coaching_suggestions || prev.suggestions,
                  critique: data.state.self_critique || prev.critique,
                  compliance: {
                    compliant: data.state.policy_compliance?.compliant ?? prev.compliance.compliant,
                    violation_reason: data.state.policy_compliance?.violation_reason ?? prev.compliance.violation_reason,
                    severity: data.state.policy_compliance?.severity ?? prev.compliance.severity,
                    confidence: data.state.policy_compliance?.confidence ?? prev.compliance.confidence
                  },
                  hallucination: {
                    is_hallucinated: data.state.hallucination_guard?.is_hallucinated ?? prev.hallucination.is_hallucinated,
                    flagged_claims: data.state.hallucination_guard?.flagged_claims ?? prev.hallucination.flagged_claims
                  },
                  risk: {
                    risk_percent: data.state.escalation_risk?.risk_percent ?? prev.risk.risk_percent,
                    risk_level: data.state.escalation_risk?.risk_level ?? prev.risk.risk_level,
                    reasons: data.state.escalation_risk?.reasons ?? prev.risk.reasons,
                    recommended_action: data.state.escalation_risk?.recommended_action ?? prev.risk.recommended_action
                  },
                  logs: data.state.agent_logs || prev.logs
                }));
              } else if (data.latest_message) {
                setStatusMessage(null);
              }
            } catch (err) {
              console.error("Error parsing customer chunk payload:", err, dataStr);
            }
          }
        }
      }
    } catch (err) {
      console.error("SSE customer connection failure:", err);
      setStatusMessage("Failed to connect to agent server.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleNextReplayTurn = async () => {
    if (!session?.preloaded_transcript || isProcessingReplay) return;
    const totalTurns = session.preloaded_transcript.length;
    if (replayIndex >= totalTurns) {
      setStatusMessage("End of preloaded transcript reached.");
      return;
    }

    const nextMsg = session.preloaded_transcript[replayIndex];
    setIsProcessingReplay(true);
    setStatusMessage(`Replaying ${nextMsg.role} message...`);

    // Add local turn message
    const localMsg: Message = {
      role: nextMsg.role,
      content: nextMsg.content,
      timestamp: new Date().toISOString()
    };
    setHistory(prev => [...prev, localMsg]);

    // Reset logs to show "running" in the viewer
    setAnalysis(prev => ({
      ...prev,
      logs: {
        intent_detector: { status: 'running', duration_ms: 0 },
        sentiment_analyst: { status: 'running', duration_ms: 0 },
        escalation_risk: { status: 'running', duration_ms: 0 },
        knowledge_recommender: { status: 'waiting', duration_ms: 0 },
        coaching_suggestions: { status: 'waiting', duration_ms: 0 },
        self_critique: { status: 'waiting', duration_ms: 0 },
        policy_compliance: { status: 'waiting', duration_ms: 0 }
      }
    }));

    try {
      const token = localStorage.getItem('token');
      const endpoint = nextMsg.role === 'customer' ? 'customer-message' : 'message';
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/chat/${endpoint}?session_id=${sessionId}&message=${encodeURIComponent(nextMsg.content)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.body) throw new Error("No stream content body.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.replace('data:', '').trim();
            try {
              const data = JSON.parse(dataStr);
              if (data.status) {
                setStatusMessage(data.message);
              } else if (data.node) {
                setAnalysis(prev => ({
                  ...prev,
                  intent: data.state.current_intent || prev.intent,
                  sentiment: data.state.sentiment || prev.sentiment,
                  knowledge: data.state.retrieved_knowledge || prev.knowledge,
                  suggestions: data.state.coaching_suggestions || prev.suggestions,
                  critique: data.state.self_critique || prev.critique,
                  compliance: {
                    compliant: data.state.policy_compliance?.compliant ?? prev.compliance.compliant,
                    violation_reason: data.state.policy_compliance?.violation_reason ?? prev.compliance.violation_reason,
                    severity: data.state.policy_compliance?.severity ?? prev.compliance.severity,
                    confidence: data.state.policy_compliance?.confidence ?? prev.compliance.confidence
                  },
                  hallucination: {
                    is_hallucinated: data.state.hallucination_guard?.is_hallucinated ?? prev.hallucination.is_hallucinated,
                    flagged_claims: data.state.hallucination_guard?.flagged_claims ?? prev.hallucination.flagged_claims
                  },
                  risk: {
                    risk_percent: data.state.escalation_risk?.risk_percent ?? prev.risk.risk_percent,
                    risk_level: data.state.escalation_risk?.risk_level ?? prev.risk.risk_level,
                    reasons: data.state.escalation_risk?.reasons ?? prev.risk.reasons,
                    recommended_action: data.state.escalation_risk?.recommended_action ?? prev.risk.recommended_action
                  },
                  logs: data.state.agent_logs || prev.logs
                }));
              }
            } catch (err) {
              console.error("Error parsing replay chunk payload:", err, dataStr);
            }
          }
        }
      }
      setReplayIndex(prev => prev + 1);
      setStatusMessage(null);
    } catch (err) {
      console.error("SSE replay connection failure:", err);
      setStatusMessage("Failed to connect to agent server.");
    } finally {
      setIsProcessingReplay(false);
    }
  };

  const selectSuggestion = (replyText: string) => {
    setAgentInput(replyText);
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to export the PDF.");
      return;
    }
    
    const chatHtml = history.map(msg => `
      <div class="message ${msg.role}">
        <div class="meta">${msg.role === 'agent' ? 'AGENT (YOU)' : 'CUSTOMER'} - ${new Date(msg.timestamp).toLocaleTimeString()}</div>
        <div class="content">${msg.content}</div>
      </div>
    `).join('');

    const cleanRecommendations = analysis.knowledge.filter(rec => rec.text !== "No confident knowledge found.");
    const knowledgeHtml = cleanRecommendations.map(rec => `
      <div class="kb-item">
        <strong>${rec.document_name} (Page ${rec.page_number})</strong>
        <p>${rec.text}</p>
      </div>
    `).join('') || '<p>No knowledge recommendations accessed during this session.</p>';

    const htmlContent = `
      <html>
        <head>
          <title>VantrixAI Coaching Session - ${session?.id || 'Export'}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; background-color: #ffffff; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 5px; }
            .title { font-size: 18px; color: #64748b; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size: 13px; background-color: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .grid div { margin-bottom: 5px; }
            .section-title { font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #0f172a; margin-top: 30px; margin-bottom: 15px; border-left: 4px solid #4f46e5; padding-left: 10px; }
            .message { margin-bottom: 20px; padding: 12px 18px; border-radius: 12px; max-width: 80%; border: 1px solid #e2e8f0; }
            .message.agent { background-color: #f0fdf4; border-color: #bbf7d0; margin-left: auto; }
            .message.customer { background-color: #f8fafc; border-color: #e2e8f0; }
            .message .meta { font-size: 10px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 5px; }
            .message .content { font-size: 13px; color: #334155; }
            .kb-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 10px; font-size: 12px; }
            .kb-item strong { color: #4f46e5; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">VantrixAI</div>
            <div class="title">Coaching Session Transcript & Analysis Report</div>
          </div>
          
          <div class="grid">
            <div><strong>Session ID:</strong> ${session?.id || 'N/A'}</div>
            <div><strong>Interaction Mode:</strong> ${session?.interaction_mode || 'N/A'}</div>
            <div><strong>Product:</strong> ${session?.product || 'N/A'}</div>
            <div><strong>Industry:</strong> ${session?.industry || 'N/A'}</div>
            <div><strong>Customer Persona:</strong> ${session?.customer_persona || 'N/A'}</div>
            <div><strong>Customer Sentiment:</strong> ${analysis.sentiment.emotion || 'N/A'} (Score: ${analysis.sentiment.frustration_score || 'N/A'})</div>
            <div><strong>Escalation Risk Level:</strong> ${analysis.risk.risk_level?.toUpperCase() || 'LOW'} (${analysis.risk.risk_percent || 0}%)</div>
            <div><strong>Exported Date:</strong> ${new Date().toLocaleString()}</div>
          </div>
          
          <div class="section-title">Conversation History</div>
          <div class="chat-history">
            ${chatHtml}
          </div>
          
          <div class="section-title">Retrieved Policy Guidelines</div>
          <div class="kb-section">
            ${knowledgeHtml}
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getRiskColor = (level: string) => {
    if (level === 'high' || level === 'critical') return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
    if (level === 'medium') return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
    return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
  };

  const getRiskBarColor = (level: string) => {
    if (level === 'high' || level === 'critical') return 'bg-rose-500';
    if (level === 'medium') return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  if (loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 text-sm animate-pulse font-medium">Assembling live coaching layout...</p>
        </div>
      </div>
    );
  }

  const cleanRecommendations = analysis.knowledge.filter(rec => rec.text !== "No confident knowledge found.");
  const currentSuggestion = analysis.suggestions.find(s => s.type === selectedSuggestionType);
  const currentCritique = analysis.critique.find(c => c.mode === selectedSuggestionType);
  
  // List of agents for Collaboration viewer
  const agentViewerList = [
    { key: 'intent_detector', name: 'Intent Classifier' },
    { key: 'sentiment_analyst', name: 'Sentiment Analyst' },
    { key: 'escalation_risk', name: 'Escalation Risk' },
    { key: 'knowledge_recommender', name: 'RAG Retriever' },
    { key: 'coaching_suggestions', name: 'Suggestions Coach' },
    { key: 'self_critique', name: 'Critique Audit' },
    { key: 'policy_compliance', name: 'Policy Checker' }
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:text-white hover:border-slate-700 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-display font-bold text-xl text-white">Coaching Console</h1>
              <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold px-2.5 py-0.5 rounded-full capitalize">
                {session?.interaction_mode}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer: <span className="text-slate-300 font-semibold">{session?.customer_persona}</span> ({analysis.sentiment.emotion || session?.customer_mood})
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-md shadow-indigo-600/10"
            title="Download Chat PDF"
          >
            <FileText className="w-4 h-4 text-white" />
            <span>Download Chat PDF</span>
          </button>

          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-300 font-semibold">{session?.product}</p>
            <p className="text-[10px] text-slate-500">Vertical: {session?.industry} • Issue: {session?.issue_type}</p>
          </div>
        </div>
      </div>

      {/* Grid panels */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
        
        {/* PANEL 1: LEFT PANEL - Live Chat Feed (4 Cols) */}
        <div className="glass rounded-2xl border border-slate-900 flex flex-col min-h-0 lg:col-span-4">
          {/* Panel Header */}
          <div className="p-4 border-b border-slate-900 bg-slate-950/40 flex items-center justify-between">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              Live Conversation Feed
            </h2>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          {/* Messages Feed Viewport */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0">
            {history.map((msg, index) => (
              <div 
                key={index} 
                className={`flex flex-col max-w-[85%] ${msg.role === 'agent' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1 block">
                  {msg.role === 'agent' ? 'Agent (You)' : 'Customer'}
                </span>
                <div className={`p-3 rounded-2xl text-xs leading-relaxed border ${
                  msg.role === 'agent' 
                    ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-100 rounded-tr-none' 
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-200 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Active Streaming Typing Chunk */}
            {streamingCustomerMessage && (
              <div className="flex flex-col max-w-[85%] mr-auto items-start">
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1 block">
                  Customer
                </span>
                <div className="p-3 rounded-2xl text-xs leading-relaxed border bg-slate-900/60 border-slate-800/80 text-slate-200 rounded-tl-none">
                  {streamingCustomerMessage}
                  <span className="inline-block w-1.5 h-3 bg-indigo-400 ml-1 animate-pulse"></span>
                </div>
              </div>
            )}

            {/* Status updates / Typing notification */}
            {isTyping && (
              <div className="flex items-center space-x-2 text-slate-500 text-[10px] font-medium py-1">
                <Hourglass className="w-3 h-3 animate-spin text-indigo-400" />
                <span className="animate-pulse">Customer is drafting reply...</span>
              </div>
            )}
            
            {statusMessage && !isTyping && (
              <div className="flex items-center space-x-2 text-slate-500 text-[10px] font-medium py-1">
                <Activity className="w-3 h-3 animate-pulse text-indigo-400" />
                <span>{statusMessage}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Module 9: Agent Collaboration Viewer */}
          <div className="border-t border-slate-900 bg-slate-950/20 p-3">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              Agent Collaboration Pipeline
            </p>
            
            <div className="grid grid-cols-4 gap-1.5 text-[9px]">
              {agentViewerList.map((agent) => {
                const log = analysis.logs[agent.key] || { status: 'waiting', duration_ms: 0 };
                return (
                  <div 
                    key={agent.key} 
                    className={`p-1.5 border rounded-lg flex flex-col justify-between transition-all ${
                      log.status === 'running' 
                        ? 'border-amber-500/30 bg-amber-500/5 text-amber-300 animate-pulse' 
                        : log.status === 'completed'
                          ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
                          : 'border-slate-800 bg-slate-950/40 text-slate-500'
                    }`}
                  >
                    <span className="truncate font-semibold">{agent.name}</span>
                    <span className="mt-1 flex items-center justify-between text-[8px]">
                      <span className="uppercase text-[7px] font-bold">
                        {log.status === 'completed' ? 'Done' : log.status}
                      </span>
                      {log.status === 'completed' && (
                        <span className="opacity-80 font-mono">{log.duration_ms}ms</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Input Form */}
          {session?.interaction_mode === 'replay' ? (
            <div className="p-4 border-t border-slate-900 bg-slate-950/40 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Replay Progress</span>
                <span className="text-white font-bold font-mono">
                  {replayIndex} / {session?.preloaded_transcript?.length || 0} Turns Processed
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ 
                    width: `${((replayIndex) / (session?.preloaded_transcript?.length || 1)) * 100}%` 
                  }}
                ></div>
              </div>

              {replayIndex < (session?.preloaded_transcript?.length || 0) ? (
                <button
                  type="button"
                  disabled={isProcessingReplay}
                  onClick={handleNextReplayTurn}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/40 text-white text-xs font-bold py-3.5 rounded-xl shadow-lg shadow-purple-600/15 hover:shadow-purple-600/25 transition-all duration-150 flex items-center justify-center space-x-2"
                >
                  {isProcessingReplay ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing Transcript Node...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                      <span>Ingest Next Replay Turn ({session?.preloaded_transcript?.[replayIndex]?.role})</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-center text-xs font-semibold">
                  ✓ Preloaded transcript replayed successfully. Click "End Coaching Call" above to finalize report.
                </div>
              )}
            </div>
          ) : session?.interaction_mode === 'manual' ? (
            <div className="border-t border-slate-900 bg-slate-950/40 p-3 space-y-2">
              {/* Manual Mode Input Role Selector */}
              <div className="flex bg-slate-900/60 p-1 rounded-lg border border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setManualRole('agent')}
                  className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-all ${
                    manualRole === 'agent'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Agent Response (Coach suggestions)
                </button>
                <button
                  type="button"
                  onClick={() => setManualRole('customer')}
                  className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-all ${
                    manualRole === 'customer'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Paste Customer Input (Ingestion)
                </button>
              </div>

              {manualRole === 'agent' ? (
                <form onSubmit={handleSendMessage} className="relative">
                  <input
                    type="text"
                    value={agentInput}
                    onChange={(e) => setAgentInput(e.target.value)}
                    placeholder="Formulate support reply..."
                    disabled={isTyping}
                    className="w-full bg-slate-900 border border-slate-800/80 rounded-xl py-3 pl-4 pr-12 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!agentInput.trim() || isTyping}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSendCustomerMessage} className="relative">
                  <input
                    type="text"
                    value={customerInput}
                    onChange={(e) => setCustomerInput(e.target.value)}
                    placeholder="Paste customer response text..."
                    disabled={isTyping}
                    className="w-full bg-slate-900 border border-slate-800/80 rounded-xl py-3 pl-4 pr-12 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!customerInput.trim() || isTyping}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-sky-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg hover:bg-sky-500 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-900 bg-slate-950/40">
              <div className="relative">
                <input
                  type="text"
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  placeholder="Formulate support reply..."
                  disabled={isTyping || !!streamingCustomerMessage}
                  className="w-full bg-slate-900 border border-slate-800/80 rounded-xl py-3 pl-4 pr-12 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={!agentInput.trim() || isTyping || !!streamingCustomerMessage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* PANEL 2: CENTER PANEL - AI Coach suggestions & self critique (4 Cols) */}
        <div className="glass rounded-2xl border border-slate-900 p-4 flex flex-col min-h-0 lg:col-span-4">
          <div className="border-b border-slate-900 pb-3 mb-3">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              AI Coach recommendations
            </h2>
          </div>

          {analysis.suggestions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <Sparkles className="w-10 h-10 text-slate-600 mb-3 animate-pulse" />
              <p className="text-xs text-slate-400 font-semibold">No response suggestions yet.</p>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">
                Submit the agent's message to trigger coaching and review loops.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 space-y-4">
              
              {/* Tab Selector */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900">
                {['empathetic', 'professional', 'concise'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedSuggestionType(type)}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                      selectedSuggestionType === type
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Suggestions View */}
              {currentSuggestion && (
                <div className="flex-grow overflow-y-auto space-y-4 pr-1 min-h-0">
                  
                  {/* Suggestion Reply Textarea Display */}
                  <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-4 space-y-3 relative group">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block">Response Suggestion</span>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {currentSuggestion.reply}
                    </p>
                    <button
                      onClick={() => selectSuggestion(currentSuggestion.reply)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-300 hover:text-white rounded-lg text-[10px] font-bold uppercase transition-all duration-200"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Apply response suggestions
                    </button>
                  </div>

                  {/* Module 2: Self-Critique panel */}
                  {currentCritique && (
                    <div className="bg-slate-900/20 border border-slate-900/60 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                          Self-Critique Audit Log
                        </span>
                        <span className="text-[8px] font-mono text-slate-500">
                          Audit Conf: {(currentCritique.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      
                      {/* Original vs Improved Diff representation */}
                      <div className="space-y-2 text-[11px]">
                        {currentCritique.original_reply !== currentCritique.improved_reply ? (
                          <>
                            <div className="p-2 bg-rose-500/5 border border-rose-500/10 rounded-lg text-slate-400 leading-relaxed">
                              <span className="text-[8px] font-bold text-rose-400 block mb-1">ORIGINAL SUGGESTION:</span>
                              "{currentCritique.original_reply}"
                            </div>
                            <div className="p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-slate-200 leading-relaxed">
                              <span className="text-[8px] font-bold text-emerald-400 block mb-1">IMPROVED & REWRITTEN:</span>
                              "{currentCritique.improved_reply}"
                            </div>
                          </>
                        ) : (
                          <p className="text-slate-400 italic text-[10px]">No flaws detected during critique. Original version maintained.</p>
                        )}

                        {/* List of Improvements */}
                        {currentCritique.improvements.length > 0 && (
                          <div className="mt-2.5 space-y-1">
                            <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Improvements Made:</span>
                            {currentCritique.improvements.map((imp, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-slate-300 text-[10px]">
                                <ChevronRight className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                                <span>{imp}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Module 5: Explainability Panel */}
                  <div className="bg-slate-900/10 border border-slate-900/60 rounded-xl p-3.5 space-y-3">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      Explainability Details
                    </span>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Coach Confidence:</span>
                        <span className="text-white font-bold font-mono">{(currentSuggestion.confidence * 100).toFixed(0)}%</span>
                      </div>
                      
                      <div className="p-2 bg-slate-950/60 rounded-lg text-[10px] text-slate-400 leading-relaxed border border-slate-900">
                        <span className="text-[8px] font-bold text-slate-500 block uppercase mb-1">Coaching Decision Rationale:</span>
                        {currentSuggestion.reasoning}
                      </div>

                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500">Policy Rules Used:</span>
                        <span className="text-indigo-300 font-semibold uppercase text-[8px] tracking-wide">
                          {analysis.intent.category === 'billing' ? 'Refund SOP' : 'Warranty Rules'}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>

        {/* PANEL 3: RIGHT PANEL - Knowledge base, citations, risk metrics, policy gates (4 Cols) */}
        <div className="glass rounded-2xl border border-slate-900 p-4 flex flex-col min-h-0 lg:col-span-4 space-y-4">
          
          {/* Module 7: Escalation Risk Meter */}
          <div className="border-b border-slate-900 pb-3">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
              Escalation Risk Rating
            </h2>
            
            <div className="bg-slate-900/40 border border-slate-900 p-3.5 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase ${getRiskColor(analysis.risk.risk_level)}`}>
                  {analysis.risk.risk_level} Risk
                </span>
                <span className="text-xs font-bold font-mono text-white">
                  {analysis.risk.risk_percent.toFixed(0)}%
                </span>
              </div>
              
              {/* Progress Slider */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${getRiskBarColor(analysis.risk.risk_level)}`}
                  style={{ width: `${analysis.risk.risk_percent}%` }}
                ></div>
              </div>

              {/* Recommended Supervisor Action */}
              <div className="p-2 bg-slate-950 border border-slate-900 rounded-lg text-[10px] text-slate-300 leading-normal">
                <span className="text-[7.5px] font-bold text-slate-400 uppercase block mb-1">Recommended Coaching Action:</span>
                {analysis.risk.recommended_action}
              </div>
            </div>
          </div>

          {/* Module 3 & 4: Policy Compliance Checker & Hallucination Guard */}
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4.5 h-4.5 text-indigo-400" />
              Policy Compliance Gate
            </h2>

            <div className="space-y-2">
              <div className={`p-3.5 border rounded-xl flex items-start gap-3 text-[11px] ${
                analysis.compliance.compliant 
                  ? 'border-emerald-500/20 bg-emerald-500/5 text-slate-300'
                  : 'border-rose-500/20 bg-rose-500/5 text-slate-300'
              }`}>
                {analysis.compliance.compliant ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-white uppercase tracking-wide text-[9px]">
                    {analysis.compliance.compliant ? 'Response Policy Approved' : 'Policy Discrepancy Flagged'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    {analysis.compliance.compliant 
                      ? 'No illegal refund promises, warranty overreaches, or SOP compliance violations identified.'
                      : analysis.compliance.violation_reason}
                  </p>
                </div>
              </div>

              {/* Hallucination guard badge */}
              {analysis.hallucination.is_hallucinated && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-start space-x-2 text-[10px] leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <p className="font-bold text-white uppercase tracking-widest text-[8px]">Hallucination Guard Warning</p>
                    <p className="text-slate-300 mt-1">
                      Factual claims made in suggestions do not exist in vector documents. Verify details before sending.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Module 6: Citation Engine & Knowledge Recommendations */}
          <div className="flex-1 flex flex-col min-h-0">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5 border-b border-slate-900 pb-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Retrieved documents & Citations
            </h2>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
              {cleanRecommendations.length === 0 ? (
                <div className="text-center py-6 flex flex-col items-center justify-center">
                  <BookOpen className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-[10px] text-slate-400">No vector document citations generated.</p>
                </div>
              ) : (
                cleanRecommendations.map((rec, index) => (
                  <div key={index} className="bg-slate-900/30 border border-slate-900/60 p-3 rounded-xl space-y-2 text-xs relative overflow-hidden">
                    
                    {/* Citation metadata headers */}
                    <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <FileText className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="text-[10px] font-semibold text-slate-200 truncate" title={rec.document_name}>
                          {rec.document_name}
                        </span>
                      </div>
                      
                      <span className="text-[8px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-medium">
                        Page {rec.page_number}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed italic">
                      "{rec.text}"
                    </p>

                    {/* Citations metadata */}
                    <div className="flex justify-between items-center text-[8px] text-slate-500 pt-1">
                      <span>Chunk: <span className="font-mono text-slate-400">{rec.chunk_id}</span></span>
                      <span>Citation Conf: <span className="font-bold text-emerald-400">{(rec.confidence_score * 100).toFixed(0)}%</span></span>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
