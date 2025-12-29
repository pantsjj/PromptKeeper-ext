#!/bin/bash

# Define the Chrome Canary path (adjust if using Dev/Beta or standard Chrome)
# Standard Chrome: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
# Canary: "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"

CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Check if Chrome exists at the path
if [ ! -f "$CHROME_PATH" ]; then
    echo "Error: Chrome not found at $CHROME_PATH"
    echo "Please edit this script to point to your specific Chrome installation."
    exit 1
fi

echo "Launching Chrome with Gemini Nano flags..."
echo "Flags: --enable-features=PromptAPIForGeminiNano,OptimizationGuideOnDeviceModel:BypassPerfRequirement"

"$CHROME_PATH" \
    --args \
    --enable-features=PromptAPIForGeminiNano,OptimizationGuideOnDeviceModel:BypassPerfRequirement \
    --remote-debugging-port=9222 \
    "$@"
