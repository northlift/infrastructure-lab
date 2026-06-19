---
description: Create a phase runbook for a documentation-only infrastructure phase
argument-hint: "<phase-number> <service-purpose> <service-slug>"
---

You are working in the current project repository.

## Goal

Create the `<phase-number>` runbook for `<service-purpose>`.

This is a **documentation-only task**.
Do not implement infrastructure yet.
Do not change any Terraform, Helm, Docker Compose, secrets, or deployment logic.

## Why This Task Matters

The repository has already accepted the architectural direction for `<phase-number>`. The runbook should make the future implementation path concrete enough that a later coding agent can act safely, but it must still stop short of implementation.

## Required Reading Before Edits

Read these files in order before making any changes:
1. `AGENTS.md` — directory roles, risk levels, validation requirements
2. `.ai/SAFE_OPERATIONS.md` — strict limitations
3. `.ai/TERRAFORM_RULES.md` and `.ai/STYLEGUIDE.md` — repo conventions
4. `.ai/KNOWLEDGE_SCHEMA.md` — frontmatter schema for docs
5. `docs/<phase-number>/adr-*.md` — the ADR for this phase (select the most relevant)
6. `docs/<phase-number>/<concept-filename>.md` — the phase concept document
7. `docs/index.md` and `mkdocs.yml` — existing doc structure and navigation
8. The most relevant earlier docs that explain the repo's infrastructure style (GitOps, Cloudflare, observability, progressive-delivery ADRs as applicable)

## Primary Task

1. Create `docs/<phase-number>/<service-slug>-runbook.md`.
2. Align the runbook with the ADR and concept doc.
3. Update navigation only if required for discoverability.
4. Use YAML frontmatter matching `.ai/KNOWLEDGE_SCHEMA.md` (`doc_type: phase-runbook`, correct `phase`, concise `summary`).
5. Keep the document practical, operational, and scoped to preparation only.

## Runbook Contents

Structure the runbook to cover, as applicable:

- **Purpose** — what the runbook is for and what it deliberately excludes.
- **Bootstrap sequence** — minimal steps to prepare the future deployment target.
- **Hosting expectations** — placement, rough sizing, storage, network.
- **OS/bootstrap expectations** — base OS, user/SSH/firewall, package baseline, runtime.
- **Service setup expectations** — app config boundaries, database/service dependencies, decision points that must be re-evaluated before deployment.
- **Backup and restore outline** — what must be backed up, how restore is validated, and the success criterion.
- **External mirror/bootstrap discipline** — if an external service is used temporarily, state that it is temporary and divergence must be avoided.
- **Explicit deferrals** — list features, integrations, and placements that are explicitly out of scope.
- **Validation checklist for the future implementation phase** — documentation review, backup/restore tests, configuration review. No direct apply instructions.

## Style Constraints

- Be conservative and explicit about non-goals.
- Do not add implementation code, secrets, sample credentials, or generic tutorials.
- Mirror the level of detail and structure used by the repo's existing phase runbooks.
- Use concise headings and short paragraphs.
- Avoid vague statements like "best practices" unless tied to a concrete repo rule.

## Critical Boundaries

- Documentation-only.
- No Terraform apply.
- No infrastructure provisioning.
- No Docker Compose implementation.
- No Helm charts.
- No secrets generation.
- No network/access tunnel setup.
- No runner setup.
- No migration of existing data yet.

## Validation

- If feasible and mkdocs is available, run `uv run mkdocs build --strict`.
- Do not run any live, apply, destroy, or deploy commands.
- If validation cannot be executed, state so plainly.

## Final Response

Summarize:
- Files changed and why
- Whether the runbook is aligned with the ADR and concept
- Validation result
- Explicit confirmation that no infrastructure was modified
