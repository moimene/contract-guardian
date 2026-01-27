import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  ClauseReview,
  ProposedChange,
  ClauseFilters,
  ContractReviewSummary,
  ClauseStatus,
  ContractTypology,
} from '@/types/contracts';

// ============================================================================
// FETCH CLAUSES FOR A DOCUMENT/RUN
// ============================================================================

export function useClauseReviews(documentId: string | undefined, runId?: string) {
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['clause_reviews', documentId, runId],
    queryFn: async (): Promise<ClauseReview[]> => {
      if (!documentId) return [];

      let queryBuilder = supabase
        .from('clause_reviews')
        .select('*')
        .eq('document_id', documentId)
        .order('sequence_number', { ascending: true });

      if (runId) {
        queryBuilder = queryBuilder.eq('run_id', runId);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      // Transform data to match ClauseReview interface
      return (data || []).map((row: any) => ({
        clause_instance_id: row.clause_instance_id,
        clause_id: row.clause_id,
        document_id: row.document_id,
        run_id: row.run_id,
        sequence_number: row.sequence_number,
        heading: row.heading || '',
        clause_text: row.clause_text || '',
        detected_family: row.detected_family || '',
        confidence_score: row.confidence_score || 0,
        client_state: row.client_state as ClauseStatus,
        client_comment: row.client_comment || '',
        client_summary_line: row.client_summary_line || '',
        proposed_changes: (row.proposed_changes as ProposedChange[]) || [],
        escalation_recommended: row.escalation_recommended || false,
        escalation_reason: row.escalation_reason || undefined,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    },
    enabled: !!documentId,
    refetchInterval: realtimeEnabled ? false : 5000, // Fallback polling if realtime fails
  });

  // Realtime subscription for clause updates
  useEffect(() => {
    if (!documentId || !realtimeEnabled) return;

    const channel = supabase
      .channel(`clause-reviews-${documentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clause_reviews',
          filter: `document_id=eq.${documentId}`,
        },
        (payload: any) => {
          console.log('Clause review update:', payload);
          queryClient.invalidateQueries({ queryKey: ['clause_reviews', documentId] });
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime subscription active for clause reviews');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('Realtime subscription failed, falling back to polling');
          setRealtimeEnabled(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [documentId, realtimeEnabled, queryClient]);

  return {
    ...query,
    realtimeEnabled,
  };
}

// ============================================================================
// FETCH SINGLE CLAUSE
// ============================================================================

export function useClauseReview(clauseInstanceId: string | undefined) {
  return useQuery({
    queryKey: ['clause_review', clauseInstanceId],
    queryFn: async (): Promise<ClauseReview | null> => {
      if (!clauseInstanceId) return null;

      const { data, error } = await supabase
        .from('clause_reviews')
        .select('*')
        .eq('clause_instance_id', clauseInstanceId)
        .single();

      if (error) throw error;

      const row = data as any;
      return {
        clause_instance_id: row.clause_instance_id,
        clause_id: row.clause_id,
        document_id: row.document_id,
        run_id: row.run_id,
        sequence_number: row.sequence_number,
        heading: row.heading || '',
        clause_text: row.clause_text || '',
        detected_family: row.detected_family || '',
        confidence_score: row.confidence_score || 0,
        client_state: row.client_state as ClauseStatus,
        client_comment: row.client_comment || '',
        client_summary_line: row.client_summary_line || '',
        proposed_changes: (row.proposed_changes as ProposedChange[]) || [],
        escalation_recommended: row.escalation_recommended || false,
        escalation_reason: row.escalation_reason || undefined,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    },
    enabled: !!clauseInstanceId,
  });
}

// ============================================================================
// GET CONTRACT REVIEW SUMMARY
// ============================================================================

export function useContractReviewSummary(documentId: string | undefined, runId?: string) {
  return useQuery({
    queryKey: ['contract_review_summary', documentId, runId],
    queryFn: async (): Promise<ContractReviewSummary | null> => {
      if (!documentId) return null;

      // Get document info
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('*, contract_types(*)')
        .eq('document_id', documentId)
        .single();

      if (docError) throw docError;

      const docData = doc as any;

      // Get run info
      let runQuery = supabase
        .from('contract_runs')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (runId) {
        runQuery = runQuery.eq('run_id', runId);
      }

      const { data: runs, error: runError } = await runQuery.limit(1);
      if (runError) throw runError;

      const latestRun = (runs as any[])?.[0];

      // Get clause counts
      let clauseQuery = supabase
        .from('clause_reviews')
        .select('client_state')
        .eq('document_id', documentId);

      if (runId) {
        clauseQuery = clauseQuery.eq('run_id', runId);
      } else if (latestRun) {
        clauseQuery = clauseQuery.eq('run_id', latestRun.run_id);
      }

      const { data: clauses, error: clauseError } = await clauseQuery;
      if (clauseError) throw clauseError;

      // Count by status
      const counts = ((clauses as any[]) || []).reduce(
        (acc, clause) => {
          const status = clause.client_state as ClauseStatus;
          acc[status] = (acc[status] || 0) + 1;
          acc.total++;
          return acc;
        },
        { total: 0, OK: 0, RECOMMENDED: 0, REQUIRED: 0, NEEDS_REVIEW: 0, BLOCKED: 0 } as Record<string, number>
      );

      const reviewed = counts.OK + counts.RECOMMENDED;
      const progress = counts.total > 0 ? Math.round((reviewed / counts.total) * 100) : 0;

      return {
        document_id: documentId,
        run_id: latestRun?.run_id || '',
        file_name: docData.file_name,
        contract_type: (docData.contract_types?.type_id || 'unknown') as ContractTypology,
        contract_decision: latestRun?.decision || 'PROCESSING',
        total_clauses: counts.total,
        ok_count: counts.OK,
        recommended_count: counts.RECOMMENDED,
        required_count: counts.REQUIRED,
        needs_review_count: counts.NEEDS_REVIEW,
        blocked_count: counts.BLOCKED,
        progress_percentage: progress,
        created_at: docData.created_at,
        updated_at: latestRun?.completed_at || docData.updated_at,
      };
    },
    enabled: !!documentId,
  });
}

// ============================================================================
// CLAUSE ACTIONS
// ============================================================================

export function useClauseActions() {
  const queryClient = useQueryClient();

  // Accept a proposed change
  const acceptChange = useMutation({
    mutationFn: async ({
      clauseInstanceId,
      changeId,
    }: {
      clauseInstanceId: string;
      changeId: string;
    }) => {
      // First get current clause
      const { data: clause, error: fetchError } = await supabase
        .from('clause_reviews')
        .select('proposed_changes')
        .eq('clause_instance_id', clauseInstanceId)
        .single();

      if (fetchError) throw fetchError;

      const clauseData = clause as any;
      // Update the specific change
      const updatedChanges = ((clauseData.proposed_changes as ProposedChange[]) || []).map((change: ProposedChange) =>
        change.change_id === changeId
          ? { ...change, accepted: true, rejected: false }
          : change
      );

      const { error } = await supabase
        .from('clause_reviews')
        .update({
          proposed_changes: updatedChanges as any,
          updated_at: new Date().toISOString(),
        })
        .eq('clause_instance_id', clauseInstanceId);

      if (error) throw error;
    },
    onSuccess: (_: any, variables: { clauseInstanceId: string; changeId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['clause_review', variables.clauseInstanceId] });
      queryClient.invalidateQueries({ queryKey: ['clause_reviews'] });
    },
  });

  // Reject a proposed change
  const rejectChange = useMutation({
    mutationFn: async ({
      clauseInstanceId,
      changeId,
    }: {
      clauseInstanceId: string;
      changeId: string;
    }) => {
      const { data: clause, error: fetchError } = await supabase
        .from('clause_reviews')
        .select('proposed_changes')
        .eq('clause_instance_id', clauseInstanceId)
        .single();

      if (fetchError) throw fetchError;

      const clauseData = clause as any;
      const updatedChanges = ((clauseData.proposed_changes as ProposedChange[]) || []).map((change: ProposedChange) =>
        change.change_id === changeId
          ? { ...change, accepted: false, rejected: true }
          : change
      );

      const { error } = await supabase
        .from('clause_reviews')
        .update({
          proposed_changes: updatedChanges as any,
          updated_at: new Date().toISOString(),
        })
        .eq('clause_instance_id', clauseInstanceId);

      if (error) throw error;
    },
    onSuccess: (_: any, variables: { clauseInstanceId: string; changeId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['clause_review', variables.clauseInstanceId] });
      queryClient.invalidateQueries({ queryKey: ['clause_reviews'] });
    },
  });

  // Accept all changes for a clause
  const acceptAllChanges = useMutation({
    mutationFn: async (clauseInstanceId: string) => {
      const { data: clause, error: fetchError } = await supabase
        .from('clause_reviews')
        .select('proposed_changes')
        .eq('clause_instance_id', clauseInstanceId)
        .single();

      if (fetchError) throw fetchError;

      const clauseData = clause as any;
      const updatedChanges = ((clauseData.proposed_changes as ProposedChange[]) || []).map((change: ProposedChange) => ({
        ...change,
        accepted: true,
        rejected: false,
      }));

      const { error } = await supabase
        .from('clause_reviews')
        .update({
          proposed_changes: updatedChanges as any,
          client_state: 'OK',
          updated_at: new Date().toISOString(),
        })
        .eq('clause_instance_id', clauseInstanceId);

      if (error) throw error;
    },
    onSuccess: (_: any, clauseInstanceId: string) => {
      queryClient.invalidateQueries({ queryKey: ['clause_review', clauseInstanceId] });
      queryClient.invalidateQueries({ queryKey: ['clause_reviews'] });
    },
  });

  // Update clause status
  const updateClauseStatus = useMutation({
    mutationFn: async ({
      clauseInstanceId,
      status,
      comment,
    }: {
      clauseInstanceId: string;
      status: ClauseStatus;
      comment?: string;
    }) => {
      const updateData: any = {
        client_state: status,
        updated_at: new Date().toISOString(),
      };

      if (comment !== undefined) {
        updateData.client_comment = comment;
      }

      const { error } = await supabase
        .from('clause_reviews')
        .update(updateData)
        .eq('clause_instance_id', clauseInstanceId);

      if (error) throw error;
    },
    onSuccess: (_: any, variables: { clauseInstanceId: string; status: ClauseStatus; comment?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['clause_review', variables.clauseInstanceId] });
      queryClient.invalidateQueries({ queryKey: ['clause_reviews'] });
    },
  });

  return {
    acceptChange,
    rejectChange,
    acceptAllChanges,
    updateClauseStatus,
  };
}

// ============================================================================
// FILTER HELPERS
// ============================================================================

export function useFilteredClauses(
  clauses: ClauseReview[] | undefined,
  filters: ClauseFilters
): ClauseReview[] {
  return useCallback(() => {
    if (!clauses) return [];

    return clauses.filter((clause) => {
      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(clause.client_state)) {
          return false;
        }
      }

      // Family filter
      if (filters.family && filters.family.length > 0) {
        if (!filters.family.includes(clause.detected_family)) {
          return false;
        }
      }

      // Has changes filter
      if (filters.hasChanges !== undefined) {
        const hasChanges = clause.proposed_changes && clause.proposed_changes.length > 0;
        if (filters.hasChanges !== hasChanges) {
          return false;
        }
      }

      // Has escalation filter
      if (filters.hasEscalation !== undefined) {
        if (filters.hasEscalation !== clause.escalation_recommended) {
          return false;
        }
      }

      // Search query filter
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesHeading = clause.heading.toLowerCase().includes(query);
        const matchesText = clause.clause_text.toLowerCase().includes(query);
        const matchesFamily = clause.detected_family.toLowerCase().includes(query);
        if (!matchesHeading && !matchesText && !matchesFamily) {
          return false;
        }
      }

      return true;
    });
  }, [clauses, filters])();
}
