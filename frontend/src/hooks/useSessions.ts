import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionService } from '../services/sessionService';
import { SessionConfig, SessionStatus } from '../types/session';

export const useSessions = () => {
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ['sessions'],
    queryFn: sessionService.getSessions,
  });

  const createSessionMutation = useMutation({
    mutationFn: (config: SessionConfig) => sessionService.createSession(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SessionStatus }) =>
      sessionService.updateSessionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });

  return {
    sessions: sessionsQuery.data || [],
    isLoading: sessionsQuery.isLoading,
    isError: sessionsQuery.isError,
    error: sessionsQuery.error,
    createSession: createSessionMutation.mutateAsync,
    isCreating: createSessionMutation.isPending,
    updateSessionStatus: updateSessionMutation.mutateAsync,
    isUpdating: updateSessionMutation.isPending,
  };
};
