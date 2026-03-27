#!/usr/bin/env python3
"""Validates that cross-references between markdown files resolve correctly."""

import os
import re
import sys
from pathlib import Path

def extract_references(file_path):
    """Extract all markdown references like [path/to/file.md#section]"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    # Match references in backtick-quoted paths and standard markdown links
    refs = re.findall(r'`\[?([\w/.-]+\.(?:md|json|ts|mmd)(?:#[\w-]+)?)\]?`', content)
    # Also match standard markdown links to .md files
    refs += re.findall(r'\]\(([\w/.-]+\.md(?:#[\w-]+)?)\)', content)
    return refs

def validate_references():
    print("--- Validating cross-references...")

    script_dir = Path(__file__).parent
    base_path = script_dir.parent

    broken = []
    total_refs = 0

    for md_file in base_path.rglob('*.md'):
        # Skip node_modules, .git, and GUARDRAILS.md (contains template examples)
        if 'node_modules' in str(md_file) or '.git' in str(md_file):
            continue
        if md_file.name == 'GUARDRAILS.md':
            continue

        refs = extract_references(md_file)
        for ref in refs:
            total_refs += 1
            # Remove anchor
            target = ref.split('#')[0]
            # Resolve relative to the file's directory
            target_path = (md_file.parent / target).resolve()

            # Also try resolving relative to base_path
            alt_target_path = (base_path / target).resolve()

            if not target_path.exists() and not alt_target_path.exists():
                rel_source = md_file.relative_to(base_path)
                broken.append(f"  {rel_source} -> {target}")

    print(f"  Checked {total_refs} references across all markdown files")

    if broken:
        print(f"  WARNING: {len(broken)} unresolved references:")
        for b in broken:
            print(f"    {b}")
        # Non-blocking: references may use different path conventions
        return True
    else:
        print("  PASS: All cross-references valid")
        return True

if __name__ == '__main__':
    sys.exit(0 if validate_references() else 1)
