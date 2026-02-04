# CG-001: Taxonomy Single Source of Truth

## Estado: ✅ DONE

---

## Objetivo
Establecer una única fuente de verdad para la clasificación de cláusulas (familias) que sea consistente en todo el sistema.

## Problema Resuelto
- Router Agent, Parse Router y Decision Engine usaban listas diferentes de familias
- Cláusulas como "Force Majeure" o "Data Privacy" se clasificaban como OtherUnknown
- No había validación centralizada

## Entregables

### 1. `CANONICAL_FAMILIES` Constant
**Archivo**: `/n8n/keyword_router_v4.1.js` (actualizado a v4.2)

```javascript
const CANONICAL_FAMILIES = [
    "PaymentCredits", "ThirdPartyCredits", "RepsProdCo", "RepsAmazon",
    "IndemnityProdCo", "IndemnityAmazon", "IndemnityProcedures",
    "LiabilityLimitation", "TerminationRights", "TerminationConsequences",
    "Confidentiality", "DataPrivacy", "GoverningLaw", "DisputeResolution",
    "ForceMajeure", "Insurance", "RightsGrant", "RightsReversion",
    "AuditRights", "Publicity", "Assignment", "ServicesScope",
    "SurvivalRemedies", "AmazonControl", "GeneralProvisions",
    "Definitions", "Parties", "OtherUnknown"
];
```

### 2. Parse Router v4.2
**Archivo**: `/n8n/parse_router_v4.2.js`
- `validFamilies` sincronizado con CANONICAL_FAMILIES
- `FAMILY_NORMALIZE` expandido con 150+ variantes

### 3. Nuevos Pattern Families
- `DataPrivacy` - GDPR/CCPA patterns
- `Publicity` - Press release/marketing patterns
- `GoverningLaw` - Choice of law patterns

## Instrucciones de Despliegue
Ver: [CG-001_DEPLOYMENT.md](../CG-001_DEPLOYMENT.md)

## Criterios de Aceptación
- [x] `CANONICAL_FAMILIES` exportada desde keyword_router
- [x] Parse Router valida contra 28 familias
- [x] Keyword Router tiene patterns para todas las familias core
- [ ] Router Agent prompt actualizado (pendiente)
- [ ] Decision Engine sincronizado (pendiente CG-002)
