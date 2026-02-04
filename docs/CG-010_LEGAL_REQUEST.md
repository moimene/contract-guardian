# Solicitud: Posiciones Estándar Amazon para Auto-Redline

**Para**: Equipo Legal
**De**: Contract Guardian Tech Team
**Fecha**: 2026-02-03
**Prioridad**: Alta
**Referencia**: CG-010 Auto-Redline v1

---

## Resumen Ejecutivo

El sistema Contract Guardian necesita **texto legal de referencia** para generar sugerencias automáticas de redlining cuando detecta cláusulas no conformes en contratos PSA/DSA de Amazon.

Actualmente tenemos definidas 5 familias. Necesitamos las **21 familias restantes** para completar la cobertura.

---

## Qué Necesitamos

Para cada familia de cláusulas, necesitamos **3 elementos**:

### 1. `summary` (Resumen de la Posición)
Una descripción de 1-2 oraciones de cuál es la posición estándar de Amazon.

**Ejemplo** (LiabilityLimitation):
> "Amazon's liability shall not be subject to mutual or symmetric caps. ProdCo liability caps are acceptable. Carve-outs required for gross negligence, willful misconduct, IP infringement, and confidentiality breaches."

### 2. `replacement_text` (Texto de Reemplazo)
El texto legal exacto que debería aparecer en el contrato. Este texto se mostrará como sugerencia al equipo de revisión.

**Ejemplo** (LiabilityLimitation):
> "Notwithstanding the foregoing, nothing in this Agreement shall limit Amazon's liability for (a) death or personal injury caused by Amazon's negligence, (b) fraud or fraudulent misrepresentation, (c) gross negligence or willful misconduct, (d) breach of confidentiality obligations, or (e) infringement of ProdCo's intellectual property rights."

### 3. `delete_triggers` (Patrones a Eliminar)
Una lista de frases o patrones que, si aparecen en la cláusula, indican lenguaje no conforme que debe ser reemplazado.

**Ejemplo** (LiabilityLimitation):
- "shall not exceed"
- "aggregate liability"
- "capped at"
- "neither party shall be liable"
- "mutual limitation"

---

## Familias Ya Definidas ✅

Las siguientes 5 familias ya tienen texto legal aprobado:

| # | Familia | Prioridad |
|---|---------|-----------|
| 1 | LiabilityLimitation | CRITICAL |
| 2 | IndemnityProdCo | CRITICAL |
| 3 | IndemnityAmazon | CRITICAL |
| 4 | IndemnityProcedures | CRITICAL |
| 5 | Insurance | HIGH |

---

## Familias Pendientes (21)

### Prioridad CRITICAL

| # | Familia | Descripción | ¿Qué revisar? |
|---|---------|-------------|---------------|
| 6 | **TerminationRights** | Derechos de terminación | ¿Quién puede terminar? ¿Con qué aviso? ¿Por qué causas? |
| 7 | **TerminationConsequences** | Consecuencias post-terminación | ¿Qué sobrevive? ¿Liquidación? ¿Inventario? |
| 8 | **RightsGrant** | Concesión de derechos (IP, contenido) | ¿Alcance? ¿Exclusividad? ¿Sublicencias? |
| 9 | **RightsReversion** | Reversión de derechos | ¿Cuándo revierten? ¿Condiciones? |
| 10 | **AuditRights** | Derechos de auditoría | ¿Frecuencia? ¿Alcance? ¿Notificación previa? |

### Prioridad HIGH

