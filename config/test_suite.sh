#!/bin/bash
# ==============================================
# Router Agent Test Suite v2.0
# Amazon PSA Clause Classification Tests
# ==============================================

# Configuration
ROUTER_ENDPOINT="${ROUTER_ENDPOINT:-https://mmenendeza.app.n8n.cloud/webhook/clause-review-rag}"
OUTPUT_DIR="${OUTPUT_DIR:-./config/test_results}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_FILE="${OUTPUT_DIR}/router_test_${TIMESTAMP}.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create output directory
mkdir -p "${OUTPUT_DIR}"

# Initialize results
echo '{"test_run": "'${TIMESTAMP}'", "results": []}' > "${RESULTS_FILE}"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Warm-up ping to avoid cold-start failures
echo "Warming up n8n endpoint..."
warmup_result=$(curl -s -X POST "${ROUTER_ENDPOINT}" \
    -H "Content-Type: application/json" \
    -d '{"clause_instance_id":"warmup-ping","clause_text":"test ping","run_id":"warmup","document_id":"00000000-0000-0000-0000-000000000000"}' \
    --max-time 90 2>/dev/null)
echo "Warm-up complete. Waiting 2 seconds..."
sleep 2

# Function to run a single test with clause text
run_clause_test() {
    local test_id="$1"
    local clause_text="$2"
    local expected_family="$3"
    local description="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing ${test_id} (expect: ${expected_family})... "
    
    # Build JSON payload
    payload=$(jq -n \
        --arg cid "test-${test_id}-${TIMESTAMP}" \
        --arg id "${test_id}" \
        --arg text "${clause_text}" \
        --arg heading "${description}" \
        --arg run_id "test-run-${TIMESTAMP}" \
        --arg doc_id "00000000-0000-0000-0000-000000000001" \
        --arg pb_id "PB_DSA_V1" \
        '{
            clause_instance_id: $cid,
            clause_id: $id,
            clause_text: $text,
            heading: $heading,
            run_id: $run_id,
            document_id: $doc_id,
            playbook_id: $pb_id
        }')
    
    # Call router API
    result=$(curl -s -X POST "${ROUTER_ENDPOINT}" \
        -H "Content-Type: application/json" \
        -d "${payload}" \
        --max-time 90)
    
    # Extract detected family from response
    detected_family=$(echo "${result}" | jq -r '.detected_family // .routerOutput.route // "ERROR"')
    confidence=$(echo "${result}" | jq -r '.routerOutput.confidence // .confidence // 0')
    
    # Retry once if result is empty or null (transient failure)
    if [ -z "${detected_family}" ] || [ "${detected_family}" == "null" ] || [ "${detected_family}" == "" ]; then
        echo -n "(retrying)... "
        sleep 2
        result=$(curl -s -X POST "${ROUTER_ENDPOINT}" \
            -H "Content-Type: application/json" \
            -d "${payload}" \
            --max-time 90)
        detected_family=$(echo "${result}" | jq -r '.detected_family // .routerOutput.route // "ERROR"')
        confidence=$(echo "${result}" | jq -r '.routerOutput.confidence // .confidence // 0')
    fi
    
    if [ "${detected_family}" == "${expected_family}" ]; then
        echo -e "${GREEN}PASS${NC} (confidence: ${confidence})"
        status="PASS"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}FAIL${NC} (got: ${detected_family}, confidence: ${confidence})"
        status="FAIL"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    # Append to results file
    jq ".results += [{
        \"test_id\": \"${test_id}\",
        \"expected\": \"${expected_family}\",
        \"detected\": \"${detected_family}\",
        \"confidence\": ${confidence:-0},
        \"status\": \"${status}\",
        \"description\": \"${description}\"
    }]" "${RESULTS_FILE}" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "${RESULTS_FILE}"
    
    # Rate limiting - wait 1 second between calls
    sleep 1
}

echo "=============================================="
echo " Router Agent Test Suite v2.0"
echo " Endpoint: ${ROUTER_ENDPOINT}"
echo " Timestamp: ${TIMESTAMP}"
echo "=============================================="
echo ""

# ==============================================
# CRITICAL FAMILY TESTS
# ==============================================
echo -e "${YELLOW}=== CRITICAL FAMILY TESTS ===${NC}"
echo ""

