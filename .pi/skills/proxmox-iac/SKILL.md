---
name: proxmox-iac
description: Proxmox VM provisioning with OpenTofu (bpg/proxmox provider). Use when creating, modifying, or troubleshooting Proxmox VM IaC. Covers provider config, Cloud-Init patterns, QEMU guest agent requirements, VM resource structure, and common deadlock fixes.
---

# Proxmox IaC Skill

## Provider

- **Provider**: `bpg/proxmox` (v0.98.1)
- **Auth**: API token (`token_id=token_secret`), not password
- **SSH**: root with private key (`~/.ssh/id_ed25519`), agent disabled

```hcl
provider "proxmox" {
  endpoint  = "https://${var.proxmox_host}/api2/json"
  api_token = "${var.proxmox_api_token_id}=${var.proxmox_api_token_secret}"
  insecure  = true

  ssh {
    agent       = false
    username    = "root"
    private_key = file("~/.ssh/id_ed25519")
  }
}
```

## VM Resource Pattern

Every VM follows this structure:

```hcl
resource "proxmox_virtual_environment_vm" "name" {
  name        = var.vm_name
  description = "..."     # Always include phase and purpose
  node_name   = var.proxmox_node_name
  vm_id       = var.vm_id  # Must be unique

  agent {
    enabled = true         # Always true — see QEMU agent section
  }

  cpu {
    cores = var.vm_cores
    type  = "x86-64-v2-AES"
  }

  memory {
    dedicated = var.vm_memory_mb
  }

  disk {
    datastore_id = var.vm_disk_storage
    file_id      = proxmox_virtual_environment_download_file.image.id
    file_format  = "raw"
    interface    = "virtio0"
    size         = var.vm_disk_size_gb
    discard      = "on"
  }

  initialization {
    ip_config {
      ipv4 {
        address = var.vm_ip_cidr     # CIDR notation, or "dhcp"
        gateway = var.vm_gateway     # Empty string if DHCP
      }
    }
    user_account {
      username = var.vm_user
      keys     = [trimspace(var.vm_ssh_public_key)]
    }
    user_data_file_id = proxmox_virtual_environment_file.cloud_config.id
  }

  network_device {
    bridge = var.vm_network_bridge
  }
}
```

## QEMU Guest Agent — Critical

**The Debian cloud image does NOT include `qemu-guest-agent` by default.**

If `agent { enabled = true }` is set without the guest agent installed, `tofu apply` hangs indefinitely on `Still creating...` even though the VM boots successfully. Proxmox waits for the agent to report the VM IP and status.

**Fix**: Always include a Cloud-Init snippet that installs and enables `qemu-guest-agent`:

```hcl
resource "proxmox_virtual_environment_file" "cloud_config" {
  content_type = "snippets"
  datastore_id = "local"
  node_name    = var.proxmox_node_name

  source_raw {
    data      = <<-EOF
      #cloud-config
      hostname: ${var.vm_name}
      package_update: true
      packages:
        - qemu-guest-agent
      users:
        - default
        - name: ${var.vm_user}
          groups: sudo
          shell: /bin/bash
          sudo: ALL=(ALL) NOPASSWD:ALL
          ssh_authorized_keys:
            - ${trimspace(var.vm_ssh_public_key)}
      runcmd:
        - [ systemctl, enable, --now, qemu-guest-agent ]
    EOF
    file_name = "<vm-name>-cloud-init.yaml"
  }
}
```

Then reference it in the VM's `initialization` block:
```hcl
user_data_file_id = proxmox_virtual_environment_file.cloud_config.id
```

## Cloud-Init Patterns

- **Snippets** (not `user-data`) for VM-specific config — stored on Proxmox as snippet files
- `content_type = "snippets"`, `datastore_id = "local"`
- Cloud-Init `users: - default` preserves the default user from the image
- Additional users are added explicitly with `name`, `groups`, `shell`, `sudo`, `ssh_authorized_keys`

## ⚠️ Cloud-Init Override Precedence (Critical)

**When a custom `user_data_file_id` (snippet) is attached to a VM, Proxmox assumes you intend to manage the entire initialization process manually. The `user_account` block in the OpenTofu VM resource is silently dropped.**

This means:
- If you attach a Cloud-Init snippet via `user_data_file_id`, you **must** define users, SSH keys, and sudo access inside the snippet itself
- The `user_account { username, keys }` block in the VM resource will be ignored — no error, no warning
- This applies to IP configuration, user accounts, and any other Cloud-Init managed settings

