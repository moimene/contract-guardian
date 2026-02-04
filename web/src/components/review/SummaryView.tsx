import { memo, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    CheckCircle,
    AlertTriangle,
    XCircle,
    AlertCircle,
    Download
} from 'lucide-react'
import type { ClauseReview, RedlineSet, ClauseStatus } from '@/types/contracts'
import { CLAUSE_STATUS_CONFIG } from '@/types/contracts'
import { cn } from '@/lib/utils'

interface SummaryViewProps {
    clauses: ClauseReview[]
    documentName: string
    redlineSet: RedlineSet
    onExportPdf?: () => void
}

interface RiskLevel {
    level: 'low' | 'medium' | 'high'
    label: string
    color: string
    bgColor: string
    icon: React.ComponentType<{ className?: string }>
}

const calculateRiskLevel = (clauses: ClauseReview[]): RiskLevel => {
    const total = clauses.length
    if (total === 0) return { level: 'low', label: 'No Data', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: AlertCircle }

    const blocked = clauses.filter(c => c.client_state === 'BLOCKED').length
    const required = clauses.filter(c => c.client_state === 'REQUIRED').length

    const blockedRatio = blocked / total
    const criticalRatio = (blocked + required) / total

    if (blockedRatio > 0.1 || blocked > 3) {
        return { level: 'high', label: 'High Risk', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle }
    }
    if (criticalRatio > 0.2 || required > 5) {
        return { level: 'medium', label: 'Medium Risk', color: 'text-amber-700', bgColor: 'bg-amber-100', icon: AlertTriangle }
    }
    return { level: 'low', label: 'Low Risk', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle }
}

export const SummaryView = memo(function SummaryView({
    clauses,
    documentName,
    redlineSet,
    onExportPdf
}: SummaryViewProps) {
    // Calculate statistics
    const stats = useMemo(() => {
        const byStatus: Record<ClauseStatus, number> = {
            OK: 0,
            RECOMMENDED: 0,
            REQUIRED: 0,
            NEEDS_REVIEW: 0,
            BLOCKED: 0
        }

        const byFamily: Record<string, { total: number; critical: number }> = {}

        clauses.forEach(clause => {
            byStatus[clause.client_state]++

            const family = clause.detected_family || 'Unknown'
            if (!byFamily[family]) {
                byFamily[family] = { total: 0, critical: 0 }
            }
            byFamily[family].total++
            if (clause.client_state === 'BLOCKED' || clause.client_state === 'REQUIRED') {
                byFamily[family].critical++
            }
        })

        return { byStatus, byFamily }
    }, [clauses])

    const risk = useMemo(() => calculateRiskLevel(clauses), [clauses])
    const RiskIcon = risk.icon

    // Critical clauses (BLOCKED + REQUIRED)
    const criticalClauses = useMemo(() => {
        return clauses
            .filter(c => c.client_state === 'BLOCKED' || c.client_state === 'REQUIRED')
            .sort((a, b) => {
                if (a.client_state === 'BLOCKED' && b.client_state !== 'BLOCKED') return -1
                if (b.client_state === 'BLOCKED' && a.client_state !== 'BLOCKED') return 1
                return a.sequence_number - b.sequence_number
            })
    }, [clauses])

    // Recommendation text
    const recommendation = useMemo(() => {
        if (stats.byStatus.BLOCKED > 0) {
            return `This contract has ${stats.byStatus.BLOCKED} blocking issue(s) that must be resolved before proceeding. Review and address all BLOCKED clauses.`
        }
        if (stats.byStatus.REQUIRED > 3) {
            return `This contract requires significant attention with ${stats.byStatus.REQUIRED} clauses needing changes. Consider a detailed review session.`
        }
        if (redlineSet.pending > 0) {
            return `${redlineSet.pending} proposed changes are pending review. Complete the review to finalize the redline.`
        }
        return 'Contract review is complete. The document is ready for negotiation.'
    }, [stats.byStatus, redlineSet])

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Review Summary</h2>
                    <p className="text-muted-foreground">{documentName}</p>
                </div>
                <Button onClick={onExportPdf}>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                </Button>
            </div>

            {/* Risk Indicator */}
            <Card className={cn("mb-6", risk.bgColor)}>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-full", risk.bgColor)}>
                            <RiskIcon className={cn("h-8 w-8", risk.color)} />
                        </div>
                        <div className="flex-1">
                            <h3 className={cn("text-xl font-bold", risk.color)}>{risk.label}</h3>
                            <p className="text-sm text-muted-foreground">{recommendation}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-5 gap-4 mb-6">
                {(Object.entries(stats.byStatus) as [ClauseStatus, number][]).map(([status, count]) => {
                    const config = CLAUSE_STATUS_CONFIG[status]
                    return (
                        <Card key={status} className={count > 0 ? config.bgColor : ''}>
                            <CardContent className="p-4 text-center">
                                <p className={cn("text-2xl font-bold", count > 0 ? config.textColor : 'text-gray-400')}>
                                    {count}
                                </p>
                                <p className="text-xs text-muted-foreground">{config.label}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Redline Status */}
            <Card className="mb-6">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        REDLINE STATUS
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="font-medium">{redlineSet.accepted}</span>
                            <span className="text-muted-foreground">accepted</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                            <span className="font-medium">{redlineSet.pending}</span>
                            <span className="text-muted-foreground">pending</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-600" />
                            <span className="font-medium">{redlineSet.rejected}</span>
                            <span className="text-muted-foreground">rejected</span>
                        </div>
                        <div className="ml-auto">
                            <Badge variant={redlineSet.isReady ? 'ok' : 'secondary'}>
                                {redlineSet.isReady ? 'Ready' : 'In Progress'}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* By Matter Breakdown */}
            <Card className="mb-6">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        BY CLAUSE FAMILY
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {Object.entries(stats.byFamily)
                            .sort((a, b) => b[1].critical - a[1].critical)
                            .map(([family, data]) => (
                                <div key={family} className="flex items-center justify-between py-2 border-b last:border-0">
                                    <span className="font-medium text-sm">{family}</span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-muted-foreground">
                                            {data.total} clauses
                                        </span>
                                        {data.critical > 0 && (
                                            <Badge variant="blocked" className="text-xs">
                                                {data.critical} critical
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>

            {/* Critical Issues */}
            {criticalClauses.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            CRITICAL ISSUES ({criticalClauses.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {criticalClauses.slice(0, 10).map(clause => (
                                <div key={clause.clause_instance_id} className="p-3 rounded-lg bg-red-50 border border-red-200">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant={clause.client_state === 'BLOCKED' ? 'blocked' : 'required'}>
                                            {CLAUSE_STATUS_CONFIG[clause.client_state].label}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            §{clause.sequence_number}
                                        </span>
                                        <span className="font-medium text-sm">{clause.heading}</span>
                                    </div>
                                    {clause.escalation_reason && (
                                        <p className="text-xs text-red-700">{clause.escalation_reason}</p>
                                    )}
                                </div>
                            ))}
                            {criticalClauses.length > 10 && (
                                <p className="text-xs text-muted-foreground text-center">
                                    + {criticalClauses.length - 10} more critical issues
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
})
