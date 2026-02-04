import { useState, useEffect, useMemo, useCallback, startTransition } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { ClauseReview, ClauseStatus, ProposedChange, RedlineSet, ContractLifecycleStatus } from '@/types/contracts'
import { CLAUSE_STATUS_CONFIG } from '@/types/contracts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
    Loader2,
    Search,
    Check,
    X,
    CheckCircle,
    Info,
    AlertCircle,
    Eye,
    Ban,
    ChevronRight,
    Pencil,
    Undo2
} from 'lucide-react'
import { cn } from '@/lib/utils'

// PRD v2.3: New review components
import { ContractHeader, DocumentView, SummaryView, RedlineStatus, type ReviewViewMode } from '@/components/review'

const STATUS_ICONS: Record<ClauseStatus, React.ComponentType<{ className?: string }>> = {
    OK: CheckCircle,
    RECOMMENDED: Info,
    REQUIRED: AlertCircle,
    NEEDS_REVIEW: Eye,
    BLOCKED: Ban,
}

// Helper to map ClauseStatus to badge variant (avoids 'as any')
const statusToBadgeVariant = (status: ClauseStatus): 'ok' | 'recommended' | 'required' | 'needsReview' | 'blocked' => {
    const map: Record<ClauseStatus, 'ok' | 'recommended' | 'required' | 'needsReview' | 'blocked'> = {
        OK: 'ok',
        RECOMMENDED: 'recommended',
        REQUIRED: 'required',
        NEEDS_REVIEW: 'needsReview',
        BLOCKED: 'blocked',
    }
    return map[status]
}

