#!/bin/bash
# Validates the TypeScript rules engine builds, tests pass, and demo runs

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENGINE_DIR="$(cd "$SCRIPT_DIR/../prototypes/rules-engine" && pwd)"

echo "--- Validating TypeScript rules engine..."

cd "$ENGINE_DIR"

# Check dependencies install
echo "  Installing dependencies..."
if ! npm install --silent 2>&1; then
  echo "  FAIL: npm install failed"
  exit 1
fi
echo "  PASS: npm install"

# Check tests pass
echo "  Running tests..."
if ! npm test 2>&1; then
  echo "  FAIL: Tests failed"
  exit 1
fi
echo "  PASS: npm test"

# Check demo runs
echo "  Running demo..."
if ! timeout 30 npm run demo 2>&1; then
  echo "  FAIL: Demo failed or timed out"
  exit 1
fi
echo "  PASS: npm run demo"

# Check for 'any' types in source code (excluding node_modules and test files)
echo "  Checking for untyped 'any' usage..."
any_count=$(grep -rn ": any" src/ --include="*.ts" | grep -v "node_modules" | grep -v ".test." | wc -l || true)
if [ "$any_count" -gt 0 ]; then
  echo "  WARNING: Found $any_count uses of ': any' type in src/"
  grep -rn ": any" src/ --include="*.ts" | grep -v "node_modules" | grep -v ".test." | while read -r line; do
    echo "    $line"
  done
else
  echo "  PASS: No 'any' types found"
fi

echo ""
echo "  PASS: Code validation complete"
exit 0