# IndemnityProdCo
echo -e "${BLUE}--- IndemnityProdCo ---${NC}"
run_clause_test "6.1" \
    "ProdCo shall indemnify, defend, and hold harmless Amazon and its parents, subsidiaries, affiliates, successors, assigns, licensees, officers, directors, employees, and agents (collectively, 'Amazon Indemnitees') from and against any and all claims, demands, actions, suits, damages, liabilities, losses, settlements, judgments, costs, and expenses arising out of or relating to any breach of ProdCo's representations, warranties, or obligations under this Agreement." \
    "IndemnityProdCo" \
    "6.1 ProdCo Indemnification"

# RepsProdCo
echo -e "${BLUE}--- RepsProdCo ---${NC}"
run_clause_test "5.1" \
    "ProdCo represents and warrants to Amazon that ProdCo has the full right, power, and authority to enter into this Agreement and to grant all rights granted herein, free and clear of any liens, claims, or encumbrances." \
    "RepsProdCo" \
    "5.1 ProdCo Representations"

# PaymentCredits
echo -e "${BLUE}--- PaymentCredits ---${NC}"
run_clause_test "4.1" \
    "In full consideration for all services rendered and rights granted hereunder, Amazon shall pay ProdCo the Production Fee in accordance with the payment schedule set forth in Exhibit D." \
    "PaymentCredits" \
    "4.1 Production Fee"

run_clause_test "4.2" \
    "ProdCo may be entitled to contingent compensation based on Net Receipts as set forth in Exhibit C, subject to Amazon's standard accounting practices and definitions. Contingent compensation, if any, shall be calculated and paid semi-annually." \
    "PaymentCredits" \
    "4.2 Contingent Compensation"

# RightsGrant
echo -e "${BLUE}--- RightsGrant ---${NC}"
run_clause_test "3.1" \
    "The Program and all Materials shall be considered a 'work made for hire' for Amazon under the United States Copyright Act. To the extent any element does not qualify as a work made for hire, ProdCo hereby irrevocably assigns to Amazon all right, title, and interest in and to such element, including all copyrights, in perpetuity throughout the universe." \
    "RightsGrant" \
    "3.1 Work Made for Hire"

run_clause_test "3.2" \
    "Amazon shall own exclusively and in perpetuity, throughout the universe, in all languages, and in all media now known or hereafter developed, all right, title, and interest in and to the Program and Materials, including without limitation all copyrights, trademarks, patents, trade secrets, and all other intellectual property rights therein." \
    "RightsGrant" \
    "3.2 Scope of Rights"

# RightsReversion
echo -e "${BLUE}--- RightsReversion ---${NC}"
run_clause_test "3.5" \
    "There shall be no reversion of rights to ProdCo under any circumstances, including termination for any reason, non-exploitation, or passage of time. All rights shall vest in Amazon upon creation and shall remain with Amazon in perpetuity." \
    "RightsReversion" \
    "3.5 No Reversion"

# LiabilityLimitation
echo -e "${BLUE}--- LiabilityLimitation ---${NC}"
run_clause_test "7.1" \
    "IN NO EVENT SHALL AMAZON BE LIABLE TO PRODCO FOR ANY CONSEQUENTIAL, INDIRECT, INCIDENTAL, SPECIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING WITHOUT LIMITATION LOST PROFITS, LOSS OF BUSINESS, LOSS OF GOODWILL, OR LOSS OF DATA, ARISING OUT OF OR RELATING TO THIS AGREEMENT, REGARDLESS OF THE THEORY OF LIABILITY." \
    "LiabilityLimitation" \
    "7.1 Exclusion of Consequential Damages"

run_clause_test "7.2" \
    "AMAZON'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THIS AGREEMENT SHALL NOT EXCEED THE TOTAL PRODUCTION FEES ACTUALLY PAID BY AMAZON TO PRODCO HEREUNDER." \
    "LiabilityLimitation" \
    "7.2 Liability Cap"

# TerminationRights
echo -e "${BLUE}--- TerminationRights ---${NC}"
run_clause_test "8.1" \
    "Amazon may terminate this Agreement at any time, for any reason or no reason, in Amazon's sole and absolute discretion, upon written notice to ProdCo." \
    "TerminationRights" \
    "8.1 Termination for Convenience"

run_clause_test "8.2" \
    "Amazon may terminate this Agreement immediately upon written notice if ProdCo: (a) materially breaches any provision of this Agreement; (b) breaches any representation or warranty; (c) becomes insolvent or files for bankruptcy; (d) is the subject of any governmental investigation relating to the Program; or (e) engages in conduct that brings Amazon into disrepute." \
    "TerminationRights" \
    "8.2 Termination for Cause"

echo ""

# ==============================================
# SUPPORT FAMILY TESTS
# ==============================================
echo -e "${YELLOW}=== SUPPORT FAMILY TESTS ===${NC}"
echo ""

