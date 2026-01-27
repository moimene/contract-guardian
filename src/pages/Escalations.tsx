import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  User,
  FileText,
  Filter,
  Search,
  MessageSquare,
  ChevronRight,
  ExternalLink,
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
  CardFooter,
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
import {
  useEscalations,
  useEscalation,
  useEscalationComments,
  useEscalationActions,
  useEscalationCounts,
} from '@/hooks/useEscalations';
import type {
  EscalationRequest,
  EscalationStatus,
  EscalationUrgency,
  EscalationFilters,
} from '@/types/contracts';
import { cn } from '@/lib/utils';

// ============================================================================
// URGENCY CONFIG
// ============================================================================

const URGENCY_CONFIG: Record<EscalationUrgency, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Baja', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  medium: { label: 'Media', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  high: { label: 'Alta', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const STATUS_CONFIG: Record<EscalationStatus, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: { label: 'Pendiente', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Clock },
  in_review: { label: 'En revisión', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: User },
  resolved: { label: 'Resuelta', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
  rejected: { label: 'Rechazada', color: 'text-red-700', bgColor: 'bg-red-100', icon: AlertTriangle },
};

// ============================================================================
// ESCALATION CARD
// ============================================================================

function EscalationCard({
  escalation,
  isSelected,
  onClick,
}: {
  escalation: EscalationRequest & { clause_heading?: string; document_name?: string };
  isSelected: boolean;
  onClick: () => void;
}) {
  const urgencyConfig = URGENCY_CONFIG[escalation.urgency];
  const statusConfig = STATUS_CONFIG[escalation.status];
  const StatusIcon = statusConfig.icon;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge className={cn(urgencyConfig.bgColor, urgencyConfig.color, 'border-0')}>
              {urgencyConfig.label}
            </Badge>
            <Badge variant="outline" className={cn(statusConfig.bgColor, statusConfig.color, 'border-0')}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardTitle className="text-base mt-2 line-clamp-1">
          {escalation.clause_heading || 'Cláusula sin título'}
        </CardTitle>
        <CardDescription className="line-clamp-1">
          {escalation.document_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {escalation.reason}
        </p>
      </CardContent>
      <CardFooter className="pt-2 text-xs text-muted-foreground">
        <div className="flex items-center justify-between w-full">
          <span>
            {new Date(escalation.created_at).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          {escalation.assigned_to_name && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {escalation.assigned_to_name}
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

// ============================================================================
// ESCALATION DETAIL PANEL
// ============================================================================

function EscalationDetailPanel({
  escalationId,
  onResolve,
}: {
  escalationId: string;
  onResolve: () => void;
}) {
  const { data: escalation, isLoading } = useEscalation(escalationId);
  const { data: comments } = useEscalationComments(escalationId);
  const { resolveEscalation, addComment } = useEscalationActions();
  const [newComment, setNewComment] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveDialog, setShowResolveDialog] = useState(false);

  const handleAddComment = () => {
    if (newComment.trim()) {
      addComment.mutate({ escalationId, content: newComment });
      setNewComment('');
    }
  };

  const handleResolve = (resolution: 'approved' | 'rejected' | 'modified') => {
    resolveEscalation.mutate({
      escalationId,
      resolution,
      resolutionNotes,
      approveChanges: resolution === 'approved',
    });
    setShowResolveDialog(false);
    onResolve();
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!escalation) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Escalación no encontrada</p>
      </div>
    );
  }

  const urgencyConfig = URGENCY_CONFIG[escalation.urgency];
  const statusConfig = STATUS_CONFIG[escalation.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn(urgencyConfig.bgColor, urgencyConfig.color, 'border-0')}>
                Urgencia: {urgencyConfig.label}
              </Badge>
              <Badge variant="outline" className={cn(statusConfig.bgColor, statusConfig.color, 'border-0')}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            <h2 className="text-lg font-semibold">Escalación #{escalation.escalation_id.slice(0, 8)}</h2>
            <p className="text-sm text-muted-foreground">
              Creada por {escalation.created_by_name || 'Usuario'} el{' '}
              {new Date(escalation.created_at).toLocaleString('es-ES')}
            </p>
          </div>
          {escalation.status !== 'resolved' && escalation.status !== 'rejected' && (
            <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
              <DialogTrigger asChild>
                <Button>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolver
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Resolver escalación</DialogTitle>
                  <DialogDescription>
                    Selecciona cómo deseas resolver esta escalación.
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  placeholder="Notas de resolución (opcional)"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="min-h-[100px]"
                />
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="text-red-600"
                    onClick={() => handleResolve('rejected')}
                  >
                    Rechazar cambios
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleResolve('modified')}
                  >
                    Modificar
                  </Button>
                  <Button onClick={() => handleResolve('approved')}>
                    Aprobar cambios
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {/* Reason */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Motivo de la escalación</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{escalation.reason}</p>
          </CardContent>
        </Card>

        {/* Context */}
        {escalation.context && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Contexto adicional</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{escalation.context}</p>
            </CardContent>
          </Card>
        )}

        {/* Link to document */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Documento relacionado</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/review/${escalation.document_id}`}>
                <FileText className="h-4 w-4 mr-2" />
                Ver contrato
                <ExternalLink className="h-3 w-3 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Resolution */}
        {escalation.resolution && (
          <Card className="mb-4 border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-800">Resolución</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="mb-2 bg-green-600">{escalation.resolution}</Badge>
              {escalation.resolution_notes && (
                <p className="text-sm text-green-700">{escalation.resolution_notes}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Comments */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comentarios ({comments?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {comments?.map((comment) => (
              <div key={comment.comment_id} className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{comment.author_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleString('es-ES')}
                  </span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            ))}

            {/* Add comment */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Añadir comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px]"
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || addComment.isPending}
              >
                Enviar
              </Button>
            </div>
          </CardContent>
        </Card>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// STATS CARDS
// ============================================================================

function StatsCards() {
  const { data: counts, isLoading } = useEscalationCounts();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  const stats = [
    { label: 'Pendientes', value: counts?.pending || 0, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { label: 'En revisión', value: counts?.in_review || 0, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Alta urgencia', value: counts?.high_urgency || 0, color: 'text-red-600', bg: 'bg-red-100' },
    { label: 'Resueltas', value: counts?.resolved || 0, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map(({ label, value, color, bg }) => (
        <Card key={label}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={cn('text-2xl font-bold', color)}>{value}</p>
              </div>
              <div className={cn('p-3 rounded-full', bg)}>
                <AlertTriangle className={cn('h-5 w-5', color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

function EscalationsContent() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filters: EscalationFilters = {
    status: statusFilter !== 'all' ? [statusFilter as EscalationStatus] : undefined,
    urgency: urgencyFilter !== 'all' ? [urgencyFilter as EscalationUrgency] : undefined,
  };

  const { data: escalations, isLoading } = useEscalations(filters);

  // Filter by search
  const filteredEscalations = (escalations || []).filter((e: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      e.reason?.toLowerCase().includes(query) ||
      e.clause_heading?.toLowerCase().includes(query) ||
      e.document_name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Escalaciones</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona las cláusulas que requieren revisión manual
        </p>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Content */}
      <div className="flex gap-6 h-[calc(100vh-20rem)]">
        {/* Left - List */}
        <div className="w-96 flex flex-col">
          {/* Filters */}
          <div className="space-y-2 mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar escalaciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="in_review">En revisión</SelectItem>
                  <SelectItem value="resolved">Resuelta</SelectItem>
                </SelectContent>
              </Select>
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Urgencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* List */}
          <ScrollArea className="flex-1">
            <div className="space-y-3 pr-2">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))
              ) : filteredEscalations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay escalaciones</p>
                </div>
              ) : (
                filteredEscalations.map((escalation: any) => (
                  <EscalationCard
                    key={escalation.escalation_id}
                    escalation={escalation}
                    isSelected={escalation.escalation_id === selectedId}
                    onClick={() => setSelectedId(escalation.escalation_id)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right - Detail */}
        <div className="flex-1 border rounded-lg bg-background">
          {selectedId ? (
            <EscalationDetailPanel
              escalationId={selectedId}
              onResolve={() => setSelectedId(null)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecciona una escalación para ver los detalles</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Escalations() {
  return (
    <AppLayout>
      <EscalationsContent />
    </AppLayout>
  );
}
