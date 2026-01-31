.PHONY: all build clean typecheck bundle test test-watch dev watch install help

# Default target
all: build

# Full build: clean, typecheck, and bundle
build:
	npm run build

# Remove dist directory and recreate it
clean:
	npm run clean

# Run TypeScript type checking only
typecheck:
	npm run typecheck

# Bundle with esbuild (no type checking)
bundle:
	npm run bundle

# Run tests once
test:
	npm run test

# Run tests in watch mode
test-watch:
	npm run test:watch

# Watch mode for development (auto-rebuild on changes)
dev:
	npm run dev

# Alias for dev
watch:
	npm run watch

# Install dependencies
install:
	npm install

# Show available targets
help:
	@echo "Available targets:"
	@echo "  make build      - Full build (clean + typecheck + bundle)"
	@echo "  make clean      - Remove dist directory"
	@echo "  make typecheck  - Run TypeScript type checking"
	@echo "  make bundle     - Bundle with esbuild (no type check)"
	@echo "  make test       - Run tests once"
	@echo "  make test-watch - Run tests in watch mode"
	@echo "  make dev        - Watch mode for development"
	@echo "  make watch      - Alias for dev"
	@echo "  make install    - Install npm dependencies"
	@echo "  make help       - Show this help message"
