

# Plan: Selector de Tipos de Contrato con Estados (Disponible/Proximamente)

## Contexto

El componente `NewAnalysis.tsx` actualmente usa un `Select` simple con 3 opciones hardcodeadas. El usuario necesita:

1. Mostrar tipos de contrato **disponibles** (funcionales): `amazon-psa`, `dsa_streaming_v1`
2. Mostrar tipos de contrato **proximamente** (deshabilitados): Nueva Planta EPC, NDA, MSA, DPA, Lease, Employment
3. Diseño visual diferenciado con badges y estados

## Problemas de Configuracion Detectados

Antes de implementar, hay **problemas criticos** que deben resolverse:

| Archivo Faltante | Impacto |
|------------------|---------|
| `index.html` | El proyecto no puede iniciar |
| `vite.config.ts` | Vite no puede configurarse |
| `build:dev` script en package.json | Build falla |

Estos archivos deben crearse/actualizarse manualmente ya que son archivos de configuracion que Lovable no puede generar automaticamente.

---

## Cambios Propuestos

### 1. Actualizar `src/pages/NewAnalysis.tsx`

**Objetivo**: Reemplazar el Select simple por un selector visual con cards

#### 1.1 Definir datos de tipos de contrato

```typescript
// Tipos de contrato con estado de disponibilidad
interface ContractTypeOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  isAvailable: boolean;
}

const CONTRACT_TYPES: ContractTypeOption[] = [
  // Disponibles
  {
    id: 'amazon-psa',
    name: 'Amazon PSA',
    description: 'Production Services Agreement',
    icon: 'file-text',
    isAvailable: true,
  },
  {
    id: 'dsa_streaming_v1',
    name: 'DSA Streaming',
    description: 'Digital Services Agreement - Streaming',
    icon: 'play-circle',
    isAvailable: true,
  },
  // Proximamente
  {
    id: 'nueva-planta-epc',
    name: 'Nueva Planta EPC',
    description: 'Engineering, Procurement & Construction',
    icon: 'building-2',
    isAvailable: false,
  },
  {
    id: 'nda_standard',
    name: 'NDA',
    description: 'Non-Disclosure Agreement',
    icon: 'shield',
    isAvailable: false,
  },
  {
    id: 'msa_standard',
    name: 'MSA',
    description: 'Master Services Agreement',
    icon: 'briefcase',
    isAvailable: false,
  },
  {
    id: 'dpa_standard',
    name: 'DPA',
    description: 'Data Processing Agreement',
    icon: 'database',
    isAvailable: false,
  },
  {
    id: 'lease_commercial',
    name: 'Lease Agreement',
    description: 'Contrato de Arrendamiento',
    icon: 'building',
    isAvailable: false,
  },
  {
    id: 'employment_standard',
    name: 'Employment Contract',
    description: 'Contrato Laboral',
    icon: 'users',
    isAvailable: false,
  },
];
```

#### 1.2 Crear componente de tarjeta de tipo de contrato

Reemplazar el `Select` (lineas 189-202) por un grid de cards:

```tsx
{/* Grid de tipos de contrato */}
<div className="space-y-4">
  <label className="text-sm font-medium">Tipo de Contrato</label>
  
  {/* Tipos Disponibles */}
  <div className="space-y-2">
    <p className="text-xs text-muted-foreground uppercase tracking-wide">Disponibles</p>
    <div className="grid gap-2">
      {CONTRACT_TYPES.filter(t => t.isAvailable).map((type) => (
        <button
          key={type.id}
          type="button"
          disabled={step !== 2}
          onClick={() => setContractType(type.id)}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
            contractType === type.id
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-border hover:border-primary/50 hover:bg-muted/50",
            step !== 2 && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{type.name}</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                Disponible
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{type.description}</p>
          </div>
          {contractType === type.id && (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          )}
        </button>
      ))}
    </div>
  </div>
  
  {/* Separador */}
  <div className="relative py-2">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-border" />
    </div>
  </div>
  
  {/* Tipos Proximamente */}
  <div className="space-y-2">
    <p className="text-xs text-muted-foreground uppercase tracking-wide">Proximamente</p>
    <div className="grid gap-2">
      {CONTRACT_TYPES.filter(t => !t.isAvailable).map((type) => (
        <Tooltip key={type.id}>
          <TooltipTrigger asChild>
            <div
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 opacity-60 cursor-not-allowed"
            >
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-muted-foreground">{type.name}</span>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">
                    Proximamente
                  </span>
                </div>
                <p className="text-sm text-muted-foreground/70">{type.description}</p>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Este tipo de contrato estara disponible proximamente</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  </div>
</div>
```

