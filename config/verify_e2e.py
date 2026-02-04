import requests
import json
import time
import uuid
import os

# Config
SUPABASE_URL = "https://hvlsuwdqtffiilvampxq.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2bHN1d2RxdGZmaWlsdmFtcHhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODMxMjkwMiwiZXhwIjoyMDgzODg4OTAyfQ.fiPHwoYlT3aW6MRrRTMvF7H6zKSiiUdS3pyOd8tT0ok"
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

DOCUMENT_ID = str(uuid.uuid4())
FILE_NAME = "ProductionServicesAgreement_E2E.pdf"
FILE_PATH = f"contracts/{DOCUMENT_ID}/{FILE_NAME}"
LOCAL_FILE = "config/ProductionServicesAgreement.pdf"

def step(msg):
    print(f"\n[STEP] {msg}")

def run_verification():
    step("1. Uploading File to Storage")
    
    # Read file
    try:
        with open(LOCAL_FILE, "rb") as f:
            file_data = f.read()
    except FileNotFoundError:
        # Assuming generating pdf didn't save to config/ but to root
        try:
            with open("ProductionServicesAgreement.pdf", "rb") as f:
                file_data = f.read()
                print("Found file in root")
        except:
            print("ERROR: PDF file not found. Run generate script first.")
            return

    # Upload (POST to storage/v1/object/contracts/...)
    upload_url = f"{SUPABASE_URL}/storage/v1/object/contracts/{FILE_PATH}"
    headers_upload = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/pdf"
    }
    
    res = requests.post(upload_url, data=file_data, headers=headers_upload)
    if res.status_code not in [200, 201]: # 200 is ok for upsert?
        print(f"Upload Failed: {res.status_code} {res.text}")
        # Try finding bucket first? Assuming 'contracts' exists.
        return
    print(f"Upload Success: {FILE_PATH}")

    step("2. Creating Document Record")
    doc_payload = {
        "document_id": DOCUMENT_ID,
        "file_name": FILE_NAME,
        "file_path": FILE_PATH,
        "contract_type": "amazon-psa",
        "mime_type": "application/pdf",
        "status": "uploaded", # Initial status
        "tenant_id": "00000000-0000-0000-0000-000000000001" # Mock
    }
    
    res = requests.post(f"{SUPABASE_URL}/rest/v1/documents", headers=HEADERS, json=doc_payload)
    if res.status_code != 201:
        print(f"Document Create Failed: {res.status_code} {res.text}")
        return
    print(f"Document Created: {DOCUMENT_ID}")

    step("3. Triggering start_review Edge Function")
    ef_url = f"{SUPABASE_URL}/functions/v1/start_review"
    ef_payload = {
        "document_id": DOCUMENT_ID,
        "contract_type_id": "amazon-psa"
    }
    
    res = requests.post(ef_url, headers=HEADERS, json=ef_payload)
    print(f"Trigger Status: {res.status_code}")
    try:
        data = res.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        run_id = data.get("run_id")
    except:
        print("Response not JSON")
        run_id = None
        
    if not run_id:
        print("Failed to get run_id")
        return

    step(f"4. Monitoring Workflow (Run ID: {run_id})")
    print("Waiting 10 seconds for n8n processing...")
    time.sleep(10)

    # Check Clause Instances
    step("5. Verifying Extracted Clauses")
    res = requests.get(f"{SUPABASE_URL}/rest/v1/clause_instances?document_id=eq.{DOCUMENT_ID}&select=count", headers=HEADERS)
    # count header? or select count
    # Supabase uses Prefer: count=exact
    headers_count = {**HEADERS, "Prefer": "count=exact"}
    res = requests.get(f"{SUPABASE_URL}/rest/v1/clause_instances?document_id=eq.{DOCUMENT_ID}&select=*", headers=headers_count)
    
    clauses = res.json()
    count = len(clauses)
    print(f"Clauses Found: {count}")
    
    if count > 0:
        print("First 3 clauses:")
        for c in clauses[:3]:
            print(f"- {c.get('heading')}: {c.get('original_text')[:50]}...")
            
    # Check Run Status
    step("6. checking Run Status")
    res = requests.get(f"{SUPABASE_URL}/rest/v1/contract_runs?run_id=eq.{run_id}", headers=HEADERS)
    runs = res.json()
    if runs:
        print(f"Run Status: {runs[0].get('status')}")
    else:
        print("Run not found")

if __name__ == "__main__":
    run_verification()
