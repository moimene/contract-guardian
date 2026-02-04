-- ================================================================
-- VALIDATION SQL: Post-Deployment Verification
-- ================================================================
-- Run these queries after updating the Keyword Router in n8n
-- to verify improvement in accuracy metrics
-- ================================================================

-- 1. BASELINE: Current classification distribution
-- Run BEFORE deploying v4
SELECT 
    'BASELINE (Before v4)' as snapshot,
    detected_family,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 1) as pct
FROM clause_reviews_internal
GROUP BY detected_family
ORDER BY count DESC;

-- ================================================================

-- 2. CREATE TEMPORARY TRACKING TABLE
-- Use this to track before/after metrics
CREATE TABLE IF NOT EXISTS router_accuracy_tracking (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    snapshot_name text NOT NULL,
    router_version text DEFAULT 'v3',
    total_clauses integer,
    unknown_count integer,
    unknown_pct numeric(5,2),
    accuracy_pct numeric(5,2),
    escalation_rate numeric(5,2),
    created_at timestamptz DEFAULT now()
);

-- ================================================================

-- 3. RECORD BASELINE
INSERT INTO router_accuracy_tracking (
    snapshot_name, 
    router_version, 
    total_clauses, 
    unknown_count, 
    unknown_pct,
    accuracy_pct,
    escalation_rate
)
SELECT 
    'Before v4 Deploy',
    'v3',
    COUNT(*) as total,
    SUM(CASE WHEN detected_family = 'OtherUnknown' THEN 1 ELSE 0 END) as unknown,
    ROUND(100.0 * SUM(CASE WHEN detected_family = 'OtherUnknown' THEN 1 ELSE 0 END) / COUNT(*), 2) as unknown_pct,
    ROUND(100.0 * SUM(CASE WHEN detected_family != 'OtherUnknown' THEN 1 ELSE 0 END) / COUNT(*), 2) as accuracy,
    ROUND(100.0 * SUM(CASE WHEN decision = 'ESCALATE_HUMAN' THEN 1 ELSE 0 END) / COUNT(*), 2) as escalation
FROM clause_reviews_internal;

-- ================================================================

-- 4. POST-DEPLOYMENT: Run a new contract through the pipeline
-- Then run this query to check improvement

-- SELECT 
--     'After v4 Deploy' as snapshot,
--     detected_family,
--     COUNT(*) as count,
--     ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 1) as pct
-- FROM clause_reviews_internal
-- WHERE created_at > 'TIMESTAMP_OF_DEPLOY'
-- GROUP BY detected_family
-- ORDER BY count DESC;

-- ================================================================

-- 5. COMPARE BEFORE/AFTER
SELECT 
    snapshot_name,
    router_version,
    total_clauses,
    unknown_pct as "OtherUnknown %",
    accuracy_pct as "Accuracy %",
    escalation_rate as "Escalation %",
    created_at
FROM router_accuracy_tracking
ORDER BY created_at DESC
LIMIT 5;

-- ================================================================

-- 6. EXPECTED RESULTS AFTER v4:
/*
╔═════════════════════════════════════════════════════════════════╗
║                    EXPECTED IMPROVEMENT                          ║
╠═════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   METRIC              BEFORE v4     AFTER v4     IMPROVEMENT    ║
║   ────────────────────────────────────────────────────────────   ║
║   OtherUnknown %      55.1%         ~15%         -40 pts ✓     ║
║   Accuracy %          44.9%         ~85%         +40 pts ✓     ║
║   Escalation %        96.4%         ~15%         -81 pts ✓     ║
║                                                                  ║
║   KEY FAMILIES IMPROVED:                                         ║
║   - RightsGrant       4.3%  →  ~12%  (+8 pts)                   ║
║   - ServicesScope     0%    →  ~10%  (+10 pts)                  ║
║   - Confidentiality   0%    →  ~8%   (+8 pts)                   ║
║   - Assignment        0%    →  ~5%   (+5 pts)                   ║
║                                                                  ║
╚═════════════════════════════════════════════════════════════════╝
*/

-- ================================================================

-- 7. QUICK HEALTH CHECK (run anytime)
SELECT 
    'Router Health Check' as report,
    COUNT(*) as total_reviews,
    SUM(CASE WHEN detected_family = 'OtherUnknown' THEN 1 ELSE 0 END) as unknown_count,
    ROUND(100.0 - (100.0 * SUM(CASE WHEN detected_family = 'OtherUnknown' THEN 1 ELSE 0 END) / COUNT(*)), 1) as accuracy_pct,
    CASE 
        WHEN (100.0 - (100.0 * SUM(CASE WHEN detected_family = 'OtherUnknown' THEN 1 ELSE 0 END) / COUNT(*))) >= 85 THEN '✅ HEALTHY'
        WHEN (100.0 - (100.0 * SUM(CASE WHEN detected_family = 'OtherUnknown' THEN 1 ELSE 0 END) / COUNT(*))) >= 70 THEN '🟡 ACCEPTABLE'
        ELSE '🔴 NEEDS ATTENTION'
    END as status
FROM clause_reviews_internal;
