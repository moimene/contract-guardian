A continuación tienes “todo el modelo” con el máximo nivel de detalle práctico: contratos de datos, JSON Schemas (draft‑07), prompts (tal cual vuestra especificación), rutas por familias, RAG/Vector/GraphRAG, validadores deterministas, matriz de decisión (gating), y artefactos de redline (ChangeSet/anchors) listos para orquestar en n8n y persistir en Supabase/Postgres.

El objetivo de este entregable es que un equipo de ingeniería pueda implementar el sistema multiagente sin volver a inventar nada y con control auditable.

1) Principios del modelo (inmutables)

Playbook = Source of Truth

Ningún agente crea rule_id nuevos.

Si no hay cobertura o ambigüedad → NotCoveredByPlaybook / Ambiguous → escalado.

Separación dura “Internal vs Client‑facing”

Los outputs del Router/Paranoico/Valorador son internos.

El único texto “cliente” es SanitizerOutput.client_comment y client_summary_line, sujeto a blocklist.

No “texto nuevo”

El Valorador solo puede proponer texto que exista exactamente en STANDARD_POSITION o FALLBACK_ACCEPTABLE (con source_reference.exact_text).

Reproducibilidad

Offsets sobre clause_text exacto.

Temperatura 0 en agentes 1/2.

Validación determinista + versionado de PolicySpec + prompts.

2) Catálogo de rutas (cuántas rutas Paranoico→Valorador hay)

Con el playbook/familias del DSA Amazon, el sistema se implementa como 9 rutas “plantilla” Paranoico→Valorador, instanciadas n‑veces por cada ClauseInstance:

Agent.PaymentCredits

Agent.ThirdPartyCredits

Agent.RepsProdCo

Agent.RepsAmazon

Agent.RepsTruthTerm

Agent.IndemnityProdCo

Agent.IndemnityAmazon

Agent.DefenseSettlement

Agent.SurvivalRemedies

Importante: la ruta es una “plantilla” (prompts+schemas+retrieval profile). En runtime se instancia por clause_id + rule_id.

3) Modelo de configuración: PolicySpec (por regla)
3.1. PolicySpec (estructura mínima)

Este es el objeto que compila el Playbook y alimenta Router/Paranoico/Valorador.

{
  "rule_id": "DSA_Amazon:2025-10-29:Fees",
  "rule_name": "Fees",
  "clause_family": "Agent.PaymentCredits",
  "required": true,
  "analysis_mode": "MODE_ENUMERATED_DEVIATIONS",
  "routing_policy": {
    "type": "ESCALATE_IF_UNACCEPTABLE",
    "target_group": "AmazonLegal",
    "block_export": true
  },
  "standard_position": {
    "text": "…",
    "text_hash": "sha256:…"
  },
  "fallback_acceptable_fragments": [
    {"text": "…", "text_hash": "sha256:…"}
  ],
  "unacceptable_patterns": [
    {"pattern_text": "…", "pattern_hash": "sha256:…"}
  ],
  "retrieval_profile": {
    "vector_top_k": 3,
    "coverage_threshold": 0.78,
    "examples_top_k": 8
  },
  "decision_policy": {
    "TH_ANCHOR": 0.85,
    "TH_CONF_OVERALL": 0.80
  },
  "metadata": {
    "playbook_id": "DSA_Amazon",
    "playbook_version": "2025-10-29",
    "policy_spec_version": "psv-001"
  }
}


Notas

standard_position.text y fallbacks nunca se exponen al cliente; solo se usan para redline y auditoría interna.

analysis_mode y routing_policy derivan del playbook y son editables por el despacho en consola (rol interno).

4) Especificación por agente (0–3) + deterministas
4.1 Agente 0 — Clause Router (determinista; LLM opcional)
Implementación determinista (recomendada)

Entrada

heading, clause_text, candidate_rules_from_vector (topK), families_catalog.

Lógica

vector_search(STANDARD_POSITION embeddings) → topK reglas con score.

heurísticas: keywords + heading + sinónimos por familia.

coverage_confidence = score máximo ajustado por dispersión (si top1≈top2, baja confianza).

