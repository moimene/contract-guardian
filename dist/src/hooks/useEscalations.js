"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEscalations = useEscalations;
exports.useEscalation = useEscalation;
exports.useEscalationComments = useEscalationComments;
exports.useEscalationActions = useEscalationActions;
exports.useEscalationCounts = useEscalationCounts;
const react_query_1 = require("@tanstack/react-query");
const react_1 = require("react");
const client_1 = require("@/integrations/supabase/client");
// ============================================================================
// FETCH ESCALATIONS
// ============================================================================
function useEscalations(filters) {
    const [realtimeEnabled, setRealtimeEnabled] = (0, react_1.useState)(true);
    const queryClient = (0, react_query_1.useQueryClient)();
    const query = (0, react_query_1.useQuery)({
        queryKey: ['escalations', filters],
        queryFn: async () => {
            let queryBuilder = client_1.supabase
                .from('escalation_requests')
                .select('*')
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
            if (error)
                throw error;
            return (data || []).map((row) => ({
                escalation_id: row.escalation_id || row.id,
                clause_instance_id: row.clause_instance_id || '',
                document_id: row.document_id || '',
                run_id: row.run_id,
                reason: row.reason || '',
                context: row.context || '',
                urgency: (row.urgency || 'medium'),
                status: (row.status || 'pending'),
                assigned_to: row.assigned_to || undefined,
                assigned_to_name: undefined,
                resolution: row.resolution || undefined,
                resolution_notes: row.resolution_notes || undefined,
                created_by: row.created_by || row.requested_by || '',
                created_by_name: undefined,
                created_at: row.created_at,
                resolved_at: row.resolved_at || undefined,
                resolved_by: row.resolved_by || undefined,
            }));
        },
        refetchInterval: realtimeEnabled ? false : 10000,
    });
    // Realtime subscription
    (0, react_1.useEffect)(() => {
        if (!realtimeEnabled)
            return;
        const channel = client_1.supabase
            .channel('escalations-changes')
            .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'escalation_requests',
        }, (payload) => {
            console.log('Escalation update:', payload);
            queryClient.invalidateQueries({ queryKey: ['escalations'] });
        })
            .subscribe((status) => {
            if (status === 'CHANNEL_ERROR') {
                console.warn('Realtime subscription failed for escalations');
                setRealtimeEnabled(false);
            }
        });
        return () => {
            client_1.supabase.removeChannel(channel);
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
function useEscalation(escalationId) {
    return (0, react_query_1.useQuery)({
        queryKey: ['escalation', escalationId],
        queryFn: async () => {
            if (!escalationId)
                return null;
            const { data, error } = await client_1.supabase
                .from('escalation_requests')
                .select('*')
                .eq('escalation_id', escalationId)
                .single();
            if (error)
                throw error;
            const row = data;
            return {
                escalation_id: row.escalation_id || row.id,
                clause_instance_id: row.clause_instance_id || '',
                document_id: row.document_id || '',
                run_id: row.run_id,
                reason: row.reason || '',
                context: row.context || '',
                urgency: (row.urgency || 'medium'),
                status: (row.status || 'pending'),
                assigned_to: row.assigned_to || undefined,
                assigned_to_name: undefined,
                resolution: row.resolution || undefined,
                resolution_notes: row.resolution_notes || undefined,
                created_by: row.created_by || row.requested_by || '',
                created_by_name: undefined,
                created_at: row.created_at,
                resolved_at: row.resolved_at || undefined,
                resolved_by: row.resolved_by || undefined,
            };
        },
        enabled: !!escalationId,
    });
}
// ============================================================================
// FETCH ESCALATION COMMENTS
// ============================================================================
function useEscalationComments(escalationId) {
    return (0, react_query_1.useQuery)({
        queryKey: ['escalation_comments', escalationId],
        queryFn: async () => {
            if (!escalationId)
                return [];
            const { data, error } = await client_1.supabase
                .from('escalation_comments')
                .select('*')
                .eq('escalation_id', escalationId)
                .order('created_at', { ascending: true });
            if (error)
                throw error;
            return (data || []).map((row) => ({
                comment_id: row.comment_id,
                escalation_id: row.escalation_id,
                author_id: row.author_id,
                author_name: 'Unknown',
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
function useEscalationActions() {
    const queryClient = (0, react_query_1.useQueryClient)();
    // Create new escalation
    const createEscalation = (0, react_query_1.useMutation)({
        mutationFn: async ({ clauseInstanceId, documentId, runId, reason, context, urgency = 'medium', }) => {
            const { data: { user } } = await client_1.supabase.auth.getUser();
            if (!user)
                throw new Error('Not authenticated');
            const { data, error } = await client_1.supabase
                .from('escalation_requests')
                .insert({
                clause_instance_id: clauseInstanceId,
                document_id: documentId,
                run_id: runId,
                reason,
                context: context || '',
                urgency,
                status: 'pending',
                requested_by: user.id,
                created_by: user.id,
            })
                .select()
                .single();
            if (error)
                throw error;
            // Update clause to mark as escalated
            await client_1.supabase
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
    const assignEscalation = (0, react_query_1.useMutation)({
        mutationFn: async ({ escalationId, assignedTo, }) => {
            const { error } = await client_1.supabase
                .from('escalation_requests')
                .update({
                assigned_to: assignedTo,
                status: 'in_review',
            })
                .eq('escalation_id', escalationId);
            if (error)
                throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['escalation', variables.escalationId] });
            queryClient.invalidateQueries({ queryKey: ['escalations'] });
        },
    });
    // Resolve escalation
    const resolveEscalation = (0, react_query_1.useMutation)({
        mutationFn: async ({ escalationId, resolution, resolutionNotes, approveChanges = false, }) => {
            const { data: { user } } = await client_1.supabase.auth.getUser();
            if (!user)
                throw new Error('Not authenticated');
            const { data: escalation, error: fetchError } = await client_1.supabase
                .from('escalation_requests')
                .select('clause_instance_id')
                .eq('escalation_id', escalationId)
                .single();
            if (fetchError)
                throw fetchError;
            const escalationData = escalation;
            // Update escalation
            const { error } = await client_1.supabase
                .from('escalation_requests')
                .update({
                status: 'resolved',
                resolution,
                resolution_notes: resolutionNotes,
                resolved_at: new Date().toISOString(),
                resolved_by: user.id,
            })
                .eq('escalation_id', escalationId);
            if (error)
                throw error;
            // Update clause status based on resolution
            if (resolution === 'approved' && approveChanges && escalationData.clause_instance_id) {
                await client_1.supabase
                    .from('clause_reviews')
                    .update({
                    client_state: 'OK',
                    escalation_recommended: false,
                })
                    .eq('clause_instance_id', escalationData.clause_instance_id);
            }
            else if (resolution === 'rejected' && escalationData.clause_instance_id) {
                await client_1.supabase
                    .from('clause_reviews')
                    .update({
                    client_state: 'BLOCKED',
                })
                    .eq('clause_instance_id', escalationData.clause_instance_id);
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['escalation', variables.escalationId] });
            queryClient.invalidateQueries({ queryKey: ['escalations'] });
            queryClient.invalidateQueries({ queryKey: ['clause_reviews'] });
        },
    });
    // Add comment to escalation
    const addComment = (0, react_query_1.useMutation)({
        mutationFn: async ({ escalationId, content, }) => {
            const { data: { user } } = await client_1.supabase.auth.getUser();
            if (!user)
                throw new Error('Not authenticated');
            const { data, error } = await client_1.supabase
                .from('escalation_comments')
                .insert({
                escalation_id: escalationId,
                author_id: user.id,
                content,
            })
                .select()
                .single();
            if (error)
                throw error;
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
function useEscalationCounts() {
    return (0, react_query_1.useQuery)({
        queryKey: ['escalation_counts'],
        queryFn: async () => {
            const { data, error } = await client_1.supabase
                .from('escalation_requests')
                .select('status, urgency');
            if (error)
                throw error;
            const counts = {
                total: data?.length || 0,
                pending: 0,
                in_review: 0,
                resolved: 0,
                high_urgency: 0,
            };
            (data || []).forEach((row) => {
                if (row.status === 'pending')
                    counts.pending++;
                if (row.status === 'in_review')
                    counts.in_review++;
                if (row.status === 'resolved')
                    counts.resolved++;
                if (row.urgency === 'high' && row.status !== 'resolved')
                    counts.high_urgency++;
            });
            return counts;
        },
    });
}
//# sourceMappingURL=useEscalations.js.map