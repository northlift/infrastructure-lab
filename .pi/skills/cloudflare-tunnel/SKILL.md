---
name: cloudflare-tunnel
description: "Cloudflare Tunnel + Access onboarding for internal services. Use when adding a new service to Cloudflare Tunnel, creating Access applications/policies, or deploying cloudflared connectors via Ansible. Covers the full pattern: Terraform IaC for DNS + Access, and Ansible for cloudflared container deployment."
---

# Cloudflare Tunnel + Access Skill

## Overview

Internal services are exposed via Cloudflare Tunnel (`lab-internal-services`) and protected by Cloudflare Access (GitHub OAuth). The pattern has two parts:

1. **Terraform IaC** — DNS CNAME, Access Application, Access Policy
2. **Ansible** — cloudflared Docker container on the service VM

## Terraform Pattern

All Cloudflare resources are in `terraform/cloudflare/`. The tunnel itself (`lab-internal-services`) is a single shared resource — new services are added as ingress routes, not new tunnels.

### Step 1: Add DNS hostname

Add an entry to `local.tunnel_dns_hostnames` in `tunnel.tf`:

```hcl
locals {
  tunnel_dns_hostnames = {
    # ... existing entries ...
    <service-key> = {
      # Phase <N>: <description>
      hostname = "<service>.northlift.net"
      proxied  = true
    }
  }
}
```

This automatically creates a `cloudflare_record` CNAME pointing to the tunnel.

### Step 2: Add Access application and policy

Add an entry to `local.protected_apps` in `access.tf`:

```hcl
locals {
  protected_apps = {
    # ... existing entries ...
    <service-key> = {
      # Phase <N>: <description>
      domain            = "<service>.northlift.net"
      policy_precedence = <next-number>
    }
  }
}
```

This automatically creates:
- `cloudflare_zero_trust_access_application` — self_hosted, GitHub OAuth
- `cloudflare_zero_trust_access_policy` — allow `var.access_allowed_emails`, require GitHub IdP

### Variables (already defined, do not re-declare)

| Variable | Purpose | Source |
|----------|---------|--------|
| `cloudflare_account_id` | Account identifier | `terraform.tfvars` |
| `cloudflare_zone_id` | Zone for northlift.net | `terraform.tfvars` |
| `github_idp_id` | GitHub OAuth IdP ID | `terraform.tfvars` |
| `access_allowed_emails` | Emails allowed by policy | `terraform.tfvars` |
| `access_scope` | `"account"` or `"zone"` | `terraform.tfvars` (default: `"zone"`) |
| `tunnel_name` | Tunnel name | variables.tf (default: `"lab-internal-services"`) |
| `tunnel_secret` | Base64 tunnel secret | `terraform.tfvars` (sensitive) |

### Validation

```bash
cd terraform/cloudflare
tofu fmt && tofu validate
```

## Ansible Pattern — cloudflared Container

Each service VM that needs tunnel access runs cloudflared as a Docker container.

### Role Structure

```
ansible/roles/cloudflared/
├── defaults/main.yml          # Image, container name, config dir
├── tasks/main.yml             # Assert token → deploy env → start → health check
└── templates/docker-compose.yml.j2
```

### Tunnel Token Secret Strategy

The tunnel token is **never** stored in templates, group_vars, or version control.

- Passed at runtime: `ansible-playbook ... -e cloudflared_tunnel_token='<token>'`
- Written to an env file by Ansible with `no_log: true`
- The `cloudflared` role has a `when` guard so it only runs when the token is provided

### Docker Compose Template

```yaml
services:
  cloudflared:
    image: "{{ cloudflared_image }}"
    container_name: "{{ cloudflared_container_name }}"
    restart: unless-stopped
    env_file:
      - "{{ cloudflared_config_dir }}/cloudflared.env"
    command: tunnel run
    networks:
      - <service>-internal

networks:
  <service>-internal:
    external: true
```

Key points:
- Uses `env_file` for the tunnel token (not inline environment variables)
- Connects to the service's internal Docker network as `external: true`
- `restart: unless-stopped` for persistence
- The service's compose must create the network; cloudflared's compose references it as external

### Task Sequence

1. **Assert token is present** — fail with clear message if not provided
2. **Create config directory** — `0750`, owned by root
3. **Deploy env file** — `TUNNEL_TOKEN=<token>`, `0600`, `no_log: true`
4. **Pull image** — `cloudflare/cloudflared:latest`
5. **Start container** — `docker_compose_v2`, `state: present`, `pull: never`
6. **Health check** — `docker_container_info` wait loop, `retries: 12`, `delay: 5`

### Playbook Integration

Add the role to the service's playbook with a `when` guard:

```yaml
- role: cloudflared
  tags: [cloudflared]
  when: cloudflared_tunnel_token is defined and cloudflared_tunnel_token | length > 0
```

## Full Onboarding Checklist

When adding a new service to Cloudflare Tunnel:

1. Add hostname to `tunnel_dns_hostnames` local in `terraform/cloudflare/tunnel.tf`
2. Add app to `protected_apps` local in `terraform/cloudflare/access.tf`
3. Run `tofu fmt && tofu validate` in `terraform/cloudflare/`
4. Create `ansible/roles/cloudflared/` (or reuse existing role with service-specific vars)
5. Add cloudflared role to the service's playbook
6. Run `ansible-playbook playbooks/<playbook>.yml --syntax-check`
7. Operator: run `tofu apply`, then `ansible-playbook ... -e cloudflared_tunnel_token='<token>'`

## Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `tofu plan` shows new DNS + Access resources | Expected for new service | Review and apply |
| cloudflared container won't start | Invalid or missing tunnel token | Verify token from Cloudflare dashboard |
| Access policy blocks operator email | Email not in `access_allowed_emails` | Add to `terraform.tfvars` |
| cloudflared can't reach service | Network not shared | Ensure service compose creates the network, cloudflared compose uses `external: true` |
| `community.general.yaml` callback error | Legacy alias in ansible.cfg | Use `stdout_callback = default` |
