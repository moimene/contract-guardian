import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  X,
  AlertTriangle,
  Eye,
  Ban,
  Info,
  FileText,
  Download,
  ChevronRight,
  Filter,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { useDocument } from '@/hooks/useDocuments';
import {
  useClauseReviews,
  useClauseActions,
  useContractReviewSummary,
  useFilteredClauses,
} from '@/hooks/useClauseReviews';
import { useEscalationActions } from '@/hooks/useEscalations';
import {
  ClauseStatus,
  ClauseReview,
  CLAUSE_STATUS_CONFIG,
  ClauseFilters,
} from '@/types/contracts';
import { cn } from '@/lib/utils';

// ============================================================================
// STATUS ICON COMPONENT
// ============================================================================

function StatusIcon({ status, className }: { status: ClauseStatus; className?: string }) {
  const icons = {
    OK: Check,
    RECOMMENDED: Info,
    REQUIRED: AlertTriangle,
    NEEDS_REVIEW: Eye,
    BLOCKED: Ban,
  };
  const Icon = icons[status];
  return <Icon className={cn('h-4 w-4', className)} />;
}

// ============================================================================
// CLAUSE LIST ITEM
// ============================================================================

function ClauseListItem({
  clause,
  isSelected,
  onClick,
}: {
  clause: ClauseReview;
  isSelected: boolean;
  onClick: () => void;
}) {
  const config = CLAUSE_STATUS_CONFIG[clause.client_state];
  const pendingChanges = clause.proposed_changes.filter(
    (c) => !c.accepted && !c.rejected
  ).length;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-all',
        'hover:bg-muted/50',
        isSelected
          ? 'bg-primary/5 border-primary'
          : 'bg-background border-border'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              #{clause.sequence_number}
            </span>
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                config.bgColor,
                config.textColor,
                config.borderColor
              )}
            >
              <StatusIcon status={clause.client_state} className="mr-1 h-3 w-3" />
              {config.label}
            </Badge>
          </div>
          <p className="mt-1 text-sm font-medium truncate">
            {clause.heading || `Cláusula ${clause.sequence_number}`}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground truncate">
            {clause.detected_family}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {pendingChanges > 0 && (
            <Badge variant="secondary" className="text-xs">
              {pendingChanges} cambio{pendingChanges > 1 ? 's' : ''}
            </Badge>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// CLAUSE DETAIL PANEL
// ============================================================================

function ClauseDetailPanel({
  clause,
  onAcceptChange,
  onRejectChange,
  onAcceptAll,
  onEscalate,
}: {
  clause: ClauseReview;
  onAcceptChange: (changeId: string) => void;
  onRejectChange: (changeId: string) => void;
  onAcceptAll: () => void;
  onEscalate: (reason: string) => void;
}) {
  const [escalationReason, setEscalationReason] = useState('');
  const [showEscalationDialog, setShowEscalationDialog] = useState(false);
  const config = CLAUSE_STATUS_CONFIG[clause.client_state];

  const pendingChanges = clause.proposed_changes.filter(
    (c) => !c.accepted && !c.rejected
  );

  const handleEscalate = () => {
    if (escalationReason.trim()) {
      onEscalate(escalationReason);
      setEscalationReason('');
      setShowEscalationDialog(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(config.bgColor, config.textColor, config.borderColor)}
              >
                <StatusIcon status={clause.client_state} className="mr-1 h-3 w-3" />
                {config.label}
              </Badge>
              <Badge variant="outline">{clause.detected_family}</Badge>
            </div>
            <h2 className="mt-2 text-lg font-semibold">
              {clause.heading || `Cláusula ${clause.sequence_number}`}
            </h2>
            {clause.client_summary_line && (
              <p className="mt-1 text-sm text-muted-foreground">
                {clause.client_summary_line}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {pendingChanges.length > 0 && (
              <Button size="sm" onClick={onAcceptAll}>
                <Check className="h-4 w-4 mr-1" />
                Aceptar todos
              </Button>
            )}
            <Dialog open={showEscalationDialog} onOpenChange={setShowEscalationDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Escalar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Escalar cláusula</DialogTitle>
                  <DialogDescription>
                    Indica el motivo por el cual esta cláusula requiere revisión adicional.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  placeholder="Describe el motivo de la escalación..."
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  className="min-h-[100px]"
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEscalationDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleEscalate} disabled={!escalationReason.trim()}>
                    Enviar escalación
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {/* Original text */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Texto original</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{clause.clause_text}</p>
          </CardContent>
        </Card>

        {/* Proposed changes */}
        {clause.proposed_changes.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Cambios propuestos ({clause.proposed_changes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {clause.proposed_changes.map((change) => (
                <div
                  key={change.change_id}
                  className={cn(
                    'p-3 rounded-lg border',
                    change.accepted && 'bg-green-50 border-green-200',
                    change.rejected && 'bg-red-50 border-red-200',
                    !change.accepted && !change.rejected && 'bg-muted/50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2">
                        {change.op_type}
                      </Badge>
                      {change.original_text && (
                        <div className="mb-2">
                          <span className="text-xs text-muted-foreground">Original:</span>
                          <p className="text-sm line-through text-red-600">
                            {change.original_text}
                          </p>
                        </div>
                      )}
                      {change.suggested_text && (
                        <div>
                          <span className="text-xs text-muted-foreground">Sugerido:</span>
                          <p className="text-sm text-green-600">{change.suggested_text}</p>
                        </div>
                      )}
                      {change.reason && (
                        <p className="mt-2 text-xs text-muted-foreground italic">
                          {change.reason}
                        </p>
                      )}
                    </div>
                    {!change.accepted && !change.rejected && (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-600 hover:bg-green-100"
                          onClick={() => onAcceptChange(change.change_id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600 hover:bg-red-100"
                          onClick={() => onRejectChange(change.change_id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {change.accepted && (
                      <Badge variant="default" className="bg-green-600">
                        Aceptado
                      </Badge>
                    )}
                    {change.rejected && (
                      <Badge variant="default" className="bg-red-600">
                        Rechazado
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Client comment */}
        {clause.client_comment && (
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Comentario</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{clause.client_comment}</p>
            </CardContent>
          </Card>
        )}
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// SUMMARY HEADER
// ============================================================================

function ReviewSummary({
  summary,
  loading,
}: {
  summary: any;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-20" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const stats = [
    { label: 'Conformes', count: summary.ok_count, status: 'OK' as ClauseStatus },
    { label: 'Recomendados', count: summary.recommended_count, status: 'RECOMMENDED' as ClauseStatus },
    { label: 'Requeridos', count: summary.required_count, status: 'REQUIRED' as ClauseStatus },
    { label: 'Revisión', count: summary.needs_review_count, status: 'NEEDS_REVIEW' as ClauseStatus },
    { label: 'Bloqueados', count: summary.blocked_count, status: 'BLOCKED' as ClauseStatus },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {stats.map(({ label, count, status }) => {
        const config = CLAUSE_STATUS_CONFIG[status];
        return (
          <Badge
            key={status}
            variant="outline"
            className={cn('text-sm', config.bgColor, config.textColor, config.borderColor)}
          >
            <StatusIcon status={status} className="mr-1 h-3 w-3" />
            {count} {label}
          </Badge>
        );
      })}
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

function ContractReviewContent() {
  const { documentId } = useParams<{ documentId: string }>();
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ClauseFilters>({});
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data hooks
  const { data: document, isLoading: loadingDoc } = useDocument(documentId);
  const { data: clauses, isLoading: loadingClauses } = useClauseReviews(documentId);
  const { data: summary, isLoading: loadingSummary } = useContractReviewSummary(documentId);
  const { acceptChange, rejectChange, acceptAllChanges } = useClauseActions();
  const { createEscalation } = useEscalationActions();

  // Apply filters
  const activeFilters: ClauseFilters = useMemo(() => ({
    ...filters,
    status: statusFilter !== 'all' ? [statusFilter as ClauseStatus] : undefined,
    searchQuery: searchQuery || undefined,
  }), [filters, statusFilter, searchQuery]);

  const filteredClauses = useFilteredClauses(clauses, activeFilters);
  const selectedClause = clauses?.find((c) => c.clause_instance_id === selectedClauseId);

  // Auto-select first clause
  useMemo(() => {
    if (filteredClauses.length > 0 && !selectedClauseId) {
      setSelectedClauseId(filteredClauses[0].clause_instance_id);
    }
  }, [filteredClauses, selectedClauseId]);

  // Action handlers
  const handleAcceptChange = (changeId: string) => {
    if (selectedClauseId) {
      acceptChange.mutate({ clauseInstanceId: selectedClauseId, changeId });
    }
  };

  const handleRejectChange = (changeId: string) => {
    if (selectedClauseId) {
      rejectChange.mutate({ clauseInstanceId: selectedClauseId, changeId });
    }
  };

  const handleAcceptAll = () => {
    if (selectedClauseId) {
      acceptAllChanges.mutate(selectedClauseId);
    }
  };

  const handleEscalate = (reason: string) => {
    if (selectedClause && documentId) {
      createEscalation.mutate({
        clauseInstanceId: selectedClause.clause_instance_id,
        documentId,
        runId: selectedClause.run_id,
        reason,
        urgency: 'medium',
      });
    }
  };

  if (loadingDoc) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-medium">Documento no encontrado</h2>
        <p className="text-muted-foreground mt-1">
          El documento solicitado no existe o no tienes acceso.
        </p>
        <Button asChild className="mt-4">
          <Link to="/dashboard">Volver al dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Top Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{document.file_name}</h1>
              <p className="text-sm text-muted-foreground">
                {summary?.total_clauses || 0} cláusulas · {summary?.progress_percentage || 0}% completado
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ReviewSummary summary={summary} loading={loadingSummary} />
            <Separator orientation="vertical" className="h-8 mx-2" />
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Clause List */}
        <div className="w-80 border-r flex flex-col bg-muted/30">
          {/* Filters */}
          <div className="p-3 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cláusulas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {(Object.keys(CLAUSE_STATUS_CONFIG) as ClauseStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={status} />
                      {CLAUSE_STATUS_CONFIG[status].label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clause List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-2">
              {loadingClauses ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))
              ) : filteredClauses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay cláusulas que coincidan</p>
                </div>
              ) : (
                filteredClauses.map((clause) => (
                  <ClauseListItem
                    key={clause.clause_instance_id}
                    clause={clause}
                    isSelected={clause.clause_instance_id === selectedClauseId}
                    onClick={() => setSelectedClauseId(clause.clause_instance_id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Clause Detail */}
        <div className="flex-1 bg-background">
          {selectedClause ? (
            <ClauseDetailPanel
              clause={selectedClause}
              onAcceptChange={handleAcceptChange}
              onRejectChange={handleRejectChange}
              onAcceptAll={handleAcceptAll}
              onEscalate={handleEscalate}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecciona una cláusula para ver los detalles</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContractReview() {
  return (
    <AppLayout>
      <ContractReviewContent />
    </AppLayout>
  );
}
