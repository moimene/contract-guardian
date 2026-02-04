/**
 * ================================================================
 * METRICS COLLECTOR - Pipeline Duration and Stats
 * ================================================================
 * Use in W3 at end of pipeline to log metrics to pipeline_metrics
 * 
 * Version: 1.0.0
 * Date: 2026-01-31
 * ================================================================
 */

/**
 * Collects and logs pipeline metrics at the end of W3 execution.
 * Call this as the final code node before responding.
 * 
 * @param {Object} data - Aggregated data from pipeline execution
 * @returns {Object} - Data with metrics attached
 */

// ================================================================
// N8N EXECUTION - Use as Code node before final response in W3
// ================================================================

const data = $input.all()[0].json;
const runData = $('Create Run ID').first().json;

// Calculate durations
const startTime = new Date(runData.started_at);
const endTime = new Date();
const totalDurationMs = endTime - startTime;

// Aggregate clause stats from results
const results = data.results || [];
let clausesAutoPassed = 0;
let clausesEscalated = 0;
let clausesBlocked = 0;
let totalRagScore = 0;
let ragCount = 0;

for (const r of results) {
    if (r.decision === 'AUTO_PASS') clausesAutoPassed++;
    else if (r.decision === 'ESCALATE_HUMAN' || r.needs_review) clausesEscalated++;
    else if (r.decision === 'BLOCK_EXPORT') clausesBlocked++;

    if (r.rag_score !== undefined) {
        totalRagScore += r.rag_score;
        ragCount++;
    }
}

// Build metrics payload for RPC call
const metricsPayload = {
    p_run_id: runData.run_id,
    p_total_duration_ms: totalDurationMs,
    p_extraction_duration_ms: null, // Would need timing from extract step
    p_parsing_duration_ms: null,    // Would need timing from parse step
    p_review_duration_ms: null,     // Would need timing from W2 calls
    p_aggregation_duration_ms: null,
    p_total_tokens: 0,              // Would need token counting in agents
    p_tokens_by_agent: JSON.stringify({}),
    p_total_clauses: results.length,
    p_clauses_auto_passed: clausesAutoPassed,
    p_clauses_escalated: clausesEscalated,
    p_clauses_blocked: clausesBlocked,
    p_avg_rag_score: ragCount > 0 ? totalRagScore / ragCount : null,
    p_rag_hits: ragCount,
    p_rag_misses: results.length - ragCount,
    p_workflow_version: 'v3.0'
};

// Attach metrics to output for HTTP logging node
return [{
    json: {
        ...data,
        _pipeline_metrics: metricsPayload,
        _metrics_summary: {
            duration_ms: totalDurationMs,
            total_clauses: results.length,
            auto_pass_rate: results.length > 0 ? clausesAutoPassed / results.length : 0,
            escalation_rate: results.length > 0 ? clausesEscalated / results.length : 0,
            block_rate: results.length > 0 ? clausesBlocked / results.length : 0
        }
    }
}];
