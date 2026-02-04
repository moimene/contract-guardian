"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useClauseReviews = useClauseReviews;
exports.useClauseReview = useClauseReview;
exports.useContractReviewSummary = useContractReviewSummary;
exports.useClauseActions = useClauseActions;
exports.useFilteredClauses = useFilteredClauses;
const react_query_1 = require("@tanstack/react-query");
const react_1 = require("react");
const client_1 = require("@/integrations/supabase/client");
// ============================================================================
// FETCH CLAUSES FOR A DOCUMENT/RUN
// ============================================================================
function useClauseReviews(documentId, runId) {
    const [realtimeEnabled, setRealtimeEnabled] = (0, react_1.useState)(true);
    const queryClient = (0, react_query_1.useQueryClient)();
    const query = (0, react_query_1.useQuery)({
        queryKey: ['clause_reviews', documentId, runId],
        queryFn: async () => {
            if (!documentId)
                return [];
            let queryBuilder = client_1.supabase
                .from('clause_reviews')
                .select('*')
                .eq('document_id', documentId)
                .order('sequence_number', { ascending: true });
            if (runId) {
                queryBuilder = queryBuilder.eq('run_id', runId);
            }
            const { data, error } = await queryBuilder;
            if (error)
                throw error;
            // Transform data to match ClauseReview interface
            return (data || []).map((row) => ({
                clause_instance_id: row.clause_instance_id,
                clause_id: row.clause_id,
                document_id: row.document_id,
                run_id: row.run_id,
                sequence_number: row.sequence_number,
                heading: row.heading || '',
                clause_text: row.clause_text || '',
                detected_family: row.detected_family || '',
                confidence_score: row.confidence_score || 0,
                client_state: row.client_state,
                client_comment: row.client_comment || '',
                client_summary_line: row.client_summary_line || '',
                proposed_changes: row.proposed_changes || [],
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
    (0, react_1.useEffect)(() => {
        if (!documentId || !realtimeEnabled)
            return;
        const channel = client_1.supabase
            .channel(`clause-reviews-${documentId}`)
            .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'clause_reviews',
            filter: `document_id=eq.${documentId}`,
        }, (payload) => {
            console.log('Clause review update:', payload);
            queryClient.invalidateQueries({ queryKey: ['clause_reviews', documentId] });
        })
            .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('Realtime subscription active for clause reviews');
            }
            else if (status === 'CHANNEL_ERROR') {
                console.warn('Realtime subscription failed, falling back to polling');
                setRealtimeEnabled(false);
            }
        });
        return () => {
            client_1.supabase.removeChannel(channel);
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
function useClauseReview(clauseInstanceId) {
    return (0, react_query_1.useQuery)({
        queryKey: ['clause_review', clauseInstanceId],
        queryFn: async () => {
            if (!clauseInstanceId)
                return null;
            const { data, error } = await client_1.supabase
                .from('clause_reviews')
                .select('*')
                .eq('clause_instance_id', clauseInstanceId)
                .single();
            if (error)
                throw error;
            const row = data;
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
                client_state: row.client_state,
                client_comment: row.client_comment || '',
                client_summary_line: row.client_summary_line || '',
                proposed_changes: row.proposed_changes || [],
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
function useContractReviewSummary(documentId, runId) {
    return (0, react_query_1.useQuery)({
        queryKey: ['contract_review_summary', documentId, runId],
        queryFn: async () => {
            if (!documentId)
                return null;
            // Get document info
            const { data: doc, error: docError } = await client_1.supabase
                .from('documents')
                .select('*, contract_types(*)')
                .eq('document_id', documentId)
                .single();
            if (docError)
                throw docError;
            const docData = doc;
            // Get run info
            let runQuery = client_1.supabase
                .from('contract_runs')
                .select('*')
                .eq('document_id', documentId)
                .order('created_at', { ascending: false });
            if (runId) {
                runQuery = runQuery.eq('run_id', runId);
            }
            const { data: runs, error: runError } = await runQuery.limit(1);
            if (runError)
                throw runError;
            const latestRun = runs?.[0];
            // Get clause counts
            let clauseQuery = client_1.supabase
                .from('clause_reviews')
                .select('client_state')
                .eq('document_id', documentId);
            if (runId) {
                clauseQuery = clauseQuery.eq('run_id', runId);
            }
            else if (latestRun) {
                clauseQuery = clauseQuery.eq('run_id', latestRun.run_id);
            }
            const { data: clauses, error: clauseError } = await clauseQuery;
            if (clauseError)
                throw clauseError;
            // Count by status
            const counts = (clauses || []).reduce((acc, clause) => {
                const status = clause.client_state;
                acc[status] = (acc[status] || 0) + 1;
                acc.total++;
                return acc;
            }, { total: 0, OK: 0, RECOMMENDED: 0, REQUIRED: 0, NEEDS_REVIEW: 0, BLOCKED: 0 });
            const reviewed = counts.OK + counts.RECOMMENDED;
            const progress = counts.total > 0 ? Math.round((reviewed / counts.total) * 100) : 0;
            return {
                document_id: documentId,
                run_id: latestRun?.run_id || '',
                file_name: docData.file_name,
                contract_type: (docData.contract_types?.type_id || 'unknown'),
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
function useClauseActions() {
    const queryClient = (0, react_query_1.useQueryClient)();
    // Accept a proposed change
    const acceptChange = (0, react_query_1.useMutation)({
        mutationFn: async ({ clauseInstanceId, changeId, }) => {
            // First get current clause
            const { data: clause, error: fetchError } = await client_1.supabase
                .from('clause_reviews')
                .select('proposed_changes')
                .eq('clause_instance_id', clauseInstanceId)
                .single();
            if (fetchError)
                throw fetchError;
            const clauseData = clause;
            // Update the specific change
            const updatedChanges = (clauseData.proposed_changes || []).map((change) => change.change_id === changeId
                ? { ...change, accepted: true, rejected: false }
                : change);
            const { error } = await client_1.supabase
                .from('clause_reviews')
                .update({
                proposed_changes: updatedChanges,
                updated_at: new Date().toISOString(),
            })
                .eq('clause_instance_id', clauseInstanceId);
            if (error)
                throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['clause_review', variables.clauseInstanceId] });
            queryClient.invalidateQueries({ queryKey: ['clause_reviews'] });
        },
    });
    // Reject a proposed change
    const rejectChange = (0, react_query_1.useMutation)({
        mutationFn: async ({ clauseInstanceId, changeId, }) => {
            const { data: clause, error: fetchError } = await client_1.supabase
                .from('clause_reviews')
                .select('proposed_changes')
                .eq('clause_instance_id', clauseInstanceId)
                .single();
            if (fetchError)
                throw fetchError;
            const clauseData = clause;
            const updatedChanges = (clauseData.proposed_changes || []).map((change) => change.change_id === changeId
                ? { ...change, accepted: false, rejected: true }
                : change);
            const { error } = await client_1.supabase
                .from('clause_reviews')
                .update({
                proposed_changes: updatedChanges,
                updated_at: new Date().toISOString(),
            })
                .eq('clause_instance_id', clauseInstanceId);
            if (error)
                throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['clause_review', variables.clauseInstanceId] });
            queryClient.invalidateQueries({ queryKey: ['clause_reviews'] });
        },
    });
    // Accept all changes for a clause
    const acceptAllChanges = (0, react_query_1.useMutation)({
        mutationFn: async (clauseInstanceId) => {
            const { data: clause, error: fetchError } = await client_1.supabase
                .from('clause_reviews')
                .select('proposed_changes')
                .eq('clause_instance_id', clauseInstanceId)
                .single();
            if (fetchError)
                throw fetchError;
            const clauseData = clause;
            const updatedChanges = (clauseData.proposed_changes || []).map((change) => ({
                ...change,
                accepted: true,
                rejected: false,
            }));
            const { error } = await client_1.supabase
                .from('clause_reviews')
                .update({
                proposed_changes: updatedChanges,
                client_state: 'OK',
                updated_at: new Date().toISOString(),
            })
                .eq('clause_instance_id', clauseInstanceId);
            if (error)
                throw error;
        },
        onSuccess: (_, clauseInstanceId) => {
            queryClient.invalidateQueries({ queryKey: ['clause_review', clauseInstanceId] });
            queryClient.invalidateQueries({ queryKey: ['clause_reviews'] });
        },
    });
    // Update clause status
    const updateClauseStatus = (0, react_query_1.useMutation)({
        mutationFn: async ({ clauseInstanceId, status, comment, }) => {
            const updateData = {
                client_state: status,
                updated_at: new Date().toISOString(),
            };
            if (comment !== undefined) {
                updateData.client_comment = comment;
            }
            const { error } = await client_1.supabase
                .from('clause_reviews')
                .update(updateData)
                .eq('clause_instance_id', clauseInstanceId);
            if (error)
                throw error;
        },
        onSuccess: (_, variables) => {
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
function useFilteredClauses(clauses, filters) {
    return (0, react_1.useCallback)(() => {
        if (!clauses)
            return [];
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
//# sourceMappingURL=useClauseReviews.js.map