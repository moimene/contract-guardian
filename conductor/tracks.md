# 📋 Contract Guardian - Track Registry

**Última actualización**: 1 Febrero 2026  
**Sprint activo**: Core Consolidation (Fase 0-3)

---

## Tracks Activos

| Track ID | Título | Prioridad | Estado | Spec |
|----------|--------|-----------|--------|------|
| CG-001 | Taxonomy Single Source | P0 | 🟢 DONE | [spec](tracks/CG-001/spec.md) |
| CG-002 | Decision Semantics Alignment | P0 | 🟢 DONE | [spec](tracks/CG-002/spec.md) |
| CG-003 | Run Lifecycle & Stuck Processing | P0 | 🟢 DONE | [spec](tracks/CG-003/spec.md) |
| CG-004 | W3→W2 Payload Completo | P0 | 🟢 DONE | [spec](tracks/CG-004/spec.md) |
| CG-005 | Metrics & QA Integrity | P1 | 🟢 DONE | [spec](tracks/CG-005/spec.md) |
| CG-006 | Router Evaluation Harness | P1 | 🟡 IN_PROGRESS | [spec](tracks/CG-006/spec.md) |
| CG-007 | Decision Policy Tuning | P1 | 🔴 TODO | [spec](tracks/CG-007/spec.md) |
| CG-008 | Secrets / Proxyization | P1 | 🔴 TODO | [spec](tracks/CG-008/spec.md) |

---

## Leyenda Estado

- 🔴 TODO - No iniciado
- 🟡 IN_PROGRESS - En desarrollo
- 🟢 DONE - Completado y verificado
- ⚫ BLOCKED - Bloqueado por dependencia

---

## Dependencias

```
CG-001 ──┬──> CG-002 ──> CG-007
         │
         └──> CG-004 ──> CG-006
         
CG-003 (independiente, ejecutar en paralelo)

CG-005 ──> CG-006

CG-008 (independiente, ejecutar tras CG-004)
```

---

## Backlog Futuro

| Track ID | Título | Prioridad | Notas |
|----------|--------|-----------|-------|
| CG-009 | Auto-redline Implementation | P2 | Post CG-007 |
| CG-010 | Multi-language Support | P2 | Stretch goal |
