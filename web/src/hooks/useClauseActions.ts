import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { ClauseStatus, ProposedChange } from '@/types/contracts'

export interface UseClauseActionsResult {
    acceptChange: (clauseInstanceId: string, changeId: string, currentChanges: ProposedChange[]) => Promise<ProposedChange[]>
    rejectChange: (clauseInstanceId: string, changeId: string, currentChanges: ProposedChange[]) => Promise<ProposedChange[]>
    acceptAllChanges: (clauseInstanceId: string, currentChanges: ProposedChange[]) => Promise<ProposedChange[]>
    updateClauseStatus: (clauseInstanceId: string, status: ClauseStatus, comment?: string) => Promise<void>
}

/**
 * Hook para acciones sobre cláusulas:
 * - Aceptar/rechazar cambios propuestos
 * - Aceptar todos los cambios
 * - Actualizar estado de cláusula
 */
export function useClauseActions(): UseClauseActionsResult {

    const acceptChange = useCallback(async (
        clauseInstanceId: string,
        changeId: string,
        currentChanges: ProposedChange[]
    ): Promise<ProposedChange[]> => {
        const updatedChanges = currentChanges.map(c =>
            c.change_id === changeId ? { ...c, accepted: true, rejected: false } : c
        )

        const { error } = await supabase
            .from('clause_reviews')
            .update({ proposed_changes: updatedChanges })
            .eq('clause_instance_id', clauseInstanceId)

        if (error) throw error
        return updatedChanges
    }, [])

    const rejectChange = useCallback(async (
        clauseInstanceId: string,
        changeId: string,
        currentChanges: ProposedChange[]
    ): Promise<ProposedChange[]> => {
        const updatedChanges = currentChanges.map(c =>
            c.change_id === changeId ? { ...c, accepted: false, rejected: true } : c
        )

        const { error } = await supabase
            .from('clause_reviews')
            .update({ proposed_changes: updatedChanges })
            .eq('clause_instance_id', clauseInstanceId)

        if (error) throw error
        return updatedChanges
    }, [])

    const acceptAllChanges = useCallback(async (
        clauseInstanceId: string,
        currentChanges: ProposedChange[]
    ): Promise<ProposedChange[]> => {
        const updatedChanges = currentChanges.map(c => ({
            ...c, accepted: true, rejected: false
        }))

        const { error } = await supabase
            .from('clause_reviews')
            .update({
                proposed_changes: updatedChanges,
                client_state: 'OK'
            })
            .eq('clause_instance_id', clauseInstanceId)

        if (error) throw error
        return updatedChanges
    }, [])

    const updateClauseStatus = useCallback(async (
        clauseInstanceId: string,
        status: ClauseStatus,
        comment?: string
    ): Promise<void> => {
        const updateData: Record<string, unknown> = { client_state: status }
        if (comment !== undefined) {
            updateData.client_comment = comment
        }

        const { error } = await supabase
            .from('clause_reviews')
            .update(updateData)
            .eq('clause_instance_id', clauseInstanceId)

        if (error) throw error
    }, [])

    return {
        acceptChange,
        rejectChange,
        acceptAllChanges,
        updateClauseStatus
    }
}
