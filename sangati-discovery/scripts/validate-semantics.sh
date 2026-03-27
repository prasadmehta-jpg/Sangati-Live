#!/bin/bash
# Checks for forbidden terms in docs and research

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "--- Checking forbidden terms..."

forbidden_terms=(
  "surveillance"
  "facial recognition"
  "identity tracking"
  "AI-powered"
  "smart system"
  "big data"
  "predictive analytics"
)

violations=0
for term in "${forbidden_terms[@]}"; do
  # Search docs/ and research/ but exclude GUARDRAILS.md (which lists them as forbidden)
  matches=$(grep -r -i -l "$term" "$BASE_DIR/docs/" "$BASE_DIR/research/" 2>/dev/null || true)
  if [ -n "$matches" ]; then
    echo "  VIOLATION: Found '$term' in:"
    echo "$matches" | while read -r f; do
      # Show relative path and the offending line
      rel_path="${f#$BASE_DIR/}"
      line=$(grep -i -n "$term" "$f" | head -3)
      echo "    $rel_path: $line"
    done
    violations=$((violations + 1))
  fi
done

echo ""
echo "--- Checking preferred terminology..."

# Check for common wrong terms (in docs only, not code)
wrong_terms=(
  "waiter:floor server"
  "waitress:floor server"
  "table status:table state"
  "on-premise:edge deployment"
  "decision engine:rules engine"
  "logic layer:rules engine"
  "object detection:blob detection"
  "people counting:blob detection"
)

suggestions=0
for entry in "${wrong_terms[@]}"; do
  wrong="${entry%%:*}"
  correct="${entry##*:}"
  matches=$(grep -r -i -l "$wrong" "$BASE_DIR/docs/" "$BASE_DIR/research/" 2>/dev/null || true)
  if [ -n "$matches" ]; then
    echo "  SUGGESTION: Replace '$wrong' with '$correct' in:"
    echo "$matches" | while read -r f; do
      rel_path="${f#$BASE_DIR/}"
      echo "    $rel_path"
    done
    suggestions=$((suggestions + 1))
  fi
done

if [ $violations -eq 0 ]; then
  echo ""
  echo "  PASS: No forbidden terms found"
  if [ $suggestions -gt 0 ]; then
    echo "  NOTE: $suggestions terminology suggestions (non-blocking)"
  fi
  exit 0
else
  echo ""
  echo "  FAIL: $violations forbidden term violations"
  exit 1
fi
