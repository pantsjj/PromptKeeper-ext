# PromptKeeper Extension - Makefile
# Development, Testing, and Packaging Commands

.PHONY: help install lint test test-e2e test-all clean package pre-commit

# Default target
help:
	@echo "PromptKeeper Extension - Available Commands:"
	@echo ""
	@echo "  make install      - Install dependencies"
	@echo "  make lint         - Run ESLint"
	@echo "  make test         - Run unit tests"
	@echo "  make test-e2e     - Run E2E tests (Playwright)"
	@echo "  make test-all     - Run lint + unit + E2E tests"
	@echo "  make package      - Create distribution ZIP"
	@echo "  make clean        - Remove build artifacts"
	@echo "  make pre-commit   - Run pre-commit checks manually"
	@echo ""

# Install dependencies
install:
	npm install

# Linting
lint:
	npm run lint

# Unit tests
test:
	npm test

# E2E tests
test-e2e:
	npm run test:e2e

# Run all tests
test-all: lint test test-e2e
	@echo "✅ All tests passed!"

# Pre-commit checks (same as test-all but explicit)
pre-commit: test-all

# Package for Chrome Web Store
package: test-all
	@echo "📦 Packaging extension..."
	@./package.sh

# Clean build artifacts
clean:
	rm -rf coverage test-results playwright-report
	rm -f *.zip
	@echo "🧹 Cleaned build artifacts"

# Create local-artifacts directory if needed
local-artifacts:
	mkdir -p local-artifacts
	@echo "Created local-artifacts directory (gitignored)"

# Install pre-commit hook
install-hooks:
	cp scripts/pre-commit.sh .git/hooks/pre-commit
	chmod +x .git/hooks/pre-commit
	@echo "✅ Pre-commit hook installed"
