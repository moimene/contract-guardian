import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  EscalationRequest,
  EscalationComment,
  EscalationFilters,
  EscalationStatus,
  EscalationUrgency,
} from '@/types/contracts';

// ============================================================================
// FETCH ESCALATIONS
// ============================================================================

export function useEscalations(filters?: EscalationFilters) {
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['escalations', filters],
    queryFn: async (): Promise<EscalationRequest[]> => {
      let queryBuilder = supabase
        .from('escalation_requests')
        .select(`
          *,
          clause_reviews(heading, detected_family),
          documents(file_name),
          assigned_profile:profiles!escalation_requests_assigned_to_fkey(full_name),
          created_profile:profiles!escalation_requests_created_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status && filters.status.length > 0) {
        queryBuilder = queryBuilder.in('status', filters.status);
      }

      if (filters?.urgency && filters.urgency.length > 0) {
        queryBuilder = queryBuilder.in('urgency', filters.urgency);
      }

      if (filters?.assignedTo) {
        queryBuilder = queryBuilder.eq('assigned_to', filters.assignedTo);
      }

      if (filters?.documentId) {
        queryBuilder = queryBuilder.eq('document_id', filters.documentId);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      return (data || []).map((row: any) => ({
        escalation_id: row.escalation_id,
        clause_instance_id: row.clause_instance_id,
        document_id: row.document_id,
        run_id: row.run_id,
        reason: row.reason || '',
        context: row.context || '',
        urgency: row.urgency as EscalationUrgency,
        status: row.status as EscalationStatus,
        assigned_to: row.assigned_to,
        assigned_to_name: row.assigned_profile?.full_name,
        resolution: row.resolution,
        resolution_notes: row.resolution_notes,
        created_by: row.created_by,
        created_by_name: row.created_profile?.full_name,
        created_at: row.created_at,
        resolved_at: row.resolved_at,
        resolved_by: row.resolved_by,
        // Extra context from joins
        clause_heading: row.clause_reviews?.heading,
        clause_family: row.clause_reviews?.detected_family,
        document_name: row.documents?.file_name,
      }));
    },
    refetchInterval: realtimeEnabled ? false : 10000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!realtimeEnabled) return;

    const channel = supabase
      .channel('escalations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'escalation_requests',
        },
        (payload) => {
          console.log('Escalation update:', payload);
          queryClient.invalidateQueries({ queryKey: ['escalations'] });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('Realtime subscription failed for escalations');
          setRealtimeEnabled(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [realtimeEnabled, queryClient]);

  return {
    ...query,
    realtimeEnabled,
  };
}

// ============================================================================
// FETCH SINGLE ESCALATION
// ============================================================================

export function useEscalation(escalationId: string | undefined) {
  return useQuery({
    queryKey: ['escalation', escalationId],
    queryFn: async (): Promise<EscalationRequest | null> => {
      if (!escalationId) return null;

      const { data, error } = await supabase
        .from('escalation_requests')
        .select(`
          *,
          clause_reviews(heading, detected_family, clause_text),
          documents(file_name),
          assigned_profile:profiles!escalation_requests_assigned_to_fkey(full_name),
          created_profile:profiles!escalation_requests_created_by_fkey(full_name)
        `)
        .eq('escalation_id', escalationId)
        .single();

      if (error) throw error;

      return {
        escalation_id: data.escalation_id,
        clause_instance_id: data.clause_instance_id,
        document_id: data.document_id,
        run_id: data.run_id,
        reason: data.reason || '',
        context: data.context || '',
        urgency: data.urgency as EscalationUrgency,
        status: data.status as EscalationStatus,
        assigned_to: data.assigned_to,
        assigned_to_name: data.assigned_profile?.full_name,
        resolution: data.resolution,
        resolution_notes: data.resolution_notes,
        created_by: data.created_by,
        created_by_name: data.created_profile?.full_name,
        created_at: data.created_at,
        resolved_at: data.resolved_at,
        resolved_by: data.resolved_by,
      };
    },
    enabled: !!escalationId,
  });
}

// ============================================================================
// FETCH ESCALATION COMMENTS
// ============================================================================

export function useEscalationComments(escalationId: string | undefined) {
  return useQuery({
    queryKey: ['escalation_comments', escalationId],
    queryFn: async (): Promise<EscalationComment[]> => {
      if (!escalationId) return [];

      const { data, error } = await supabase
        .from('escalation_comments')
        .select(`
          *,
          profiles(full_name)
        `)
        .eq('escalation_id', escalationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((row: any) => ({
        comment_id: row.comment_id,
        escalation_id: row.escalation_id,
        author_id: row.author_id,
        author_name: row.profiles?.full_name || 'Unknown',
        content: row.content,
        created_at: row.created_at,
      }));
    },
    enabled: !!escalationId,
  });
}

// ============================================================================
// ESCALATION ACTIONS
// ============================================================================

export function useEscalationActions() {
  const queryClient = useQueryClient();

  // Create new escalation
  const createEscalation = useMutation({
    mutationFn: async ({
      clauseInstanceId,
      documentId,
      runId,
      reason,
      context,
      urgency = 'medium',
    }: {
      clauseInstanceId: string;
      documentId: string;
      runId: string;
      reason: string;
      context?: string;
      urgency?: EscalationUrgency;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('escalation_requests')
        .insert({
          clause_instance_id: clauseInstanceId,
          document_id: documentId,
          run_id: runId,
          reason,
          context: context || '',
          urgency,
          status: 'pending',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update clause to mark as escalated
      await supabase
        .from('clause_reviews')
        .update({
          escalation_recommended: true,
          escalation_reason: reason,
          client_state: 'NEEDS_REVIEW',
        })
        .eq('clause_instance_id', clauseInstanceId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] });
      queryClient.invalidateQueries({ queryKey: ['clause_reviews'] });
    },
  });

  // Assign escalation to user
  const assignEscalation = useMutation({
    mutationFn: async ({
      escalationId,
      assignedTo,
    }: {
      escalationId: string;
      assignedTo: string;
    }) => {
      const { error } = await supabase
        .from('escalation_requests')
        .update({
          assigned_to: assignedTo,
          status: 'in_review',
        })
        .eq('escalation_id', escalationId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['escalation', variables.escalationId] });
      queryClient.invalidateQueries({ queryKey: ['escalations'] });
    },
  });

  // Resolve escalation
  const resolveEscalation = useMutation({
    mutationFn: async ({
      escalationId,
      resolution,
      resolutionNotes,
      approveChanges = false,
    }: {
      escalationId: string;
      resolution: 'approved' | 'rejected' | 'modified';
      resolutionNotes?: string;
      approveChanges?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: escalation, error: fetchError } = await supabase
        .from('escalation_requests')
        .select('clause_instance_id')
        .eq('escalation_id', escalationId)
        .single();

      if (fetchError) throw fetchError;

      // Update escalation
      const { error } = await supabase
        .from('escalation_requests')
        .update({
          status: 'resolved',
          resolution,
          resolution_notes: resolutionNotes,
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        })
        .eq('escalation_id', escalationId);

      if (error) throw error;

      // Update clause status based on resolution
      let newClauseStatus: EscalationStatus = 'resolved';
      if (resolution === 'approved' && approveChanges) {
        newClauseStatus = 'resolved';
        await supabase
          .from('clause_reviews')
          .update({
            client_state: 'OK',
            escalation_recommended: false,
          })
          .eq('clause_instance_id', escalation.clause_instance_id);
      } else if (resolution === 'rejected') {
        await supabase
          .from('clause_reviews')
          .update({
            client_state: 'BLOCKED',
          })
          .eq('clause_instance_id', escalation.clause_instance_id);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['escalation', variables.escalationId] });
      queryClient.invalidateQueries({ queryKey: ['escalations'] });
      queryClient.invalidateQueries({ queryKey: ['clause_reviews'] });
    },
  });

  // Add comment to escalation
  const addComment = useMutation({
    mutationFn: async ({
      escalationId,
      content,
    }: {
      escalationId: string;
      content: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('escalation_comments')
        .insert({
          escalation_id: escalationId,
          author_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['escalation_comments', variables.escalationId] });
    },
  });

  return {
    createEscalation,
    assignEscalation,
    resolveEscalation,
    addComment,
  };
}

// ============================================================================
// ESCALATION COUNTS
// ============================================================================

export function useEscalationCounts() {
  return useQuery({
    queryKey: ['escalation_counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escalation_requests')
        .select('status, urgency');

      if (error) throw error;

      const counts = {
        total: data?.length || 0,
        pending: 0,
        in_review: 0,
        resolved: 0,
        high_urgency: 0,
      };

      (data || []).forEach((row) => {
        if (row.status === 'pending') counts.pending++;
        if (row.status === 'in_review') counts.in_review++;
        if (row.status === 'resolved') counts.resolved++;
        if (row.urgency === 'high' && row.status !== 'resolved') counts.high_urgency++;
      });

      return counts;
    },
  });
}
