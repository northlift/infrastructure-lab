# Safe Operations for Agents (Strict Boundaries)

## 🟢 Always Permitted (Safe)
- **Analyze**: Read files, search codebase, read ADRs in `docs/`.
- **Validate**: Run `tofu fmt`, `tofu validate`, `pytest`, `helm lint`.
- **Develop Locally**: Write/update IaC in `terraform/`, YAML manifests in `gitops/`, or Python code in `/`.
- **Document**: Update `README.md` or ADRs.

## 🟡 Ask First (Requires Explicit User Consent)
- All infrastructure-modifying commands: `tofu apply`, `tofu plan`, `helm install/upgrade`, `kubectl apply/delete/patch`.
- Modifying structural infrastructure files (EKS configurations, Proxmox VM resources, Cloudflare routing).
- Modifying resource allocation (CPU/Memory) in `gitops/` manifests.
- Triggering GitHub Actions workflows manually via CLI.

**Consent model:**
- **Per-command**: Agent asks before each individual command. Operator replies "yes" or "approved".
- **Blanket**: Operator says "you have my approval" or runs `/approve` — agent may run all commands in the current task without asking each time. Agent still shows what it's about to run before executing.
- **Revocable**: Operator can revoke blanket approval at any time with "stop" or `/revoke`.

*Agent Instruction: When asking, show the exact command that will be run. Never batch multiple destructive commands behind a single approval.*

## 🔴 NEVER DO (Strictly Forbidden)
- **NEVER** create, read, log, or expose live secrets (tokens, API keys, passwords). Exception: reading `.env` files to export env vars for provider auth is permitted.
- **NEVER** execute `tofu state` modification commands (`tofu state rm`, `tofu state mv`, etc.).
- **NEVER** interrupt `tofu apply` during a blocking API call (disk allocation, VM creation). If interrupted, state file desyncs from the hypervisor — requires manual cleanup of zombie resources + `tofu state rm` before retrying.
- **NEVER** modify `.github/workflows` to disable security checks or hardcode credentials.
