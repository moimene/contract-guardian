import { useState, useEffect } from 'react'
import {
    Activity,
    AlertTriangle,
    Clock,
    CheckCircle,
    XCircle,
    TrendingUp,
    BarChart3,
    RefreshCw,
    ChevronRight,
    X,
    MessageSquare,
    Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface PipelineStats {
    total_runs: number
    successful_runs: number
    failed_runs: number
    avg_duration_ms: number
    avg_clauses_per_run: number
    last_run_at: string
}

interface FailurePattern {
    failure_type: string
    agent_name: string
    occurrence_count: number
    avg_confidence: number
    first_seen: string
    last_seen: string
}

interface PendingReview {
    id: string
    run_id: string
    clause_instance_id: string
    detected_family: string
    final_status: string
    decision: string
    escalation_reason: string
    confidence_overall: number
    anchor_confidence: number
    created_at: string
    document_id: string
    run_status: string
}

// ============================================================================
// STATS CARD
// ============================================================================

function StatsCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    color = 'primary'
}: {
    title: string
    value: string | number
    subtitle?: string
    icon: React.ElementType
    trend?: { value: number; positive: boolean }
    color?: 'primary' | 'success' | 'warning' | 'destructive'
}) {
    const colorClasses = {
        primary: 'text-primary',
        success: 'text-green-600',
        warning: 'text-amber-600',
        destructive: 'text-red-600'
    }

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
                        {trend.value}% vs last week
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// ============================================================================
// FAILURE PATTERNS TABLE
// ============================================================================

function FailurePatternsTable({ patterns }: { patterns: FailurePattern[] }) {
    const typeLabels: Record<string, { label: string; color: string }> = {
        'low_confidence': { label: 'Low Confidence', color: 'bg-amber-100 text-amber-800' },
        'keyword_fallback': { label: 'LLM Fallback', color: 'bg-blue-100 text-blue-800' },
        'unknown_classification': { label: 'Unclassified', color: 'bg-red-100 text-red-800' },
        'low_anchor_confidence': { label: 'Low Anchor', color: 'bg-purple-100 text-purple-800' },
        'hallucination_detected': { label: 'Hallucination', color: 'bg-red-100 text-red-800' },
    }

    if (patterns.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p>No failure patterns detected</p>
                <p className="text-sm">The system is functioning correctly</p>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {patterns.map((pattern, idx) => {
                const typeConfig = typeLabels[pattern.failure_type] || {
                    label: pattern.failure_type,
                    color: 'bg-gray-100 text-gray-800'
                }

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
                                    Avg. Confidence: {(pattern.avg_confidence * 100).toFixed(1)}%
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <Badge variant="secondary" className="text-lg px-3">
                                {pattern.occurrence_count}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                                occurrences
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ============================================================================
// FEEDBACK DIALOG
// ============================================================================

interface FeedbackDialogProps {
    review: PendingReview | null
    onClose: () => void
    onSubmit: (reviewId: string, decision: string, feedback: string) => Promise<void>
}

function FeedbackDialog({ review, onClose, onSubmit }: FeedbackDialogProps) {
    const [decision, setDecision] = useState<string>('')
    const [feedback, setFeedback] = useState('')
    const [submitting, setSubmitting] = useState(false)

    if (!review) return null

    const handleSubmit = async () => {
        if (!decision) return
        setSubmitting(true)
        try {
            await onSubmit(review.id, decision, feedback)
            onClose()
        } finally {
            setSubmitting(false)
        }
    }

    const decisionOptions = [
        { value: 'CONFIRM_ACCEPT', label: 'Confirm Accept', color: 'bg-green-100 text-green-800 border-green-300' },
        { value: 'CONFIRM_REJECT', label: 'Confirm Reject', color: 'bg-red-100 text-red-800 border-red-300' },
        { value: 'OVERRIDE_ACCEPT', label: 'Override → Accept', color: 'bg-blue-100 text-blue-800 border-blue-300' },
        { value: 'OVERRIDE_REJECT', label: 'Override → Reject', color: 'bg-amber-100 text-amber-800 border-amber-300' },
        { value: 'NEEDS_REVIEW', label: 'Needs More Review', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    ]

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold">Review Feedback</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Review Info */}
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-sm">
                                {review.detected_family}
                            </Badge>
                            <div className={cn(
                                "text-sm font-medium px-2 py-1 rounded",
                                review.confidence_overall < 0.5 ? "bg-red-100 text-red-700" :
                                    review.confidence_overall < 0.7 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                            )}>
                                Confidence: {(review.confidence_overall * 100).toFixed(0)}%
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">System Decision:</p>
                            <p className="font-medium">{review.decision || review.final_status}</p>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Escalation Reason:</p>
                            <p className="text-sm">{review.escalation_reason || 'Not specified'}</p>
                        </div>

                        <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>Clause: {review.clause_instance_id}</span>
                            <span>Anchor: {(review.anchor_confidence * 100).toFixed(0)}%</span>
                        </div>
                    </div>

                    {/* Decision Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-3">
                            Your Decision <span className="text-destructive">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {decisionOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setDecision(opt.value)}
                                    className={cn(
                                        "p-3 rounded-lg border-2 text-left transition-all",
                                        decision === opt.value
                                            ? `${opt.color} border-current`
                                            : "bg-card border-border hover:border-primary/50"
                                    )}
                                >
                                    <span className="font-medium">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Feedback Text */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Comments (Optional)
                        </label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Add context to improve the system..."
                            className="w-full h-24 px-3 py-2 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            This feedback helps train the system for similar cases
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t bg-muted/30">
                    <Button variant="outline" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!decision || submitting}>
                        {submitting ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4 mr-2" />
                                Submit Feedback
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// PENDING REVIEWS TABLE (with click to open feedback)
// ============================================================================

interface PendingReviewsTableProps {
    reviews: PendingReview[]
    onReviewClick: (review: PendingReview) => void
}

function PendingReviewsTable({ reviews, onReviewClick }: PendingReviewsTableProps) {
    if (reviews.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p>No pending reviews</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {reviews.slice(0, 15).map((review) => (
                <div
                    key={review.id}
                    onClick={() => onReviewClick(review)}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{review.clause_instance_id}</p>
                            <Badge variant="outline" className="text-xs">
                                {review.detected_family}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                            {review.escalation_reason || review.decision}
                        </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                        <div className="text-right">
                            <div className={cn(
                                "text-sm font-medium",
                                review.confidence_overall < 0.5 ? "text-red-600" :
                                    review.confidence_overall < 0.7 ? "text-amber-600" : "text-green-600"
                            )}>
                                {(review.confidence_overall * 100).toFixed(0)}%
                            </div>
                            <p className="text-xs text-muted-foreground">confidence</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                </div>
            ))}
            {reviews.length > 15 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                    +{reviews.length - 15} more pending
                </p>
            )}
        </div>
    )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Observability() {
    const [stats, setStats] = useState<PipelineStats | null>(null)
    const [failurePatterns, setFailurePatterns] = useState<FailurePattern[]>([])
    const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null)

    const fetchData = async () => {
        setLoading(true)
        setError(null)

        try {
            // Fetch pipeline stats
            const { data: statsData, error: statsError } = await supabase
                .rpc('get_pipeline_stats')

            if (statsError) throw statsError
            setStats(statsData)

            // Fetch failure patterns from view
            const { data: patternsData, error: patternsError } = await supabase
                .from('failure_dashboard')
                .select('*')
                .order('occurrence_count', { ascending: false })
                .limit(10)

            if (!patternsError && patternsData) {
                setFailurePatterns(patternsData)
            }

            // Fetch pending reviews
            const { data: reviewsData, error: reviewsError } = await supabase
                .from('pending_human_review')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50)

            if (!reviewsError && reviewsData) {
                setPendingReviews(reviewsData)
            }

        } catch (err) {
            console.error('Error fetching observability data:', err)
            setError('Error loading observability data')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitFeedback = async (reviewId: string, decision: string, feedback: string) => {
        const { error } = await supabase.rpc('submit_human_feedback', {
            p_review_id: reviewId,
            p_override_decision: decision,
            p_feedback: feedback
        })

        if (error) {
            console.error('Error submitting feedback:', error)
            throw error
        }

        // Remove from pending list
        setPendingReviews(prev => prev.filter(r => r.id !== reviewId))
    }

    useEffect(() => {
        fetchData()
    }, [])

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`
        return `${(ms / 1000).toFixed(1)}s`
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A'
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const successRate = stats ?
        ((stats.successful_runs / stats.total_runs) * 100).toFixed(1) : '0'

    return (
        <div className="flex-1 overflow-auto p-6 bg-background">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Observability</h1>
                    <p className="text-muted-foreground">
                        Pipeline metrics and failure analysis
                    </p>
                </div>
                <Button onClick={fetchData} disabled={loading} variant="outline">
                    <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                    Refresh
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
                    title="Total Runs"
                    value={stats?.total_runs ?? 0}
                    subtitle={stats?.last_run_at ? `Last: ${formatDate(stats.last_run_at)}` : undefined}
                    icon={BarChart3}
                    color="primary"
                />
                <StatsCard
                    title="Success Rate"
                    value={`${successRate}%`}
                    subtitle={`${stats?.successful_runs ?? 0} successful of ${stats?.total_runs ?? 0}`}
                    icon={CheckCircle}
                    color="success"
                />
                <StatsCard
                    title="Avg. Duration"
                    value={formatDuration(stats?.avg_duration_ms ?? 0)}
                    subtitle="Per full document"
                    icon={Clock}
                    color="primary"
                />
                <StatsCard
                    title="Clauses/Document"
                    value={(stats?.avg_clauses_per_run ?? 0).toFixed(1)}
                    subtitle="Average per run"
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
                            {pendingReviews.length} clauses pending human review
                        </p>
                        <p className="text-sm text-amber-700">
                            Click on a clause to submit feedback
                        </p>
                    </div>
                </div>
            )}

            {/* Tabs for detailed views */}
            <Tabs defaultValue="pending" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pending" className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Pending Reviews
                        {pendingReviews.length > 0 && (
                            <Badge variant="secondary" className="ml-1">
                                {pendingReviews.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="failures" className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Failure Patterns
                        {failurePatterns.length > 0 && (
                            <Badge variant="secondary" className="ml-1">
                                {failurePatterns.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Reviews</CardTitle>
                            <CardDescription>
                                Click on a clause to send feedback and improve the system
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PendingReviewsTable
                                reviews={pendingReviews}
                                onReviewClick={setSelectedReview}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="failures">
                    <Card>
                        <CardHeader>
                            <CardTitle>Failure Mode Analysis (FMA)</CardTitle>
                            <CardDescription>
                                Patterns detected for continuous system improvement
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FailurePatternsTable patterns={failurePatterns} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Feedback Dialog */}
            <FeedbackDialog
                review={selectedReview}
                onClose={() => setSelectedReview(null)}
                onSubmit={handleSubmitFeedback}
            />
        </div>
    )
}