#### 1.3 Actualizar imports

Anadir al inicio del archivo:

```typescript
import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
```

---

### 2. Crear componentes UI faltantes (si no existen)

El proyecto parece tener una estructura incompleta. Se necesitan:

#### 2.1 `src/components/ui/badge.tsx`

```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        success: "border-transparent bg-green-100 text-green-700",
        warning: "border-transparent bg-amber-100 text-amber-700",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```

#### 2.2 `src/components/ui/tooltip.tsx`

```typescript
import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
```

---

### 3. Estructura Visual Final

```
┌─────────────────────────────────────────────────────────────────┐
│ Tipo de Contrato                                                │
├─────────────────────────────────────────────────────────────────┤
│ DISPONIBLES                                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [icon] Amazon PSA                           [Disponible] ✓ │ │
│ │        Production Services Agreement                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [icon] DSA Streaming                        [Disponible]   │ │
│ │        Digital Services Agreement - Streaming              │ │
│ └─────────────────────────────────────────────────────────────┘ │
├───────────────────────── ─ ─ ─ ─ ─ ─ ──────────────────────────┤
│ PROXIMAMENTE                                                    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [🔒] Nueva Planta EPC                     [Proximamente]   │ │
│ │      Engineering, Procurement & Construction   (disabled)  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [🔒] NDA                                   [Proximamente]  │ │
│ │      Non-Disclosure Agreement                  (disabled)  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ...                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4. Dependencias Requeridas

El proyecto necesita estas dependencias de Radix UI para los tooltips:

```bash
npm install @radix-ui/react-tooltip class-variance-authority
```

O si ya estan instaladas pero no estan siendo usadas, solo necesitamos crear los componentes.

---

## Seccion Tecnica

### Archivos a Modificar

| Archivo | Accion | Lineas Afectadas |
|---------|--------|------------------|
| `src/pages/NewAnalysis.tsx` | Modificar | 1-225 (reescribir selector) |
| `src/components/ui/badge.tsx` | Crear | Nuevo archivo |
| `src/components/ui/tooltip.tsx` | Crear | Nuevo archivo (si no existe) |

### Orden de Implementacion

1. Verificar/crear `src/components/ui/tooltip.tsx`
2. Crear `src/components/ui/badge.tsx`
3. Actualizar `src/pages/NewAnalysis.tsx`:
   - Anadir interface `ContractTypeOption`
   - Definir array `CONTRACT_TYPES`
   - Reemplazar `Select` por grid de cards
   - Anadir imports necesarios

### Consideraciones de Accesibilidad

- Los tipos deshabilitados tienen `cursor-not-allowed` y `opacity-60`
- Tooltips explican por que estan deshabilitados
- Los tipos disponibles son botones con `role="button"` implicito
- El estado seleccionado tiene indicador visual (borde + checkmark)

---

## Problemas Pendientes (Requieren Accion Manual)

El proyecto tiene errores de build que deben resolverse:

1. **Crear `index.html`** en la raiz del proyecto
2. **Crear `vite.config.ts`** con configuracion basica de Vite + React
3. **Anadir script `build:dev`** a `package.json`:
   ```json
   "build:dev": "vite build --mode development"
   ```

Estos archivos son de configuracion y deben crearse manualmente.