Si coverage_confidence < coverage_threshold → rule_candidates=[].

Prompt LLM auxiliar (opcional)

Usar exactamente el prompt minimalista que proporcionaste.

4.2 Agente 1 — Analista Paranoico (alto recall)

Objetivo

Señalar cualquier desviación con spans reproducibles, sin decidir.

Entradas

policy_spec (solo regla activa) + standard_position + acceptable_variations + unacceptable_variations + variation_set_examples.

Salida

JSON ParanoidAnalyzerOutput validado (draft‑07) con observations[].

4.3 Agente 2 — Valorador conforme al Playbook (alto precision)

Objetivo

final_status + proposed_changes[] seguros + escalation.

Reglas duras

No texto nuevo.

No “materialidad” si no está definida.

En MODE_STRICT_NO_DEVIATIONS, cualquier cambio relevante → UnacceptableDeviation.

4.4 Agente 3 — Sanitizer (client‑facing seguro)

Objetivo

Crear client_comment neutral y seguro, con blocklist y safety.pass.

4.5 Deterministas (sin LLM)

DeterministicValidator

Decider/Gating

AnchorResolver

LeakageGuard (pre‑export)

RedlineEngine (ChangeSet→DOCX)

5) JSON Schemas (Draft‑07) — listos para validar en n8n

A continuación incluyo los 4 esquemas principales + ChangeSet (para redline). Están pensados para additionalProperties=false (control estricto).

5.1 Schema: ClauseRouterOutput (draft‑07)
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ClauseRouterOutput",
  "type": "object",
  "additionalProperties": false,
  "required": ["clause_id", "detected_family", "rule_candidates", "coverage_confidence"],
  "properties": {
    "clause_id": { "type": "string", "minLength": 1 },
    "detected_family": { "type": "string", "minLength": 1 },
    "rule_candidates": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["rule_id", "score"],
        "properties": {
          "rule_id": { "type": "string", "minLength": 1 },
          "score": { "type": "number", "minimum": 0, "maximum": 1 }
        }
      }
    },
    "coverage_confidence": { "type": "number", "minimum": 0, "maximum": 1 }
  }
}

5.2 Schema: ParanoidAnalyzerOutput (draft‑07)
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ParanoidAnalyzerOutput",
  "type": "object",
  "additionalProperties": false,
  "required": ["clause_id", "detected_family", "rule_candidates", "observations", "summary", "model_info"],
  "properties": {
    "clause_id": { "type": "string", "minLength": 1 },
    "detected_family": { "type": "string", "minLength": 1 },
    "rule_candidates": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["rule_id", "score"],
        "properties": {
          "rule_id": { "type": "string", "minLength": 1 },
          "score": { "type": "number", "minimum": 0, "maximum": 1 }
        }
      }
    },
    "active_rule_id": { "type": "string" },

    "observations": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["quote", "offsets", "change_type", "possible_category", "signal_terms", "confidence"],
        "properties": {
          "observation_id": { "type": "string" },
          "quote": { "type": "string", "minLength": 1 },
          "offsets": {
            "type": "object",
            "additionalProperties": false,
            "required": ["start", "end"],
            "properties": {
              "start": { "type": "integer", "minimum": 0 },
              "end": { "type": "integer", "minimum": 1 }
            }
          },
          "change_type": {
            "type": "string",
            "enum": ["missing", "added", "modified", "potential_ambiguity", "matches_standard"]
          },
          "possible_category": {
            "type": "string",
            "enum": ["MatchesStandard", "MatchesAcceptable", "MatchesUnacceptable", "UnknownChange"]
          },
          "signal_terms": { "type": "array", "items": { "type": "string" } },
          "confidence": { "type": "number", "minimum": 0, "maximum": 1 }
        }
      }
    },

    "summary": {
      "type": "object",
      "additionalProperties": false,
      "required": ["counts", "coverage_confidence"],
      "properties": {
        "counts": {
          "type": "object",
          "additionalProperties": false,
          "required": ["total", "matches_standard", "matches_acceptable", "matches_unacceptable", "unknown_change"],
          "properties": {
            "total": { "type": "integer", "minimum": 0 },
            "matches_standard": { "type": "integer", "minimum": 0 },
            "matches_acceptable": { "type": "integer", "minimum": 0 },
            "matches_unacceptable": { "type": "integer", "minimum": 0 },
            "unknown_change": { "type": "integer", "minimum": 0 },
            "missing": { "type": "integer", "minimum": 0 },
            "added": { "type": "integer", "minimum": 0 },
            "modified": { "type": "integer", "minimum": 0 },
            "potential_ambiguity": { "type": "integer", "minimum": 0 }
          }
        },
        "coverage_confidence": { "type": "number", "minimum": 0, "maximum": 1 }
      }
    },

    "model_info": {
      "type": "object",
      "additionalProperties": false,
      "required": ["model", "temperature", "prompt_version"],
      "properties": {
        "model": { "type": "string" },
        "temperature": { "type": "number" },
        "prompt_version": { "type": "string" }
      }
    }
  }
}

