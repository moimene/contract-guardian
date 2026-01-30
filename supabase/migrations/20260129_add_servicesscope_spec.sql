-- Migration: Add ServicesScope and Confidentiality Playbook Specs
-- Date: 2026-01-29

-- ServicesScope Playbook Spec
INSERT INTO playbook_specs (
  family_id,
  display_name,
  priority,
  requires_legal_review,
  amazon_position,
  acceptability_matrix,
  negotiation_guidance,
  risk_assessment,
  detection_patterns
) VALUES (
  'ServicesScope',
  'Scope of Services',
  'SUPPORT',
  false,
  '{
    "summary": "ProdCo is engaged to render comprehensive production services for the Program. Amazon requires full-service delivery including pre-production, principal photography, post-production, and final delivery of broadcast-ready masters.",
    "core_requirements": [
      "ProdCo must render ALL production services necessary to complete the Program",
      "Must include pre-production, principal photography, and post-production",
      "ProdCo must deliver completed Program to Amazon specifications",
      "Production must meet first-class, broadcast-quality standards",
      "Services must be performed in accordance with all exhibits and schedules"
    ]
  }'::jsonb,
  '{
    "acceptable": {
      "description": "Language that ensures comprehensive service delivery",
      "required_elements": ["ProdCo will render services", "Reference to Program", "Reference to exhibits/schedules"],
      "example": "ProdCo will render all production services as set forth in this Agreement, including any exhibits, to produce the Program."
    },
    "passable": {
      "description": "Adequate scope with minor gaps",
      "variations": ["General service description without phases if exhibits contain details", "No explicit first-class standards if delivery specs detailed"],
      "approval_level": "AMAZON_LEGAL"
    },
    "unacceptable": {
      "patterns": ["Limited services only", "Best efforts language", "Subject to additional fees", "Uncontrolled subcontracting"]
    }
  }'::jsonb,
  '{
    "leverage_points": ["Services scope is foundational - clear scope protects both parties"],
    "fallback_positions": ["Accept general description if exhibits are comprehensive"],
    "escalation_triggers": ["Limited services", "Best efforts", "Additional fees conditioning"]
  }'::jsonb,
  '{
    "inherent_risk": "MEDIUM",
    "escalation_triggers": ["Partial services only", "Best efforts commitment", "Subcontracting without approval"],
    "requires_legal_review": false
  }'::jsonb,
  '{
    "must_have": ["render", "services", "Program"],
    "strong_indicators": ["pre-production", "principal photography", "post-production", "deliver"],
    "red_flags": ["limited services", "best efforts", "subject to"]
  }'::jsonb
)
ON CONFLICT (family_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  priority = EXCLUDED.priority,
  requires_legal_review = EXCLUDED.requires_legal_review,
  amazon_position = EXCLUDED.amazon_position,
  acceptability_matrix = EXCLUDED.acceptability_matrix,
  negotiation_guidance = EXCLUDED.negotiation_guidance,
  risk_assessment = EXCLUDED.risk_assessment,
  detection_patterns = EXCLUDED.detection_patterns,
  updated_at = now();

-- Verify insertion
SELECT family_id, display_name, priority FROM playbook_specs WHERE family_id = 'ServicesScope';
