# Repository Styleguide

## GitOps & Kubernetes (`gitops/`, `helm/`)
- **ArgoCD Apps**: Keep application definitions strictly in `gitops/apps/`.
- **Helm**: Local charts go in `helm/`. Values overrides go in `gitops/`.
- **Names**: Use `kebab-case` for Kubernetes resource names, Helm releases, and directories.
- **Secrets**: NEVER commit plain text secrets. Use Sealed Secrets (`generate_phase14_sealed_secrets.sh` or `kubeseal`).

## OpenTofu / Terraform (`terraform/`)
- Reference existing patterns from `terraform/aws`, `terraform/proxmox`, `terraform/cloudflare`.
- Keep states separated by provider. Do not introduce cross-provider states.

## Application Code (Python/FastAPI)
- Root files (`app.py`, `models.py`, `schemas.py`) form the FastAPI backend.
- Database migrations belong in `alembic/versions/`. Use Alembic commands to generate them; do not write manually if preventable.
- Validate app logic with `pytest tests/`.

## Architecture & Documentation
- **No Unprompted Tools**: Stick to OpenTofu, Bash, ArgoCD, Helm, Python/FastAPI.
- **ADR Backing**: Structural changes MUST map to an existing ADR in `docs/phase*/`. If changing architecture, create a new ADR first.
