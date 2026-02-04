import { memo, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, AlertTriangle, X } from 'lucide-react'
import type { RedlineSet, ContractLifecycleStatus } from '@/types/contracts'

interface RedlineStatusProps {
    redlineSet: RedlineSet
    lifecycleStatus: ContractLifecycleStatus
    onMarkAsReady: () => void
    isTransitioning?: boolean
}

export const RedlineStatus = memo(function RedlineStatus({
    redlineSet,
    lifecycleStatus,
    onMarkAsReady,
    isTransitioning = false
}: RedlineStatusProps) {
    const canMarkAsReady = useMemo(() => {
        return redlineSet.pending === 0 &&
            redlineSet.total > 0 &&
            lifecycleStatus === 'DRAFT_REVIEW'
    }, [redlineSet, lifecycleStatus])

    const completionPercent = useMemo(() => {
        if (redlineSet.total === 0) return 0
        return Math.round(((redlineSet.accepted + redlineSet.rejected) / redlineSet.total) * 100)
    }, [redlineSet])

    return (
        <Card className="fixed bottom-6 right-6 w-72 shadow-lg border-2 z-50">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">Redline Status</h3>
                    <Badge variant="secondary" className="text-xs">
                        {completionPercent}% complete
                    </Badge>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-muted rounded-full mb-4 overflow-hidden">
                    <div
                        className="h-full flex"
                        style={{ width: `${completionPercent}%` }}
                    >
                        <div
                            className="bg-green-500 transition-all"
                            style={{
                                width: redlineSet.total > 0
                                    ? `${(redlineSet.accepted / (redlineSet.accepted + redlineSet.rejected || 1)) * 100}%`
                                    : '0%'
                            }}
                        />
                        <div
                            className="bg-red-400 transition-all"
                            style={{
                                width: redlineSet.total > 0
                                    ? `${(redlineSet.rejected / (redlineSet.accepted + redlineSet.rejected || 1)) * 100}%`
                                    : '0%'
                            }}
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-green-600">
                            <Check className="h-4 w-4" />
                            Accepted
                        </span>
                        <span className="font-medium">{redlineSet.accepted}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-4 w-4" />
                            Pending
                        </span>
                        <span className="font-medium">{redlineSet.pending}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-red-600">
                            <X className="h-4 w-4" />
                            Rejected
                        </span>
                        <span className="font-medium">{redlineSet.rejected}</span>
                    </div>
                </div>

                {/* Action Button */}
                <Button
                    className="w-full"
                    disabled={!canMarkAsReady || isTransitioning}
                    onClick={onMarkAsReady}
                >
                    {isTransitioning ? 'Updating...' :
                        canMarkAsReady ? 'Mark as Ready' :
                            lifecycleStatus !== 'DRAFT_REVIEW' ? 'Already Ready' :
                                `${redlineSet.pending} pending`}
                </Button>

                {redlineSet.pending > 0 && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        Review all pending changes to mark as ready
                    </p>
                )}
            </CardContent>
        </Card>
    )
})