**Rule**: If you use a custom snippet, put *all* user/key config in the snippet. Do not rely on `user_account` as a fallback.

## Image Download Pattern

```hcl
resource "proxmox_virtual_environment_download_file" "image" {
  content_type = "iso"
  datastore_id = "local"
  node_name    = var.proxmox_node_name

  url       = "<image-url>"
  file_name = "<descriptive-name>.img"
}
```

- Download once, reference via `file_id` in disk block
- Use unique `file_name` per VM type to avoid conflicts

## Variable Conventions

All VM-specific values are variables. Defaults are set for dev convenience, but real values go in `terraform.tfvars`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `vm_name` | `"forgejo"` | Hostname / VM name |
| `vm_id` | `116` | Proxmox VM ID (must be unique) |
| `vm_cores` | `2` | CPU cores |
| `vm_memory_mb` | `2048` | RAM in MiB |
| `vm_disk_size_gb` | `40` | Disk in GiB |
| `vm_disk_storage` | `"local-lvm"` | Storage pool |
| `vm_network_bridge` | `"vmbr0"` | Network bridge |
| `vm_ip_cidr` | *(required)* | IP in CIDR or `"dhcp"` |
| `vm_gateway` | `""` | Gateway (empty if DHCP) |
| `vm_user` | `"adminsetup"` | Cloud-Init admin user |
| `vm_ssh_public_key` | *(required)* | SSH public key string |

## Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `tofu apply` hangs on "Still creating..." | QEMU guest agent not installed | Add Cloud-Init snippet with `qemu-guest-agent` package |
| VM has no IP in Proxmox UI | Same as above, or `agent { enabled = false }` | Install guest agent; keep `enabled = true` |
| `tofu validate` fails with provider error | Missing `tofu init` or wrong provider version | Run `tofu init`; check `required_providers` block |
| SSH key not working | Key in wrong format or wrong user | Use `user_account` block; verify `vm_user` matches Ansible inventory |
| Disk not found | `file_id` references wrong download resource | Check resource name matches the download_file |
| Disk format error (qcow2 not supported) | Default format incompatible with block storage (local-lvm) | Always set `file_format = "raw"` for local-lvm |
| SSH key rejected after provisioning | Cloud-Init snippet overrode `user_account` block | Put user + key config in the snippet itself (see Cloud-Init Override Precedence) |
| `tofu apply` interrupted mid-provisioning | State file desyncs from Proxmox storage | Manually purge zombie VM from Proxmox UI, then `tofu state rm` the affected resource |

## Repo Structure

```
terraform/proxmox/
├── provider.tf          # Provider config (shared pattern)
├── variables.tf         # Shared Proxmox variables
├── compute.tf           # K3s VM (existing)
├── outputs.tf           # K3s outputs
├── terraform.tfvars     # Shared tfvars
└── <vm-name>/           # Per-VM subdirectory
    ├── main.tf          # VM resources + Cloud-Init
    ├── variables.tf     # VM-specific variables
    ├── outputs.tf       # VM-specific outputs
    ├── provider.tf      # Same provider config (isolated state)
    └── terraform.tfvars # VM-specific values
```

Each VM gets its own subdirectory with its own state. This prevents accidental cross-VM changes.

## Validation

```bash
cd terraform/proxmox/<vm-name>
tofu fmt -recursive
tofu validate
```

Never run `tofu apply` without explicit operator approval (see `.ai/SAFE_OPERATIONS.md`).

## ⚠️ Interrupting `tofu apply` — State Corruption Risk

Interrupting `tofu apply` while it is waiting on a blocking Proxmox API call (especially LVM disk allocation) **desynchronizes the state file from the hypervisor's actual disk topology**. Proxmox may have created resources that OpenTofu doesn't know about, or cleaned up resources that OpenTofu still expects to manage.

**If you must interrupt**:
1. Check Proxmox UI for zombie VMs or orphaned disks
2. Manually purge any partial resources from Proxmox
3. Run `tofu state rm proxmox_virtual_environment_vm.<name>` to clean the state file
4. Re-run `tofu apply` from a clean state

**Prevention**: Ensure all prerequisites (guest agent, correct disk format, correct network config) are validated *before* running `tofu apply`.
