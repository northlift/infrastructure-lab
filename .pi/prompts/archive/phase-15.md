You are working in the repository /home/excalt/Projects/infrastracture/infrastructure-lab.

Goal:
Create the Phase 15 runbook for the Forgejo + Second Brain foundation.

This is a documentation-only task.
Do not implement infrastructure yet.
Do not change any Terraform, Helm, Docker Compose, secrets, or deployment logic.

Why this task matters:
The repository has already accepted the architectural direction for Phase 15:
- Forgejo runs on a dedicated Proxmox VM outside K3s.
- Cloudflare Tunnel / Access is deferred.
- GitHub remains a temporary bootstrap/mirror path until Forgejo backup and restore are proven.
- Forgejo Actions runners are deferred.
- The database choice is intentionally policy-driven, not dogmatic.

The runbook should make the future implementation path concrete enough that a later coding agent can act safely, but it must still stop short of implementation.

Required reading before edits:
- AGENTS.md
- .ai/SAFE_OPERATIONS.md
- .ai/TERRAFORM_RULES.md
- .ai/STYLEGUIDE.md
- .ai/KNOWLEDGE_SCHEMA.md
- docs/phase15/adr-024-forgejo-second-brain-foundation.md
- docs/phase15/forgejo-second-brain.md
- docs/index.md
- mkdocs.yml
- the most relevant earlier docs that explain the repo’s infrastructure style, especially the GitOps / Cloudflare / observability / progressive-delivery ADRs

Primary task:
1. Create `docs/phase15/forgejo-second-brain-runbook.md`.
2. Make sure the runbook is clearly aligned with the ADR and concept doc.
3. Update navigation only if required for discoverability.
4. Use YAML frontmatter that matches `ai/KNOWLEDGE_SCHEMA.md`.
5. Keep the document practical, operational, and scoped to Phase 15 preparation only.

What the runbook should contain:
- Purpose of the runbook.
- A concrete, minimal bootstrap sequence for the future Forgejo VM.
- VM expectations at a high level:
  - Proxmox placement
  - rough sizing assumptions
  - persistent storage expectations
  - network expectations
- OS/bootstrap expectations:
  - base OS assumptions
  - user / SSH / firewall / package baseline
  - runtime choice for Forgejo service
- Service setup expectations:
  - Forgejo app config boundaries
  - database decision handling:
    - SQLite acceptable for a small/private start
    - PostgreSQL preferred if the operator expects heavy CI, more users, or long-term criticality
  - note how the DB choice is to be revisited before actual deployment if conditions change
- Backup and restore outline:
  - what must be backed up
  - how restore is validated
  - what counts as a successful restore test
- GitHub bootstrap/mirror discipline:
  - treat GitHub as temporary support until recovery is proven
  - avoid silent divergence between GitHub and Forgejo
- Explicit deferrals:
  - no Cloudflare Tunnel/Access yet
  - no Forgejo Actions runners yet
  - no K3s placement
  - no public exposure
- Validation checklist for the future implementation phase:
  - documentation review
  - backup test
  - restore test
  - configuration review
  - no direct apply instructions yet

Important style constraints:
- Keep it actionable and repo-specific.
- Be conservative and explicit about non-goals.
- Do not add implementation code.
- Do not add secrets or sample credentials.
- Do not write a generic tutorial.
- Mirror the level of detail and structure used by the repo’s existing phase runbooks.
- Use concise headings and short paragraphs.
- Avoid vague statements like “best practices” unless tied to a concrete repo rule.

Critical boundaries:
- Documentation-only.
- No Terraform apply.
- No infrastructure provisioning.
- No Docker Compose implementation.
- No Helm charts.
- No secrets generation.
- No Cloudflare Access/Tunnel setup.
- No runner setup.
- No migration of repos yet.

Database guidance:
- The runbook must not present SQLite vs PostgreSQL as a simple preference toggle.
- It should say:
  - SQLite is operationally attractive for an initial private, low-to-moderate Forgejo instance.
  - PostgreSQL should be chosen before deployment if the service is expected to become CI-heavy, multi-user, or operationally central.
  - The decision must be re-evaluated before deployment if the intended usage changes.
- Keep the guidance practical, not philosophical.

Backup/restore guidance:
- Emphasize configuration, repositories, attachments, and database.
- State that a restore is only “proven” if the service can be restored to a usable state, not merely if files exist.
- Include a simple success criterion for restore validation.

GitHub mirror/bootstrap discipline:
- State that GitHub is temporary support during the proving period.
- State that mirror discipline is required to avoid divergence.
- Do not suggest permanent dual-writer complexity.

Validation:
- If feasible, run `uv run mkdocs build --strict`.
- Do not run any live infrastructure commands.
- Do not run apply/destroy/deploy commands.
- If validation cannot be executed, say so plainly.

Final response:
- Summarize files changed.
- State whether the runbook is aligned with the ADR and concept.
- State validation result.
- Explicitly confirm that no infrastructure was modified.
