# n8n Workflow Import Guide

## Prerequisites
- Access to n8n Cloud: https://mmenendeza.app.n8n.cloud
- Credentials configured: Supabase, OpenAI, Google Drive

## Import Order

Import workflows in this order to ensure dependencies are available:

### Step 1: Import W1_DriveIngest
1. Go to n8n Cloud → Workflows → Import
2. Upload `n8n/W1_DriveIngest.json`
3. Configure credentials:
   - Google Drive OAuth2
   - Supabase API
4. Activate workflow

### Step 2: Import W2_ClauseReview
1. Import `n8n/W2_ClauseReview.json`
2. Configure credentials:
   - OpenAI API (for all 4 agents)
   - Supabase API (for Save Review)
3. Activate workflow

### Step 3: Import W3_ContractReview
1. Import `n8n/W3_ContractReview.json`
2. Configure credentials:
   - Supabase API
3. Verify W2 webhook URL is: `https://mmenendeza.app.n8n.cloud/webhook/clause-review`
4. Activate workflow

## Webhook URLs (Production)

| Workflow | Webhook URL |
|----------|-------------|
| W1_DriveIngest | `https://mmenendeza.app.n8n.cloud/webhook/drive-ingest` |
| W2_ClauseReview | `https://mmenendeza.app.n8n.cloud/webhook/clause-review` |
| W3_ContractReview | `https://mmenendeza.app.n8n.cloud/webhook/contract-review` |

## After Import

1. Deactivate the unified workflow (`cOQTqg89rT2lWH4e`)
2. Test each workflow independently
3. Run full pipeline test: W1 → W3 → W2 (loop)
