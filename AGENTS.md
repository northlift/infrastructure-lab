# Agent Instructions (infrastructure-lab)

This is the entry point for coding agents in `infrastructure-lab` — Proxmox/AWS EKS, ArgoCD, OpenTofu, K3s, Cloudflare.

**Shared rules**: See `~/Projects/infrastructure/AGENTS.md` for common infrastructure rules (Design Before Code, ADR Convention, Commit Conventions, Final Response Format, Shared Known Pitfalls, Post-Mortem Loop, Shared Skills, Verification Checklist).

## Directory Roles & Risk Levels
- **`docs/` & `docs/phase*/`** (Read-Mostly): Contains architecture decisions (ADRs). Always read before modifying IaC.
- **`terraform/`** (High Risk): OpenTofu IaC (`aws`, `cloudflare`, `proxmox`). Requires `tofu validate`. Never auto-apply.
- **`gitops/` & `helm/`** (Medium Risk): Kubernetes/Target state. Use SealedSecrets for secrets. Manifest validation required.
- **`scripts/`** (Execution Risk): Helper scripts. Do not run `deploy.sh` unattended.
- **`./` (Root)**: Application code (FastAPI). Tests run via `pytest`.

## Mandatory Validation Commands
- **Terraform/OpenTofu**: `cd terraform/<provider> && tofu fmt && tofu validate`
- **Python App**: `pytest tests/`
- **GitOps/Helm**: `helm lint helm/<chart>`
- **Ansible**: `ansible-playbook playbooks/<playbook>.yml --syntax-check`

## ADR Convention

ADRs are phase-specific in this project:
- `docs/<phase>/adr-<NNN>-<slug>.md` following the format of existing ADRs
- Use YAML frontmatter matching `.ai/KNOWLEDGE_SCHEMA.md` (`doc_type: adr`)
- Status must be `Accepted and implemented in Phase <N>` (or `Accepted` if not yet implemented)
- Reference the ADR in code comments for every new resource it introduces

## Project-Specific Known Pitfalls

- **Trivy flags Python transitive deps despite OS package upgrades**: The Dockerfile runs `apt-get update && apt-get upgrade -y` to patch OS packages, but Python dependencies (via uv) can still have CRITICAL/HIGH CVEs in transitive deps like starlette. `uv lock` preserves existing versions — use `uv lock --upgrade-package <name>==X.Y.Z` to force the fix, or tighten the constraint in `pyproject.toml`.

## Project-Specific Skills

| Domain | Skill | Trigger |
|--------|-------|---------|
| ArgoCD Applications, SealedSecrets, Helm values, multi-cluster | `gitops-patterns` | Creating or modifying GitOps manifests |
