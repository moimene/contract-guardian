import { useEffect, useState, memo, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Document } from '@/types/contracts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    FilePlus,
    FileText,
    Clock,
    CheckCircle,
    AlertTriangle,
    ArrowRight,
    Loader2
} from 'lucide-react'

// [rerender-memo] Componente memoizado para lista de documentos
const DocumentListItem = memo(function DocumentListItem({
    doc,
    getStatusBadge
}: {
    doc: Document
    getStatusBadge: (status: string) => React.ReactNode
}) {
    return (
        <Link
            to={`/review/${doc.document_id}`}
            className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
        >
            <div className="flex items-center gap-4">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                    <p className="font-medium">{doc.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                {getStatusBadge(doc.status)}
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
        </Link>
    )
})

// [rendering-hoist-jsx] Componente estático hoisted
const EmptyState = memo(function EmptyState() {
    return (
        <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No hay documentos todavía</p>
            <Link to="/new">
                <Button>
                    <FilePlus className="h-4 w-4 mr-2" />
                    Subir tu primer contrato
                </Button>
            </Link>
        </div>
    )
})

// [rendering-hoist-jsx] Loading spinner hoisted
const LoadingState = memo(function LoadingState() {
    return (
        <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )
})

export function Dashboard() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)

    // [js-combine-iterations] Calcular stats en un solo loop con useMemo
    const stats = useMemo(() => {
        // Single iteration instead of 4 separate filter calls
        let processing = 0
        let completed = 0
        let errors = 0

        for (const doc of documents) {
            switch (doc.status) {
                case 'PROCESSING':
                    processing++
                    break
                case 'PROCESSED':
                    completed++
                    break
                case 'ERROR':
                    errors++
                    break
            }
        }

        return {
            total: documents.length,
            processing,
            completed,
            errors
        }
    }, [documents])

    useEffect(() => {
        fetchDocuments()
    }, [])

    const fetchDocuments = async () => {
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10)

            if (error) throw error
            setDocuments(data || [])
        } catch (err) {
            console.error('Error fetching documents:', err)
        } finally {
            setLoading(false)
        }
    }

    // [rerender-functional-setstate] Callback estable con useCallback
    const getStatusBadge = useCallback((status: string) => {
        switch (status) {
            case 'PROCESSED':
                return <Badge variant="ok"><CheckCircle className="h-3 w-3 mr-1" />Completado</Badge>
            case 'PROCESSING':
                return <Badge variant="recommended"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Procesando</Badge>
            case 'ERROR':
                return <Badge variant="blocked"><AlertTriangle className="h-3 w-3 mr-1" />Error</Badge>
            default:
                return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>
        }
    }, [])

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona tus contratos y revisiones
                    </p>
                </div>
                <Link to="/new">
                    <Button>
                        <FilePlus className="h-4 w-4 mr-2" />
                        Nuevo Análisis
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Documentos</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <FileText className="h-8 w-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">En Proceso</p>
                                <p className="text-2xl font-bold">{stats.processing}</p>
                            </div>
                            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Completados</p>
                                <p className="text-2xl font-bold">{stats.completed}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Errores</p>
                                <p className="text-2xl font-bold">{stats.errors}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Documents */}
            <Card>
                <CardHeader>
                    <CardTitle>Documentos Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <LoadingState />
                    ) : documents.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="space-y-2">
                            {documents.map((doc) => (
                                <DocumentListItem
                                    key={doc.document_id}
                                    doc={doc}
                                    getStatusBadge={getStatusBadge}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