export function ContractReview() {
    const { documentId } = useParams<{ documentId: string }>()
    const navigate = useNavigate()
    const [clauses, setClauses] = useState<ClauseReview[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedClause, setSelectedClause] = useState<ClauseReview | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<ClauseStatus | 'ALL'>('ALL')
    // CG-011: Edit state
    const [editingChangeId, setEditingChangeId] = useState<string | null>(null)
    const [editedText, setEditedText] = useState('')
    const [documentName, setDocumentName] = useState('')

    // PRD v2.3: View mode and lifecycle
    const [activeView, setActiveView] = useState<ReviewViewMode>('clause')
    const [lifecycleStatus, setLifecycleStatus] = useState<ContractLifecycleStatus>('DRAFT_REVIEW')
    const [isTransitioning, setIsTransitioning] = useState(false)

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
                    .from('clause_reviews_view')
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

            // Setup realtime subscription inline to avoid dependency warning
            const channel = supabase
                .channel(`clause-reviews-${documentId}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'clause_instances', // Subscribe to source table for realtime
                    filter: `document_id=eq.${documentId}`,
                }, () => {
                    fetchInitialData()
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [documentId, fetchInitialData])

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

    // PRD v2.3: Calculate Redline Set from proposed_changes
    const redlineSet = useMemo<RedlineSet>(() => {
        let accepted = 0, rejected = 0, pending = 0

        for (const clause of clauses) {
            for (const change of clause.proposed_changes || []) {
                if (change.accepted) accepted++
                else if (change.rejected) rejected++
                else pending++
            }
        }

        const total = accepted + rejected + pending
        return {
            accepted,
            rejected,
            pending,
            total,
            isReady: pending === 0 && total > 0
        }
    }, [clauses])

    // PRD v2.3: Handle lifecycle transition
    const handleMarkAsReady = useCallback(async () => {
        if (!documentId || redlineSet.pending > 0) return

        setIsTransitioning(true)
        try {
            // For now, just update local state
            // TODO: Call RPC transition_lifecycle_status when DB migration is applied
            setLifecycleStatus('REDLINE_READY')
        } finally {
            setIsTransitioning(false)
        }
    }, [documentId, redlineSet.pending])

    // CG-011: Get current user for audit trail
    const getCurrentUser = async () => {
        const { data } = await supabase.auth.getUser()
        return data.user?.email || 'anonymous'
    }

    const handleAcceptChange = async (changeId: string) => {
        if (!selectedClause) return
        const userEmail = await getCurrentUser()
        const now = new Date().toISOString()

        const updatedChanges = selectedClause.proposed_changes.map(c =>
            c.change_id === changeId
                ? { ...c, accepted: true, rejected: false, accepted_by: userEmail, accepted_at: now }
                : c
        )

        await supabase
            .from('clause_reviews_internal')
            .update({ proposed_changes: updatedChanges })
            .eq('clause_instance_id', selectedClause.clause_instance_id)

        setSelectedClause({ ...selectedClause, proposed_changes: updatedChanges })
    }

    const handleRejectChange = async (changeId: string) => {
        if (!selectedClause) return
        const userEmail = await getCurrentUser()
        const now = new Date().toISOString()

        const updatedChanges = selectedClause.proposed_changes.map(c =>
            c.change_id === changeId
                ? { ...c, accepted: false, rejected: true, rejected_by: userEmail, rejected_at: now }
                : c
        )

        await supabase
            .from('clause_reviews_internal')
            .update({ proposed_changes: updatedChanges })
            .eq('clause_instance_id', selectedClause.clause_instance_id)

        setSelectedClause({ ...selectedClause, proposed_changes: updatedChanges })
    }

    // CG-011: Edit suggestion text
    const handleStartEdit = (change: ProposedChange) => {
        setEditingChangeId(change.change_id)
        setEditedText(change.suggested_text || '')
    }

    const handleSaveEdit = async (changeId: string) => {
        if (!selectedClause) return
        const userEmail = await getCurrentUser()
        const now = new Date().toISOString()

        const updatedChanges = selectedClause.proposed_changes.map(c => {
            if (c.change_id === changeId) {
                return {
                    ...c,
                    original_suggestion: c.original_suggestion || c.suggested_text,
                    suggested_text: editedText,
                    edited: true,
                    edited_by: userEmail,
                    edited_at: now
                }
            }
            return c
        })

        await supabase
            .from('clause_reviews_internal')
            .update({ proposed_changes: updatedChanges })
            .eq('clause_instance_id', selectedClause.clause_instance_id)

        setSelectedClause({ ...selectedClause, proposed_changes: updatedChanges })
        setEditingChangeId(null)
        setEditedText('')
    }

    const handleCancelEdit = () => {
        setEditingChangeId(null)
        setEditedText('')
    }

    // CG-011: Undo edit
    const handleUndoEdit = async (changeId: string) => {
        if (!selectedClause) return

        const updatedChanges = selectedClause.proposed_changes.map(c => {
            if (c.change_id === changeId && c.original_suggestion) {
                return {
                    ...c,
                    suggested_text: c.original_suggestion,
                    original_suggestion: undefined,
                    edited: false,
                    edited_by: undefined,
                    edited_at: undefined
                }
            }
            return c
        })

        await supabase
            .from('clause_reviews_internal')
            .update({ proposed_changes: updatedChanges })
            .eq('clause_instance_id', selectedClause.clause_instance_id)

        setSelectedClause({ ...selectedClause, proposed_changes: updatedChanges })
    }

    const handleAcceptAll = async () => {
        if (!selectedClause) return
        const userEmail = await getCurrentUser()
        const now = new Date().toISOString()

        const updatedChanges = selectedClause.proposed_changes.map(c => ({
            ...c,
            accepted: true,
            rejected: false,
            accepted_by: userEmail,
            accepted_at: now
        }))

        await supabase
            .from('clause_reviews_internal')
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
            {/* PRD v2.3: Enhanced Header with Tabs */}
            <ContractHeader
                documentName={documentName}
                lifecycleStatus={lifecycleStatus}
                progress={completionPercent}
                totalClauses={stats.total}
                activeView={activeView}
                onViewChange={setActiveView}
                onBack={() => navigate('/')}
                onExport={handleExport}
                redlineSet={redlineSet}
            />

            {/* Stats Bar - Only visible in Clause View */}
            {activeView === 'clause' && (
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
            )}

            {/* Main Content - Conditional based on activeView */}
            <div className="flex-1 flex overflow-hidden">
                {activeView === 'clause' ? (
                    <>
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
                                                <Badge variant={statusToBadgeVariant(clause.client_state)} className="mt-0.5">
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
                                                    variant={statusToBadgeVariant(selectedClause.client_state)}
                                                    className="mb-2"
                                                >
                                                    {CLAUSE_STATUS_CONFIG[selectedClause.client_state].label}
                                                </Badge>
                                                {selectedClause.proposed_changes?.length > 0 && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button size="sm">
                                                                <Check className="h-3 w-3 mr-1" />
                                                                Accept All
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Accept all suggestions?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will accept {selectedClause.proposed_changes.filter(c => !c.accepted && !c.rejected).length} pending suggestions.
                                                                    You can undo individual changes afterwards.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={handleAcceptAll}>
                                                                    Confirm
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
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

                                                        {/* CG-011: Inline Edit Mode */}
                                                        {editingChangeId === change.change_id ? (
                                                            <div className="space-y-2 mb-2">
                                                                <Textarea
                                                                    value={editedText}
                                                                    onChange={(e) => setEditedText(e.target.value)}
                                                                    className="min-h-[100px] text-sm"
                                                                    placeholder="Enter replacement text..."
                                                                />
                                                                <div className="flex gap-2">
                                                                    <Button size="sm" onClick={() => handleSaveEdit(change.change_id)}>
                                                                        <Check className="h-3 w-3 mr-1" /> Save
                                                                    </Button>
                                                                    <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                                                                        Cancel
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            change.suggested_text && (
                                                                <div className="relative">
                                                                    <p className={cn(
                                                                        "text-sm underline text-green-700 bg-green-50 px-2 py-1 rounded mb-2",
                                                                        change.edited && "border-l-2 border-amber-500"
                                                                    )}>
                                                                        {change.suggested_text}
                                                                    </p>
                                                                    {change.edited && (
                                                                        <span className="text-xs text-amber-600 block mb-1">
                                                                            Edited by {change.edited_by} · {change.edited_at && new Date(change.edited_at).toLocaleString('en-GB')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )
                                                        )}

                                                        {change.reason && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Reason: {change.reason}
                                                            </p>
                                                        )}

                                                        {/* CG-011: Audit trail display */}
                                                        {change.accepted && change.accepted_by && (
                                                            <p className="text-xs text-green-600 mt-1">
                                                                Accepted by {change.accepted_by} · {change.accepted_at && new Date(change.accepted_at).toLocaleString('en-GB')}
                                                            </p>
                                                        )}
                                                        {change.rejected && change.rejected_by && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Rejected by {change.rejected_by} · {change.rejected_at && new Date(change.rejected_at).toLocaleString('en-GB')}
                                                            </p>
                                                        )}

                                                        {!change.accepted && !change.rejected && editingChangeId !== change.change_id && (
                                                            <div className="flex gap-2 mt-3">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleAcceptChange(change.change_id)}
                                                                >
                                                                    <Check className="h-3 w-3 mr-1" />
                                                                    Accept
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleRejectChange(change.change_id)}
                                                                >
                                                                    <X className="h-3 w-3 mr-1" />
                                                                    Reject
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleStartEdit(change)}
                                                                >
                                                                    <Pencil className="h-3 w-3 mr-1" />
                                                                    Edit
                                                                </Button>
                                                                {change.edited && change.original_suggestion && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => handleUndoEdit(change.change_id)}
                                                                    >
                                                                        <Undo2 className="h-3 w-3 mr-1" />
                                                                        Undo
                                                                    </Button>
                                                                )}
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
                    </>
                ) : activeView === 'document' ? (
                    /* Document View */
                    <div className="flex-1 overflow-auto bg-white">
                        <DocumentView
                            clauses={clauses}
                            selectedClauseId={selectedClause?.clause_instance_id}
                            onClauseClick={(id) => {
                                const clause = clauses.find(c => c.clause_instance_id === id)
                                if (clause) {
                                    setSelectedClause(clause)
                                    setActiveView('clause')
                                }
                            }}
                        />
                    </div>
                ) : (
                    /* Summary View */
                    <div className="flex-1 overflow-auto bg-muted/20">
                        <SummaryView
                            clauses={clauses}
                            documentName={documentName}
                            redlineSet={redlineSet}
                            onExportPdf={handleExport}
                        />
                    </div>
                )}

                {/* PRD v2.3: Floating Redline Status Widget - visible in clause view */}
                {activeView === 'clause' && redlineSet.total > 0 && (
                    <RedlineStatus
                        redlineSet={redlineSet}
                        lifecycleStatus={lifecycleStatus}
                        onMarkAsReady={handleMarkAsReady}
                        isTransitioning={isTransitioning}
                    />
                )}
            </div>
        </div>
    )
}
