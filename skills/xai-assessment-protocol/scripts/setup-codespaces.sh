#!/bin/bash
# Setup script for GitHub Codespaces environment
#
# Usage:
#   bash setup-codespaces.sh
#
# This script installs all dependencies required for working with skills
# in a GitHub Codespaces environment.

set -e

echo "🚀 Setting up Codespaces environment for skills..."
echo ""

# System packages
echo "📦 Installing system packages..."
sudo apt-get update -qq
sudo apt-get install -y -qq pandoc libreoffice poppler-utils
echo "✅ System packages installed"

# Node.js packages
echo "📦 Installing Node.js packages..."
npm install -g docx pptxgenjs playwright react-icons react react-dom sharp
echo "✅ Node.js packages installed"

# Python packages
echo "🐍 Installing Python packages..."
pip install -q defusedxml pillow imageio imageio-ffmpeg numpy anthropic mcp "markitdown[pptx]"
echo "✅ Python packages installed"

# Playwright browser
echo "🌐 Installing Playwright browser..."
playwright install chromium --with-deps
echo "✅ Playwright browser installed"

echo ""
echo "✅ Setup complete! All dependencies installed."
echo ""
echo "You can now use the skill tools:"
echo "  - python scripts/pull-skill.py <source> --output <destination>"
echo "  - python scripts/validate-skill.py <skill-path>"
