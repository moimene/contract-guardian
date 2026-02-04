/**
 * ================================================================
 * FAILURE DETECTOR - Low Confidence Routing Detection
 * ================================================================
 * Use in W2 after Parse Router to detect and log potential failures
 * 
 * Version: 1.0.0
 * Date: 2026-01-31
 * ================================================================
 */

/**
 * Detects potential failures based on routing confidence and method.
 * Logs failures to agent_failures table via RPC when thresholds are breached.
 * 
 * @param {Object} routerOutput - Output from Parse Router node
 * @param {Object} inputData - Original input data with clause info
 * @param {Object} config - Configuration with Supabase credentials
 * @returns {Object} - Original data with failure detection metadata
 */
async function detectAndLogFailure(routerOutput, inputData, config) {
    const SUPABASE_URL = config.SUPABASE_URL || 'https://hvlsuwdqtffiilvampxq.supabase.co';
    const SUPABASE_KEY = config.SUPABASE_SERVICE_KEY;

    // Thresholds for failure detection
    const THRESHOLDS = {
        LOW_CONFIDENCE: 0.65,       // Below this = log as low_confidence
        FALLBACK_TRIGGERED: true,   // LLM was used because keyword failed
        UNKNOWN_FAMILY: 'OtherUnknown'
    };

    const failures = [];

    // Check 1: Low confidence routing
    if (routerOutput.confidence < THRESHOLDS.LOW_CONFIDENCE) {
        failures.push({
            agent_name: 'router',
            failure_type: 'low_confidence',
            confidence: routerOutput.confidence,
            reason: `Confidence ${routerOutput.confidence} below threshold ${THRESHOLDS.LOW_CONFIDENCE}`
        });
    }

    // Check 2: LLM fallback was triggered (keyword router failed)
    if (routerOutput._routing_method === 'LLM' && routerOutput._keyword_confidence < 0.5) {
        failures.push({
            agent_name: 'router',
            failure_type: 'misclassification',
            confidence: routerOutput.confidence,
            reason: 'LLM fallback triggered - keyword patterns insufficient'
        });
    }

    // Check 3: Unknown family classification
    if (routerOutput.route === THRESHOLDS.UNKNOWN_FAMILY) {
        failures.push({
            agent_name: 'router',
            failure_type: 'misclassification',
            confidence: routerOutput.confidence,
            reason: 'Classified as OtherUnknown - no matching family'
        });
    }

    // Log each failure to database
    for (const failure of failures) {
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/rpc/log_agent_failure`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({
                    p_run_id: inputData.run_id || null,
                    p_clause_instance_id: inputData.clause_instance_id || null,
                    p_agent_name: failure.agent_name,
                    p_failure_type: failure.failure_type,
                    p_original_input: inputData.clause_text?.substring(0, 1000) || '',
                    p_actual_output: routerOutput.route,
                    p_confidence: failure.confidence,
                    p_keywords: routerOutput._keyword_router?.matched_patterns || [],
                    p_route_assigned: routerOutput.route
                })
            });
        } catch (err) {
            console.error('Failed to log failure:', err.message);
        }
    }

    return {
        ...inputData,
        routerOutput,
        _failure_detection: {
            failures_detected: failures.length,
            failures: failures,
            logged: true
        }
    };
}

// ================================================================
// N8N EXECUTION - Use as Code node after Parse Router
// ================================================================
const inputData = $input.all()[0].json;
const routerOutput = inputData.routerOutput || {};

// Configuration
const config = {
    SUPABASE_URL: 'https://hvlsuwdqtffiilvampxq.supabase.co',
    SUPABASE_SERVICE_KEY: $env.SUPABASE_SERVICE_KEY
};

// Only detect failures, don't log (logging is async and may slow down pipeline)
const THRESHOLDS = {
    LOW_CONFIDENCE: 0.65,
    UNKNOWN_FAMILY: 'OtherUnknown'
};

const failures = [];

if (routerOutput.confidence < THRESHOLDS.LOW_CONFIDENCE) {
    failures.push({
        agent_name: 'router',
        failure_type: 'low_confidence',
        confidence: routerOutput.confidence
    });
}

if (routerOutput._routing_method === 'LLM' && (routerOutput._keyword_confidence || 0) < 0.5) {
    failures.push({
        agent_name: 'router',
        failure_type: 'misclassification',
        reason: 'LLM_FALLBACK'
    });
}

if (routerOutput.route === THRESHOLDS.UNKNOWN_FAMILY) {
    failures.push({
        agent_name: 'router',
        failure_type: 'unknown_family'
    });
}

return [{
    json: {
        ...inputData,
        _failure_detection: {
            failures_detected: failures.length,
            failures: failures,
            should_log: failures.length > 0
        }
    }
}];
