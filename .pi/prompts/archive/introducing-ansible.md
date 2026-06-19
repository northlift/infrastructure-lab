You are working in the repository /home/excalt/Projects/infrastracture/infrastructure-lab.

Goal:
Introduce Ansible into the repository in the smallest useful way for Phase 15, so it becomes the configuration-management layer for the future Forgejo VM.

This is an implementation task.
Do not create broad new architecture docs unless a tiny clarification is absolutely necessary.
Use the existing Phase 15 docs and the current Forgejo VM OpenTofu scaffold as the source of truth.

Required reading before edits:
- AGENTS.md
- .ai/SAFE_OPERATIONS.md
- .ai/TERRAFORM_RULES.md
- .ai/STYLEGUIDE.md
- .ai/KNOWLEDGE_SCHEMA.md
- docs/phase15/adr-024-forgejo-second-brain-foundation.md
- docs/phase15/forgejo-second-brain.md
- docs/phase15/forgejo-second-brain-runbook.md
- terraform/proxmox/forgejo/*
- any existing repo conventions for automation, scripts, naming, folder layout, inventory, secrets handling, or bootstrap logic

Primary objective:
Add a minimal Ansible structure that is clearly useful for Phase 15 and fits the repo’s style.

What Ansible should cover in this step:
- Basic host bootstrap for the Forgejo VM only.
- Prepare the VM for future Forgejo deployment.
- Focus on OS-level configuration and prerequisites, not the application itself.

Scope for this step:
1. Add an `ansible/` structure that is simple, reviewable, and extensible.
2. Add inventory/group vars/host vars only if they are truly useful and consistent with repo style.
3. Add one minimal playbook for the Forgejo VM.
4. Add only the roles or task files needed for:
   - package baseline
   - non-root administrative/service user expectations
   - SSH hardening baseline
   - firewall baseline
   - Docker installation / runtime preparation
   - Forgejo data/config directory preparation
5. Keep the result generic enough to be maintainable, but clearly motivated by the Forgejo Phase 15 use case.

Out of scope for this step:
- No Forgejo application deployment yet
- No Docker Compose service definition yet
- No Cloudflare Tunnel / Access
- No Forgejo Actions runners
- No backup automation jobs yet
- No GitHub mirroring automation
- No broad multi-host orchestration
- No unrelated Ansible abstractions

Important design constraints:
- The Forgejo VM is outside K3s.
- Initial access is private/internal only.
- Remote access is deferred.
- The Ansible layer should complement the existing OpenTofu VM scaffold, not replace it.
- Keep the separation of concerns clear:
  - OpenTofu provisions the VM
  - Ansible configures the host
  - application deployment comes later

Preferred structure:
Choose the smallest reasonable Ansible structure for a repo that is just starting to adopt Ansible.
Avoid overengineering.
Do not create a giant role hierarchy unless the repo already strongly suggests that pattern.

Good direction:
- `ansible/README.md` only if truly useful
- `ansible/inventory/`
- `ansible/playbooks/forgejo-vm.yml`
- `ansible/roles/common/`
- `ansible/roles/docker/`
- `ansible/roles/forgejo_host/`
But only create what is genuinely needed.

Secrets handling:
- Do not commit real secrets.
- If variables are needed, use placeholders or clearly named defaults.
- If the repo does not yet have a secrets-management pattern for Ansible, keep it simple and explicit rather than inventing a complex vault workflow now.

Host bootstrap expectations:
The resulting playbook/roles should prepare the VM for a later Forgejo deployment by ensuring:
- baseline packages are present
- Docker is installed and enabled
- required directories exist with sane ownership/permissions
- SSH and firewall baseline are applied conservatively
- no public exposure is introduced

Quality bar:
- Small and reviewable.
- Idempotent where practical.
- Clear separation between present scope and future scope.
- No generic fluff.
- No “kitchen sink” Ansible framework.

Validation:
- Run relevant local validation if feasible, such as:
  - `ansible-playbook --syntax-check ...`
  - `ansible-lint` if available and appropriate
- Keep validation honest: if tooling is missing, report that clearly.
- Do not run changes against a live host.
- Do not apply live infrastructure changes.

Expected deliverable:
A minimal but real Ansible foundation that prepares the Forgejo VM host and establishes the repo’s initial Ansible pattern.

Final response:
- Summarize files created or changed.
- Explain the chosen Ansible structure and why it is intentionally minimal.
- State what is intentionally left out.
- Report validation results.
- Explicitly confirm that no infrastructure was modified and no live host changes were executed.
