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

# Create a temporary production manifest without the key
echo "🔧 preparing manifest for production..."
cp manifest.json manifest.json.bak
# Remove the 'key' field and swap client_id using node
PROD_CLIENT_ID="804678258987-trop26ei3lek64gvdscchg2pfijo82mq.apps.googleusercontent.com"
node -e "const fs = require('fs'); const m = JSON.parse(fs.readFileSync('manifest.json', 'utf8')); delete m.key; m.oauth2.client_id = '${PROD_CLIENT_ID}'; fs.writeFileSync('manifest.json', JSON.stringify(m, null, 2));"

# Ensure cleanup happens even if script fails
cleanup() {
    if [ -f manifest.json.bak ]; then
        mv manifest.json.bak manifest.json
        echo "🔄 Restored original manifest.json"
    fi
}
trap cleanup EXIT


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
  -x "manifest.json.bak" \
  -x "verify_id.py" \
  -x ".DS_Store"

echo "✅ Created: ${OUTPUT_FILE}"
echo "📊 Size: $(du -h "${OUTPUT_FILE}" | cut -f1)"
echo ""
echo "Next steps:"
echo "1. Upload to Chrome Web Store Developer Dashboard"
echo "2. Update store description with ChromeStore/STORE_CONTENT_v2.md"
