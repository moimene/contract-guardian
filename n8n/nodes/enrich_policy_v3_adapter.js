// Enrich Policy (CG-012) - with v2→v3 adapter
// =============================================
// This node enriches the policy spec with playbook data and normalizes
// the acceptability_matrix to v3 format for consistent consumption.

// Get data from Parse RAG Results and Playbook Spec
const prevData = $('Parse RAG Results').first().json;
const family = prevData.detected_family || 'OtherUnknown';

// Get playbook spec from database response (from Get Playbook Spec node)
let playbookSpec = null;
try {
    const specResponse = $input.all()[0]?.json;
    if (Array.isArray(specResponse) && specResponse.length > 0) {
        playbookSpec = specResponse[0];
    } else if (specResponse && !Array.isArray(specResponse)) {
        playbookSpec = specResponse;
    }
} catch (e) {
    console.log('Playbook spec parse error:', e.message);
}

// -------------------------
// v2→v3 Adapter
// -------------------------
function normalizeAcceptabilityMatrix(matrix) {
    const empty = {
        acceptable: { description: '', examples: [] },
        passable: { description: '', requires_approval: '', variations: [] },
        unacceptable: { description: '', action: '', patterns: [] }
    };
    if (!matrix || typeof matrix !== 'object') return empty;

    // v3 already OK - check if patterns[0] is an object
    const hasV3 = matrix?.unacceptable?.patterns?.length &&
        typeof matrix.unacceptable.patterns[0] === 'object';
    if (hasV3) return matrix;

    // v2: arrays of strings (legacy)
    const unacceptableStrings = matrix?.unacceptable?.patterns || matrix?.unacceptable || matrix?.unacceptable_patterns || [];
    const passableStrings = matrix?.passable?.variations || matrix?.passable || matrix?.passable_variations || [];
    const acceptableStrings = matrix?.acceptable?.examples || matrix?.acceptable || matrix?.acceptable_examples || [];

    return {
        acceptable: {
            description: matrix?.acceptable?.description || '',
            examples: (Array.isArray(acceptableStrings) ? acceptableStrings : []).map((s, i) => ({
                id: `acc-legacy-${i + 1}`,
                pattern: String(s),
                example: '',
                reason: 'requires playbook_specs data',
                risk_level: 'NONE'
            }))
        },
        passable: {
            description: matrix?.passable?.description || '',
            requires_approval: matrix?.passable?.requires_approval || '',
            variations: (Array.isArray(passableStrings) ? passableStrings : []).map((s, i) => ({
                id: `pas-legacy-${i + 1}`,
                pattern: String(s),
                condition: '',
                example: '',
                reason: 'requires playbook_specs data',
                risk_level: 'MEDIUM'
            }))
        },
        unacceptable: {
            description: matrix?.unacceptable?.description || '',
            action: matrix?.unacceptable?.action || 'REJECT',
            patterns: (Array.isArray(unacceptableStrings) ? unacceptableStrings : []).map((s, i) => ({
                id: `unacc-legacy-${i + 1}`,
                pattern: String(s),
                example: '',
                reason: 'requires playbook_specs data',
                risk_level: 'CRITICAL'
            }))
        }
    };
}

// Build policySpec from database data or fallback
let policySpec;
if (playbookSpec && playbookSpec.family_id) {
    // Normalize the matrix to v3
    const matrixV3 = normalizeAcceptabilityMatrix(playbookSpec.acceptability_matrix);

    policySpec = {
        clause_family: playbookSpec.family_id,
        display_name: playbookSpec.display_name,
        priority: playbookSpec.priority,
        requires_legal_review: playbookSpec.requires_legal_review,
        rule_id: `PB:v2026-02:${playbookSpec.family_id}-Core`,
        has_policy_spec: true,

        // Amazon position data
        amazon_position: playbookSpec.amazon_position,
        standard_position: {
            text: playbookSpec.amazon_position?.summary || '',
            summary: playbookSpec.amazon_position?.summary || '',
            core_requirements: playbookSpec.amazon_position?.core_requirements || []
        },

        // Acceptability data (v3 normalized)
        acceptability_matrix: matrixV3,

        // v3 objects for advanced consumers (Paranoid, Valuator)
        unacceptable_patterns: matrixV3.unacceptable.patterns,
        passable_variations: matrixV3.passable.variations,
        acceptable_examples: matrixV3.acceptable.examples,

        // Flat labels for compatibility/logging/UI
        unacceptable_pattern_labels: matrixV3.unacceptable.patterns.map(p => p.pattern),
        passable_variation_labels: matrixV3.passable.variations.map(v => v.pattern),
        acceptable_example_labels: matrixV3.acceptable.examples.map(e => e.pattern),

        // Negotiation and risk
        negotiation_guidance: playbookSpec.negotiation_guidance,
        risk_assessment: playbookSpec.risk_assessment,
        detection_patterns: playbookSpec.detection_patterns,

        // Policies
        analysis_mode: 'MODE_ENUMERATED_DEVIATIONS',
        required: true,
        routing_policy: {
            type: playbookSpec.priority === 'CRITICAL' ? 'ESCALATE_IF_UNACCEPTABLE' : 'LOG_ONLY',
            block_export: playbookSpec.priority === 'CRITICAL'
        },
        decision_policy: {
            anchor_conf_threshold: 0.85,
            gating_logic: 'STANDARD',
            block_export_if_escalated: playbookSpec.priority === 'CRITICAL'
        }
    };
} else {
    // Fallback for families without playbook spec
    policySpec = {
        id: null,
        rule_id: `default:${family}`,
        clause_family: family,
        required: true,
        analysis_mode: 'MODE_ENUMERATED_DEVIATIONS',
        standard_position: { text: 'Not defined', summary: 'Manual review required' },
        acceptability_matrix: normalizeAcceptabilityMatrix(null),
        unacceptable_patterns: [],
        passable_variations: [],
        acceptable_examples: [],
        unacceptable_pattern_labels: [],
        passable_variation_labels: [],
        acceptable_example_labels: [],
        routing_policy: { type: 'ESCALATE', block_export: true },
        decision_policy: { anchor_conf_threshold: 0.85, gating_logic: 'STANDARD', block_export_if_escalated: true },
        has_policy_spec: false
    };
}

const TH_ANCHOR = policySpec.decision_policy?.anchor_conf_threshold || 0.85;
const TH_CONF = 0.80;

return [{ json: { ...prevData, policySpec, playbookSpec, TH_ANCHOR, TH_CONF } }];
