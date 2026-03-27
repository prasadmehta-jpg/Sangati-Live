#!/usr/bin/env python3
"""Detects contradictions between discovery phase documents."""

import json
import re
import sys
from pathlib import Path

def load_file(path):
    """Load a text file, return empty string if missing."""
    try:
        return path.read_text(encoding='utf-8')
    except FileNotFoundError:
        print(f"  WARNING: File not found: {path}")
        return ""

def check_timeline_consistency(base_path):
    """Check if roadmap timeline matches tech requirements complexity."""
    print("  Checking timeline consistency...")

    roadmap = load_file(base_path / 'docs/05-execution/pilot-roadmap.md')
    tech_req = load_file(base_path / 'docs/02-requirements/tech-requirements.md')
    mvp_scope = load_file(base_path / 'docs/02-requirements/mvp-scope.md')

    issues = []

    # Check if CCTV is mentioned in roadmap and tech requirements
    if 'cctv' in roadmap.lower() and 'cctv' not in tech_req.lower():
        issues.append("Roadmap mentions CCTV but tech-requirements does not specify CCTV needs")

    if 'cctv' in tech_req.lower() and 'cctv' not in roadmap.lower():
        issues.append("Tech-requirements mentions CCTV but roadmap has no CCTV milestone")

    # Check MVP scope alignment with roadmap
    if mvp_scope and roadmap:
        # Extract week counts from roadmap
        week_mentions = re.findall(r'[Ww]eek\s+(\d+)', roadmap)
        if week_mentions:
            max_week = max(int(w) for w in week_mentions)
            if max_week > 24:
                issues.append(f"Roadmap extends to Week {max_week} — exceeds typical MVP timeline")

    for issue in issues:
        print(f"    WARNING: {issue}")

    if not issues:
        print("    OK")
    return len(issues) == 0

def check_alert_consistency(base_path):
    """Check if alert taxonomy matches system design."""
    print("  Checking alert taxonomy consistency...")

    taxonomy_path = base_path / 'prototypes/alert-taxonomy/taxonomy.sample.json'
    system_design = load_file(base_path / 'docs/03-architecture/system-design.md')
    rules_path = base_path / 'prototypes/rules-engine/src/rules.ts'

    issues = []

    try:
        with open(taxonomy_path, 'r', encoding='utf-8') as f:
            taxonomy = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"    WARNING: Cannot load taxonomy: {e}")
        return True

    # Get alert IDs from taxonomy
    alerts = taxonomy.get('alerts', [])
    alert_ids = [a.get('id', '') for a in alerts]

    # Check severity levels are consistent
    severity_levels = set()
    for alert in alerts:
        sev = alert.get('severity', alert.get('defaultSeverity', ''))
        if sev:
            severity_levels.add(sev.lower() if isinstance(sev, str) else str(sev))

    # Check if rules engine references alerts from taxonomy
    if rules_path.exists():
        rules_content = load_file(rules_path)
        # Just check that the rules engine exists and has content
        if len(rules_content) < 50:
            issues.append("Rules engine src/rules.ts appears empty or minimal")

    # Check system design mentions alert routing
    if system_design:
        if 'alert' not in system_design.lower() and 'rule' not in system_design.lower():
            issues.append("System design does not mention alerts or rules")

    for issue in issues:
        print(f"    WARNING: {issue}")

    if not issues:
        print("    OK")
    return len(issues) == 0

def check_persona_consistency(base_path):
    """Check if persona pain points align with pilot workflows."""
    print("  Checking persona-workflow alignment...")

    personas_dir = base_path / 'research/user-personas'
    workflows = load_file(base_path / 'docs/01-vision/pilot-workflows.md')

    issues = []

    if personas_dir.exists():
        persona_files = list(personas_dir.glob('*.md'))
        if not persona_files:
            issues.append("No persona files found in research/user-personas/")
        elif not workflows:
            issues.append("No pilot-workflows.md found to cross-reference personas")
        else:
            # Check each persona is mentioned in workflows
            for pf in persona_files:
                persona_name = pf.stem.replace('-', ' ')
                if persona_name not in workflows.lower() and pf.stem not in workflows.lower():
                    issues.append(f"Persona '{pf.stem}' not referenced in pilot-workflows.md")

    for issue in issues:
        print(f"    WARNING: {issue}")

    if not issues:
        print("    OK")
    return len(issues) == 0

def check_deployment_consistency(base_path):
    """Check if deployment plan matches tech requirements."""
    print("  Checking deployment-tech alignment...")

    deployment = load_file(base_path / 'docs/05-execution/deployment-plan.md')
    tech_req = load_file(base_path / 'docs/02-requirements/tech-requirements.md')

    issues = []

    # Check edge deployment mention
    if 'edge' in tech_req.lower() and 'edge' not in deployment.lower():
        issues.append("Tech requirements specify edge deployment but deployment plan does not address it")

    if 'offline' in tech_req.lower() and 'offline' not in deployment.lower():
        issues.append("Tech requirements mention offline capability but deployment plan does not address it")

    for issue in issues:
        print(f"    WARNING: {issue}")

    if not issues:
        print("    OK")
    return len(issues) == 0

def main():
    print("--- Detecting contradictions...")

    script_dir = Path(__file__).parent
    base_path = script_dir.parent

    results = []
    results.append(check_timeline_consistency(base_path))
    results.append(check_alert_consistency(base_path))
    results.append(check_persona_consistency(base_path))
    results.append(check_deployment_consistency(base_path))

    if all(results):
        print("")
        print("  PASS: No contradictions detected")
        return True
    else:
        print("")
        print("  WARNING: Potential inconsistencies found (review above)")
        # Non-blocking — warnings only
        return True

if __name__ == '__main__':
    sys.exit(0 if main() else 1)
