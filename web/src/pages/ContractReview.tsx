import { useState, useEffect, useMemo, useCallback, startTransition } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { ClauseReview, ClauseStatus } from '@/types/contracts'
import { CLAUSE_STATUS_CONFIG } from '@/types/contracts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    ArrowLeft,
    Loader2,
    Search,
    Download,
    Check,
    X,
    CheckCircle,
    Info,
    AlertCircle,
    Eye,
    Ban,
    ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_ICONS: Record<ClauseStatus, React.ComponentType<{ className?: string }>> = {
    OK: CheckCircle,
    RECOMMENDED: Info,
    REQUIRED: AlertCircle,
    NEEDS_REVIEW: Eye,
    BLOCKED: Ban,
}

export function ContractReview() {
    const { documentId } = useParams<{ documentId: string }>()
    const navigate = useNavigate()
    const [clauses, setClauses] = useState<ClauseReview[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedClause, setSelectedClause] = useState<ClauseReview | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<ClauseStatus | 'ALL'>('ALL')
    const [documentName, setDocumentName] = useState('')

    // [async-parallel] Fetches en paralelo con Promise.all
    const fetchInitialData = useCallback(async () => {
        if (!documentId) return

        try {
            // Ejecutar ambos fetches en paralelo
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

            if (docResult.data) setDocumentName(docResult.data.file_name)
            if (clausesResult.data) {
                setClauses(clausesResult.data)
                if (clausesResult.data.length > 0) {
                    setSelectedClause(clausesResult.data[0])
                }
            }
        } catch (err) {
            console.error('Error fetching data:', err)
        } finally {
            setLoading(false)
        }
    }, [documentId])

    // Setup inicial y realtime
    useEffect(() => {
        if (documentId) {
            fetchInitialData()
            return setupRealtimeSubscription()
        }
    }, [documentId, fetchInitialData])

    const setupRealtimeSubscription = () => {
        const channel = supabase
            .channel(`clause-reviews-${documentId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'clause_reviews',
                filter: `document_id=eq.${documentId}`,
            }, () => {
                fetchInitialData()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }

    // [rerender-derived-state] Usamos useMemo para evitar recálculos innecesarios
    // [js-combine-iterations] Stats calculados en un solo loop
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

    const handleAcceptChange = async (changeId: string) => {
        if (!selectedClause) return

        const updatedChanges = selectedClause.proposed_changes.map(c =>
            c.change_id === changeId ? { ...c, accepted: true, rejected: false } : c
        )

        await supabase
            .from('clause_reviews')
            .update({ proposed_changes: updatedChanges })
            .eq('clause_instance_id', selectedClause.clause_instance_id)

        setSelectedClause({ ...selectedClause, proposed_changes: updatedChanges })
    }

    const handleRejectChange = async (changeId: string) => {
        if (!selectedClause) return

        const updatedChanges = selectedClause.proposed_changes.map(c =>
            c.change_id === changeId ? { ...c, accepted: false, rejected: true } : c
        )

        await supabase
            .from('clause_reviews')
            .update({ proposed_changes: updatedChanges })
            .eq('clause_instance_id', selectedClause.clause_instance_id)

        setSelectedClause({ ...selectedClause, proposed_changes: updatedChanges })
    }

    const handleAcceptAll = async () => {
        if (!selectedClause) return

        const updatedChanges = selectedClause.proposed_changes.map(c => ({
            ...c, accepted: true, rejected: false
        }))

        await supabase
            .from('clause_reviews')
            .update({
                proposed_changes: updatedChanges,
                client_state: 'OK'
            })
            .eq('clause_instance_id', selectedClause.clause_instance_id)

        setSelectedClause({
            ...selectedClause,
            proposed_changes: updatedChanges,
            client_state: 'OK'
        })
    }

    const handleExport = async () => {
        // TODO: Implement export via edge function
        alert('Exportación en desarrollo')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-border px-4 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="font-semibold truncate max-w-md">{documentName}</h1>
                        <p className="text-sm text-muted-foreground">
                            {stats.total} cláusulas · {completionPercent}% completado
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                    </Button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="h-12 border-b border-border px-4 flex items-center gap-4 bg-muted/30">
                {Object.entries(CLAUSE_STATUS_CONFIG).map(([status, config]) => {
                    const count = stats[status.toLowerCase().replace('_', '') as keyof typeof stats] ||
                        (status === 'NEEDS_REVIEW' ? stats.needsReview : 0)
                    return (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status as ClauseStatus)}
                            className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors",
                                filterStatus === status ? config.bgColor : "hover:bg-accent"
                            )}
                        >
                            <span className={cn("font-medium", config.textColor)}>{count}</span>
                            <span className="text-muted-foreground">{config.label}</span>
                        </button>
                    )
                })}
                <button
                    onClick={() => setFilterStatus('ALL')}
                    className={cn(
                        "ml-auto text-sm px-2 py-1 rounded",
                        filterStatus === 'ALL' ? "bg-accent" : "hover:bg-accent"
                    )}
                >
                    Ver todas
                </button>
            </div>

            {/* Main Content - Two Panels */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Clause List */}
                <div className="w-80 border-r border-border flex flex-col bg-white">
                    <div className="p-3 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar cláusulas..."
                                value={searchTerm}
                                onChange={(e) => {
                                    // [rerender-transitions] startTransition para filtrado no urgente
                                    startTransition(() => {
                                        setSearchTerm(e.target.value)
                                    })
                                }}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                        {filteredClauses.map((clause) => {
                            const Icon = STATUS_ICONS[clause.client_state]
                            const isSelected = selectedClause?.clause_instance_id === clause.clause_instance_id
                            const pendingChanges = clause.proposed_changes?.filter(c => !c.accepted && !c.rejected).length || 0

                            return (
                                <button
                                    key={clause.clause_instance_id}
                                    onClick={() => setSelectedClause(clause)}
                                    className={cn(
                                        "w-full p-3 text-left border-b border-border transition-colors",
                                        isSelected ? "bg-accent" : "hover:bg-accent/50"
                                    )}
                                >
                                    <div className="flex items-start gap-2">
                                        <Badge variant={clause.client_state.toLowerCase().replace('_', '') as any} className="mt-0.5">
                                            <Icon className="h-3 w-3" />
                                        </Badge>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">#{clause.sequence_number}</span>
                                                <span className="font-medium text-sm truncate">{clause.heading || 'Sin título'}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">{clause.detected_family}</p>
                                            {pendingChanges > 0 && (
                                                <span className="text-xs text-amber-600 mt-1 inline-block">
                                                    {pendingChanges} cambio{pendingChanges > 1 ? 's' : ''} pendiente{pendingChanges > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Right Panel - Clause Detail */}
                <div className="flex-1 overflow-auto p-6 bg-muted/20">
                    {selectedClause ? (
                        <div className="max-w-3xl mx-auto">
                            {/* Clause Header */}
                            <Card className="mb-4">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <Badge
                                            variant={selectedClause.client_state.toLowerCase().replace('_', '') as any}
                                            className="mb-2"
                                        >
                                            {CLAUSE_STATUS_CONFIG[selectedClause.client_state].label}
                                        </Badge>
                                        {selectedClause.proposed_changes?.length > 0 && (
                                            <Button size="sm" onClick={handleAcceptAll}>
                                                <Check className="h-3 w-3 mr-1" />
                                                Aceptar todos
                                            </Button>
                                        )}
                                    </div>
                                    <CardTitle className="text-lg">
                                        #{selectedClause.sequence_number} {selectedClause.heading || 'Cláusula'}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Familia: {selectedClause.detected_family} ·
                                        Confianza: {Math.round(selectedClause.confidence_score * 100)}%
                                    </p>
                                </CardHeader>
                            </Card>

                            {/* Original Text */}
                            <Card className="mb-4">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        TEXTO ORIGINAL
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {selectedClause.clause_text}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Proposed Changes */}
                            {selectedClause.proposed_changes && selectedClause.proposed_changes.length > 0 && (
                                <Card className="mb-4">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            CAMBIOS PROPUESTOS ({selectedClause.proposed_changes.length})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {selectedClause.proposed_changes.map((change) => (
                                            <div
                                                key={change.change_id}
                                                className={cn(
                                                    "p-3 rounded-lg border",
                                                    change.accepted ? "bg-green-50 border-green-200" :
                                                        change.rejected ? "bg-gray-50 border-gray-200 opacity-60" :
                                                            "bg-white border-border"
                                                )}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {change.op_type}
                                                    </Badge>
                                                    {change.accepted && (
                                                        <span className="text-xs text-green-600 flex items-center gap-1">
                                                            <Check className="h-3 w-3" /> Aceptado
                                                        </span>
                                                    )}
                                                    {change.rejected && (
                                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                                            <X className="h-3 w-3" /> Rechazado
                                                        </span>
                                                    )}
                                                </div>

                                                {change.original_text && (
                                                    <p className="text-sm line-through text-red-600 bg-red-50 px-2 py-1 rounded mb-2">
                                                        {change.original_text}
                                                    </p>
                                                )}
                                                {change.suggested_text && (
                                                    <p className="text-sm underline text-green-700 bg-green-50 px-2 py-1 rounded mb-2">
                                                        {change.suggested_text}
                                                    </p>
                                                )}
                                                {change.reason && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Razón: {change.reason}
                                                    </p>
                                                )}

                                                {!change.accepted && !change.rejected && (
                                                    <div className="flex gap-2 mt-3">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleAcceptChange(change.change_id)}
                                                        >
                                                            <Check className="h-3 w-3 mr-1" />
                                                            Aceptar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleRejectChange(change.change_id)}
                                                        >
                                                            <X className="h-3 w-3 mr-1" />
                                                            Rechazar
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Client Comment */}
                            {selectedClause.client_comment && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            COMENTARIO PARA CLIENTE
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm">{selectedClause.client_comment}</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Selecciona una cláusula para ver los detalles
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
