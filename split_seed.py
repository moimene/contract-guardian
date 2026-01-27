import re
import os

SOURCE_FILE = "./Dataset /20260120061000_seed_harvey_policy_examples_expanded.sql"
OUTPUT_DIR = "sql_batches"

def main():
    global SOURCE_FILE
    if not os.path.exists(SOURCE_FILE):
        print(f"Error: File {SOURCE_FILE} not found")
        # Try without space
        alt_path = "./Dataset/20260120061000_seed_harvey_policy_examples_expanded.sql"
        if os.path.exists(alt_path):
            SOURCE_FILE = alt_path
            print(f"Found at {SOURCE_FILE}")
        else:
             return

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    with open(SOURCE_FILE, 'r') as f:
        content = f.read()

    # Extract Header (lines 1 to ~32)
    # Be careful to get the DECLARE block and initialization
    # roughly from "DO $$" to just before the first "-- rights_..." or SELECT
    
    # regex to find the start of the first block
    # The first block starts around line 33 with "-- rights_ownership"
    
    header_match = re.search(r'(DO \$\$.*?)(-- rights_ownership)', content, re.DOTALL)
    if not header_match:
        print("Could not find header pattern")
        # Fallback: manually slice if we know lines. But regex is safer.
        # Let's try to split by the first specific comment
        parts = content.split('-- rights_ownership', 1)
        if len(parts) < 2:
             print("Split failed")
             return
        header = parts[0]
        body = '-- rights_ownership' + parts[1]
    else:
        header = header_match.group(1)
        body = header_match.group(2) + content[content.find(header_match.group(2)) + len(header_match.group(2)):]
        # Actually header_match.group(2) is just the start text, we need the rest.
        # easier:
        split_idx = content.find('-- rights_ownership')
        header = content[:split_idx]
        body = content[split_idx:]

    # Remove the final "END $$;" from body if present
    body = body.strip()
    if body.endswith('END $$;'):
        body = body[:-7]
    elif body.endswith('END $$'):
        body = body[:-6]

    # Split body into blocks
    # Each block usually starts with "-- rights_" or "SELECT mp.id"
    # and ends with "END IF;"
    
    # We can split by "END IF;"
    raw_blocks = body.split('END IF;')
    
    blocks = []
    for b in raw_blocks:
        if b.strip():
            blocks.append(b + 'END IF;')
    
    print(f"Found {len(blocks)} blocks")
    
    # Create batches
    BATCH_SIZE = 10
    batch_idx = 1
    
    for i in range(0, len(blocks), BATCH_SIZE):
        batch_blocks = blocks[i : i + BATCH_SIZE]
        
        batch_content = header + "\n\n" + "\n\n".join(batch_blocks) + "\n\nEND $$;"
        
        filename = os.path.join(OUTPUT_DIR, f"batch_{batch_idx:03d}.sql")
        with open(filename, 'w') as f:
            f.write(batch_content)
        
        print(f"Wrote {filename} with {len(batch_blocks)} blocks")
        batch_idx += 1

if __name__ == "__main__":
    main()
