You are working inside the infrastructure-lab repository.

## Goal
Extend the existing Cloudflare OpenTofu module to expose the Forgejo VM
(Phase 15) via Cloudflare Tunnel and protect it with Cloudflare Access.
Additionally, deploy cloudflared as a Docker container on the Forgejo VM
via Ansible.

## Step 1: Understand the existing setup
Before writing any code, read and internalize the following:

1. docs/phase11/adr-018-cloudflare-iac.md — understand the IaC pattern
   for Cloudflare (tunnel lifecycle, DNS routing, Access application,
   Access policy)
2. docs/ — search for ADR-016 and any other Cloudflare-related ADRs
3. terraform/cloudflare/ — read ALL files. Understand the module
   structure, variable conventions, resource naming, and how existing
   services (e.g. argocd.northlift.net) are defined
4. terraform/proxmox/forgejo/ — understand the Forgejo VM outputs
   (IP, ports)
5. ansible/roles/forgejo/ and ansible/playbooks/forgejo-vm.yml —
   understand the existing Ansible structure and conventions

## Step 2: Design (explain before coding)
Before writing any Terraform or Ansible code, explain:
- Which existing files you will modify vs. which new files you will create
- How the new Forgejo ingress fits the existing module structure
- What the cloudflared tunnel token secret strategy is (how it gets
  from Cloudflare API to the VM securely, consistent with how other
  secrets are handled in this repo)
- Any ADR-level decisions you are making (document them explicitly)

## Step 3: Implement
Implement the following:

### Cloudflare (OpenTofu)
Following the exact same pattern as existing services:
- Tunnel ingress route: git.northlift.net → http://localhost:3000
  (on the Forgejo VM)
- DNS CNAME record for git.northlift.net
- Access Application for git.northlift.net
- Access Policy: allow only the operator email address
  (read it from existing variables or tfvars — do not hardcode)

### Ansible
- New task or role extension: deploy cloudflared as a Docker container
  on the Forgejo VM
- The tunnel token must be passed as a secret (consistent with how
  forgejo.env secrets are handled — never plaintext in templates or vars)
- cloudflared container must restart unless stopped
- Add a health check / wait condition (similar to the Forgejo container
  wait task)

## Step 4: Validate
- Run `tofu fmt` and `tofu validate` on the cloudflare module
- Run `ansible-playbook playbooks/forgejo-vm.yml --syntax-check`
- If any errors, fix them before presenting the result

## Constraints
- Follow all existing naming conventions exactly (read them from the
  existing code — do not invent new ones)
- Do not modify any existing resources — only add new ones
- Do not hardcode values that are already defined as variables elsewhere
- Every new resource must have a comment referencing the ADR or phase
  that introduced it
- Write a short ADR (adr-025-forgejo-cloudflare-access.md) documenting
  this decision, consistent in format with existing ADRs in docs/

## Output
When done, summarize:
1. Every file created or modified (with path)
2. The manual steps the operator must perform after `tofu apply`
   (e.g. copy tunnel token to VM)
3. The exact commands to apply: `tofu plan`, `tofu apply`,
   `ansible-playbook`
