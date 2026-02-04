# Contract Guardian — UI Functional Specification
## Revisión para Product Owner | v1.0 | Febrero 2026

---

## 1. Resumen Ejecutivo

Contract Guardian dispone de **7 pantallas de producción** organizadas en un flujo de trabajo lineal para revisión de contratos PSA (Production Services Agreement).

```
Login → Dashboard → NewAnalysis → ContractReview → Escalations
                          ↓
                    [Background: W3 → W2 Workflows]
```

---

## 2. Inventario de Pantallas UI

| # | Página | Archivo | Estado | Funcionalidad Principal |
|---|--------|---------|--------|-------------------------|
| 1 | **Login** | `Login.tsx` | ✅ Prod | Autenticación via Supabase Auth |
| 2 | **Dashboard** | `Dashboard.tsx` | ✅ Prod | Vista de documentos y estadísticas |
| 3 | **NewAnalysis** | `NewAnalysis.tsx` | ✅ Prod | Upload de contratos, trigger W3 |
| 4 | **ContractReview** | `ContractReview.tsx` | ✅ Prod | Revisión de cláusulas + CG-011 |
| 5 | **Escalations** | `Escalations.tsx` | ✅ Prod | Gestión de escalaciones humanas |
| 6 | **Observability** | `Observability.tsx` | ✅ Prod | Métricas y monitoreo |
| 7 | **Playbook** | `Playbook.tsx` | ✅ Prod | Configuración de políticas |

---

## 3. User Stories por Pantalla

### 3.1 Dashboard

| US-ID | User Story | Criterio de Aceptación | Estado |
|-------|------------|------------------------|--------|
| US-001 | Como abogado, quiero ver mis documentos recientes | Lista con nombre, fecha, estado | ✅ DONE |
| US-002 | Como abogado, quiero ver estadísticas de revisión | Contadores: pendientes, completados, bloqueados | ✅ DONE |
| US-003 | Como abogado, quiero filtrar por estado | Filtros: todos, pendiente, completado | ✅ DONE |

---

### 3.2 NewAnalysis

| US-ID | User Story | Criterio de Aceptación | Estado |
|-------|------------|------------------------|--------|
| US-010 | Como abogado, quiero subir un contrato DOCX/PDF | Upload drag-and-drop + selector de archivo | ✅ DONE |
| US-011 | Como abogado, quiero seleccionar tipo de contrato | Selector: PSA (Production Services Agreement) | ✅ DONE |
| US-012 | Como abogado, quiero ver el progreso del análisis | Barra de progreso + estados de workflow | ✅ DONE |
| US-013 | Como abogado, quiero ser redirigido automáticamente | Redirección a ContractReview al completar | ✅ DONE |

---

### 3.3 ContractReview (CG-011) ⭐ PRINCIPAL

| US-ID | User Story | Criterio de Aceptación | Estado |
|-------|------------|------------------------|--------|
| US-020 | Como abogado, quiero ver lista de cláusulas | Panel izquierdo con todas las cláusulas | ✅ DONE |
| US-021 | Como abogado, quiero filtrar por estado de cláusula | Filtros: OK, Recomendado, Requerido, Bloqueado | ✅ DONE |
| US-022 | Como abogado, quiero ver detalle de cláusula | Panel derecho con texto original + sugerencias | ✅ DONE |
| US-023 | Como abogado, quiero **aceptar** una sugerencia | Botón "Accept" + registro de quién y cuándo | ✅ DONE |
| US-024 | Como abogado, quiero **rechazar** una sugerencia | Botón "Reject" + registro de quién y cuándo | ✅ DONE |
| US-025 | Como abogado, quiero **editar** texto sugerido | Textarea inline + Save/Cancel | ✅ DONE |
| US-026 | Como abogado, quiero **deshacer** una edición | Botón "Undo" restaura texto original AI | ✅ DONE |
| US-027 | Como abogado, quiero aceptar todas las sugerencias | Botón "Accept All" con diálogo de confirmación | ✅ DONE |
| US-028 | Como abogado, quiero buscar cláusulas | Campo de búsqueda por texto/título | ✅ DONE |
| US-029 | Como abogado, quiero ver audit trail | "Accepted by [email] · [fecha/hora]" visible | ✅ DONE |
| US-030 | Como abogado, quiero exportar documento | Botón "Exportar" (pendiente CG-012) | 🔜 NEXT |

