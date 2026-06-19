You are working in the repository /home/excalt/Projects/infrastracture/infrastructure-lab.

Goal:
Implement the first real IaC step for Phase 15 by creating an OpenTofu scaffold for the future Forgejo Proxmox VM.

This is NOT a documentation task.
Use the existing Phase 15 docs as the source of truth.
Do not create new architecture docs unless a tiny clarification is absolutely necessary.

Primary objective:
Create the smallest useful, reviewable OpenTofu scaffold that prepares a dedicated Proxmox VM definition for Forgejo, aligned with the accepted Phase 15 ADR, concept, and runbook.

Required reading before edits:
- AGENTS.md
- .ai/SAFE_OPERATIONS.md
- .ai/TERRAFORM_RULES.md
- .ai/STYLEGUIDE.md
- .ai/KNOWLEDGE_SCHEMA.md
- docs/phase15/adr-024-forgejo-second-brain-foundation.md
- docs/phase15/forgejo-second-brain.md
- docs/phase15/forgejo-second-brain-runbook.md
- relevant existing Terraform/OpenTofu structure in the repo, especially under:
  - terraform/
  - terraform/proxmox/
  - terraform/aws/
  - terraform/cloudflare/
- any repo conventions for variables, outputs, provider files, naming, formatting, and directory layout

Task:
Create the initial OpenTofu scaffold for a dedicated Forgejo VM on Proxmox.

What to implement:
1. Add a new Phase 15-oriented Proxmox IaC structure in the repo that fits existing Terraform/OpenTofu conventions.
2. Define the minimal provider and module/root structure needed for a future Forgejo VM.
3. Add variables, locals, and placeholder resource definitions as appropriate.
4. Model only the VM layer for now.
5. Do not implement Forgejo application deployment yet.
6. Do not implement Cloudflare, remote access, runners, backup jobs, or repo migration.
7. Keep the code intentionally incomplete where real environment-specific values are not yet known, but structure it so a later step can safely continue.

Implementation intent:
The result should be a scaffold that:
- is syntactically clean,
- reflects repo conventions,
- is aligned with the Phase 15 docs,
- is ready for later expansion,
- and can be reviewed without risk of accidental deployment.

What the scaffold should include:
- Proxmox provider setup following the repo’s existing style and best current practice.
- A dedicated root/module or equivalent structure for the Forgejo VM, depending on how this repo already organizes Proxmox code.
- Variables for:
  - Proxmox node / target
  - VM name
  - VM ID if the repo convention expects explicit IDs
  - template or image reference
  - CPU
  - memory
  - disk size
  - storage target
  - network bridge
  - IP configuration if the repo convention already supports this
- Reasonable locals or naming helpers if that matches repo style.
- Output(s) only if they are useful and consistent with existing repo patterns.

Important architecture constraints from Phase 15:
- Dedicated Proxmox VM.
- Outside K3s.
- Initial access is private/internal only.
- Cloudflare Tunnel / Access is deferred.
- Forgejo Actions runners are deferred.
- GitHub mirror/bootstrap path is temporary and not part of this IaC step.
- This step is VM scaffolding only, not service deployment.

Hard boundaries:
- Do not run `tofu apply` or `terraform apply`.
- Do not create live infrastructure.
- Do not add Docker Compose files yet.
- Do not add Ansible yet unless the repo already has an established provisioning pattern that absolutely requires a placeholder hook.
- Do not add secrets.
- Do not commit credentials or tokens.
- Do not invent environment-specific values that are not supported by the repo context.
- If some values are unknown, expose them as variables with clear names and safe descriptions.

Provider guidance:
- Prefer the Proxmox provider approach that best matches the repo’s current direction and maintainability.
- If the repo already uses a Proxmox provider or has an obvious preferred provider convention, follow that.
- If the provider choice is not yet established, make the smallest reviewable choice and state it clearly in the final summary.
- Use API-token-oriented assumptions rather than username/password if credentials need to be modeled, but do not provide real values. Using dedicated API tokens is a documented best practice for Proxmox automation. [web:374][web:444]

Code quality expectations:
- Follow existing repo structure and naming conventions.
- Keep the scaffold minimal.
- Prefer explicit variables over hidden assumptions.
- Add comments only where they clarify intentional incompleteness.
- Keep files small and reviewable.
- Do not overengineer the first pass.

Validation:
1. Run formatting and validation steps that are already standard in the repo, such as:
   - `tofu fmt -recursive`
   - `tofu validate`
   if they are feasible in the relevant directories.
2. If initialization is required for validation, do it only as needed and report clearly what was or was not possible.
3. Do not run any apply/destroy/deploy commands.
4. If validation cannot fully run because of missing provider/plugins/environment, say so clearly.

Expected deliverable:
A minimal but real OpenTofu scaffold for the future Forgejo VM that the next implementation step can build on.

Final response:
- Summarize files created or changed.
- Explain the chosen structure and why it matches the repo.
- State what is intentionally left out.
- Report formatting/validation results.
- Explicitly confirm that no infrastructure was modified and no apply was executed.