5.3 Schema: PlaybookValuatorOutput (draft‑07)
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PlaybookValuatorOutput",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "clause_id",
    "rule_id",
    "analysis_mode",
    "final_status",
    "proposed_changes",
    "escalation",
    "confidence_overall",
    "dependencies",
    "audit"
  ],
  "properties": {
    "clause_id": { "type": "string", "minLength": 1 },
    "rule_id": { "type": "string", "minLength": 1 },

    "analysis_mode": {
      "type": "string",
      "enum": [
        "MODE_STRICT_NO_DEVIATIONS",
        "MODE_ENUMERATED_DEVIATIONS",
        "MODE_POLICY_JUDGMENT_REQUIRED"
      ]
    },

    "final_status": {
      "type": "string",
      "enum": ["Compliant", "AcceptableDeviation", "UnacceptableDeviation", "NotCoveredByPlaybook", "Ambiguous"]
    },

    "proposed_changes": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["op_type", "anchor", "source_reference"],
        "properties": {
          "change_id": { "type": "string" },

          "op_type": { "type": "string", "enum": ["INSERT", "DELETE", "REPLACE"] },

          "anchor": {
            "type": "object",
            "additionalProperties": false,
            "required": ["quote", "offsets", "anchor_confidence"],
            "properties": {
              "quote": { "type": "string", "minLength": 1 },
              "offsets": {
                "type": "object",
                "additionalProperties": false,
                "required": ["start", "end"],
                "properties": {
                  "start": { "type": "integer", "minimum": 0 },
                  "end": { "type": "integer", "minimum": 1 }
                }
              },
              "anchor_confidence": { "type": "number", "minimum": 0, "maximum": 1 },
              "strategy": { "type": "string" }
            }
          },

          "delete_text": { "type": "string" },
          "insert_text": { "type": "string" },
          "replace_from": { "type": "string" },
          "replace_to": { "type": "string" },

          "source_reference": {
            "type": "object",
            "additionalProperties": false,
            "required": ["source_type", "exact_text", "match_method"],
            "properties": {
              "source_type": { "type": "string", "enum": ["STANDARD_POSITION", "FALLBACK_ACCEPTABLE"] },
              "exact_text": { "type": "string", "minLength": 1 },
              "match_method": { "type": "string", "enum": ["EXACT", "NORMALIZED_EXACT"] }
            }
          }
        },
        "allOf": [
          {
            "if": { "properties": { "op_type": { "const": "DELETE" } } },
            "then": { "required": ["delete_text"] }
          },
          {
            "if": { "properties": { "op_type": { "const": "INSERT" } } },
            "then": { "required": ["insert_text"] }
          },
          {
            "if": { "properties": { "op_type": { "const": "REPLACE" } } },
            "then": { "required": ["replace_from", "replace_to"] }
          }
        ]
      }
    },

    "escalation": {
      "type": "object",
      "additionalProperties": false,
      "required": ["recommended", "reason", "routing_policy_effect"],
      "properties": {
        "recommended": { "type": "boolean" },
        "reason": {
          "type": "string",
          "enum": [
            "WITH_LEGAL_APPROVAL_REQUIRED",
            "NOT_COVERED_BY_PLAYBOOK",
            "AMBIGUOUS_POLICY_JUDGMENT",
            "UNACCEPTABLE_DEVIATION_STRICT",
            "LOW_CONFIDENCE_ANCHOR",
            "LOW_CONFIDENCE_OVERALL"
          ]
        },
        "routing_policy_effect": {
          "type": "object",
          "additionalProperties": false,
          "required": ["type", "block_export"],
          "properties": {
            "type": { "type": "string" },
            "target_group": { "type": "string" },
            "block_export": { "type": "boolean" }
          }
        }
      }
    },

    "confidence_overall": { "type": "number", "minimum": 0, "maximum": 1 },

    "dependencies": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["dep_type", "text_snippet"],
        "properties": {
          "dep_type": { "type": "string", "enum": ["DefinedTerm", "CrossReference", "Exhibit", "ClauseDependency"] },
          "source_clause_id": { "type": "string" },
          "target_clause_id": { "type": "string" },
          "text_snippet": { "type": "string" }
        }
      }
    },

    "audit": {
      "type": "object",
      "additionalProperties": false,
      "required": ["evidence_spans", "valuator_model", "prompt_version"],
      "properties": {
        "evidence_spans": {
          "type": "array",
          "items": {
            "type": "object",
            "additionalProperties": false,
            "required": ["quote", "start", "end"],
            "properties": {
              "quote": { "type": "string" },
              "start": { "type": "integer", "minimum": 0 },
              "end": { "type": "integer", "minimum": 1 },
              "observation_id": { "type": "string" }
            }
          }
        },
        "valuator_model": { "type": "string" },
        "prompt_version": { "type": "string" }
      }
    }
  }
}