---

### 3.4 Escalations

| US-ID | User Story | Criterio de Aceptación | Estado |
|-------|------------|------------------------|--------|
| US-040 | Como abogado senior, quiero ver escalaciones pendientes | Lista con prioridad y fecha | ✅ DONE |
| US-041 | Como abogado senior, quiero aprobar una escalación | Botón aprobar + comentario | ✅ DONE |
| US-042 | Como abogado senior, quiero rechazar una escalación | Botón rechazar + motivo | ✅ DONE |
| US-043 | Como abogado senior, quiero ver historial | Lista de escalaciones resueltas | ✅ DONE |

---

### 3.5 Observability

| US-ID | User Story | Criterio de Aceptación | Estado |
|-------|------------|------------------------|--------|
| US-050 | Como Legal Ops, quiero ver métricas de Router | Accuracy, distribución por familia | ✅ DONE |
| US-051 | Como Legal Ops, quiero ver tasa de escalación | Porcentaje y tendencia | ✅ DONE |
| US-052 | Como Legal Ops, quiero ver tiempos de procesamiento | Tiempo promedio por cláusula | ✅ DONE |

---

### 3.6 Playbook

| US-ID | User Story | Criterio de Aceptación | Estado |
|-------|------------|------------------------|--------|
| US-060 | Como Legal Ops, quiero ver familias de cláusulas | Lista de 26 familias activas | ✅ DONE |
| US-061 | Como Legal Ops, quiero ver ejemplos por familia | Conteo de ejemplos ACCEPTABLE/UNACCEPTABLE | ✅ DONE |

---

## 4. Integración con Workflows

### Flujo E2E

```
[Usuario]       [Frontend]         [Edge Function]      [n8n]
    |               |                    |                 |
    |--Upload------>|                    |                 |
    |               |--Trigger---------->|                 |
    |               |                    |--W3 Contract--->|
    |               |                    |                 |--Parse clauses
    |               |                    |                 |--For each clause
    |               |                    |                 |----> W2 Review
    |               |<---Realtime--------|<---Save---------|
    |<--View--------|                    |                 |
```

### Workflows Activos

| Workflow | Trigger | Output |
|----------|---------|--------|
| **W3_ContractReview** | `start_review` Edge Function | Cláusulas en `clause_instances` |
| **W2_ClauseReview** | Cada cláusula de W3 | Revisión en `clause_reviews_internal` |

---

## 5. Próximos Pasos (PSA Phase)

| Ticket | Descripción | Estado | Prioridad |
|--------|-------------|--------|-----------|
| CG-011 | UI Suggestion Review | ✅ DONE | — |
| CG-012 | DOCX Export (Track Changes) | 🔜 NEXT | CRITICAL |
| CG-013 | PSA E2E Demo & Freeze | ⏳ Pending | HIGH |

---

## 6. Captura de Pantalla - ContractReview (CG-011)

![CG-011 Audit Trail Verified](/Users/moisesmenendez/.gemini/antigravity/brain/b6ffce76-24ca-4c8a-941d-09bca5be15f2/cg011_audit_trail_verified.png)

---

## Aprobación PO

| Campo | Valor |
|-------|-------|
| Documento | UI Functional Specification v1.0 |
| Fecha | 2026-02-03 |
| Revisado por | — |
| Aprobado | ☐ Sí / ☐ No / ☐ Con observaciones |

**Observaciones PO:**

> _(Espacio para comentarios del Product Owner)_
