---
description: Implement the next phase's infrastructure (IaC, Ansible, or service bootstrap)
argument-hint: "<phase-number> <service-name> <task-summary>"
---
You are working in the current project repository.

## Goal

Implement the next real infrastructure step for Phase ${1} — ${2}.

${3}

This is an **implementation task**, not a documentation task.
Use the existing Phase ${1} docs as the source of truth.
Do not create new architecture docs unless a tiny clarification is absolutely necessary.

## Required Reading Before Edits

Read these files in order before making any changes:
1. `AGENTS.md` — directory roles, risk levels, validation requirements
2. `.ai/SAFE_OPERATIONS.md` — strict limitations
3. `.ai/TERRAFORM_RULES.md` and `.ai/STYLEGUIDE.md` — repo conventions
4. `.ai/KNOWLEDGE_SCHEMA.md` — frontmatter schema for docs
5. `docs/${1}/adr-*.md` — the ADR(s) for this phase
6. `docs/${1}/*.md` — the phase concept doc and runbook
7. The relevant existing code that this phase builds on:
   - `terraform/` — existing IaC patterns
   - `ansible/` — existing Ansible roles/playbooks
   - `gitops/`, `helm/` — existing Kubernetes patterns

## Step 1: Design (explain before coding)

Before writing any code, explain:
- Which existing files you will modify vs. which new files you will create
- How the new work fits the existing module/pattern structure
- Any secret/sensitive-value strategy (consistent with how other secrets are handled in this repo)
- Any ADR-level decisions you are making (document them explicitly)

## Step 2: Implement

Follow the exact same patterns as existing services in the repo.
Do not invent new architecture.

Key constraints:
- Follow all existing naming conventions exactly (read them from the existing code)
- Do not modify existing resources — only add new ones unless a fix is necessary
- Do not hardcode values that are already defined as variables elsewhere
- Every new resource must have a comment referencing the ADR or phase that introduced it
- Keep files small and reviewable

## Step 3: Validate

Run the applicable validation commands locally:
- **Terraform/OpenTofu**: `cd terraform/<provider> && tofu fmt && tofu validate`
- **Ansible**: `ansible-playbook playbooks/<playbook>.yml --syntax-check`
- **Python App**: `pytest tests/`
- **GitOps/Helm**: `helm lint helm/<chart>`

If any errors, fix them before presenting the result.

## Hard Boundaries

- Do not run `tofu apply`, `terraform apply`, or `scripts/deploy.sh`
- Do not create live infrastructure
- Do not commit real secrets or credentials
- Do not expand scope beyond what the phase docs define
- Do not contradict AGENTS.md or `.ai/` guidance

## Final Response

Summarize:
1. Every file created or modified (with path)
2. The design decisions made and why they fit existing patterns
3. Validation results (pass/fail)
4. What was intentionally left out
5. Explicit confirmation that no infrastructure was modified and no apply was executed
