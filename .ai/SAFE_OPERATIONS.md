# Safe Operations for Agents (Strict Boundaries)

## 🟢 Always Permitted (Safe)
- **Analyze**: Read files, search codebase, read ADRs in `docs/`.
- **Validate**: Run `tofu fmt`, `tofu validate`, `pytest`, `helm lint`.
- **Develop Locally**: Write/update IaC in `terraform/`, YAML manifests in `gitops/`, or Python code in `/`.
- **Document**: Update `README.md` or ADRs.

## 🟡 Ask First (Requires Explicit User Consent)
- Modifying structural infrastructure files (EKS configurations, Proxmox VM resources, Cloudflare routing).
- Modifying resource allocation (CPU/Memory) in `gitops/` manifests.
- Triggering GitHub Actions workflows manually via CLI.
*Agent Instruction: To get consent, stop and ask the user directly in the conversation. Do not proceed until the user explicitly confirms.*

## 🔴 NEVER DO (Strictly Forbidden & Blocked)
- **NEVER** run `tofu apply`, `terraform apply`, or `scripts/deploy.sh` remotely or locally.
- **NEVER** create, read, log, or expose live secrets (tokens, AWS keys, Kubernetes secrets).
- **NEVER** execute `tofu state` modification commands.
- **NEVER** interrupt `tofu apply` during a blocking API call (disk allocation, VM creation). If interrupted, state file desyncs from the hypervisor — requires manual cleanup of zombie resources + `tofu state rm` before retrying.
- **NEVER** modify `.github/workflows` to disable security checks or hardcode credentials.
