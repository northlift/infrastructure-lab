# OpenTofu / Terraform Rules

Applies to `terraform/aws`, `terraform/cloudflare`, and `terraform/proxmox`.

## Hard Rules
- **No apply**: Never execute an apply. You may ONLY run `tofu validate`, `tofu fmt`, and `tofu plan` (given credentials exist).
- **No State Surgery**: Never run `tofu state rm`, `tofu state mv`, or manual state edits.
- **Run Check**: Before completing a Terraform task, you must run `tofu fmt` and `tofu validate` in the modified directory.

## Resource Constraints
- Do not add new top-level cloud services without verifying alignment with `docs/` ADRs.
- Keep provider configurations scoped cleanly within their respective `terraform/<provider>` directories.

## Security & Secrets
- Do not hardcode IPs, passwords, tokens, or SSH keys.
- Reference `.tfvars` structures or secrets managers for sensitive data.
- Do not output sensitive variables in Terraform outputs without `sensitive = true`.
