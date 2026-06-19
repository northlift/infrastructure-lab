You are working in the repository /home/excalt/Projects/infrastracture/infrastructure-lab.

Goal:
Audit the current state of Phase 15 end-to-end, identify inconsistencies or low-risk implementation issues, and apply safe repo-local fixes where necessary.

This is a review-and-correct task, not a deployment task.
Do not provision infrastructure.
Do not execute live Ansible changes against any host.
Do not run apply/destroy commands.
Do not expand the Phase 15 scope.

Context:
Phase 15 introduces Forgejo as a private self-hosted Git service on a dedicated Proxmox VM outside K3s.
The repo already contains:
- ADR
- concept doc
- runbook
- OpenTofu scaffold for the Forgejo VM
- Ansible host-prep layer
- Forgejo service bootstrap using Docker Compose and SQLite
A prior refinement pass already fixed health-check logic, SSH port mapping consistency, and UID/GID alignment.

Your job:
1. Determine the true current state of Phase 15 in the repository.
2. Check whether the docs, prompts, OpenTofu scaffold, Ansible inventory/playbooks/roles, and Forgejo service templates are internally consistent.
3. Apply only safe, reviewable fixes that improve correctness, clarity, and deployment readiness.
4. Leave all live infrastructure untouched.

Required reading before edits:
- AGENTS.md
- .ai/SAFE_OPERATIONS.md
- .ai/TERRAFORM_RULES.md
- .ai/STYLEGUIDE.md
- docs/phase15/*
- terraform/proxmox/forgejo/*
- ansible/*
- any prompt templates or agent files that reference Phase 15 filenames or workflow steps
- README.md and docs/index.md if they reference Phase 15

Primary audit questions:
1. Do all Phase 15 file references point to the actual current filenames?
2. Do ADR, concept doc, and runbook agree on:
   - private-only initial access
   - dedicated VM outside K3s
   - Docker Compose runtime
   - deferred Cloudflare / runners / migration / public exposure
   - backup/restore as a reliability gate
3. Does the OpenTofu scaffold still match the documented intent?
4. Does the Ansible layer match the docs and current Forgejo bootstrap?
5. Are there stale variables, dead code paths, duplicated config, or misleading comments?
6. Are there validation gaps that can be safely closed locally?
7. Are any prompts or docs now inaccurate because filenames or implementation details changed?
8. Are there any obvious security hygiene issues in repo-visible files or references that should be corrected without rotating real credentials?

Safe fixes you may make:
- Correct wrong file references
- Remove dead variables or stale comments
- Tighten docs for accuracy where they conflict with implementation
- Improve consistency between docs and code
- Fix repo-local validation issues
- Improve wording around what is implemented vs deferred
- Add minimal clarification comments where they reduce future operator confusion

Unsafe actions you must not take:
- No `tofu apply`
- No `terraform apply`
- No `ansible-playbook` against a live host
- No SSH to real infrastructure
- No secret rotation
- No Cloudflare changes
- No GitHub mirror setup
- No backup job creation on real hosts
- No architecture expansion

Validation expectations:
Run only safe local validation relevant to touched files, for example:
- `tofu fmt -check`
- `tofu validate`
- `ansible-playbook --syntax-check`
- `ansible-lint` if appropriate
- docs validation/build if the repo uses it and it is safe to run locally
Do not run anything that touches live infrastructure.

Expected output:
- Current Phase 15 status: what is actually done vs not done
- Files changed
- Safe fixes applied
- Issues found but intentionally left unresolved
- Validation results
- Explicit confirmation that no infrastructure was modified, no live hosts were touched, and no apply commands were executed

Important:
If the repo reveals that some earlier prompts referenced wrong filenames, fix those references.
If the docs and implementation disagree, prefer correcting the repo toward the current approved Phase 15 intent rather than inventing a new direction.
Keep changes minimal, surgical, and easy to review.
