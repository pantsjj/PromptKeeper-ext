#!/bin/sh
# PromptKeeper Pre-commit Hook
# Copy this to .git/hooks/pre-commit and make executable

echo "🔍 Running pre-commit checks..."

# Run linting
echo "📝 Linting..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Lint failed. Fix errors before committing."
    exit 1
fi

# Run unit tests
echo "🧪 Running unit tests..."
npm test
if [ $? -ne 0 ]; then
    echo "❌ Unit tests failed. Fix tests before committing."
    exit 1
fi

# Optional: Run E2E tests (uncomment if desired)
# echo "🎭 Running E2E tests..."
# npm run test:e2e
# if [ $? -ne 0 ]; then
#     echo "❌ E2E tests failed. Fix tests before committing."
#     exit 1
# fi

echo "✅ All checks passed! Proceeding with commit."
exit 0
