---
name: ansible-patterns
description: Ansible conventions for this repository. Use when creating or modifying Ansible roles, playbooks, inventory, or tasks. Covers role structure, inventory layout, secrets handling, idempotency patterns, callback configuration, and Docker Compose integration.
---

# Ansible Patterns Skill

## Repo Structure

```
ansible/
├── ansible.cfg              # Global config (callback, SSH, paths)
├── inventory/
│   ├── hosts.yml            # Host definitions (children groups)
│   └── group_vars/
│       └── <group>.yml      # Variables per host group
├── playbooks/
│   └── <service>-vm.yml     # One playbook per service/host
└── roles/
    ├── common/              # Baseline: packages, SSH, UFW
    │   ├── tasks/main.yml
    │   ├── defaults/main.yml
    │   └── handlers/main.yml
    ├── docker/              # Docker CE installation
    │   ├── tasks/main.yml
    │   └── defaults/main.yml
    └── <service>/           # Service-specific deployment
        ├── tasks/main.yml
        ├── defaults/main.yml
        └── templates/
            ├── docker-compose.yml.j2
            ├── <service>.env.j2
            └── <config>.j2
```

## Role Conventions

### Directory Layout

Every role has:
- `tasks/main.yml` — required, the main task sequence
- `defaults/main.yml` — required, all configurable variables with safe defaults
- `handlers/main.yml` — optional, for `notify` actions (e.g., restart sshd)
- `templates/` — optional, Jinja2 templates for config files

### Task Patterns

**Idempotency**: Every task must be idempotent. Use `state: present` (not `state: latest` for apt), `creates:` conditions, and `changed_when: false` for read-only lookups.

**UID/GID lookup** — Look up the service user's UID/GID at runtime, don't hardcode:

```yaml
- name: Look up service user UID
  ansible.builtin.command:
    cmd: "id -u {{ service_user }}"
  register: service_user_uid_result
  changed_when: false

- name: Set UID/GID facts
  ansible.builtin.set_fact:
    service_user_uid: "{{ service_user_uid_result.stdout }}"
```

**Directory creation** — Always pre-create directories before Docker or the service needs them:

```yaml
- name: Ensure data directory exists
  ansible.builtin.file:
    path: "{{ data_dir }}"
    state: directory
    owner: "{{ service_user }}"
    group: "{{ service_group }}"
    mode: "0750"
```

**Template deployment** — Use `ansible.builtin.template` for files with variable substitution:

```yaml
- name: Deploy config file
  ansible.builtin.template:
    src: config.j2
    dest: "{{ config_dir }}/config.ini"
    owner: "{{ service_user }}"
    group: "{{ service_group }}"
    mode: "0640"
```

**Secrets** — Use `ansible.builtin.copy` with `content:` and `no_log: true` for sensitive values:

```yaml
- name: Deploy environment file with secrets
  ansible.builtin.copy:
    dest: "{{ config_dir }}/service.env"
    content: |
      SECRET_KEY={{ secret_value }}
    owner: "{{ service_user }}"
    group: "{{ service_group }}"
    mode: "0600"
  no_log: true
```

### Docker Compose Pattern

**Pull image separately** before starting compose:

```yaml
- name: Pull service image
  community.docker.docker_image:
    name: "{{ service_image }}"
    source: pull

- name: Start service container
  community.docker.docker_compose_v2:
    project_src: "{{ data_dir }}"
    files:
      - docker-compose.yml
    state: present
    pull: never
```

**Health check** — Always wait for the container after starting:

```yaml
- name: Wait for container to be running
  community.docker.docker_container_info:
    name: "{{ container_name }}"
  register: container_info
  until: container_info.container.State.Status == "running"
  retries: 12
  delay: 5
```

### Pre-creating Docker Networks

When multiple compose projects share a network, create it explicitly before either compose starts:

```yaml
- name: Ensure shared Docker network exists
  community.docker.docker_network:
    name: <service>-internal
    driver: bridge
    state: present
```

Then reference as `external: true` in all compose templates using that network.

## Inventory Pattern

**hosts.yml** — Group hosts by service:

```yaml
all:
  children:
    <service>:
      hosts:
        <service>-vm:
          ansible_host: "{{ vm_ip }}"
          ansible_user: "{{ vm_user }}"
          ansible_ssh_private_key_file: "{{ vm_ssh_key | default('~/.ssh/id_ed25519') }}"
```

**group_vars/** — One file per group, named `<group>.yml`:

```yaml
# Connection
vm_ip: "192.168.x.x"
vm_user: "adminsetup"
vm_ssh_key: "~/.ssh/id_ed25519"

# Service paths
host_data_dir: "/opt/<service>"
host_config_dir: "/opt/<service>/config"

# Service config
http_port: 3000
listen_address: "127.0.0.1"
```

## Playbook Pattern

```yaml
---
# Phase <N>: <description>
- name: Bootstrap <service> VM
  hosts: <service>
  become: true
  gather_facts: true

  pre_tasks:
    # Create system user/group, data directory
    - name: Create service system group
      ansible.builtin.group:
        name: "{{ host_system_group | default('<service>') }}"
        system: true

    - name: Create service system user
      ansible.builtin.user:
        name: "{{ host_system_user }}"
        group: "{{ host_system_group | default('<service>') }}"
        system: true
        shell: /usr/sbin/nologin
        home: "{{ host_data_dir }}"
        create_home: false

    - name: Create data directory
      ansible.builtin.file:
        path: "{{ host_data_dir }}"
        state: directory
        owner: "{{ host_system_user }}"
        group: "{{ host_system_group | default('<service>') }}"
        mode: "0750"

  roles:
    - role: common
      tags: [common]
    - role: docker
      tags: [docker]
    - role: <service>
      tags: [service]
    # Optional: cloudflared (with when guard)
    - role: cloudflared
      tags: [cloudflared]
      when: cloudflared_tunnel_token is defined and cloudflared_tunnel_token | length > 0

  tasks:
    # Service-specific firewall rules, etc.
```

## ansible.cfg

```ini
[defaults]
roles_path = ./roles
inventory = ./inventory/hosts.yml
host_key_checking = False
retry_files_enabled = False
stdout_callback = default    # NOT "yaml" — see callback deprecation pitfall

[ssh_connection]
pipelining = True
```

**Critical**: `stdout_callback = default`. The value `yaml` is a legacy alias that routes to the removed `community.general.yaml` plugin and causes a fatal error on Ansible 12+.

## Secrets Rules

1. **Never store real secrets in group_vars, defaults, or templates**
2. **Runtime secrets** — pass via `--extra-vars` or ansible-vault
3. **Env files** — deploy with `no_log: true`, mode `0600`
4. **Template files** — use `no_log: true` when they contain sensitive values
5. **Defaults** — use placeholder values or empty strings, with comments indicating they must be supplied at runtime

## Validation

```bash
ansible-playbook playbooks/<playbook>.yml --syntax-check
```

Run this after every playbook or role change. Do not run against a live host without explicit approval.

## Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `community.general.yaml` callback error | `stdout_callback = yaml` in ansible.cfg | Change to `stdout_callback = default` |
| SSH key rejected | Wrong user or key format | Verify `ansible_user` and `ansible_ssh_private_key_file` in inventory |
| Container crash loop | Docker created bind mount dirs as root | Pre-create dirs with correct ownership before starting container |
| `Connection refused` on published port | `internal: true` on Docker network | Remove `internal: true`; use `127.0.0.1:PORT:PORT` |
| SSH host key mismatch | VM was rebuilt at same IP | Run `ssh-keygen -R <VM_IP>` on operator machine |
