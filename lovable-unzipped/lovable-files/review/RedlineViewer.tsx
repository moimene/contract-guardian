import { useMemo, useState } from 'react';
import { Check, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ProposedChange, ChangeOperationType } from '@/types/contracts';

// ============================================================================
// TYPES
// ============================================================================

interface TextSegment {
  type: 'unchanged' | 'deleted' | 'inserted' | 'replaced-old' | 'replaced-new';
  text: string;
  changeId?: string;
  change?: ProposedChange;
}

interface RedlineViewerProps {
  originalText: string;
  proposedChanges: ProposedChange[];
  onAcceptChange?: (changeId: string) => void;
  onRejectChange?: (changeId: string) => void;
  showActions?: boolean;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function buildSegments(
  originalText: string,
  changes: ProposedChange[]
): TextSegment[] {
  if (!changes || changes.length === 0) {
    return [{ type: 'unchanged', text: originalText }];
  }

  // Sort changes by their anchor position
  const sortedChanges = [...changes].sort((a, b) => {
    return (a.anchor?.start || 0) - (b.anchor?.start || 0);
  });

  const segments: TextSegment[] = [];
  let currentPos = 0;

  for (const change of sortedChanges) {
    const start = change.anchor?.start || 0;
    const end = change.anchor?.end || start;

    // Add unchanged text before this change
    if (start > currentPos) {
      segments.push({
        type: 'unchanged',
        text: originalText.substring(currentPos, start),
      });
    }

    // Add the change segment(s)
    switch (change.op_type) {
      case 'DELETE':
        segments.push({
          type: 'deleted',
          text: change.original_text || originalText.substring(start, end),
          changeId: change.change_id,
          change,
        });
        break;

      case 'INSERT':
        segments.push({
          type: 'inserted',
          text: change.suggested_text || '',
          changeId: change.change_id,
          change,
        });
        break;

      case 'REPLACE':
        segments.push({
          type: 'replaced-old',
          text: change.original_text || originalText.substring(start, end),
          changeId: change.change_id,
          change,
        });
        segments.push({
          type: 'replaced-new',
          text: change.suggested_text || '',
          changeId: change.change_id,
          change,
        });
        break;
    }

    currentPos = end;
  }

  // Add remaining unchanged text
  if (currentPos < originalText.length) {
    segments.push({
      type: 'unchanged',
      text: originalText.substring(currentPos),
    });
  }

  return segments;
}

// ============================================================================
// SEGMENT COMPONENT
// ============================================================================

interface SegmentProps {
  segment: TextSegment;
  onAccept?: () => void;
  onReject?: () => void;
  showActions: boolean;
}

function Segment({ segment, onAccept, onReject, showActions }: SegmentProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (segment.type === 'unchanged') {
    return <span className="text-foreground">{segment.text}</span>;
  }

  const isAccepted = segment.change?.accepted;
  const isRejected = segment.change?.rejected;
  const isPending = !isAccepted && !isRejected;

  const getSegmentStyles = () => {
    switch (segment.type) {
      case 'deleted':
      case 'replaced-old':
        return cn(
          'line-through',
          isPending && 'bg-red-100 text-red-700 decoration-red-500',
          isAccepted && 'bg-red-50 text-red-400 decoration-red-300',
          isRejected && 'bg-gray-100 text-gray-500 decoration-gray-400'
        );
      case 'inserted':
      case 'replaced-new':
        return cn(
          'underline decoration-2',
          isPending && 'bg-green-100 text-green-700 decoration-green-500',
          isAccepted && 'bg-green-50 text-green-600 decoration-green-400',
          isRejected && 'bg-gray-100 text-gray-400 line-through decoration-gray-400'
        );
      default:
        return '';
    }
  };

  const content = (
    <span
      className={cn(
        'px-0.5 rounded cursor-pointer transition-colors',
        getSegmentStyles(),
        isPending && showActions && 'hover:ring-2 hover:ring-primary/50'
      )}
      onClick={() => isPending && setShowTooltip(!showTooltip)}
    >
      {segment.text}
    </span>
  );

  if (!showActions || !isPending) {
    return content;
  }

  return (
    <TooltipProvider>
      <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="p-0">
          <div className="p-2 space-y-2 min-w-[200px]">
            {/* Change info */}
            <div className="text-xs">
              <Badge variant="outline" className="mb-1">
                {segment.change?.op_type}
              </Badge>
              {segment.change?.reason && (
                <p className="text-muted-foreground mt-1">
                  {segment.change.reason}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-1 pt-1 border-t">
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 h-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept?.();
                  setShowTooltip(false);
                }}
              >
                <Check className="h-3 w-3 mr-1" />
                Aceptar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="flex-1 h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onReject?.();
                  setShowTooltip(false);
                }}
              >
                <X className="h-3 w-3 mr-1" />
                Rechazar
              </Button>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RedlineViewer({
  originalText,
  proposedChanges,
  onAcceptChange,
  onRejectChange,
  showActions = true,
  className,
}: RedlineViewerProps) {
  const segments = useMemo(
    () => buildSegments(originalText, proposedChanges),
    [originalText, proposedChanges]
  );

  // Stats
  const stats = useMemo(() => {
    const pending = proposedChanges.filter(c => !c.accepted && !c.rejected).length;
    const accepted = proposedChanges.filter(c => c.accepted).length;
    const rejected = proposedChanges.filter(c => c.rejected).length;
    return { total: proposedChanges.length, pending, accepted, rejected };
  }, [proposedChanges]);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Stats bar */}
      {proposedChanges.length > 0 && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">
            {stats.total} cambio{stats.total !== 1 ? 's' : ''}:
          </span>
          {stats.pending > 0 && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              {stats.pending} pendiente{stats.pending !== 1 ? 's' : ''}
            </Badge>
          )}
          {stats.accepted > 0 && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {stats.accepted} aceptado{stats.accepted !== 1 ? 's' : ''}
            </Badge>
          )}
          {stats.rejected > 0 && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              {stats.rejected} rechazado{stats.rejected !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-red-100 rounded" />
          <span>Eliminar</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-green-100 rounded" />
          <span>Insertar</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          <span>Click para ver opciones</span>
        </div>
      </div>

      {/* Text with redlines */}
      <div className="p-4 border rounded-lg bg-white dark:bg-gray-950 text-sm leading-relaxed whitespace-pre-wrap font-serif">
        {segments.map((segment, index) => (
          <Segment
            key={`${segment.type}-${index}-${segment.changeId || ''}`}
            segment={segment}
            onAccept={
              segment.changeId && onAcceptChange
                ? () => onAcceptChange(segment.changeId!)
                : undefined
            }
            onReject={
              segment.changeId && onRejectChange
                ? () => onRejectChange(segment.changeId!)
                : undefined
            }
            showActions={showActions}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SIMPLE DIFF VIEW (Alternative compact view)
// ============================================================================

interface SimpleDiffProps {
  original: string;
  suggested: string;
  className?: string;
}

export function SimpleDiff({ original, suggested, className }: SimpleDiffProps) {
  return (
    <div className={cn('space-y-2 text-sm', className)}>
      {original && (
        <div className="p-2 rounded bg-red-50 border border-red-200">
          <span className="text-xs text-red-600 font-medium">Eliminar:</span>
          <p className="text-red-700 line-through mt-1">{original}</p>
        </div>
      )}
      {suggested && (
        <div className="p-2 rounded bg-green-50 border border-green-200">
          <span className="text-xs text-green-600 font-medium">Insertar:</span>
          <p className="text-green-700 underline mt-1">{suggested}</p>
        </div>
      )}
    </div>
  );
}

export default RedlineViewer;
