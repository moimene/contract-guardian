/**
 * ================================================================
 * CG-007: Hybrid Router Integration Guide
 * ================================================================
 * 
 * This document explains how to integrate the Hybrid Router into W2.
 * 
 * ARCHITECTURE:
 * 
 * BEFORE (v4.1):
 *   Keyword Router → Router Agent (LLM) → Parse Router
 * 
 * AFTER (v4.2 CG-007):
 *   Hybrid Router → [IF llm_required] → LLM Classification → Parse LLM
 * 
 * ================================================================
 * 
 * FILES:
 * - hybrid_router_n8n.js: Main node (replaces Keyword Router)
 * - parse_llm_result_n8n.js: Processes LLM response
 * 
 * N8N NODE CHAIN:
 * 
 * 1. Hybrid Router (Code)
 *    - Input: clause_text, heading, rag_examples
 *    - Output: llm_required (true/false), family (if keyword-only), llm_prompt
 * 
 * 2. IF Node (llm_required == true)
 *    - Routes to LLM call or bypass
 * 
 * 3. LLM Classification (HTTP Request) [only if llm_required]
 *    - Model: gpt-4o-mini
 *    - Prompt: from hybrid_router output
 * 
 * 4. Parse LLM Result (Code)
 *    - Resolves keyword vs LLM conflicts
 *    - Output: final family, confidence, method
 * 
 * ================================================================
 * 
 * WORKFLOW JSON UPDATE:
 * 
 * Remove nodes:
 * - "Keyword Router"
 * - "Router Agent"
 * - "Parse Router"
 * 
 * Add nodes:
 * - "Hybrid Router" (Code) using hybrid_router_n8n.js
 * - "Route Decision" (IF) checking llm_required
 * - "LLM Classification" (HTTP) calling OpenAI
 * - "Parse LLM" (Code) using parse_llm_result_n8n.js
 * - "Merge Router" (Merge) combining both paths
 * 
 * ================================================================
 */

// This file is documentation only - no executable code
module.exports = {
    version: 'CG-007 v1.0',
    description: 'Hybrid Router Integration Guide',
    files: [
        'hybrid_router_n8n.js',
        'parse_llm_result_n8n.js',
        'keyword_router_v4.1.js (patterns imported)'
    ]
};
