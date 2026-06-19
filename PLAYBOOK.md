# Playbook — Operator Workflow Cheat Sheet

## 0. Agent Capabilities & Safety Net

Before diving into phase-specific workflows, know what the agent can and won't do:

**Automatic safety enforcement (extensions):**
- **Permission Gate** — Agent is physically blocked from running `tofu apply`, `tofu destroy`, `tofu state rm/mv/pull/import`, `ansible-playbook` (without `--syntax-check`), `kubectl apply/delete/patch`, `helm install/upgrade/uninstall`, `deploy.sh`. Also confirms before `rm -rf`, `sudo`, `chmod 777`. This is enforced at the tool level, not just a prompt instruction.
- **Protected Paths** — Agent cannot write/edit `.env`, `terraform.tfvars`, `.git/`, `node_modules/`, or sealed-secrets master key backups.
- **Git Checkpoint** — Code is stashed before each turn. When you `/fork`, you're offered a code restore to that point.
- **Dirty Repo Guard** — `/new`, `/resume`, `/fork` are blocked if uncommitted changes exist.
- **Status Line** — Footer shows detected phase and turn progress.

**Custom commands:**
- `/validate` — Runs all relevant validators: `tofu fmt/validate`, `ansible-playbook --syntax-check`, `helm lint`, `pytest`, `mkdocs build --strict`.
- `/phase-status <N>` — Shows docs + implementation artifacts for a phase.

**Global agent preferences (always active):**
- Concise communication — no filler, leads with the answer.
- Design-before-code — agent explains the plan before writing anything.
- No apply/deploy without explicit operator confirmation.
- Two-strikes rule for pitfalls — first incident goes to post-mortem; second occurrence of the same root cause gets added to Known Pitfalls + relevant skill.

**Project settings:**
- `defaultProjectTrust: "always"` — no trust prompt on startup.

---

## 1. Starting a New Phase

**Trigger:** You've decided what the next phase should accomplish (e.g. "add a backup system") but nothing is written yet.

**Steps:**
1. `/phase-runbook <N> <service-purpose> <service-slug>` — creates the runbook first. This is documentation-only: no code, no apply, no infrastructure.
2. Review the runbook. Does it capture scope, deferred items, validation gates? If not, refine it.
3. Write an ADR in `docs/phase<N>/adr-<NNN>-<slug>.md` (see ADR Convention in AGENTS.md). Get acceptance before coding.
4. `/phase-implement <N> <service-name> <task-summary>` — the agent reads the ADR + runbook, designs the implementation, explains its plan, then codes.
5. Agent validates: `tofu fmt && tofu validate` / `ansible-playbook --syntax-check` / `helm lint`. Or just run `/validate` to cover all domains at once.
6. You review the diff. **You run `tofu apply` or `ansible-playbook` — not the agent.**

**Skills:** Agent loads the relevant skill based on the domain (see "When to Load Skills" in AGENTS.md). After the first successful implementation, consider `/create-skill` to distill the pattern for future use.

**Done:** ADR accepted, code validated, runbook updated with any discovered corrections, and you've approved the plan for manual apply.

---

## 2. Onboarding a New Service to Cloudflare Tunnel

**Trigger:** A new internal service needs Cloudflare Tunnel + Access (e.g. `grafana.northlift.net`, `git.northlift.net`).

**Steps:**
1. Agent: loads `cloudflare-tunnel` skill.
2. Add entry to `tunnel_dns_hostnames` local in `terraform/cloudflare/tunnel.tf`.
3. Add entry to `protected_apps` local in `terraform/cloudflare/access.tf` (increment policy_precedence).
4. `/validate` (or `tofu fmt && tofu validate` in `terraform/cloudflare/`).
5. If the service runs on a new VM: create `ansible/roles/cloudflared/` (or reuse), add role with `when` guard to the service playbook, syntax-check.
6. You: `tofu apply` in `terraform/cloudflare/`.
7. You: get tunnel token from Cloudflare dashboard → Zero Trust → Tunnels → `lab-internal-services`.
8. You: `ansible-playbook playbooks/<service>-vm.yml -e cloudflared_tunnel_token='<token>' --tags cloudflared`.
9. Verify: `https://<service>.northlift.net` shows Cloudflare Access login.

**Skill:** `cloudflare-tunnel`

**Done:** DNS resolves, Access policy protects the service, cloudflared container is running on the VM.

---

## 3. Adding a New Ansible Role/Playbook

**Trigger:** New service VM that needs host-level configuration and app deployment.

