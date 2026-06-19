You are working in the repository /home/excalt/Projects/infrastracture/infrastructure-lab.

Goal:
Review and tighten the newly added Forgejo service bootstrap so it is correct, minimal, and ready for the next phase without expanding scope.

This is a refinement task, not a new feature task.
Do not add Cloudflare, runners, GitHub mirroring, or public exposure.
Do not change the architecture unless a small correction is necessary.

Current architecture to preserve:
- OpenTofu provisions the dedicated Forgejo VM.
- Ansible prepares the host.
- Forgejo runs as the application service on the VM.
- The current bootstrap uses SQLite and private-only access.
- The service is intentionally not publicly exposed yet.

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
- the newly added Forgejo role, templates, and inventory variables

Primary task:
Critically review the Forgejo bootstrap implementation and make only the smallest necessary changes so the service layer is operationally coherent and aligned with the Phase 15 docs.

What to check:
1. Is the Docker Compose layout minimal and sensible for a single private VM?
2. Are the volume mount paths and ownership assumptions correct?
3. Does the SQLite setup match Forgejo’s supported configuration?
4. Is the `app.ini` aligned with the private-only model?
5. Is the loopback-only exposure intentional and clearly documented in the config?
6. Are health checks checking something meaningful?
7. Are inventory/group vars free of dead or redundant values?
8. Are any variables premature, duplicated, or unused?
9. Does the result leave a clean path to a later PostgreSQL migration if needed?
10. Is the current layout consistent with the repo’s minimal, reviewable style?

What to improve if needed:
- Tighten config clarity
- Remove unnecessary variables
- Fix inconsistent defaults
- Adjust paths or ownership if they are awkward
- Simplify templates if they have unnecessary indirection
- Improve comments only where they clarify the private/bootstrap nature
- Make sure the implementation is still small and easy to review

What must remain out of scope:
- No Cloudflare Tunnel / Access
- No runners
- No GitHub mirror automation
- No migration tooling
- No backup automation jobs
- No public DNS or public exposure
- No unrelated orchestration changes

Validation:
- Run the relevant local validation for any touched files.
- For Ansible: `ansible-playbook --syntax-check` and `ansible-lint` if relevant.
- For Compose/config changes: validate syntax and consistency as appropriate.
- Do not run any apply, deploy, or destructive commands.
- Do not touch live infrastructure.

Expected output:
- A short summary of what was tightened or kept as-is.
- A clear explanation of any corrections made for correctness or future compatibility.
- Validation results.
- Explicit confirmation that no infrastructure was modified and no live host changes were executed.
