# Sangati Discovery — Guardrails & Quality Gates

This document defines the semantic, structural, and executability constraints
that govern every deliverable in this discovery phase. All contributors
(human and AI) MUST comply.

---

## Semantic & Terminology Constraints

### Required terminology (use these exact terms):
- "Service pressure" not "stress" or "load"
- "Orchestration" not "automation" or "management"
- "Alert" not "notification" or "message" (unless system-level)
- "Floor server" not "waiter" or "waitress"
- "Table state" not "table status"
- "Blob detection" not "object detection" or "people counting"
- "Edge deployment" not "on-premise" or "local installation"
- "Rules engine" not "decision engine" or "logic layer"

### Forbidden terms (never use):
- "AI-powered" or "smart" (too vague)
- "Surveillance" or "monitoring" (privacy red flag)
- "Facial recognition" or "identity tracking"
- "Predictive analytics" (not our approach)
- "Big data" or "insights" (meaningless buzzwords)

### Naming conventions:
- File names: kebab-case (e.g., `manager-rush-dashboard.mmd`)
- Code variables: camelCase (e.g., `alertSeverity`)
- Database tables: snake_case (e.g., `table_states`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_ALERT_COOLDOWN`)

---

## N=1 Principle (Single Source of Truth)

- Alert taxonomy MUST be defined ONCE in `prototypes/alert-taxonomy/taxonomy.schema.json`
- All other docs reference this file, never duplicate alert definitions
- System architecture diagram MUST be defined ONCE in `docs/03-architecture/system-design.md`
- All persona goals/pains MUST cite back to persona files in `research/user-personas/`
- No contradictions allowed: if roadmap says "Week 3: CCTV integration" then tech-requirements MUST specify CCTV needs

### Cross-reference format:
When referencing other docs, use:
> See `[relative/path/to/file.md#section-header]` for details.

### Contradiction detection:
Before finalizing, run self-check:
1. Does alert-taxonomy match system-design's "rules engine" section?
2. Do persona pain points match pilot-workflows triggers?
3. Does roadmap timeline match tech-requirements complexity?
4. Does MVP scope match deployment-plan assumptions?

Flag any conflicts in a `CONFLICTS.md` file if found.

---

## Executability Requirements

Every deliverable MUST pass these tests:

### Documents:
- [ ] Has "DECISIONS NEEDED" section at end (if any ambiguity exists)
- [ ] Has measurable acceptance criteria (not "improve UX" but "reduce alert response time from 45s to <15s")
- [ ] Cites sources (file path + section) for all factual claims
- [ ] No generic statements like "we should consider" — only concrete specifications

### Code:
- [ ] `npm install` runs without errors
- [ ] `npm test` passes all tests
- [ ] `npm run demo` produces visible output
- [ ] Every function has TypeScript types (no `any`)
- [ ] Every rule has a test case

### Schemas:
- [ ] Valid JSON (validate with `jq . file.json`)
- [ ] Matches declared JSON Schema
- [ ] Has at least 3 example instances

### Diagrams (Mermaid):
- [ ] Renders in VS Code Mermaid extension
- [ ] Has title and legend
- [ ] All nodes have labels
- [ ] No orphaned nodes

---

## Quality Gates

### Gate 1: Structural Completeness (automated)
- All required files exist
- All required sections present
- No empty files

### Gate 2: Semantic Correctness (automated + manual)
- Terminology matches constraints
- No forbidden terms
- Naming conventions followed

### Gate 3: Code Quality (automated)
- Tests pass
- Demo runs
- No `any` types
- All functions documented

### Gate 4: Internal Consistency (automated + manual)
- Cross-references valid
- No contradictions detected
- Alert taxonomy <-> system design aligned

### Gate 5: Executability (manual)
- Can you explain the system design to a developer?
- Can a restaurant manager understand the personas?
- Can you deploy following the deployment plan?

---

## Validation

Run the full validation suite:
```bash
cd sangati-discovery && ./scripts/validate-all.sh
```

See `scripts/` directory for individual validators.
