import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { ClauseReview, ClauseStatus } from '@/types/contracts'

export interface ClauseStats {
    total: number
    ok: number
    recommended: number
    required: number
    needsReview: number
    blocked: number
}

export interface UseContractReviewsOptions {
    searchTerm?: string
    filterStatus?: ClauseStatus | 'ALL'
}

export interface UseContractReviewsResult {
    clauses: ClauseReview[]
    filteredClauses: ClauseReview[]
    stats: ClauseStats
    completionPercent: number
    loading: boolean
    error: Error | null
    documentName: string
    refetch: () => Promise<void>
}

/**
 * Hook para gestionar las cláusulas de un contrato con:
 * - Fetch paralelo de documento y cláusulas
 * - Subscripción realtime a cambios
 * - Filtrado y búsqueda
 * - Cálculo de estadísticas
 */
export function useContractReviews(
    documentId: string | undefined,
    options: UseContractReviewsOptions = {}
): UseContractReviewsResult {
    const { searchTerm = '', filterStatus = 'ALL' } = options

    const [clauses, setClauses] = useState<ClauseReview[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const [documentName, setDocumentName] = useState('')

    // Fetch inicial con Promise.all para paralelismo
    const fetchData = useCallback(async () => {
        if (!documentId) {
            setLoading(false)
            return
        }

        try {
            setError(null)
            const [docResult, clausesResult] = await Promise.all([
                supabase
                    .from('documents')
                    .select('file_name')
                    .eq('document_id', documentId)
                    .single(),
                supabase
                    .from('clause_reviews')
                    .select('*')
                    .eq('document_id', documentId)
                    .order('sequence_number', { ascending: true })
            ])

            if (docResult.error) throw docResult.error
            if (clausesResult.error) throw clausesResult.error

            if (docResult.data) setDocumentName(docResult.data.file_name)
            if (clausesResult.data) setClauses(clausesResult.data)
        } catch (err) {
            console.error('Error fetching contract reviews:', err)
            setError(err instanceof Error ? err : new Error('Unknown error'))
        } finally {
            setLoading(false)
        }
    }, [documentId])

    // Setup inicial y realtime subscription
    useEffect(() => {
        if (!documentId) return

        fetchData()

        // Realtime subscription
        const channel = supabase
            .channel(`clause-reviews-${documentId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'clause_reviews',
                filter: `document_id=eq.${documentId}`,
            }, () => {
                fetchData()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [documentId, fetchData])

    // Cálculo de estadísticas y filtrado en un solo loop
    const { filteredClauses, stats, completionPercent } = useMemo(() => {
        let ok = 0, recommended = 0, required = 0, needsReview = 0, blocked = 0
        const filtered: ClauseReview[] = []
        const searchLower = searchTerm.toLowerCase()

        for (const clause of clauses) {
            // Contar stats
            switch (clause.client_state) {
                case 'OK': ok++; break
                case 'RECOMMENDED': recommended++; break
                case 'REQUIRED': required++; break
                case 'NEEDS_REVIEW': needsReview++; break
                case 'BLOCKED': blocked++; break
            }

            // Filtrar en el mismo loop
            const matchesSearch = !searchTerm ||
                clause.heading?.toLowerCase().includes(searchLower) ||
                clause.clause_text?.toLowerCase().includes(searchLower)
            const matchesStatus = filterStatus === 'ALL' || clause.client_state === filterStatus

            if (matchesSearch && matchesStatus) {
                filtered.push(clause)
            }
        }

        const total = clauses.length
        const completion = total > 0 ? Math.round(((ok + recommended) / total) * 100) : 0

        return {
            filteredClauses: filtered,
            stats: { total, ok, recommended, required, needsReview, blocked },
            completionPercent: completion
        }
    }, [clauses, searchTerm, filterStatus])

    return {
        clauses,
        filteredClauses,
        stats,
        completionPercent,
        loading,
        error,
        documentName,
        refetch: fetchData
    }
}
