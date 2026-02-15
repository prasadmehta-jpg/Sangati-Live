#!/bin/bash
# Master validation suite — runs all checks in sequence
# Usage: cd sangati-discovery && ./scripts/validate-all.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo " Sangati Discovery — Validation Suite"
echo "========================================="
echo ""

passed=0
failed=0
total=6

run_check() {
  local name="$1"
  local script="$2"
  echo ""
  if bash "$SCRIPT_DIR/$script" 2>&1; then
    passed=$((passed + 1))
  else
    echo "  ^^^ FAILED ^^^"
    failed=$((failed + 1))
  fi
}

run_python_check() {
  local name="$1"
  local script="$2"
  echo ""
  if python3 "$SCRIPT_DIR/$script" 2>&1; then
    passed=$((passed + 1))
  else
    echo "  ^^^ FAILED ^^^"
    failed=$((failed + 1))
  fi
}

# Gate 1: Structural completeness
run_check "Structure" "validate-structure.sh"

# Gate 2: Semantic correctness
run_check "Semantics" "validate-semantics.sh"

# Gate 3: Code quality
run_check "Code" "validate-code.sh"

# Gate 4: JSON schemas
run_check "Schemas" "validate-schemas.sh"

# Gate 5: Cross-references
run_python_check "References" "validate-references.py"

# Gate 6: Contradictions
run_python_check "Contradictions" "detect-contradictions.py"

echo ""
echo "========================================="
echo " Results: $passed/$total passed, $failed failed"
echo "========================================="

if [ $failed -eq 0 ]; then
  echo " ALL VALIDATIONS PASSED"
  echo " Discovery phase output is production-ready."
  exit 0
else
  echo " $failed VALIDATION(S) FAILED"
  echo " Review errors above and fix failed components."
  exit 1
fi
