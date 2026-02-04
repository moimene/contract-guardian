# CG-012 Troubleshooting Runbook

## Quick Diagnosis: `red_flags_found = 0` Unexpected

### Symptoms
- Canary test shows `red_flags_found: 0`
- `risk_level: YELLOW` instead of `RED`
- `final_status: Ambiguous` instead of `UnacceptableDeviation`
- `rule_id: default:*` (fallback mode)

### Step 1: Verify Get Playbook Spec Output (30 sec)
1. Open W2 workflow in n8n
2. Click "Get Playbook Spec" node
3. Run test execution
4. Check output:
   - **Expected**: `detection_patterns.red_flags` array with entries
   - **Problem**: Empty `{}` or missing `detection_patterns`

### Step 2: If Output is Empty → API Key Issue
```bash
# Test API key directly
curl -s -X POST "https://hvlsuwdqtffiilvampxq.supabase.co/rest/v1/rpc/get_playbook_spec" \
  -H "Content-Type: application/json" \
  -H "apikey: [YOUR_KEY]" \
  -H "Authorization: Bearer [YOUR_KEY]" \
  -d '{"p_family_id": "IndemnityProdCo"}'
```

**If "Invalid API key"** → Get fresh key from Supabase dashboard → Settings → API

### Step 3: Verify Supabase Data
```sql
SELECT family_id, detection_patterns->'red_flags' as red_flags
FROM playbook_specs 
WHERE family_id = 'IndemnityProdCo';
```

**If empty** → Run sync script:
```bash
node scripts/sync_playbook_to_supabase.js IndemnityProdCo
```

### Step 4: Verify n8n Node Code
Compare Parse Paranoid code in n8n vs `/n8n/nodes/parse_paranoid_CG012_FIX.js`
- Must have `CG-012-FIX` comments
- Must have `matchesRedFlag` function
- Must have `injected` array for guardrail

---

## Current Valid API Key (as of 2026-02-02)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bHN1d2RxdGZmaWlsdmFtcHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTI5MDIsImV4cCI6MjA4Mzg4ODkwMn0.AYhrbvL5OZ5cdG5e5THLEiEAxOD7n8p3eif0sTrzWbg
```

## Nodes Using Supabase Credentials

| Node | Key Type | Purpose |
|------|----------|---------|
| Get Playbook Spec | anon | Fetch detection_patterns |
| RAG Search | anon | Vector similarity search |
| Save to clause_reviews_internal | service_role | Write results |
| Save to sanitizer_outputs | service_role | Write sanitized output |

---

## Canary Tests Available

| Test File | Red Flags Tested |
|-----------|------------------|
| `canary_indemnity_redflag.json` | shall not exceed, to ProdCo's knowledge, consequential |
| `canary_sole_remedy.json` | sole remedy, exclusive remedy |
| `canary_aggregate_liability.json` | aggregate liability, capped at |
| `canary_punitive_damages.json` | punitive, indirect damages, consequential |

Run all:
```bash
for f in n8n/test_payloads/canary_*.json; do
  echo "Testing: $f"
  curl -s -X POST "https://mmenendeza.app.n8n.cloud/webhook/clause-review-rag" \
    -H "Content-Type: application/json" \
    -d @"$f" | jq '{file: "'$f'", red_flags: ._internal.observations.summary.red_flags_found, status: ._internal.final_status}'
done
```
