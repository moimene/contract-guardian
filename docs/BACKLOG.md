# Contract Guardian - Product Backlog

**Actualizado**: 2026-02-01 | **Sprint**: Febrero S1 | **PO**: Guardian AI

---

## 📊 Estado del Sprint Actual

| Métrica | Target | Actual | Estado |
|---------|--------|--------|--------|
| Router Accuracy | 89%+ | 44.9% | 🔴 CRITICAL |
| Escalation Rate | <15% | ~93% | 🔴 CRITICAL |
| Pending Reviews | 0 | 50 | 🟡 MEDIUM |
| Stuck Processing | 0 | 8 | 🟡 MEDIUM |

---

## 🔴 P0 - CRITICAL (Must Have Esta Semana)

### BL-001: Optimizar Router Accuracy
**Prioridad**: P0 | **Esfuerzo**: L | **Valor**: CRITICAL

> **User Story**: Como sistema, necesito clasificar cláusulas con ≥89% accuracy para reducir escalaciones falsas y mejorar la confianza del usuario.

**Criterios de Aceptación**:
- [ ] Router v4.1 clasifica Force Majeure al 100%
- [ ] Router v4.1 clasifica Indemnity al 90%+
- [ ] Router v4.1 clasifica Liability al 90%+
- [ ] "OtherUnknown" reducido de 55.1% a <10%
- [ ] Tests automatizados para las 22 familias

**Dependencias**: `keyword_router_v4.1.js`, Playbook Specs YAML

**Subtareas**:
1. [ ] Analizar distribución actual de clasificaciones
2. [ ] Expandir patrones de keywords por familia
3. [ ] Añadir familias faltantes al router
4. [ ] Crear test suite con 100+ ejemplos reales
5. [ ] Validar accuracy post-cambios

---

### BL-002: Reducir Escalation Rate
**Prioridad**: P0 | **Esfuerzo**: M | **Valor**: CRITICAL

> **User Story**: Como abogado, necesito que solo las cláusulas verdaderamente ambiguas se escalen, para no perder tiempo revisando falsos positivos.

**Criterios de Aceptación**:
- [ ] Escalation Rate < 25% (fase 1)
- [ ] Escalation Rate < 15% (fase 2)
- [ ] Threshold de confianza ajustado
- [ ] Feedback loop implementado desde Observability

**Dependencias**: BL-001 (Router Accuracy), W2 Pipeline

---

## 🟠 P1 - HIGH (Esta Semana si P0 Avanza)

### BL-003: Resolver Contract Runs Atascados
**Prioridad**: P1 | **Esfuerzo**: S | **Valor**: HIGH

> **User Story**: Como usuario, necesito que mis documentos no queden "En proceso" indefinidamente.

**Criterios de Aceptación**:
- [ ] 8 runs en PROCESSING resueltos
- [ ] Timeout implementado en W3 (max 10 min)
- [ ] Alerta por Slack/Email para runs > 5 min
- [ ] UI muestra opción "Reintentar" para runs fallidos

**Subtareas**:
1. [ ] Identificar causa de los 8 runs stuck
2. [ ] Implementar timeout en W3
3. [ ] Agregar retry logic con backoff
4. [ ] Actualizar status manualmente si necesario

---

### BL-004: Procesar 50 Pending Reviews
**Prioridad**: P1 | **Esfuerzo**: M | **Valor**: HIGH

> **User Story**: Como sistema, necesito feedback humano para mejorar los modelos mediante RLHF.

**Criterios de Aceptación**:
- [ ] Dashboard de revisión funcional
- [ ] Workflow de aprobación/rechazo
- [ ] Datos de feedback guardados en BD
- [ ] Métricas de feedback visibles en Observability

---

## 🟡 P2 - MEDIUM (Próxima Semana)

### BL-005: Añadir Familias Faltantes al Router
**Prioridad**: P2 | **Esfuerzo**: M | **Valor**: MEDIUM

> **User Story**: Como sistema, necesito cubrir todas las familias de cláusulas para no clasificar como "OtherUnknown".

**Familias a añadir** (basado en playbook_specs):
- [ ] `Representations` (Prodco/Amazon)
- [ ] `Warranties` (Prodco/Amazon)  
- [ ] `Audit` rights
- [ ] `DataProtection` / GDPR
- [ ] `Compliance` regulatory

---

### BL-006: UI - Sección Playbook
**Prioridad**: P2 | **Esfuerzo**: M | **Valor**: MEDIUM

> **User Story**: Como Legal Ops, necesito ver y gestionar las configuraciones del playbook desde la UI.

**Criterios de Aceptación**:
- [ ] Página `/playbook` funcional
- [ ] Lista las 22 familias de cláusulas
- [ ] Muestra configuración por familia
- [ ] Permite editar thresholds

---

### BL-007: Exportar Reporte de Contrato
**Prioridad**: P2 | **Esfuerzo**: S | **Valor**: MEDIUM

> **User Story**: Como abogado, necesito exportar el análisis completo en PDF/Word para compartir con el cliente.

**Criterios de Aceptación**:
- [ ] Botón "Exportar" en ContractReview
- [ ] Formato: PDF o DOCX
- [ ] Incluye: resumen, cláusulas, recomendaciones
- [ ] Branding configurable

---

## 🟢 P3 - LOW (Backlog Futuro)

### BL-008: Integración Google Drive
**Prioridad**: P3 | **Esfuerzo**: L | **Valor**: LOW

> Reactivar W1 para ingesta batch desde Google Drive compartido.

---

### BL-009: Multi-Tenancy
**Prioridad**: P3 | **Esfuerzo**: XL | **Valor**: FUTURE

> Soportar múltiples organizaciones con playbooks independientes.

---

### BL-010: GraphRAG Integration
**Prioridad**: P3 | **Esfuerzo**: XL | **Valor**: FUTURE

> Implementar Capa 3 (GraphRAG) para análisis de relaciones entre cláusulas.

---

## 📋 Resumen del Sprint

| Prioridad | Items | Estado |
|-----------|-------|--------|
| P0 Critical | 2 | 🔴 En progreso |
| P1 High | 2 | 🟠 Planificado |
| P2 Medium | 3 | 🟡 Backlog |
| P3 Low | 3 | 🟢 Futuro |
| **Total** | **10** | - |

---

## 🎯 Definición de Done (DoD)

Todo item del backlog debe cumplir:
- [ ] Código sin errores TypeScript
- [ ] Tests pasando (si aplica)
- [ ] Build exitoso en Vercel
- [ ] Documentación actualizada
- [ ] Métricas verificadas en Observability
- [ ] Review por PO aprobado

---

*Generado por Guardian PO - 1 febrero 2026*
