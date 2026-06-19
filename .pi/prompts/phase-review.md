---
description: Review and refine the last phase's implementation for correctness and consistency
argument-hint: "<phase-number> <area> [focus-description]"
---
You are working in the current project repository.

## Goal

Review and refine the Phase ${1} ${2} implementation.

${3}

This is a **review-and-correct task**, not a deployment task.
Do not provision infrastructure.
Do not execute live changes against any host.
Do not run apply/destroy commands.
Do not expand the Phase ${1} scope.

## Required Reading Before Edits

Read these files in order before making any changes:
1. `AGENTS.md` — directory roles, risk levels, validation requirements
2. `.ai/SAFE_OPERATIONS.md` — strict limitations
3. `.ai/TERRAFORM_RULES.md` and `.ai/STYLEGUIDE.md` — repo conventions
4. `docs/${1}/*` — all phase docs (ADR, concept, runbook)
5. The relevant implementation files:
   - `terraform/` — IaC for this phase
   - `ansible/` — playbooks/roles for this phase
   - `gitops/`, `helm/` — Kubernetes manifests if applicable
6. Any prompt templates or agent files that reference Phase ${1} filenames or workflow steps

## Primary Audit Questions

1. Do all file references point to the actual current filenames?
2. Do ADR, concept doc, and runbook agree on scope, boundaries, and deferred items?
3. Does the implementation match the documented intent?
4. Are there stale variables, dead code paths, duplicated config, or misleading comments?
5. Are there validation gaps that can be safely closed locally?
6. Are any prompts or docs now inaccurate because filenames or implementation details changed?
7. Are there obvious security hygiene issues in repo-visible files?

## Safe Fixes You May Make

- Correct wrong file references
- Remove dead variables or stale comments
- Tighten docs for accuracy where they conflict with implementation
- Improve consistency between docs and code
- Fix repo-local validation issues
- Improve wording around what is implemented vs deferred
- Add minimal clarification comments where they reduce future operator confusion

## Unsafe Actions

- No `tofu apply` or `terraform apply`
- No `ansible-playbook` against a live host
- No SSH to real infrastructure
- No secret rotation
- No architecture expansion
- No changes to live infrastructure

## Validation

Run only safe local validation relevant to touched files:
- `tofu fmt -check` / `tofu validate`
- `ansible-playbook --syntax-check`
- `ansible-lint` if appropriate
- Docs validation/build if available

Do not run anything that touches live infrastructure.

## Final Response

Summarize:
1. Current status: what is actually done vs not done
2. Files changed and why
3. Safe fixes applied
4. Issues found but intentionally left unresolved
5. Validation results
6. Explicit confirmation that no infrastructure was modified, no live hosts were touched, and no apply commands were executed
