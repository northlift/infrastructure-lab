---
name: docker-ansible
description: Docker container deployment patterns for Ansible-managed VMs. Use when deploying or troubleshooting Docker Compose services via Ansible. Covers bind mount ownership, network isolation pitfalls, unprivileged containers, and health check patterns.
---

# Docker + Ansible Skill

## Bind Mount Ownership — The Docker Root Trap

**When Docker initializes a bind mount and the target host path does not exist, the Docker daemon (running as root) automatically creates the missing directory structure with `root:root` ownership.**

If the container runs as an unprivileged user, it cannot write to these directories, causing crash loops with `Permission denied` errors.

### The Fix

Always pre-create the entire required host directory structure with correct ownership **before** starting the container:

```yaml
- name: Pre-create container directory structure
  ansible.builtin.file:
    path: "{{ data_dir }}/gitea/conf"
    state: directory
    owner: "{{ service_user }}"
    group: "{{ service_group }}"
    mode: "0750"
```

### Rules

1. **Never rely on Docker to create directories** for bind mounts that an unprivileged container needs to write to
2. **Pre-create the full path** — if the container expects `/data/gitea/conf`, create `gitea/conf` with correct ownership
3. **Match UID/GID** — look up the service user's UID/GID on the host and pass it to the container via environment variables or compose `user:` directive
4. **Avoid single-file bind mounts into nested paths** — mounting a single file into `/data/gitea/conf/app.ini` causes Docker to create the parent directories as root. Instead, pre-create the directory and deploy the file directly into it

## Docker Network Isolation — `internal: true`

**Setting `internal: true` on a Docker Compose network silently disables all port publishing.** The container becomes unreachable from the host, even with explicit `ports:` mappings.

### When to Use `internal: true`

Only when the container should have **no host access at all** — e.g., a backend database that should only be reachable by other containers on the same network.

### When NOT to Use It

- When the container needs to be reached from the host (e.g., via SSH tunnel)
- When the container needs incoming connections from the operator

### The Correct Pattern for Host-Only Exposure

Use loopback binding instead of `internal: true`:

```yaml
ports:
  - "127.0.0.1:3000:3000"  # Host-only, no public exposure
```

This gives you private access (via SSH tunnel) without silently breaking port mappings.

## Health Check Pattern

Always include a wait/health check task after starting a container:

```yaml
- name: Wait for container to be running
  community.docker.docker_container_info:
    name: "{{ container_name }}"
  register: container_info
  until: container_info.container.State.Status == "running"
  retries: 12
  delay: 5
```

- Use `retries: 12` and `delay: 5` (60 seconds total) for most services
- For slower-starting services (databases, Git servers), increase retries
- Check `container.State.Status == "running"` — not `Healthy`, which requires a HEALTHCHECK directive in the Dockerfile

## Compose File Conventions

- Store compose files in the service data directory (e.g., `/opt/<service>/data/docker-compose.yml`)
- Use `restart: unless-stopped` for persistent services
- Use `env_file` for sensitive environment variables (with `no_log: true` in the Ansible task)
- Reference external networks with `external: true` only when the network is created by another compose project or explicitly by Ansible

## Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Container crash loop with `Permission denied` | Docker created bind mount dirs as root | Pre-create dirs with correct ownership before starting container |
| `Connection refused` on published port | `internal: true` on network silently drops port mappings | Remove `internal: true`; use `127.0.0.1:PORT:PORT` for host-only |
| Container running but app not listening | App config binds to wrong interface | Ensure app binds to `0.0.0.0`, not `127.0.0.1` (or match the compose network) |
| SSH host key mismatch after VM rebuild | New VM generates new host keys | Run `ssh-keygen -R <VM_IP>` on operator machine before reconnecting |
