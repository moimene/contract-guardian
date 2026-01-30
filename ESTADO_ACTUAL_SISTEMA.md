# Estado Actual del Sistema - Contract Guardian v2.2
**Fecha de Actualización: 2026-01-29**

> ⚠️ **IMPORTANTE**: Este documento es la fuente de verdad sobre la arquitectura actual. Documentos antiguos pueden contener referencias obsoletas a "Lovable" que **NO APLICAN**.

---

## 🏗️ Arquitectura Real (Implementada)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND: React + Vite (LOCAL)                        │
│                    Directorio: /web                                      │
│                    Puerto: http://localhost:5173                         │
│                    Deploy: Vercel (https://web-tan-mu-35.vercel.app)    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    SUPABASE (EXTERNO UNIFICADO)                          │
│                    Project: hvlsuwdqtffiilvampxq                         │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│   │  PostgreSQL 15  │  │ Edge Functions  │  │    Storage      │        │
│   │   + pgvector    │  │   (9 activas)   │  │  /contracts/    │        │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘        │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         n8n CLOUD                                        │
│   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐           │
│   │ W1_DriveIngest │  │W2_ClauseReview │  │W3_ContractRev  │           │
│   └────────────────┘  └────────────────┘  └────────────────┘           │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         OPENAI API                                       │
│   gpt-4o (Paranoid) | gpt-4o-mini (Router, Valuator, Sanitizer)        │
│   text-embedding-3-small (1536 dims)                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ❌ Lovable NO Está en Uso

| Componente | Histórico | Actual |
|------------|-----------|--------|
| **Frontend** | Lovable Cloud | **React + Vite** (`/web`) |
| **Base de Datos** | Lovable (jirgkdvajlhsnydxybpi) | **Supabase externo** (hvlsuwdqtffiilvampxq) |
| **Deploy** | Lovable Cloud | **Vercel** |

Las 66+ referencias a "Lovable" en docs/ y db/ son **OBSOLETAS**.

---

## ✅ Estado de Implementación Verificado

### Base de Datos (Supabase)

| Tabla | Estado | Registros | Notas |
|-------|--------|-----------|-------|
| `policy_specs` | ✅ Existe | 9 activos | 9 familias configuradas |
| `clause_reviews_internal` | ✅ Existe | - | Separación internal/client |
| `sanitizer_outputs` | ✅ Existe | - | Solo visible a cliente |
| `matters` | ✅ Existe | 24 | Categorías legales |
| `clause_types` | ✅ Existe | 95 | Tipos de cláusula |
| `policy_examples` | ✅ Existe | 1,367 | 100% con embeddings |

### FamilyPacks (Prompts Especializados)

| Familia | TH_ANCHOR | Archivo | Estado |
|---------|-----------|---------|--------|
| PaymentCredits | 0.85 | ✅ family_packs.js | Implementado |
| ThirdPartyCredits | 0.85 | ✅ family_packs.js | Implementado |
| RepsProdCo | 0.88 | ✅ family_packs.js | Implementado |
| RepsAmazon | 0.85 | ✅ family_packs.js | Implementado |
| RepsTruthTerm | 0.83 | ✅ family_packs.js | Implementado |
| IndemnityProdCo | 0.86 | ✅ family_packs.js | Implementado |
| IndemnityAmazon | 0.85 | ✅ family_packs.js | Implementado |
| DefenseSettlement | 0.87 | ✅ family_packs.js | Implementado |
| SurvivalRemedies | 0.85 | ✅ family_packs.js | Implementado |
| OtherUnknown | 0.85 | ✅ family_packs.js | Fallback |

### Workflow W2 (n8n)

| Nodo | Estado | Función |
|------|--------|---------|
| Webhook | ✅ | Entry point |
| Router Agent | ✅ | Clasificar familia |
| Context Retriever | ✅ | Recuperar PolicySpec + RAG |
| Build Family Prompt | ✅ | Seleccionar FamilyPack |
| Paranoid Agent | ✅ | Análisis con prompt dinámico |
| Parse Paranoid | ✅ | + Schema validation |
| Valuator Agent | ✅ | Decisión con prompt dinámico |
| Parse Valuator | ✅ | + Schema validation |
| Decisor | ✅ | Matriz 5-path |
| Sanitizer | ✅ | Limpieza comentarios |
| Build Result | ✅ | + LeakageGuard (35 términos) |
| Save | ✅ | → clause_reviews_internal |

---

## ✅ Gaps P0 Cerrados (2026-01-29)

> Compound Engineering REVIEW completado: **100% consistencia**

### Resumen Audit

| Check | Estado | Detalle |
|-------|--------|---------|
| FamilyPacks | ✅ 10/10 | Paranoid + Valuator + TH_ANCHOR |
| Schema Flow | ✅ 7/7 | Todos los campos se propagan |
| Error Handling | ✅ 6/6 | onError=continueErrorOutput |
| Timeouts | ✅ 6/6 | 30-60s configurados |
| LeakageGuard | ✅ 44 términos | blocklist completo |
| Dual Persistence | ✅ 2 tablas | internal + sanitized |
| ValidatorDeterministic | ✅ 3 checks | no-new-text, anchor-conf, anchor-exists |

### Nodos Añadidos en W2

| Nodo | Función | Posición |
|------|---------|----------|
| ValidatorDeterministic | Validación determinista | Parse Valuator → Decisor |
| Save to sanitizer_outputs | Persistencia cliente | Build Result → Respond |

### Workflow Actualizado

```
22 nodos | 21 conexiones
Parse Valuator → ValidatorDeterministic → Decisor → Sanitizer
    → Build Result → Save Internal → Save Sanitized → Respond
```

---

## 🟡 Gaps P1 Pendientes

| Gap | Estado | Notas |
|-----|--------|-------|
| CompletenessChecker (W3) | ❌ Pendiente | Verificar familias required |
| Test E2E IndemnityProdCo | 🔄 Payload listo | Pendiente ejecución |

---

## 📊 Métricas Actuales

| Métrica | Valor |
|---------|-------|
| Policy Examples con embeddings | **1,367 (100%)** |
| PolicySpecs activos | **9** |
| Matters | **24** |
| Clause Types | **95** |
| LeakageGuard términos | **44** |
| FamilyPacks prompts | **10** (9 + 1 fallback) |
| W2 Nodos | **22** |
| W2 Conexiones | **21** |

---

## 🔧 Cómo Ejecutar

### Frontend Local
```bash
cd web
npm install
npm run dev
# → http://localhost:5173
```

### Producción
- **Frontend**: https://web-tan-mu-35.vercel.app
- **Supabase**: https://hvlsuwdqtffiilvampxq.supabase.co

---

## 📝 Comparativa PRD v2.1 vs Implementación Real

| Aspecto | PRD v2.1 Indica | Realidad Implementada |
|---------|-----------------|----------------------|
| Frontend | "React + Vite" | ✅ Correcto |
| PolicySpecs | No mencionado | ✅ Existe (9 activos) |
| FamilyPacks | No mencionado | ✅ Existe (9 familias) |
| Separación Internal/Client | No mencionado | ✅ Tablas existen |
| Lovable | ❌ NO en uso | Confirmado - NO en uso |

### Conclusión

El sistema está más avanzado de lo que el gap analysis sugería:
- **Base de datos**: ~90% implementada (policy_specs, internal/client split)
- **Prompts**: 100% implementados (family_packs.js)
- **W2 workflow**: ~85% actualizado
- **Pendiente**: Validador determinista, wiring final, CompletenessChecker

---

*Última actualización: 2026-01-29 09:20 | Contract Guardian v2.2*
