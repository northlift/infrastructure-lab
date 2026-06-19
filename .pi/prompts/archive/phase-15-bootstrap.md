You are working in the repository /home/excalt/Projects/infrastracture/infrastructure-lab.

Goal:
Implement the Forgejo service bootstrap on top of the already provisioned VM and the now-refined Ansible host-preparation layer.

This is an implementation task, not a documentation task.
Use the existing Phase 15 ADR, concept, runbook, OpenTofu scaffold, and Ansible foundation as the source of truth.
Do not create new architecture docs unless a tiny clarification is absolutely necessary.

Required reading before edits:
- AGENTS.md
- .ai/SAFE_OPERATIONS.md
- .ai/TERRAFORM_RULES.md
- .ai/STYLEGUIDE.md
- docs/phase15/adr-024-forgejo-second-brain-foundation.md
- docs/phase15/forgejo-second-brain.md
- docs/phase15/forgejo-second-brain-runbook.md
- terraform/proxmox/forgejo/*
- ansible/*
- any existing repo conventions for service runtime, Docker Compose, secrets handling, and config layout

Primary objective:
Bring Forgejo to a minimal but real working service state on the dedicated VM.

Critical requirement:
You must choose the database approach for this implementation and implement it consistently.
Do not leave the database choice ambiguous.

Database guidance:
- SQLite is acceptable if the goal is the simplest private low-to-moderate first deployment.
- PostgreSQL is the better choice if the service should be treated as a long-lived foundational platform component.
- Pick one and align all config, compose files, and bootstrap logic with that choice.
- If you choose SQLite, keep the implementation clean and leave a clear path to PostgreSQL later.
- If you choose PostgreSQL, keep it minimal and do not turn this into a broader database platform.

What to implement:
1. Add the Forgejo service runtime layer.
2. Add the Compose or equivalent runtime definition for Forgejo.
3. Add the chosen database configuration.
4. Add the persistent storage and configuration layout needed for the service.
5. Add the minimal bootstrap/config needed for Forgejo to start on the private VM.
6. Hook the service cleanly into the host-prep assumptions already introduced by Ansible.
7. Keep the service private/internal only.

What not to implement yet:
- No Cloudflare Tunnel / Access
- No Forgejo Actions runners
- No GitHub mirror automation
- No migration of existing GitHub repositories
- No public exposure
- No backup automation jobs beyond whatever minimal config is required for future backup readiness
- No unrelated platform expansion

Scope boundaries:
- OpenTofu provisions the VM
- Ansible prepares the host
- This step adds the Forgejo application runtime
- Keep those responsibilities separate and clear

Style and quality expectations:
- Keep files small and reviewable.
- Follow repo conventions rather than inventing new patterns.
- Prefer explicit config over hidden assumptions.
- Use placeholders for any environment-specific values that cannot be known yet.
- Do not overengineer the first service bootstrap.
- Do not add abstractions just to be abstract.

Secrets and config rules:
- Do not commit real secrets.
- If secrets or sensitive values are needed, follow the repo’s existing pattern or use placeholders clearly marked for later substitution.
- Do not invent a new secret-management system just for this step.

Validation:
- Run the relevant local validation for the touched files.
- For Compose: validate syntax and consistency as appropriate.
- For Ansible-related changes: syntax-check if touched.
- For IaC-related changes: format/validate if touched.
- Do not run apply/destroy/deploy commands.
- Do not touch live infrastructure.

Expected deliverable:
A minimal but real Forgejo service bootstrap implementation that runs on the dedicated VM and is aligned with the Phase 15 docs.

Final response:
- Summarize files changed.
- State the chosen database approach and why it fits this implementation.
- State what is intentionally left out.
- Report validation results.
- Explicitly confirm that no infrastructure was modified and no apply was executed.