| # | Familia | Descripción | ¿Qué revisar? |
|---|---------|-------------|---------------|
| 11 | **PaymentCredits** | Créditos y compensaciones | ¿Fórmulas objetivas? ¿Documentación? |
| 12 | **RepsProdCo** | Representaciones de ProdCo | ¿"Knowledge qualifiers"? ¿Alcance? |
| 13 | **Confidentiality** | Confidencialidad | ¿Mutual? ¿Duración? ¿Excepciones? |
| 14 | **DataProtection** | Protección de datos (GDPR) | ¿Procesador vs Controlador? ¿DPA? |
| 15 | **DisputeResolution** | Resolución de disputas | ¿Arbitraje? ¿Jurisdicción? ¿Mediación? |
| 16 | **ForceMajeure** | Fuerza mayor | ¿Eventos cubiertos? ¿Pandemia? ¿Cyber? |

### Prioridad MEDIUM

| # | Familia | Descripción | ¿Qué revisar? |
|---|---------|-------------|---------------|
| 17 | **Assignment** | Cesión del contrato | ¿Consentimiento? ¿Afiliados? |
| 18 | **Publicity** | Publicidad y marketing | ¿Uso de marca? ¿Aprobación previa? |
| 19 | **ServicesScope** | Alcance de servicios | ¿Definición? ¿Cambios? |
| 20 | **AmazonControl** | Control operativo de Amazon | ¿Pricing? ¿Merchandising? |
| 21 | **SurvivalRemedies** | Supervivencia y remedios | ¿Qué cláusulas sobreviven? |

### Prioridad LOW

| # | Familia | Descripción | ¿Qué revisar? |
|---|---------|-------------|---------------|
| 22 | **GeneralProvisions** | Provisiones generales | Enmiendas, avisos, renuncia |
| 23 | **ThirdPartyCredits** | Créditos de terceros | Reconocimientos, atribuciones |
| 24 | **MoralRights** | Derechos morales | Renuncia de derechos morales |
| 25 | **AIPolicy** | Políticas de IA | Uso de IA generativa, restricciones |
| 26 | **KeyPersons** | Personas clave | Cláusulas de persona clave |

---

## Formato de Entrega

Por favor complete la siguiente plantilla para cada familia:

```yaml
Familia: [Nombre de la Familia]
Prioridad: CRITICAL | HIGH | MEDIUM | LOW

summary: |
  [1-2 oraciones describiendo la posición estándar de Amazon]

replacement_text: |
  [Texto legal exacto que debería aparecer en el contrato.
   Puede ser múltiples oraciones o párrafos.]

delete_triggers:
  - "[Frase 1 que indica lenguaje no conforme]"
  - "[Frase 2]"
  - "[Frase 3]"
  - "[etc.]"
```

---

## Ejemplo Completo (para referencia)

```yaml
Familia: IndemnityProcedures
Prioridad: CRITICAL

summary: |
  Notice periods shall be reasonable (minimum 30 days). Failure to 
  provide timely notice shall only reduce obligations to extent of 
  actual prejudice. Settlement requires consent for admissions of liability.

replacement_text: |
  The Indemnifying Party shall provide prompt written notice of any 
  claim, but in no event later than thirty (30) days after becoming 
  aware of such claim. Failure to provide timely notice shall not 
  relieve the Indemnifying Party of its obligations except to the 
  extent such failure materially prejudices the defense. No settlement 
  that admits liability or imposes obligations on the Indemnified Party 
  shall be made without such party's prior written consent.

delete_triggers:
  - "five (5) business days"
  - "deemed waived"
  - "sole control"
  - "without consent"
```

---

## Cronograma Sugerido

| Fase | Familias | Deadline Sugerido |
|------|----------|-------------------|
| 1 | CRITICAL (5 familias: #6-10) | 1 semana |
| 2 | HIGH (6 familias: #11-16) | 2 semanas |
| 3 | MEDIUM + LOW (10 familias: #17-26) | 3 semanas |

---

## Contacto

Para dudas técnicas sobre el formato o integración:
- **Sistema**: Contract Guardian (CG-010)
- **Workflow**: W2_ClauseReview v3.0

---

**Nota**: El sistema NO aplicará cambios automáticamente. Todas las sugerencias requieren revisión humana antes de aplicarse al documento.
