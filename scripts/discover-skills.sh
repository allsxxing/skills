#!/usr/bin/env bash
#
# discover-skills.sh - Discover new skills in Google Drive CloudSync mount
# Part of the GitHub Agent workflow for skill deployment
#
# Usage: ./scripts/discover-skills.sh [--verbose]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GOOGLE_DRIVE_PATH="${CLAUDE_SKILLS_DRIVE_PATH:-${HOME}/Library/CloudStorage/GoogleDrive-/My Drive/✴️Claude/Claude_skills}"
REPO_SKILLS_PATH="./skills"
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [--verbose]"
            echo ""
            echo "Discovers new skills in Google Drive CloudSync mount that are not yet in the repository."
            echo ""
            echo "Options:"
            echo "  --verbose, -v    Show detailed output"
            echo "  --help, -h       Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Print header
echo "════════════════════════════════════════════════════════════════"
echo "📊 SKILL DISCOVERY REPORT"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Check if Google Drive path exists
if [ ! -d "$GOOGLE_DRIVE_PATH" ]; then
    echo -e "${RED}✗ Google Drive CloudSync not mounted${NC}"
    echo "  Expected path: $GOOGLE_DRIVE_PATH"
    echo ""
    echo "Please ensure:"
    echo "  1. Google Drive is installed"
    echo "  2. CloudSync is enabled"
    echo "  3. The skills directory exists in your Google Drive"
    exit 1
fi

# Count skills in Google Drive
cd "$(dirname "$0")/.." || exit 1
DRIVE_SKILLS=$(find "$GOOGLE_DRIVE_PATH" -maxdepth 1 -type d ! -name ".*" ! -name "Claude_skills" | wc -l | tr -d ' ')
REPO_SKILLS=$(find "$REPO_SKILLS_PATH" -maxdepth 1 -type d ! -name "skills" | wc -l | tr -d ' ')

echo "Total Skills in Google Drive: $DRIVE_SKILLS"
echo "Already in Repository: $REPO_SKILLS"
echo ""

# Find new skills
echo "═══ Skills in Google Drive ═══"
if [ "$VERBOSE" = true ]; then
    find "$GOOGLE_DRIVE_PATH" -mindepth 1 -maxdepth 1 -type d ! -name ".*" -exec basename {} \; | sed 's/^/  /'
else
    find "$GOOGLE_DRIVE_PATH" -mindepth 1 -maxdepth 1 -type d ! -name ".*" -exec basename {} \; | sed 's/^/  /'
fi
echo ""

echo "═══ Skills Already in Repository ═══"
ls "$REPO_SKILLS_PATH" | sed 's/^/  /'
echo ""

# Compare and find new skills
echo "═══ NEW SKILLS (Ready to Deploy) ═══"
NEW_COUNT=0

for skill_dir in "$GOOGLE_DRIVE_PATH"/*; do
    if [ ! -d "$skill_dir" ]; then
        continue
    fi
    
    skill_name=$(basename "$skill_dir")
    
    # Skip hidden directories
    if [[ "$skill_name" == .* ]]; then
        continue
    fi
    
    # Check if skill exists in repository
    if [ ! -d "$REPO_SKILLS_PATH/$skill_name" ]; then
        NEW_COUNT=$((NEW_COUNT + 1))
        
        # Validate skill structure
        HAS_SKILL_MD=false
        HAS_README=false
        HAS_CHANGELOG=false
        HAS_JSON=false
        
        if [ -f "$skill_dir/SKILL.md" ]; then
            HAS_SKILL_MD=true
        elif compgen -G "$skill_dir/*SKILL*.md" > /dev/null; then
            HAS_SKILL_MD=true
        fi
        
        if [ -f "$skill_dir/README.md" ]; then
            HAS_README=true
        fi
        
        if [ -f "$skill_dir/CHANGELOG.md" ]; then
            HAS_CHANGELOG=true
        fi
        
        if compgen -G "$skill_dir/*.json" > /dev/null; then
            HAS_JSON=true
        fi
        
        # Determine status
        STATUS="unknown"
        STATUS_SYMBOL="?"
        STATUS_COLOR="$NC"
        
        if [ "$HAS_SKILL_MD" = true ] && [ "$HAS_README" = true ]; then
            STATUS="✓ Valid (all required files present)"
            STATUS_SYMBOL="✓"
            STATUS_COLOR="$GREEN"
        elif [ "$HAS_SKILL_MD" = true ] || [ "$HAS_README" = true ]; then
            STATUS="○ Incomplete (missing some required files)"
            STATUS_SYMBOL="○"
            STATUS_COLOR="$YELLOW"
        else
            STATUS="✗ Invalid (missing required files - SKIP)"
            STATUS_SYMBOL="✗"
            STATUS_COLOR="$RED"
        fi
        
        echo -e "${STATUS_COLOR}${STATUS_SYMBOL}${NC} $skill_name"
        
        if [ "$VERBOSE" = true ]; then
            echo "  Files:"
            if [ "$HAS_SKILL_MD" = true ]; then
                echo -e "    ${GREEN}✓${NC} SKILL.md"
            else
                echo -e "    ${RED}✗${NC} SKILL.md (REQUIRED)"
            fi
            
            if [ "$HAS_README" = true ]; then
                echo -e "    ${GREEN}✓${NC} README.md"
            else
                echo -e "    ${RED}✗${NC} README.md (REQUIRED)"
            fi
            
            if [ "$HAS_CHANGELOG" = true ]; then
                echo -e "    ${GREEN}✓${NC} CHANGELOG.md"
            else
                echo -e "    ${YELLOW}○${NC} CHANGELOG.md (optional)"
            fi
            
            if [ "$HAS_JSON" = true ]; then
                echo -e "    ${GREEN}✓${NC} Data payload (.json)"
            else
                echo -e "    ${YELLOW}○${NC} Data payload (optional)"
            fi
            echo ""
        fi
    fi
done

if [ "$NEW_COUNT" -eq 0 ]; then
    echo -e "${BLUE}No new skills detected${NC}"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "New Skills Found: $NEW_COUNT"
echo "════════════════════════════════════════════════════════════════"
