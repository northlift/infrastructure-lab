---
description: Create a detailed implementation plan for an infrastructure documentation task
argument-hint: "<task description>"
---
You are working in the current project repository. Read the repository's AGENTS.md and `ai/` guidance files first.

## Goal

$@

## Required Reading Before Edits

Read these files in order before making any changes:
1. `AGENTS.md` — directory roles, risk levels, validation requirements
2. `.ai/SAFE_OPERATIONS.md` — strict limitations
3. `.ai/TERRAFORM_RULES.md` and `.ai/STYLEGUIDE.md`
4. `.ai/KNOWLEDGE_SCHEMA.md` — frontmatter schema for docs
5. `docs/index.md` and `mkdocs.yml` — existing doc structure and navigation
6. The most recent 2–3 ADRs and phase concept docs to mirror tone and specificity

## Hard Rules

- Follow existing patterns. Do not invent new architecture.
- Never contradict AGENTS.md or `ai/` guidance.
- Prefer small, reviewable changes.
- Do not run destructive or irreversible operations unprompted.

## Validation

Before presenting changes, run the applicable validation from AGENTS.md:
- **Docs**: `cd <project_root> && uv run mkdocs build --strict` (if available)
- **Terraform/OpenTofu**: `cd terraform/<provider> && tofu fmt && tofu validate`
- **Python App**: `pytest tests/`
- **GitOps/Helm**: `helm lint helm/<chart>`

## Final Response

Summarize:
- Files changed and why
- Validation results (pass/fail, any errors)
- What was NOT modified and why
- Any assumptions you had to make
