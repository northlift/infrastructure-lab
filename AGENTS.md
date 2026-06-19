# Agent Instructions (infrastructure-lab)

This is the entry point for coding agents in `infrastructure-lab` (Proxmox/AWS EKS, ArgoCD, OpenTofu, K3s, Cloudflare).

## Directory Roles & Risk Levels
- **`docs/` & `docs/phase*/`** (Read-Mostly): Contains architecture decisions (ADRs). Always read before modifying IaC.
- **`terraform/`** (High Risk): OpenTofu IaC (`aws`, `cloudflare`, `proxmox`). Requires `tofu validate`. Never auto-apply.
- **`gitops/` & `helm/`** (Medium Risk): Kubernetes/Target state. Use SealedSecrets for secrets. Manifest validation required.
- **`scripts/`** (Execution Risk): Helper scripts. Do not run `deploy.sh` unattended.
- **`./` (Root)**: Application code (FastAPI). Tests run via `pytest`.

## Mandatory Validation Commands
Before presenting changes, an agent MUST run the applicable validation commands locally:
- **Terraform/OpenTofu**: `cd terraform/<provider> && tofu fmt && tofu validate`
- **Python App**: `pytest tests/`
- **GitOps/Helm**: `helm lint helm/<chart>`
- **Ansible**: `ansible-playbook playbooks/<playbook>.yml --syntax-check`

## First Steps
1. Read `README.md` and relevant `docs/phase*/adr-*.md`.
2. Check `.ai/SAFE_OPERATIONS.md` for strict limitations.
3. Check `.ai/TERRAFORM_RULES.md` and `.ai/STYLEGUIDE.md`.

## Design Before Code
For every implementation task, explain before writing code:
- Which existing files you will modify vs. which new files you will create
- How the new work fits the existing module/pattern structure
- Any secret/sensitive-value strategy
- Any ADR-level decisions being made

## ADR Convention
When a task requires an architectural decision:
- Create `docs/<phase>/adr-<NNN>-<slug>.md` following the format of existing ADRs
- Use YAML frontmatter matching `.ai/KNOWLEDGE_SCHEMA.md` (`doc_type: adr`)
- Status must be `Accepted and implemented in Phase <N>` (or `Accepted` if not yet implemented)
- Reference the ADR in code comments for every new resource it introduces

## Final Response Format
Every task must end with:
1. Every file created or modified (with path)
2. Validation results (pass/fail, any errors)
3. What was intentionally left out and why
4. Any assumptions made
5. For non-apply tasks: explicit confirmation that no infrastructure was modified, no live hosts were touched, and no apply commands were executed

## Known Pitfalls

These issues have caused real incidents. Check for them proactively:

- **Cloud-Init override**: When using a custom `user_data_file_id` snippet on a Proxmox VM, the `user_account` block is silently dropped. Put all user/key config in the snippet itself.
- **Docker root trap**: Docker daemon creates missing bind mount directories as `root:root`. Pre-create all host directories with correct ownership before starting unprivileged containers.
- **`internal: true` on Docker networks**: Silently disables all port publishing. Use `127.0.0.1:PORT:PORT` loopback binding instead for host-only exposure.
- **Ansible callback deprecation**: `stdout_callback = yaml` is a legacy alias that routes to the removed `community.general.yaml` plugin. Use `stdout_callback = default`.
- **SSH host key mismatch**: After destroying and recreating a VM at the same IP, run `ssh-keygen -R <VM_IP>` on the operator machine before reconnecting.
- **Proxmox disk format**: `local-lvm` requires `file_format = "raw"`. The default `qcow2` causes allocation errors.
- **Proxmox state corruption**: Interrupting `tofu apply` during disk/VM allocation desyncs state. Manually purge zombie resources + `tofu state rm` before retrying.

## Post-Mortem Feedback Loop

When a new post-mortem is added to `docs/<phase>/`:
1. Review `.pi/skills/` — update any skill whose Common Issues or patterns are affected
2. Review `AGENTS.md` Known Pitfalls — add new pitfalls or update existing ones
3. Ensure the lesson is encoded as a proactive check, not just a historical record

The goal: every incident makes the agent smarter. Post-mortems are the raw material; skills and pitfalls are where lessons become enforceable.

## When to Load Skills

Load the relevant skill **before** starting work in these domains:

| Domain | Skill | Trigger |
|--------|-------|---------|
| Proxmox VMs, Cloud-Init, OpenTofu `bpg/proxmox` | `proxmox-iac` | Creating or modifying Proxmox VM IaC |
| Docker Compose, bind mounts, container networking on Ansible VMs | `docker-ansible` | Deploying or troubleshooting Docker services via Ansible |
| Ansible roles, playbooks, inventory, `ansible.cfg` | `ansible-patterns` | Creating or modifying any Ansible code |
| ArgoCD Applications, SealedSecrets, Helm values, multi-cluster | `gitops-patterns` | Creating or modifying GitOps manifests |
| Cloudflare Tunnel, Access policies, cloudflared deployment | `cloudflare-tunnel` | Adding a service to Cloudflare Tunnel or deploying cloudflared |

If a task spans multiple domains, load all applicable skills.

## Verification Checklist
Before finishing your turn, check:
- [ ] Were changes scoped to existing patterns without inventing new architecture?
- [ ] Were validation commands (`tofu validate`, `pytest`) executed without errors?
- [ ] Are secrets managed securely (SealedSecrets or `.tfvars`) without hardcoding?
- [ ] Is `.ai/SAFE_OPERATIONS.md` respected (no unprompted `apply` or destructive operations)?