5.4 Schema: SanitizerOutput (draft‑07)
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SanitizerOutput",
  "type": "object",
  "additionalProperties": false,
  "required": ["clause_id", "client_comment", "client_summary_line", "locale", "safety", "redactions", "model_info"],
  "properties": {
    "clause_id": { "type": "string", "minLength": 1 },
    "client_comment": { "type": "string" },
    "client_summary_line": { "type": "string" },
    "locale": { "type": "string", "minLength": 2 },

    "safety": {
      "type": "object",
      "additionalProperties": false,
      "required": ["blocked_terms_detected", "leak_score", "policy_leak_flags", "pass"],
      "properties": {
        "blocked_terms_detected": { "type": "array", "items": { "type": "string" } },
        "leak_score": { "type": "number", "minimum": 0, "maximum": 1 },
        "policy_leak_flags": { "type": "array", "items": { "type": "string" } },
        "pass": { "type": "boolean" }
      }
    },

    "redactions": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["field", "from", "to"],
        "properties": {
          "field": { "type": "string", "enum": ["client_comment", "client_summary_line"] },
          "from": { "type": "string" },
          "to": { "type": "string" }
        }
      }
    },

    "model_info": {
      "type": "object",
      "additionalProperties": false,
      "required": ["model", "prompt_version"],
      "properties": {
        "model": { "type": "string" },
        "prompt_version": { "type": "string" }
      }
    }
  }
}

5.5 Schema: ChangeSet (para redline DOCX)

Este es el “puente” entre Agente 2 (proposed_changes) y el motor DOCX.

