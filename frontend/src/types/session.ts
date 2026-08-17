export type InteractionMode = 'simulator' | 'manual' | 'replay';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type SessionStatus = 'active' | 'completed';

export interface TranscriptMessage {
  role: 'customer' | 'agent';
  content: string;
}

export interface SessionConfig {
  interaction_mode: InteractionMode;
  industry: string;
  product: string;
  issue_type: string;
  difficulty: DifficultyLevel;
  customer_persona: string;
  customer_mood: string;
  preloaded_transcript?: TranscriptMessage[] | null;
}

export interface Session extends SessionConfig {
  id: string;
  agent_id: string;
  status: SessionStatus;
  created_at: string;
  post_interaction_summary?: any;
  replay_timeline?: any[];
}
