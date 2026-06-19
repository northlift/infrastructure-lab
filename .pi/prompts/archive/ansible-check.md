You are working in the repository /home/excalt/Projects/infrastracture/infrastructure-lab.

Goal:
Review and refine the newly added Ansible foundation for Phase 15 so it is minimal, correct, and genuinely useful for preparing the future Forgejo VM host.

This is an implementation refinement task.
Do not broaden scope.
Do not add Forgejo application deployment yet.
Do not add new architecture docs unless a tiny clarification is absolutely necessary.

Important context:
- The repository now has:
  - Phase 15 documentation (ADR, concept, runbook)
  - an OpenTofu scaffold for the Forgejo Proxmox VM
  - a newly created `ansible/` structure for Phase 15 host preparation
- The desired architecture is:
  - OpenTofu provisions the VM
  - Ansible configures the host
  - Forgejo service deployment comes later
- Initial access is private/internal only.
- Cloudflare access is deferred.
- Forgejo Actions runners are deferred.
- Quality and maintainability matter more than speed or breadth.

Required reading before edits:
- AGENTS.md
- .ai/SAFE_OPERATIONS.md
- .ai/TERRAFORM_RULES.md
- .ai/STYLEGUIDE.md
- docs/phase15/adr-024-forgejo-second-brain-foundation.md
- docs/phase15/forgejo-second-brain.md
- docs/phase15/forgejo-second-brain-runbook.md
- terraform/proxmox/forgejo/*
- ansible/**

Primary task:
Critically review the current Ansible structure and make only the smallest necessary changes so it becomes a strong Phase 15 host-bootstrap layer.

What to evaluate:
1. Is the Ansible structure too large or too abstract for the repo’s current maturity?
2. Are any roles/tasks unnecessary at this stage?
3. Is the separation of concerns clear?
   - OpenTofu provisions the VM
   - Ansible prepares the host
   - Forgejo application deployment is not implemented yet
4. Does the Ansible content align with the Phase 15 runbook?
5. Are there hidden implementation assumptions that should be turned into variables or removed?
6. Is the result understandable and reviewable for a human maintainer?

What this step should preserve or improve:
- Baseline package preparation
- Conservative SSH hardening baseline
- Firewall baseline
- Docker installation/runtime preparation
- Forgejo host directory preparation
- Minimal, clear inventory/playbook structure
- Idempotent behavior where practical

What this step must NOT do:
- No Forgejo application deployment
- No Docker Compose app stack yet
- No Cloudflare configuration
- No runner setup
- No backup automation jobs
- No GitHub mirror automation
- No unrelated multi-host abstractions
- No “enterprise framework” expansion

What to change if needed:
- Simplify role structure if it is overengineered
- Reduce abstraction if variables/roles are premature
- Improve naming and layout if it does not match repo style
- Add or adjust comments only where they clarify scope boundaries
- Keep the result small and easy to review

Validation:
- Run `ansible-playbook --syntax-check` where feasible
- Run `ansible-lint` if available and useful
- Report clearly if tooling is unavailable
- Do not execute against a live host
- Do not modify live infrastructure

Final response:
- Summarize files changed
- State whether the Ansible structure was simplified, kept, or lightly adjusted
- Explain the biggest issues found
- Report validation results
- Explicitly confirm that no live host changes were executed and no infrastructure was modified
