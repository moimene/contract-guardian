#!/bin/bash
# CG-007 Phase 2 Benchmark - W2 v4.2.4 with Hybrid Router
# Run a subset of 20 examples to verify routing accuracy

WEBHOOK="https://mmenendeza.app.n8n.cloud/webhook/clause-review-rag"
DATASET="/Users/moisesmenendez/Downloads/DESARROLLO/AMAZON REDLINER/n8n/test_payloads/router_eval_dataset.json"

echo "CG-007 Phase 2 Benchmark - W2 v4.2.4"
echo "====================================="
echo "Webhook: $WEBHOOK"
echo ""

# Test cases (20 samples from different families)
declare -a TESTS=(
  'IndemnityProdCo|ProdCo shall indemnify, defend, and hold harmless Amazon'
  'IndemnityAmazon|Amazon shall indemnify ProdCo against third party claims'
  'ForceMajeure|Neither party shall be liable for delays due to acts of God, war, terrorism'
  'TerminationRights|Amazon may terminate this Agreement immediately upon written notice'
  'Assignment|ProdCo may not assign this Agreement without prior written consent'
  'LiabilityLimitation|In no event shall Amazon liability exceed the amounts paid hereunder'
  'Confidentiality|Each party agrees to maintain the confidentiality of all proprietary information'
  'Insurance|ProdCo shall maintain comprehensive general liability insurance'
  'DisputeResolution|Any dispute arising under this Agreement shall be resolved by binding arbitration'
  'AmazonControl|Amazon has sole and final control over the Program'
  'RightsGrant|ProdCo hereby grants to Amazon all rights throughout the universe'
  'DataProtection|Each party shall comply with applicable data protection laws including GDPR'
  'TerminationConsequences|Upon termination, all rights granted herein shall revert to ProdCo'
  'Publicity|ProdCo grants Amazon the right to use ProdCo name and likeness for publicity'
  'AuditRights|Amazon shall have the right to audit ProdCo books and records'
  'ServicesScope|ProdCo shall provide production services as set forth in Exhibit A'
  'PaymentCredits|Amazon shall pay ProdCo the budget set forth in Exhibit B'
  'GoverningLaw|This Agreement shall be governed by the laws of California'
  'GeneralProvisions|This Agreement constitutes the entire understanding between the parties'
  'RepsProdCo|ProdCo represents and warrants that it has full authority to enter into this Agreement'
)

CORRECT=0
TOTAL=0
RESULTS=()

for test in "${TESTS[@]}"; do
  IFS='|' read -r expected clause <<< "$test"
  TOTAL=$((TOTAL + 1))
  
  # Call webhook
  RESPONSE=$(curl -s -X POST "$WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{\"clause_text\": \"$clause\", \"clause_instance_id\": \"bench-$TOTAL\"}" 2>&1)
  
  # Extract detected_family
  DETECTED=$(echo "$RESPONSE" | jq -r '.detected_family // "ERROR"' 2>/dev/null || echo "ERROR")
  
  # Compare
  if [ "$DETECTED" == "$expected" ]; then
    STATUS="✅"
    CORRECT=$((CORRECT + 1))
  else
    STATUS="❌"
  fi
  
  echo "$STATUS $expected → $DETECTED"
  RESULTS+=("$STATUS|$expected|$DETECTED")
  
  # Rate limit
  sleep 0.5
done

echo ""
echo "====================================="
echo "Results: $CORRECT / $TOTAL correct"
ACCURACY=$(echo "scale=1; $CORRECT * 100 / $TOTAL" | bc)
echo "Accuracy: $ACCURACY%"
echo ""

# Summary
echo "Detailed Results:"
echo "-----------------"
for result in "${RESULTS[@]}"; do
  echo "$result" | tr '|' '\t'
done