# SurvivalRemedies
echo -e "${BLUE}--- SurvivalRemedies ---${NC}"
run_clause_test "8.5" \
    "The following provisions shall survive termination: Articles 3, 5, 6, 7, 9, 10, 11, and any other provision that by its nature should survive." \
    "SurvivalRemedies" \
    "8.5 Survival"

# TerminationConsequences
echo -e "${BLUE}--- TerminationConsequences ---${NC}"
run_clause_test "8.3" \
    "Upon termination for any reason: (a) all rights granted herein shall remain vested in Amazon; (b) ProdCo shall immediately deliver all Materials to Amazon; (c) Amazon shall own all work in progress; and (d) ProdCo shall have no right to any reversion of rights." \
    "TerminationConsequences" \
    "8.3 Effect of Termination"

# IndemnityProcedures
echo -e "${BLUE}--- IndemnityProcedures ---${NC}"
run_clause_test "6.2" \
    "Amazon shall promptly notify ProdCo of any claim for which indemnification is sought. ProdCo shall assume the defense of such claim with counsel reasonably acceptable to Amazon. Amazon may participate in the defense at its own expense. ProdCo shall not settle any claim without Amazon's prior written consent." \
    "IndemnityProcedures" \
    "6.2 Indemnification Procedures"

# IndemnityAmazon
echo -e "${BLUE}--- IndemnityAmazon ---${NC}"
run_clause_test "6.3" \
    "Amazon shall indemnify ProdCo from claims arising solely from Amazon's exploitation of the Program in a manner that materially deviates from the approved final deliverables and was not authorized or approved by ProdCo, provided that such indemnification shall not apply to any claim for which ProdCo has an indemnification obligation." \
    "IndemnityAmazon" \
    "6.3 Amazon Indemnification"

# Confidentiality
echo -e "${BLUE}--- Confidentiality ---${NC}"
run_clause_test "9.1" \
    "ProdCo shall maintain in strict confidence and shall not disclose to any third party any Confidential Information of Amazon, including the terms of this Agreement, Amazon's business strategies, NPI, and any other information designated as confidential by Amazon." \
    "Confidentiality" \
    "9.1 Confidentiality Obligations"

# Insurance
echo -e "${BLUE}--- Insurance ---${NC}"
run_clause_test "11.1" \
    "ProdCo shall obtain and maintain throughout production and for three (3) years thereafter: (a) Commercial General Liability insurance with limits of \$2,000,000 per occurrence and \$5,000,000 aggregate; (b) Errors and Omissions insurance with limits of \$3,000,000 per claim; (c) Workers' Compensation insurance as required by law." \
    "Insurance" \
    "11.1 Required Coverage"

# DisputeResolution
echo -e "${BLUE}--- DisputeResolution ---${NC}"
run_clause_test "12.1" \
    "This Agreement shall be governed by the laws of the State of California without regard to conflict of laws principles." \
    "DisputeResolution" \
    "12.1 Governing Law"

run_clause_test "12.2" \
    "Any dispute arising out of or relating to this Agreement shall be resolved by binding arbitration administered by JAMS in Los Angeles, California, in accordance with its Comprehensive Arbitration Rules." \
    "DisputeResolution" \
    "12.2 Arbitration"

echo ""

# ==============================================
# GENERATE SUMMARY
# ==============================================
echo -e "${YELLOW}=== TEST SUMMARY ===${NC}"
echo ""
echo "Total tests: ${TOTAL_TESTS}"
echo -e "Passed: ${GREEN}${PASSED_TESTS}${NC}"
echo -e "Failed: ${RED}${FAILED_TESTS}${NC}"
echo ""

if [ "${TOTAL_TESTS}" -gt 0 ]; then
    PASS_RATE=$(echo "scale=2; ${PASSED_TESTS}/${TOTAL_TESTS}*100" | bc)
    echo "Pass rate: ${PASS_RATE}%"
fi

echo ""
echo "Results saved to: ${RESULTS_FILE}"

# List failures
if [ "${FAILED_TESTS}" -gt 0 ]; then
    echo ""
    echo -e "${RED}Failed tests:${NC}"
    jq -r '.results[] | select(.status == "FAIL") | "  - \(.test_id): expected \(.expected), got \(.detected)"' "${RESULTS_FILE}"
fi

echo ""
echo "=============================================="

# ==============================================
# EXIT CODE
# ==============================================
if [ "${FAILED_TESTS}" -gt 0 ]; then
    exit 1
else
    exit 0
fi
