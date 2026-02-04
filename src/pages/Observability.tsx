import { useState, useEffect } from 'react';
import {
    Activity,
    AlertTriangle,
    Clock,
    CheckCircle,
    XCircle,
    TrendingUp,
    BarChart3,
    RefreshCw,
    Filter,
    ChevronRight
} from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface PipelineStats {
    total_runs: number;
    successful_runs: number;
    failed_runs: number;
    avg_duration_ms: number;
    avg_clauses_per_run: number;
    last_run_at: string;
}

interface FailurePattern {
    failure_type: string;
    agent_name: string;
    occurrence_count: number;
    avg_confidence: number;
    first_seen: string;
    last_seen: string;
}

interface PendingReview {
    id: string;
    clause_heading: string;
    clause_text: string;
    detected_family: string;
    acceptance: string;
    confidence_score: number;
    escalation_reason: string;
    created_at: string;
}

// ============================================================================
// STATS CARDS
// ============================================================================

function StatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = 'primary'
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    trend?: { value: number; positive: boolean };
    color?: 'primary' | 'success' | 'warning' | 'destructive';
}) {
    const colorClasses = {
        primary: 'text-primary',
        success: 'text-green-600',
        warning: 'text-amber-600',
        destructive: 'text-red-600'
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className={cn("h-4 w-4", colorClasses[color])} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                )}
                {trend && (
                    <div className={cn(
                        "flex items-center text-xs mt-1",
                        trend.positive ? "text-green-600" : "text-red-600"
                    )}>
                        <TrendingUp className={cn("h-3 w-3 mr-1", !trend.positive && "rotate-180")} />
                        {trend.value}% vs última semana
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ============================================================================
// FAILURE PATTERNS TABLE
// ============================================================================

function FailurePatternsTable({ patterns }: { patterns: FailurePattern[] }) {
    const typeLabels: Record<string, { label: string; color: string }> = {
        'low_confidence': { label: 'Baja Confianza', color: 'bg-amber-100 text-amber-800' },
        'keyword_fallback': { label: 'Fallback a LLM', color: 'bg-blue-100 text-blue-800' },
        'unknown_classification': { label: 'No Clasificado', color: 'bg-red-100 text-red-800' },
        'low_anchor_confidence': { label: 'Anchor Bajo', color: 'bg-purple-100 text-purple-800' },
        'hallucination_detected': { label: 'Alucinación', color: 'bg-red-100 text-red-800' },
    };

    if (patterns.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p>No hay patrones de fallo detectados</p>
                <p className="text-sm">El sistema está funcionando correctamente</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {patterns.map((pattern, idx) => {
                const typeConfig = typeLabels[pattern.failure_type] || {
                    label: pattern.failure_type,
                    color: 'bg-gray-100 text-gray-800'
                };

                return (
                    <div
                        key={idx}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn("px-2 py-1 rounded text-xs font-medium", typeConfig.color)}>
                                {typeConfig.label}
                            </div>
                            <div>
                                <p className="font-medium">{pattern.agent_name}</p>
                                <p className="text-sm text-muted-foreground">
                                    Confianza promedio: {(pattern.avg_confidence * 100).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <Badge variant="secondary" className="text-lg px-3">
                                {pattern.occurrence_count}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                                ocurrencias
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================================================
// PENDING REVIEWS TABLE
// ============================================================================

function PendingReviewsTable({ reviews }: { reviews: PendingReview[] }) {
    if (reviews.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p>No hay revisiones pendientes</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {reviews.slice(0, 10).map((review) => (
                <div
                    key={review.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{review.clause_heading || 'Sin título'}</p>
                            <Badge variant="outline" className="text-xs">
                                {review.detected_family}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                            {review.escalation_reason}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                        <div className="text-right">
                            <div className={cn(
                                "text-sm font-medium",
                                review.confidence_score < 0.5 ? "text-red-600" :
                                    review.confidence_score < 0.7 ? "text-amber-600" : "text-green-600"
                            )}>
                                {(review.confidence_score * 100).toFixed(0)}%
                            </div>
                            <p className="text-xs text-muted-foreground">confianza</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
            ))}
            {reviews.length > 10 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                    +{reviews.length - 10} más pendientes
                </p>
            )}
        </div>
    );
}

// ============================================================================
// MAIN OBSERVABILITY CONTENT
// ============================================================================

function ObservabilityContent() {
    const [stats, setStats] = useState<PipelineStats | null>(null);
    const [failurePatterns, setFailurePatterns] = useState<FailurePattern[]>([]);
    const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch pipeline stats
            const { data: statsData, error: statsError } = await supabase
                .rpc('get_pipeline_stats');

            if (statsError) throw statsError;
            setStats(statsData);

            // Fetch failure patterns from view
            const { data: patternsData, error: patternsError } = await supabase
                .from('failure_dashboard')
                .select('*')
                .order('occurrence_count', { ascending: false })
                .limit(10);

            if (!patternsError && patternsData) {
                setFailurePatterns(patternsData);
            }

            // Fetch pending reviews
            const { data: reviewsData, error: reviewsError } = await supabase
                .from('pending_human_review')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (!reviewsError && reviewsData) {
                setPendingReviews(reviewsData);
            }

        } catch (err) {
            console.error('Error fetching observability data:', err);
            setError('Error al cargar datos de observabilidad');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const successRate = stats ?
        ((stats.successful_runs / stats.total_runs) * 100).toFixed(1) : '0';

    return (
        <div className="flex-1 overflow-auto p-6 bg-background">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Observabilidad</h1>
                    <p className="text-muted-foreground">
                        Métricas del pipeline y análisis de fallos
                    </p>
                </div>
                <Button onClick={fetchData} disabled={loading} variant="outline">
                    <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                    Actualizar
                </Button>
            </div>

            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
                    {error}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatsCard
                    title="Total Ejecuciones"
                    value={stats?.total_runs ?? 0}
                    subtitle={stats?.last_run_at ? `Última: ${formatDate(stats.last_run_at)}` : undefined}
                    icon={BarChart3}
                    color="primary"
                />
                <StatsCard
                    title="Tasa de Éxito"
                    value={`${successRate}%`}
                    subtitle={`${stats?.successful_runs ?? 0} exitosas de ${stats?.total_runs ?? 0}`}
                    icon={CheckCircle}
                    color="success"
                />
                <StatsCard
                    title="Duración Promedio"
                    value={formatDuration(stats?.avg_duration_ms ?? 0)}
                    subtitle="Por documento completo"
                    icon={Clock}
                    color="primary"
                />
                <StatsCard
                    title="Cláusulas/Documento"
                    value={(stats?.avg_clauses_per_run ?? 0).toFixed(1)}
                    subtitle="Promedio por ejecución"
                    icon={Activity}
                    color="primary"
                />
            </div>

            {/* Alert for pending reviews */}
            {pendingReviews.length > 0 && (
                <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <div>
                        <p className="font-medium text-amber-800">
                            {pendingReviews.length} cláusulas pendientes de revisión humana
                        </p>
                        <p className="text-sm text-amber-700">
                            Estas cláusulas requieren feedback para mejorar el sistema
                        </p>
                    </div>
                </div>
            )}

            {/* Tabs for detailed views */}
            <Tabs defaultValue="failures" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="failures" className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Patrones de Fallo
                        {failurePatterns.length > 0 && (
                            <Badge variant="secondary" className="ml-1">
                                {failurePatterns.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Revisiones Pendientes
                        {pendingReviews.length > 0 && (
                            <Badge variant="secondary" className="ml-1">
                                {pendingReviews.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="failures">
                    <Card>
                        <CardHeader>
                            <CardTitle>Análisis de Modos de Fallo (FMA)</CardTitle>
                            <CardDescription>
                                Patrones detectados para mejora continua del sistema
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FailurePatternsTable patterns={failurePatterns} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pending">
                    <Card>
                        <CardHeader>
                            <CardTitle>Revisiones Pendientes</CardTitle>
                            <CardDescription>
                                Cláusulas que requieren feedback humano para entrenamiento
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PendingReviewsTable reviews={pendingReviews} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export default function Observability() {
    return (
        <div className="flex min-h-screen">
            <AppSidebar />
            <ObservabilityContent />
        </div>
    );
}
