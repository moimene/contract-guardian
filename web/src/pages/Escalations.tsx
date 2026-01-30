import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { EscalationRequest, EscalationUrgency, EscalationStatus } from '@/types/contracts'
import { URGENCY_CONFIG, STATUS_CONFIG } from '@/types/contracts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Search,
    Loader2,
    AlertTriangle,
    Clock,
    User,
    CheckCircle,
    FileText,
    ExternalLink,

    Check,
    X,
    Edit
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function Escalations() {
    const [escalations, setEscalations] = useState<EscalationRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<EscalationStatus | 'ALL'>('ALL')
    const [filterUrgency, setFilterUrgency] = useState<EscalationUrgency | 'ALL'>('ALL')
    const [selectedEscalation, setSelectedEscalation] = useState<EscalationRequest | null>(null)

    useEffect(() => {
        fetchEscalations()
    }, [])

    const fetchEscalations = async () => {
        try {
            const { data, error } = await supabase
                .from('escalation_requests')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setEscalations(data || [])
            if (data && data.length > 0 && !selectedEscalation) {
                setSelectedEscalation(data[0])
            }
        } catch (err) {
            console.error('Error fetching escalations:', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredEscalations = escalations.filter(esc => {
        const matchesSearch = esc.reason.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = filterStatus === 'ALL' || esc.status === filterStatus
        const matchesUrgency = filterUrgency === 'ALL' || esc.urgency === filterUrgency
        return matchesSearch && matchesStatus && matchesUrgency
    })

    const stats = {
        pending: escalations.filter(e => e.status === 'pending').length,
        in_review: escalations.filter(e => e.status === 'in_review').length,
        high_urgency: escalations.filter(e => e.urgency === 'high' && e.status !== 'resolved').length,
        resolved: escalations.filter(e => e.status === 'resolved').length,
    }

    const handleResolve = async (resolution: string) => {
        if (!selectedEscalation) return

        await supabase
            .from('escalation_requests')
            .update({
                status: resolution === 'reject' ? 'rejected' : 'resolved',
                resolution: resolution,
                resolved_at: new Date().toISOString()
            })
            .eq('escalation_id', selectedEscalation.escalation_id)

        fetchEscalations()
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
            <div className="px-6 py-4 border-b border-border bg-white">
                <h1 className="text-2xl font-bold text-foreground">Escalaciones</h1>
                <p className="text-muted-foreground">
                    Gestiona las cláusulas que requieren revisión manual
                </p>
            </div>

            {/* Stats Bar */}
            <div className="px-6 py-3 border-b border-border flex items-center gap-4 bg-muted/30">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-700">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">{stats.pending}</span>
                    <span className="text-sm">Pendientes</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{stats.in_review}</span>
                    <span className="text-sm">En revisión</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-100 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">{stats.high_urgency}</span>
                    <span className="text-sm">Alta urgencia</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-100 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">{stats.resolved}</span>
                    <span className="text-sm">Resueltas</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - List */}
                <div className="w-96 border-r border-border flex flex-col bg-white">
                    <div className="p-3 border-b border-border space-y-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as EscalationStatus | 'ALL')}
                                className="text-sm border rounded px-2 py-1 flex-1"
                            >
                                <option value="ALL">Todos los estados</option>
                                <option value="pending">Pendiente</option>
                                <option value="in_review">En revisión</option>
                                <option value="resolved">Resuelta</option>
                                <option value="rejected">Rechazada</option>
                            </select>
                            <select
                                value={filterUrgency}
                                onChange={(e) => setFilterUrgency(e.target.value as EscalationUrgency | 'ALL')}
                                className="text-sm border rounded px-2 py-1 flex-1"
                            >
                                <option value="ALL">Todas</option>
                                <option value="high">Alta</option>
                                <option value="medium">Media</option>
                                <option value="low">Baja</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {filteredEscalations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                                <AlertTriangle className="h-12 w-12 mb-2" />
                                <p>No hay escalaciones</p>
                            </div>
                        ) : (
                            filteredEscalations.map((esc) => {
                                const urgencyConfig = URGENCY_CONFIG[esc.urgency]
                                const statusConfig = STATUS_CONFIG[esc.status]
                                const isSelected = selectedEscalation?.escalation_id === esc.escalation_id

                                return (
                                    <button
                                        key={esc.escalation_id}
                                        onClick={() => setSelectedEscalation(esc)}
                                        className={cn(
                                            "w-full p-4 text-left border-b border-border transition-colors",
                                            isSelected ? "bg-accent" : "hover:bg-accent/50"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex flex-col gap-1">
                                                <Badge className={cn(urgencyConfig.bgColor, urgencyConfig.color, "text-xs")}>
                                                    {urgencyConfig.label}
                                                </Badge>
                                                <Badge variant="outline" className={cn(statusConfig.color, "text-xs")}>
                                                    {statusConfig.label}
                                                </Badge>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm line-clamp-2">{esc.reason}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(esc.created_at).toLocaleDateString('es-ES', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Right Panel - Detail */}
                <div className="flex-1 overflow-auto p-6 bg-muted/20">
                    {selectedEscalation ? (
                        <div className="max-w-2xl mx-auto">
                            {/* Header */}
                            <Card className="mb-4">
                                <CardHeader>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge className={cn(
                                            URGENCY_CONFIG[selectedEscalation.urgency].bgColor,
                                            URGENCY_CONFIG[selectedEscalation.urgency].color
                                        )}>
                                            Urgencia: {URGENCY_CONFIG[selectedEscalation.urgency].label}
                                        </Badge>
                                        <Badge variant="outline" className={STATUS_CONFIG[selectedEscalation.status].color}>
                                            {STATUS_CONFIG[selectedEscalation.status].label}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        ID: {selectedEscalation.escalation_id.slice(0, 8)}... ·
                                        Creada: {new Date(selectedEscalation.created_at).toLocaleString('es-ES')}
                                    </p>
                                </CardHeader>
                            </Card>

                            {/* Reason */}
                            <Card className="mb-4">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        MOTIVO
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm">{selectedEscalation.reason}</p>
                                    {selectedEscalation.context && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                            {selectedEscalation.context}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Document Link */}
                            <Card className="mb-4">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        DOCUMENTO
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Link
                                        to={`/review/${selectedEscalation.document_id}`}
                                        className="flex items-center gap-2 text-primary hover:underline"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Ver contrato
                                        <ExternalLink className="h-3 w-3" />
                                    </Link>
                                </CardContent>
                            </Card>

                            {/* Resolution (if resolved) */}
                            {selectedEscalation.resolution && (
                                <Card className="mb-4">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            RESOLUCIÓN
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm">{selectedEscalation.resolution}</p>
                                        {selectedEscalation.resolution_notes && (
                                            <p className="text-sm text-muted-foreground mt-2">
                                                {selectedEscalation.resolution_notes}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Actions */}
                            {selectedEscalation.status === 'pending' || selectedEscalation.status === 'in_review' ? (
                                <div className="flex gap-3">
                                    <Button
                                        variant="destructive"
                                        onClick={() => handleResolve('reject')}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Rechazar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleResolve('modify')}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Modificar
                                    </Button>
                                    <Button
                                        onClick={() => handleResolve('approve')}
                                    >
                                        <Check className="h-4 w-4 mr-2" />
                                        Aprobar
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Selecciona una escalación para ver los detalles
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
