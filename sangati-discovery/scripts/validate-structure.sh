#!/bin/bash
# Validates that all required discovery phase files exist

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "--- Validating repo structure..."

required_files=(
  "README.md"
  "GUARDRAILS.md"
  "docs/01-vision/product-vision.md"
  "docs/01-vision/pilot-workflows.md"
  "docs/02-requirements/mvp-scope.md"
  "docs/02-requirements/tech-requirements.md"
  "docs/03-architecture/system-design.md"
  "docs/03-architecture/integrations.md"
  "docs/05-execution/deployment-plan.md"
  "docs/05-execution/pilot-roadmap.md"
  "docs/05-execution/risks-mitigations.md"
  "research/user-personas/manager.md"
  "research/user-personas/floor-server.md"
  "research/user-personas/kitchen.md"
  "research/user-personas/owner-admin.md"
  "research/competitive-analysis.md"
  "prototypes/alert-taxonomy/taxonomy.schema.json"
  "prototypes/alert-taxonomy/taxonomy.sample.json"
  "prototypes/rules-engine/package.json"
  "prototypes/rules-engine/src/index.ts"
)

missing=0
for file in "${required_files[@]}"; do
  if [ ! -f "$BASE_DIR/$file" ]; then
    echo "  MISSING: $file"
    missing=$((missing + 1))
  fi
done

# Check for empty files
empty=0
for file in "${required_files[@]}"; do
  if [ -f "$BASE_DIR/$file" ] && [ ! -s "$BASE_DIR/$file" ]; then
    echo "  EMPTY: $file"
    empty=$((empty + 1))
  fi
done

if [ $missing -eq 0 ] && [ $empty -eq 0 ]; then
  echo "  PASS: All ${#required_files[@]} required files present and non-empty"
  exit 0
else
  echo "  FAIL: $missing missing, $empty empty"
  exit 1
fi
