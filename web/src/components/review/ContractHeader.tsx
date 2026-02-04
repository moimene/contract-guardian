import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    Download,
    FileText,
    List,
    BarChart3,
    ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ContractLifecycleStatus, RedlineSet } from '@/types/contracts'
import { LIFECYCLE_STATUS_CONFIG } from '@/types/contracts'

export type ReviewViewMode = 'clause' | 'document' | 'summary'

interface ContractHeaderProps {
    documentName: string
    lifecycleStatus: ContractLifecycleStatus
    progress: number
    totalClauses: number
    activeView: ReviewViewMode
    onViewChange: (view: ReviewViewMode) => void
    onBack: () => void
    onExport: () => void
    redlineSet?: RedlineSet
}

const ViewTab = memo(function ViewTab({
    label,
    icon: Icon,
    isActive,
    onClick
}: {
    label: string
    icon: React.ComponentType<{ className?: string }>
    isActive: boolean
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
        >
            <Icon className="h-4 w-4" />
            {label}
        </button>
    )
})

export const ContractHeader = memo(function ContractHeader({
    documentName,
    lifecycleStatus,
    progress,
    totalClauses,
    activeView,
    onViewChange,
    onBack,
    onExport,
    redlineSet
}: ContractHeaderProps) {
    const statusConfig = LIFECYCLE_STATUS_CONFIG[lifecycleStatus]

    return (
        <div className="border-b border-border bg-white">
            {/* Top Row: Document Info & Actions */}
            <div className="h-16 px-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="font-semibold truncate max-w-md text-foreground">
                                {documentName}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{totalClauses} clauses</span>
                                <span>·</span>
                                <span>{progress}% reviewed</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Lifecycle Status Badge */}
                    <Badge
                        className={cn(
                            "px-3 py-1 text-sm font-medium",
                            statusConfig.bgColor,
                            statusConfig.color,
                            statusConfig.borderColor,
                            "border"
                        )}
                    >
                        {statusConfig.label}
                        {statusConfig.nextAction && (
                            <ChevronRight className="h-3 w-3 ml-1 opacity-60" />
                        )}
                    </Badge>

                    <Button variant="outline" onClick={onExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Bottom Row: View Tabs & Redline Status */}
            <div className="h-12 px-4 flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-1">
                    <ViewTab
                        label="Clause View"
                        icon={List}
                        isActive={activeView === 'clause'}
                        onClick={() => onViewChange('clause')}
                    />
                    <ViewTab
                        label="Document View"
                        icon={FileText}
                        isActive={activeView === 'document'}
                        onClick={() => onViewChange('document')}
                    />
                    <ViewTab
                        label="Summary"
                        icon={BarChart3}
                        isActive={activeView === 'summary'}
                        onClick={() => onViewChange('summary')}
                    />
                </div>

                {/* Inline Redline Status */}
                {redlineSet && (
                    <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-green-600">
                            <span className="font-medium">{redlineSet.accepted}</span>
                            <span className="text-muted-foreground">accepted</span>
                        </span>
                        <span className="flex items-center gap-1 text-amber-600">
                            <span className="font-medium">{redlineSet.pending}</span>
                            <span className="text-muted-foreground">pending</span>
                        </span>
                        <span className="flex items-center gap-1 text-red-600">
                            <span className="font-medium">{redlineSet.rejected}</span>
                            <span className="text-muted-foreground">rejected</span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
})
