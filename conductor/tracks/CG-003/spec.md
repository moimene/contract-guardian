# CG-003: Run Lifecycle & Stuck Processing

## Estado: ✅ DONE

---

## Objetivo
Implementar un lifecycle determinista para contract_runs, eliminando runs zombies y asegurando trazabilidad.

## Problemas Resueltos

### 1. Runs atascados en PROCESSING
- **8 runs** identificados en estado PROCESSING por más de 1 día
- Sin mecanismo para detectar o resolver timeouts

### 2. Estados insuficientes
- Solo existían: CREATED, PROCESSING, COMPLETED
- No había forma de indicar errores parciales o timeouts

## Entregables

### 1. SQL Migration `20260201_cg003_run_lifecycle.sql`

#### Estados Añadidos
| Estado | Descripción |
|--------|-------------|
| `COMPLETED_WITH_ERRORS` | Run terminó pero algunas cláusulas fallaron |
| `FAILED` | Run falló completamente |
| `TIMEOUT` | Run excedió límite de 1 hora |
| `CANCELLED` | Usuario canceló el run |

#### Funciones Creadas

```sql
-- Matar runs zombies (>1 hora en PROCESSING)
watchdog_kill_zombie_runs()

-- Completar un run de forma segura
complete_run_safely(run_id, processed_clauses, failed_clauses)

-- Marcar un run como fallido
fail_run(run_id, error_message)
```

#### pg_cron Job
- **Nombre**: `watchdog_zombie_runs`
- **Schedule**: Cada 15 minutos
- **Acción**: Ejecuta `watchdog_kill_zombie_runs()`

### 2. Columnas Añadidas
- `failed_clauses` - Conteo de cláusulas que fallaron
- `last_activity_at` - Timestamp de última actividad

## Instrucciones de Despliegue

```bash
# Ejecutar migración
npx supabase db push

# Verificar
SELECT watchdog_kill_zombie_runs();
SELECT status, COUNT(*) FROM contract_runs GROUP BY status;
```

## Criterios de Aceptación
- [x] Estados FAILED, TIMEOUT, COMPLETED_WITH_ERRORS disponibles
- [x] Función watchdog creada
- [x] pg_cron job configurado (si extensión disponible)
- [x] Runs stuck migrados a TIMEOUT
- [ ] W3 Error Trigger añadido (requiere workflow update)