{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ChangeSet",
  "type": "object",
  "additionalProperties": false,
  "required": ["document_id", "playbook_id", "playbook_version", "changes", "docx_export"],
  "properties": {
    "document_id": { "type": "string" },
    "playbook_id": { "type": "string" },
    "playbook_version": { "type": "string" },

    "changes": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["change_id", "rule_id", "clause_instance_id", "ops", "comments"],
        "properties": {
          "change_id": { "type": "string" },
          "rule_id": { "type": "string" },
          "clause_instance_id": { "type": "string" },

          "ops": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": ["op_id", "type", "anchor"],
              "properties": {
                "op_id": { "type": "string" },
                "type": { "type": "string", "enum": ["INSERT", "DELETE", "REPLACE"] },

                "anchor": {
                  "type": "object",
                  "additionalProperties": false,
                  "required": ["strategy", "clause_id", "context_hash"],
                  "properties": {
                    "strategy": { "type": "string", "enum": ["CLAUSE_OFFSET_CONTEXT", "PARAGRAPH_RUN_MAP"] },
                    "clause_id": { "type": "string" },
                    "start_offset": { "type": "integer", "minimum": 0 },
                    "end_offset": { "type": "integer", "minimum": 0 },
                    "before": { "type": "string" },
                    "after": { "type": "string" },
                    "context_hash": { "type": "string" }
                  }
                },

                "insert_text": { "type": "string" },
                "delete_text": { "type": "string" },
                "replace_from": { "type": "string" },
                "replace_to": { "type": "string" }
              }
            }
          },

          "comments": {
            "type": "object",
            "additionalProperties": false,
            "required": ["internal", "client"],
            "properties": {
              "internal": { "type": "string" },
              "client": { "type": "string" }
            }
          }
        }
      }
    },

    "docx_export": {
      "type": "object",
      "additionalProperties": false,
      "required": ["author_name_for_revisions", "sanitize_client_comments"],
      "properties": {
        "author_name_for_revisions": { "type": "string" },
        "sanitize_client_comments": { "type": "boolean" }
      }
    }
  }
}

6) Validadores deterministas (especificación exacta)
6.1 DeterministicValidator: reglas

Regla V1 — “No texto nuevo”

Para cada proposed_changes[i].source_reference.exact_text:

debe existir como substring exacto en standard_position.text o en alguno de fallback_acceptable_fragments.text, según source_type.

Regla V2 — Anchor mínimo

Si anchor.anchor_confidence < TH_ANCHOR y el cambio es crítico (required o final_status inaceptable) → forzar escalation.reason=LOW_CONFIDENCE_ANCHOR.

Regla V3 — Coherencia operación‑campos

INSERT debe traer insert_text

DELETE debe traer delete_text

REPLACE debe traer replace_from, replace_to

Regla V4 — Evidencia obligatoria

audit.evidence_spans[] no vacío cuando final_status != Compliant.

Regla V5 — Leak precheck

escaneo de tokens prohibidos en cualquier campo client-facing (si ya se generó).

6.2 AnchorResolver: cálculo de anchor_confidence (determinista)

Entrada:

clause_text

anchor.quote + offsets

contexto (ventana before/after)

Cálculo recomendado (determinista, auditable):

Verificar que clause_text.substring(start,end) coincide con quote (exacto) → base 1.0

Si falla, probar match normalizado (espacios/puntuación) → base 0.9

Si hay múltiples matches del mismo quote en la cláusula → penalizar (p.ej. 0.9→0.75)

Incorporar match de contexto before/after (si coincide, subir; si no, bajar)

Resultado: anchor_confidence ∈ [0,1].

6.3 Decider/Gating: matriz determinista (mínima)

Variables:

required

routing_policy.type

routing_policy.block_export

final_status

confidence_overall

anchor_confidence

Decisión:

Si final_status in {NotCoveredByPlaybook, Ambiguous}
→ ESCALATE_HUMAN
→ BLOCK_EXPORT si routing_policy.block_export=true

Si final_status = UnacceptableDeviation

si anchor_confidence >= TH_ANCHOR y confidence_overall >= TH_CONF_OVERALL
→ AUTO_REDLINEDRAFT (+ escalado si routing exige)

else → ESCALATE_HUMAN (+ posible BLOCK_EXPORT)

Si final_status = AcceptableDeviation

si routing_policy.type incluye aprobación → ESCALATE_HUMAN (esto modela “Pasable”)

si no → AUTO_PASS

Si final_status = Compliant

AUTO_PASS salvo que routing_policy.type=ESCALATE (casos especiales)

7) RAG gobernado: cómo se indexa y cómo se recupera
7.1 Namespacing de embeddings (multi‑tenant y por regla)

Recomendación de partición lógica en Postgres:

tenant_id

playbook_id

