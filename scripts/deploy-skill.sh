#!/usr/bin/env bash
#
# deploy-skill.sh - Deploy a skill from Google Drive to repository
# Part of the GitHub Agent workflow for skill deployment
#
# Usage: ./scripts/deploy-skill.sh <skill-name> [--dry-run]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GOOGLE_DRIVE_PATH="${HOME}/Library/CloudStorage/GoogleDrive-/My Drive/✴️Claude/Claude_skills"
REPO_SKILLS_PATH="./skills"
CLAUDE_SKILLS_PATH="./.claude/skills"
DRY_RUN=false

# Parse arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <skill-name> [--dry-run]"
    echo ""
    echo "Deploys a skill from Google Drive to the repository."
    echo ""
    echo "Arguments:"
    echo "  skill-name       Name of the skill directory in Google Drive"
    echo ""
    echo "Options:"
    echo "  --dry-run        Show what would be done without actually doing it"
    echo ""
    echo "Example:"
    echo "  $0 xai-assessment-protocol"
    echo "  $0 xai-assessment-protocol --dry-run"
    exit 1
fi

SKILL_NAME="$1"
shift

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

SOURCE_PATH="$GOOGLE_DRIVE_PATH/$SKILL_NAME"
DEST_PATH="$REPO_SKILLS_PATH/$SKILL_NAME"
SYMLINK_PATH="$CLAUDE_SKILLS_PATH/$SKILL_NAME"

echo "════════════════════════════════════════════════════════════════"
echo "🚀 SKILL DEPLOYMENT: $SKILL_NAME"
echo "════════════════════════════════════════════════════════════════"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}⚠ DRY RUN MODE - No changes will be made${NC}"
    echo ""
fi

# Check if source exists
if [ ! -d "$SOURCE_PATH" ]; then
    echo -e "${RED}✗ Source skill not found: $SOURCE_PATH${NC}"
    exit 1
fi

# Check if destination already exists
if [ -d "$DEST_PATH" ]; then
    echo -e "${YELLOW}⚠ Skill already exists in repository: $DEST_PATH${NC}"
    echo "  Overwrite? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Validate skill structure
echo "Validating skill structure..."
./scripts/validate-skill.sh "$SOURCE_PATH" || exit 1
echo ""

# Show what will be copied
echo "Files to copy:"
ls -lh "$SOURCE_PATH" | grep -v "^total" | awk '{print "  " $9 " (" $5 ")"}'
echo ""

# Perform deployment
if [ "$DRY_RUN" = true ]; then
    echo "Would execute:"
    echo "  mkdir -p $DEST_PATH"
    echo "  cp -r $SOURCE_PATH/* $DEST_PATH/"
    echo "  mkdir -p $CLAUDE_SKILLS_PATH"
    echo "  ln -sf ../../skills/$SKILL_NAME $SYMLINK_PATH"
else
    echo "Copying files..."
    mkdir -p "$DEST_PATH"
    cp -r "$SOURCE_PATH"/* "$DEST_PATH/"
    echo -e "${GREEN}✓${NC} Files copied to $DEST_PATH"
    
    echo "Creating symlink..."
    mkdir -p "$CLAUDE_SKILLS_PATH"
    ln -sf "../../skills/$SKILL_NAME" "$SYMLINK_PATH"
    echo -e "${GREEN}✓${NC} Symlink created at $SYMLINK_PATH"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"

if [ "$DRY_RUN" = true ]; then
    echo -e "${BLUE}✓ DRY RUN COMPLETE${NC}"
    echo "Run without --dry-run to perform actual deployment"
else
    echo -e "${GREEN}✓ DEPLOYMENT COMPLETE${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review changes: git status"
    echo "  2. Create branch: git checkout -b $SKILL_NAME"
    echo "  3. Commit changes: git add . && git commit -m 'Add $SKILL_NAME skill'"
    echo "  4. Push branch: git push origin $SKILL_NAME"
    echo "  5. Create PR: gh pr create --title 'Add $SKILL_NAME skill'"
fi

echo "════════════════════════════════════════════════════════════════"
