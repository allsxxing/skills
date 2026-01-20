#!/usr/bin/env bash
#
# validate-skill.sh - Validate skill structure
# Part of the GitHub Agent workflow for skill deployment
#
# Usage: ./scripts/validate-skill.sh <skill-path>

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <skill-path>"
    echo ""
    echo "Validates skill structure and required files."
    echo ""
    echo "Example:"
    echo "  $0 ~/Library/CloudStorage/GoogleDrive-/My\\ Drive/✴️Claude/Claude_skills/xai-assessment-protocol"
    exit 1
fi

SKILL_PATH="$1"

# Check if skill path exists
if [ ! -d "$SKILL_PATH" ]; then
    echo -e "${RED}✗ Skill directory not found: $SKILL_PATH${NC}"
    exit 1
fi

SKILL_NAME=$(basename "$SKILL_PATH")

echo "════════════════════════════════════════════════════════════════"
echo "🔍 SKILL VALIDATION: $SKILL_NAME"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Validate required files
VALIDATION_PASSED=true

# Check for SKILL.md
if [ -f "$SKILL_PATH/SKILL.md" ]; then
    echo -e "${GREEN}✓${NC} SKILL.md found"
elif compgen -G "$SKILL_PATH/*SKILL*.md" > /dev/null; then
    echo -e "${GREEN}✓${NC} SKILL.md found"
else
    echo -e "${RED}✗${NC} SKILL.md MISSING (REQUIRED)"
    VALIDATION_PASSED=false
fi

# Check for README.md
if [ -f "$SKILL_PATH/README.md" ]; then
    echo -e "${GREEN}✓${NC} README.md found"
else
    echo -e "${RED}✗${NC} README.md MISSING (REQUIRED)"
    VALIDATION_PASSED=false
fi

# Check for CHANGELOG.md
if [ -f "$SKILL_PATH/CHANGELOG.md" ]; then
    echo -e "${GREEN}✓${NC} CHANGELOG.md found"
else
    echo -e "${YELLOW}○${NC} CHANGELOG.md optional (recommended)"
fi

# Check for data payload
if compgen -G "$SKILL_PATH/*.json" > /dev/null; then
    echo -e "${GREEN}✓${NC} Data payload found"
    find "$SKILL_PATH" -maxdepth 1 -name "*.json" -type f -exec basename {} \; | sed 's/^/    /'
else
    echo -e "${YELLOW}○${NC} Data payload optional"
fi

echo ""

# List all files in skill directory
echo "Files in skill directory:"
find "$SKILL_PATH" -maxdepth 1 -type f -exec sh -c 'basename "$1" && du -h "$1" | cut -f1' _ {} \; | paste -d ' ' - - | awk '{print "  " $1 " (" $2 ")"}'

echo ""
echo "════════════════════════════════════════════════════════════════"

if [ "$VALIDATION_PASSED" = true ]; then
    echo -e "${GREEN}✓ VALIDATION PASSED${NC}"
    exit 0
else
    echo -e "${RED}✗ VALIDATION FAILED${NC}"
    echo "Missing required files. Please add them before deploying."
    exit 1
fi
