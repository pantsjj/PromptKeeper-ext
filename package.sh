#!/bin/bash
# PromptKeeper Packaging Script
# Creates a clean ZIP file for Chrome Web Store submission

set -e

EXTENSION_NAME="promptkeeper"
VERSION=$(node -p "require('./package.json').version")
OUTPUT_FILE="${EXTENSION_NAME}-v${VERSION}.zip"

echo "📦 Packaging PromptKeeper v${VERSION}..."

# Remove old zip if exists
rm -f "${OUTPUT_FILE}"

# Create zip excluding dev files
zip -r "${OUTPUT_FILE}" . \
  -x ".git/*" \
  -x ".vscode/*" \
  -x "node_modules/*" \
  -x "tests/*" \
  -x "coverage/*" \
  -x "test-results/*" \
  -x "playwright-report/*" \
  -x "ChromeStore/*" \
  -x "docs/*" \
  -x "*.md" \
  -x "playwright.config.js" \
  -x "jest.config.js" \
  -x "babel.config.json" \
  -x "eslint.config.js" \
  -x ".ignore" \
  -x ".gitignore" \
  -x "key.pem" \
  -x "pubkey.txt" \
  -x "*.code-workspace" \
  -x "package-lock.json" \
  -x "*.sh" \
  -x ".DS_Store"

echo "✅ Created: ${OUTPUT_FILE}"
echo "📊 Size: $(du -h "${OUTPUT_FILE}" | cut -f1)"
echo ""
echo "Next steps:"
echo "1. Upload to Chrome Web Store Developer Dashboard"
echo "2. Update store description with ChromeStore/STORE_CONTENT_v2.md"
