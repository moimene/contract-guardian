import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Typology } from '@/types/contracts'

export interface UseTypologiesResult {
    typologies: Typology[]
    loading: boolean
    error: Error | null
    refetch: () => Promise<void>
    getTypology: (code: string) => Typology | undefined
}

/**
 * Hook para cargar tipologías activas desde la base de datos
 * Reemplaza CONTRACT_TYPES hardcodeado para arquitectura extensible
 */
export function useTypologies(): UseTypologiesResult {
    const [typologies, setTypologies] = useState<Typology[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const fetchTypologies = useCallback(async () => {
        try {
            setError(null)
            const { data, error: fetchError } = await supabase
                .rpc('get_active_typologies')

            if (fetchError) throw fetchError

            // Mapear resultado a Typology
            const mapped: Typology[] = (data || []).map((t: Record<string, unknown>) => ({
                id: t.id as string,
                code: t.code as string,
                name: t.name as string,
                description: t.description as string | undefined,
                icon: t.icon as string | undefined,
                color: t.color as string | undefined,
                is_active: t.is_active as boolean,
                matters_count: t.matters_count as number,
                clause_types_count: t.clause_types_count as number,
                examples_count: t.examples_count as number,
                config: (t.config as Typology['config']) || { families: [], workflow: '', rag_threshold: 0.6 }
            }))

            setTypologies(mapped)
        } catch (err) {
            console.error('Error fetching typologies:', err)
            setError(err instanceof Error ? err : new Error('Unknown error'))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchTypologies()
    }, [fetchTypologies])

    const getTypology = useCallback((code: string) => {
        return typologies.find(t => t.code === code)
    }, [typologies])

    return {
        typologies,
        loading,
        error,
        refetch: fetchTypologies,
        getTypology
    }
}
