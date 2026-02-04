# W1 DriveIngest - DEPRECATED

> ⚠️ **STATUS: DEPRECATED** (31 enero 2026)

## Razón de Deprecación

El flujo actual de Contract Guardian **ya no requiere W1** para su operación:

| Capacidad W1 | Cobertura Actual |
|--------------|------------------|
| Download desde Google Drive | ❌ No se usa - UI hace upload directo |
| Upload a Supabase Storage | ✅ Cubierto por UI (`NewAnalysis.tsx`) |
| Crear registro en `documents` | ✅ Cubierto por UI |
| Trigger de workflow siguiente | ✅ Cubierto por `start_review` Edge Function |

## Flujo Actual (sin W1)

```
UI Upload → Supabase Storage + documents → start_review EF → W3 → W2
```

## Archivo Preservado

El archivo `W1_DriveIngest.json` se mantiene como referencia histórica por si se necesita reactivar funcionalidad de ingesta desde Google Drive en el futuro.

## Posibles Escenarios de Reactivación

1. Integración con folder compartido de clientes en Google Drive
2. Ingesta batch automatizada desde repositorio documental
3. Migración de documentos legacy

---
*Deprecado por decisión de optimización - Ver implementation_plan.md*
