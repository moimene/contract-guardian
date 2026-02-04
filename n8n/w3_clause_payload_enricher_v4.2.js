/**
 * ================================================================
 * W3 CLAUSE PAYLOAD ENRICHER v4.2 - CG-004 Payload Completo
 * ================================================================
 * 
 * Enriches the payload sent from W3 to W2 with:
 * - heading: The clause heading for router boost
 * - contract_type: Dynamic value from document metadata (not hardcoded)
 * 
 * Place this in the HTTP Request body for W2 call
 * 
 * Version: 4.2
 * Last Updated: 2026-02-01
 * Track: CG-004
 * ================================================================
 */

// ================================================================
// OPTION 1: Use as Code node BEFORE HTTP Request to W2
// ================================================================

const clauseData = $('Format & Split').item.json;

// Build enriched payload for W2
const enrichedPayload = {
    // Core identifiers
    clause_instance_id: clauseData.clause_instance_id,
    clause_id: clauseData.clause_id,
    run_id: clauseData.run_id,
    document_id: clauseData.document_id,

    // Clause content
    clause_text: clauseData.clause_text,

    // CG-004: NEW - Pass heading for router boost
    heading: clauseData.heading || '',

    // CG-004: NEW - Dynamic contract_type from document metadata
    // Fallback chain: doc metadata → run metadata → default
    contract_type: clauseData.contract_type
        || clauseData._doc_metadata?.contract_type
        || clauseData._run_metadata?.contract_type
        || 'psa_standard',  // Default but NOT hardcoded 'nueva_planta'

    // Optional: Sequence info for ordering
    sequence_number: clauseData.clause_index,
    total_clauses: clauseData.total_clauses,

    // Processing timestamp
    _processing_start: Date.now()
};

return [{ json: enrichedPayload }];

// ================================================================
// OPTION 2: Use directly in HTTP Request jsonBody expression
// ================================================================
/*
In the HTTP Request node, set jsonBody to:

={{ JSON.stringify({
  clause_instance_id: $('Format & Split').item.json.clause_instance_id,
  clause_id: $('Format & Split').item.json.clause_id,
  clause_text: $('Format & Split').item.json.clause_text,
  run_id: $('Format & Split').item.json.run_id,
  document_id: $('Format & Split').item.json.document_id,
  heading: $('Format & Split').item.json.heading || '',
  contract_type: $('Format & Split').item.json.contract_type || $('Format & Split').item.json._doc_metadata?.contract_type || 'psa_standard',
  sequence_number: $('Format & Split').item.json.clause_index
}) }}

*/

// ================================================================
// DEPLOYMENT INSTRUCTIONS
// ================================================================
/*
1. In W3 workflow, find the HTTP Request node that calls W2
2. Replace the jsonBody expression with OPTION 2 above
3. OR add this as a Code node between "Format & Split" and the HTTP Request

KEY CHANGES:
- Added `heading` field (was extracted but not passed)
- Changed `contract_type` from 'nueva_planta' to dynamic lookup
- Added `sequence_number` for ordering
*/
