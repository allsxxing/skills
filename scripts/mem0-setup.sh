#!/bin/bash
# mem0-setup.sh — Complete mem0 key rotation, SDK install, and verification
# Run this script locally (outside sandbox) with network access.
#
# Prerequisites:
#   export CLOUDFLARE_API_TOKEN=<your CF token>
#   pip install mem0ai
#   npm install -g mem0ai
#
set -euo pipefail

echo "=== Step 1: Create ase-mem0-mcp project (if not exists) ==="
if [ ! -d "$HOME/ase-mem0-mcp" ]; then
  mkdir -p "$HOME/ase-mem0-mcp/src"
  echo "Project dir created at ~/ase-mem0-mcp"
  echo "Copy wrangler.toml, tsconfig.json, package.json, and src/index.ts there."
else
  echo "~/ase-mem0-mcp already exists"
fi

echo ""
echo "=== Step 2: Rotate MEM0_API_KEY ==="
cd "$HOME/ase-mem0-mcp"
echo "m0-Q9vKI2Mlk65cUS4DY4p6aOZumcmZ6CuNL0bs2DlP" | npx wrangler secret put MEM0_API_KEY

echo ""
echo "=== Step 3: Deploy worker ==="
npx wrangler deploy

echo ""
echo "=== Step 4: Seed mem0 memory ==="
python3 "$HOME/.claude/mem0-config.py"

echo ""
echo "=== Step 5: Verify ==="
python3 -c "
from mem0 import MemoryClient
client = MemoryClient(api_key='m0-Q9vKI2Mlk65cUS4DY4p6aOZumcmZ6CuNL0bs2DlP')
results = client.search('ALL SEEING EYES', user_id='allsxxing')
print('Search results:', results)
if results:
    print('mem0 is FULLY LIVE')
else:
    print('No results yet — re-run seed step')
"