**Steps:**
1. Agent: loads `ansible-patterns` and `docker-ansible` skills.
2. Create `ansible/roles/<service>/` with `tasks/main.yml`, `defaults/main.yml`, `templates/`.
3. Create `ansible/playbooks/<service>-vm.yml` following the standard pattern: pre_tasks (user/group/dirs) → roles (common → docker → <service> → optional cloudflared) → tasks (firewall).
4. Add host to `ansible/inventory/hosts.yml` and variables to `ansible/inventory/group_vars/<service>.yml`.
5. Key rules from post-mortems:
   - All tasks idempotent (`changed_when: false` for lookups, `state: present` not `latest`).
   - UID/GID looked up at runtime, never hardcoded.
   - Pre-create ALL directories before Docker starts (avoids root trap).
   - `no_log: true` on any task handling secrets.
   - Shared Docker networks created explicitly with `docker_network` module, referenced as `external: true`.
6. `/validate` (or `ansible-playbook playbooks/<service>-vm.yml --syntax-check`).
7. You: run the playbook against the live VM.

**Skills:** `ansible-patterns`, `docker-ansible`

**Done:** Syntax check passes, all templates render, role is tagged, playbook follows the standard pattern.

---

## 4. Responding to an Incident and Feeding It Back

**Trigger:** Something broke — provisioning hang, SSH rejection, container crash loop, etc.

**Steps:**
1. Diagnose and fix the immediate issue (manually or with agent help — see "Ad-hoc Task" below).
2. Write a post-mortem in `docs/<phase>/<incident-name>.md`: Summary → Timeline → Root Cause → Remediation → Preventive Actions → Second-brain note.
3. Agent: loads AGENTS.md → "Post-Mortem Feedback Loop" section.
4. Update `.pi/skills/` — add new rows to Common Issues tables, add new pitfall sections if the domain isn't covered. If the incident reveals a pattern that doesn't fit an existing skill, use `/create-skill` to distill it into a new `.pi/skills/<name>/SKILL.md`.
5. Update `AGENTS.md` → Known Pitfalls — add a concise pitfall entry (what, symptom, fix).
6. Verify: the pitfall is written as a **proactive check**, not just a historical note.

**Two-strikes rule:** First incident → post-mortem only. Second occurrence of the same root cause → also add to Known Pitfalls + relevant skill Common Issues table.

**Skill:** Whatever domain the incident belongs to (loaded to understand the Common Issues table that needs updating).

**Done:** Post-mortem written, affected skill(s) updated, Known Pitfalls has a new entry, agent would catch this next time.

---

## 5. Adding a New GitOps Application to ArgoCD

**Trigger:** New Helm chart or platform component that should be managed by ArgoCD.

**Steps:**
1. Agent: loads `gitops-patterns` skill.
2. Decide: is this for `in-cluster` only, `aws-eks-prod` only, or both?
3. Create `gitops/apps/<service>-<env>.yaml`:
   - Pin `targetRevision` — never float.
   - Assign the correct sync wave (see skill for the wave table).
   - Use `kebab-case` naming: `<service>-<env>.yaml`.
   - Set standard sync options: `CreateNamespace=true`, `ServerSideApply=true`.
4. If targeting both clusters: create two files (one with `name: aws-eks-prod`, one without).
5. If secrets are needed: generate SealedSecret with `kubeseal`, place in `gitops/secrets/`, reference via a `platform-secrets` app at sync-wave 1.
6. Commit, push, check ArgoCD UI: `argocd app list` → should show Healthy + Synced.

**Skill:** `gitops-patterns`

**Done:** App appears in ArgoCD, syncs to Healthy, secrets unseal correctly, wave ordering is correct.

---

## 6. Ad-hoc Task (Doesn't Fit a Template)

**Trigger:** Fix a typo, answer a question, investigate a config value, write a one-off script — anything small that doesn't warrant a full template.

**Steps:**
1. Just describe what you need. No slash-command required.
2. Agent reads AGENTS.md first steps automatically (README, SAFE_OPERATIONS, TERRAFORM_RULES, STYLEGUIDE).
3. For infrastructure changes: agent designs → explains plan → implements → validates.
4. You review and approve.
5. You run any apply/deploy commands.

**Rules regardless of task size:**
- Agent never runs `tofu apply`, `terraform apply`, or `ansible-playbook` against a live host (enforced by Permission Gate extension).
- Agent never writes to protected paths (`.env`, `terraform.tfvars`, `.git/`, etc.).
- Agent never commits real secrets.
- Agent always runs the relevant validation commands before presenting results (`/validate` covers all domains).

**Done:** You have what you asked for, validated, and you manually apply if infrastructure changed.
