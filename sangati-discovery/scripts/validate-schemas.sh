#!/bin/bash
# Validates JSON schemas and sample data

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TAXONOMY_DIR="$(cd "$SCRIPT_DIR/../prototypes/alert-taxonomy" && pwd)"

echo "--- Validating JSON schemas..."

# Validate JSON syntax for schema
echo "  Checking taxonomy.schema.json..."
if ! jq . "$TAXONOMY_DIR/taxonomy.schema.json" > /dev/null 2>&1; then
  echo "  FAIL: taxonomy.schema.json is invalid JSON"
  exit 1
fi
echo "  PASS: taxonomy.schema.json is valid JSON"

# Validate JSON syntax for sample
echo "  Checking taxonomy.sample.json..."
if ! jq . "$TAXONOMY_DIR/taxonomy.sample.json" > /dev/null 2>&1; then
  echo "  FAIL: taxonomy.sample.json is invalid JSON"
  exit 1
fi
echo "  PASS: taxonomy.sample.json is valid JSON"

# Count alerts (expect 15-20)
alert_count=$(jq '.alerts | length' "$TAXONOMY_DIR/taxonomy.sample.json" 2>/dev/null || echo "0")
echo "  Alert count: $alert_count"
if [ "$alert_count" -lt 15 ]; then
  echo "  WARNING: Alert count is $alert_count (expected >= 15)"
elif [ "$alert_count" -gt 20 ]; then
  echo "  WARNING: Alert count is $alert_count (expected <= 20)"
else
  echo "  PASS: Alert count within expected range (15-20)"
fi

# Check that schema has required top-level fields
echo "  Checking schema structure..."
has_type=$(jq 'has("type")' "$TAXONOMY_DIR/taxonomy.schema.json")
has_properties=$(jq 'has("properties")' "$TAXONOMY_DIR/taxonomy.schema.json")

if [ "$has_type" = "true" ] && [ "$has_properties" = "true" ]; then
  echo "  PASS: Schema has required structure"
else
  echo "  WARNING: Schema may be missing 'type' or 'properties' fields"
fi

echo ""
echo "  PASS: Schema validation complete"
exit 0
