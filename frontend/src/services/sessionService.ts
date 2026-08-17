import api from './api';
import { Session, SessionConfig, SessionStatus } from '../types/session';

export const sessionService = {
  async createSession(config: SessionConfig): Promise<Session> {
    const response = await api.post<Session>('/api/sessions/', config);
    return response.data;
  },

  async getSessions(): Promise<Session[]> {
    const response = await api.get<Session[]>('/api/sessions/');
    return response.data;
  },

  async updateSessionStatus(sessionId: string, status: SessionStatus): Promise<Session> {
    const response = await api.patch<Session>(`/api/sessions/${sessionId}`, { status });
    return response.data;
  },
};
