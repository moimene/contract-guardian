import { FileText, PlayCircle, Building2, Shield, Briefcase, Database, Building, Users, Lock, CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Contract type configuration with availability status
interface ContractTypeOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  isAvailable: boolean;
}

const CONTRACT_TYPES: ContractTypeOption[] = [
  // Available
  {
    id: 'amazon-psa',
    name: 'Amazon PSA',
    description: 'Production Services Agreement',
    icon: FileText,
    isAvailable: true,
  },
  {
    id: 'dsa_streaming_v1',
    name: 'DSA Streaming',
    description: 'Digital Services Agreement - Streaming',
    icon: PlayCircle,
    isAvailable: true,
  },
  // Coming Soon
  {
    id: 'nueva-planta-epc',
    name: 'Nueva Planta EPC',
    description: 'Engineering, Procurement & Construction',
    icon: Building2,
    isAvailable: false,
  },
  {
    id: 'nda_standard',
    name: 'NDA',
    description: 'Non-Disclosure Agreement',
    icon: Shield,
    isAvailable: false,
  },
  {
    id: 'msa_standard',
    name: 'MSA',
    description: 'Master Services Agreement',
    icon: Briefcase,
    isAvailable: false,
  },
  {
    id: 'dpa_standard',
    name: 'DPA',
    description: 'Data Processing Agreement',
    icon: Database,
    isAvailable: false,
  },
  {
    id: 'lease_commercial',
    name: 'Lease Agreement',
    description: 'Contrato de Arrendamiento',
    icon: Building,
    isAvailable: false,
  },
  {
    id: 'employment_standard',
    name: 'Employment Contract',
    description: 'Contrato Laboral',
    icon: Users,
    isAvailable: false,
  },
];

interface ContractTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ContractTypeSelector({ value, onChange, disabled }: ContractTypeSelectorProps) {
  const availableTypes = CONTRACT_TYPES.filter(t => t.isAvailable);
  const comingSoonTypes = CONTRACT_TYPES.filter(t => !t.isAvailable);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <label className="text-sm font-medium">Tipo de Contrato</label>
        
        {/* Available Types */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Disponibles
          </p>
          <div className="grid gap-2">
            {availableTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = value === type.id;
              
              return (
                <button
                  key={type.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(type.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/50 hover:bg-muted/50",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{type.name}</span>
                      <Badge variant="success">Disponible</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{type.description}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Separator */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
        </div>
        
        {/* Coming Soon Types */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Próximamente
          </p>
          <div className="grid gap-2">
            {comingSoonTypes.map((type) => {
              const Icon = type.icon;
              
              return (
                <Tooltip key={type.id}>
                  <TooltipTrigger asChild>
                    <div
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 opacity-60 cursor-not-allowed"
                    >
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-muted-foreground">{type.name}</span>
                          <Badge variant="warning">Próximamente</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground/70 truncate">{type.description}</p>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Este tipo de contrato estará disponible próximamente</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export { CONTRACT_TYPES };
