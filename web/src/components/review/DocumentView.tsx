import { memo, useMemo, useRef, useEffect } from 'react'
import type { ClauseReview } from '@/types/contracts'
import { cn } from '@/lib/utils'

interface DocumentViewProps {
    clauses: ClauseReview[]
    selectedClauseId?: string
    onClauseClick?: (clauseId: string) => void
}

// Renders a clause with its proposed changes inline as track-changes
const ClauseWithChanges = memo(function ClauseWithChanges({
    clause,
    isSelected,
    onClick
}: {
    clause: ClauseReview
    isSelected: boolean
    onClick: () => void
}) {
    const ref = useRef<HTMLDivElement>(null)

    // Scroll into view when selected
    useEffect(() => {
        if (isSelected && ref.current) {
            ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
    }, [isSelected])

    // Build rendered content with track-changes
    const renderedContent = useMemo(() => {
        const text = clause.clause_text || ''
        const changes = clause.proposed_changes || []

        if (changes.length === 0) {
            return <span>{text}</span>
        }

        // Sort changes by anchor position (if available)
        const sortedChanges = [...changes].sort((a, b) => {
            const aStart = a.anchor?.start ?? 0
            const bStart = b.anchor?.start ?? 0
            return aStart - bStart
        })

        const elements: React.ReactNode[] = []
        let lastEnd = 0

        sortedChanges.forEach((change, idx) => {
            const start = change.anchor?.start ?? 0
            const end = change.anchor?.end ?? 0

            // Text before this change
            if (start > lastEnd) {
                elements.push(
                    <span key={`text-${idx}`}>
                        {text.substring(lastEnd, start)}
                    </span>
                )
            }

            // The change itself
            const isAccepted = change.accepted
            const isRejected = change.rejected

            if (change.op_type === 'DELETE' || change.op_type === 'REPLACE') {
                // Show deleted/replaced text
                elements.push(
                    <span
                        key={`del-${idx}`}
                        className={cn(
                            "line-through",
                            isAccepted ? "text-red-600 bg-red-50" :
                                isRejected ? "text-gray-400 bg-gray-50" :
                                    "text-red-500 bg-red-100"
                        )}
                        title={isAccepted ? "Deleted (accepted)" : isRejected ? "Kept (rejected)" : "Pending deletion"}
                    >
                        {change.original_text || text.substring(start, end)}
                    </span>
                )
            }

            if ((change.op_type === 'INSERT' || change.op_type === 'REPLACE') && change.suggested_text) {
                // Show inserted/replacement text
                elements.push(
                    <span
                        key={`ins-${idx}`}
                        className={cn(
                            "underline",
                            isAccepted ? "text-green-700 bg-green-50" :
                                isRejected ? "text-gray-400 bg-gray-50 line-through" :
                                    "text-green-600 bg-green-100"
                        )}
                        title={isAccepted ? "Added (accepted)" : isRejected ? "Not added (rejected)" : "Pending insertion"}
                    >
                        {change.suggested_text}
                    </span>
                )
            }

            lastEnd = Math.max(lastEnd, end)
        })

        // Remaining text after all changes
        if (lastEnd < text.length) {
            elements.push(
                <span key="text-end">
                    {text.substring(lastEnd)}
                </span>
            )
        }

        return elements.length > 0 ? elements : <span>{text}</span>
    }, [clause.clause_text, clause.proposed_changes])

    // Count pending changes for indicator
    const pendingCount = clause.proposed_changes?.filter(c => !c.accepted && !c.rejected).length || 0

    return (
        <div
            ref={ref}
            onClick={onClick}
            className={cn(
                "p-4 rounded-lg border mb-3 cursor-pointer transition-all",
                isSelected
                    ? "ring-2 ring-primary border-primary bg-primary/5"
                    : "hover:border-primary/50 hover:bg-accent/30"
            )}
        >
            {/* Clause header */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                        §{clause.sequence_number}
                    </span>
                    {clause.heading && (
                        <span className="font-semibold text-sm">
                            {clause.heading}
                        </span>
                    )}
                </div>
                {pendingCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        {pendingCount} pending
                    </span>
                )}
            </div>

            {/* Clause content with track-changes */}
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {renderedContent}
            </div>
        </div>
    )
})

export const DocumentView = memo(function DocumentView({
    clauses,
    selectedClauseId,
    onClauseClick
}: DocumentViewProps) {
    // Sort clauses by sequence number
    const sortedClauses = useMemo(() => {
        return [...clauses].sort((a, b) => a.sequence_number - b.sequence_number)
    }, [clauses])

    if (clauses.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                No clauses to display
            </div>
        )
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Legend */}
            <div className="flex items-center gap-4 mb-6 p-3 bg-muted/50 rounded-lg text-xs">
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-100 border border-green-300 rounded" />
                    <span>Inserted</span>
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-red-100 border border-red-300 rounded" />
                    <span>Deleted</span>
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-amber-100 border border-amber-300 rounded" />
                    <span>Pending</span>
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-gray-100 border border-gray-300 rounded" />
                    <span>Rejected</span>
                </span>
            </div>

            {/* Document content */}
            <div className="space-y-1">
                {sortedClauses.map((clause) => (
                    <ClauseWithChanges
                        key={clause.clause_instance_id}
                        clause={clause}
                        isSelected={selectedClauseId === clause.clause_instance_id}
                        onClick={() => onClauseClick?.(clause.clause_instance_id)}
                    />
                ))}
            </div>
        </div>
    )
})