playbook_version

rule_id

agent_family

doc_type (standard / acceptable / unacceptable / example)

Esto te permite:

actualizar un playbook sin romper otro,

recuperar solo lo permitido por la regla activa,

auditar qué se usó exactamente.

7.2 Tablas mínimas (Supabase)

playbooks(id, version, status, created_at)

playbook_rules(rule_id, playbook_id, version, clause_family, required, analysis_mode, routing_policy_json, standard_text, …)

variation_examples(example_id, rule_id, label, text, text_hash, embedding vector, source {synthetic|human}, created_at)

blocked_terms(tenant_id, term, severity)

clauses(clause_instance_id, document_id, clause_id, heading, clause_text, offsets_json, paragraph_ids_json, embedding vector)

clause_reviews(run_id, clause_instance_id, router_json, paranoid_json, valuator_json, sanitizer_json, decision_json, created_at)

changesets(document_id, version_id, changeset_json, created_at)

audit_events(event_id, run_id, step, payload_json, created_at)

7.3 Retriever (por regla activa)

variation_set_examples = topK por similitud entre clause_embedding y variation_examples.embedding filtrado por rule_id y label in (STANDARD, ACCEPTABLE, UNACCEPTABLE, NOT_COVERED).

8) GraphRAG (opcional pero modelado)

Entrada: document_ir + clauses[]
Salida: dependencies para el Valorador

Componentes:

DefinedTermExtractor (determinista + LLM opcional)

CrossReferenceExtractor

ContractGraph (nodes: Clause, DefinedTerm, Exhibit; edges: defines/refers_to/depends_on)

Retriever GraphRAG:

Dado un clause_instance_id, recuperar:

definiciones referenciadas por términos presentes

cláusulas cross‑referenced

exhibiciones mencionadas

Se pasa al Valorador como dependencies (ya lo contempláis en inputs).

9) Generación de datos sintéticos (sujeta a guardrails del playbook)

Pipeline (n8n job):

seleccionar rule_id

generar ejemplos solo dentro de:

“Aceptables” (match fallbacks)

“Pasables” (aceptables condicionados → se etiquetan AcceptableDeviation + escalation flag)

“No aceptables”

“No cubiertos”

validar:

no texto fuera del dominio

deduplicación por hash

insertar en variation_examples

recalcular embeddings y refrescar índices

Regla de oro: lo sintético no crea política; solo aumenta cobertura del clasificador.

10) Orquestación n8n (modelo operativo)
10.1 Subworkflow por cláusula (plantilla)

RouterNode → RetrieverNode → ParanoidLLM → ValuatorLLM → DetValidator → AnchorResolver → Decider → SanitizerLLM → Persist

10.2 Concurrencia y reintentos

Concurrencia por contrato: 5–10 cláusulas (config).

Reintentos:

Router determinista: sí

LLM: 1 reintento máximo (idempotencia por run_id + clause_id + step)

Timeouts:

Paranoico: corto

Valorador: medio

Sanitizer: corto

11) Prompts (tal cual vuestra especificación)

Ya los has definido con precisión. La recomendación de “modelo” es:

Guardar cada prompt como artefacto versionado:

prompt_id

prompt_version

system_text

developer_text

schema_ref

Persistir en cada clause_reviews.*_json.model_info.prompt_version.

Esto convierte el sistema en audit‑ready.

12) Qué queda “por implementar” (lista de entregables técnicos)

Si queréis que el equipo implemente sin fricción, los siguientes artefactos deben existir como archivos/repositorio:

/schemas/*.json

ClauseRouterOutput.json

ParanoidAnalyzerOutput.json

PlaybookValuatorOutput.json

SanitizerOutput.json

ChangeSet.json

/prompts/{family}/{agent}/vX.txt

family = 9 familias

agent = router/paranoid/valuator/sanitizer

/validators/

validate_no_new_text.ts

validate_anchor_conf.ts

gating_matrix.ts

leakage_guard.ts

/n8n/

workflows exportados (json)

subworkflow ClauseReview

/db/

migrations SQL para Supabase

índices pgvector + policies RLS