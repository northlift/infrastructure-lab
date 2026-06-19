You are working in the repository /home/excalt/Projects/infrastracture/infrastructure-lab.

Goal:
Fix an OpenTofu provisioning deadlock in Phase 15 without expanding scope or running live applies.

Context:
We are attempting the first live provisioning pass for the Phase 15 Forgejo VM. The `tofu apply` command successfully creates and boots the Proxmox VM to the Debian login prompt, but the OpenTofu process hangs indefinitely on `proxmox_virtual_environment_vm.forgejo: Still creating...` until cancelled.

Diagnosis:
The `proxmox_virtual_environment_vm` resource has `agent { enabled = true }` configured. However, the standard `debian_cloud_image` being used does not have the `qemu-guest-agent` package installed by default. OpenTofu is waiting for the QEMU guest agent to report back, causing a deadlock.

Directives for the Fix:
1. Evaluate the cleanest way to resolve this while maintaining the separation between OpenTofu (hardware/infrastructure) and Ansible (host prep).
2. Option A (Preferred for IaC completeness): Generate a minimal Cloud-Init snippet (user-data or vendor-data) that installs the `qemu-guest-agent` package on boot, upload it as a Proxmox snippet using `proxmox_virtual_environment_file`, and attach it to the `initialization` block of the VM.
3. Option B (Fallback for minimal Tofu changes): Set `agent { enabled = false }` in the OpenTofu configuration so it stops waiting, and add the installation and enablement of `qemu-guest-agent` to the `ansible/playbooks/forgejo-vm.yml` playbook.
4. Implement the chosen option by modifying the repository files locally. Ensure the solution leaves the VM manageable by Proxmox gracefully (a running QEMU agent is required for clean shutdowns).
5. Do not run `tofu apply`, `tofu destroy`, or any live Ansible executions.
6. Keep the fix minimal and reviewable.

Validation:
Run local validation on the files you touch:
* `tofu fmt -check`
* `tofu validate`
* `ansible-playbook playbooks/forgejo-vm.yml --syntax-check`

Expected Output:
* A summary of the approach chosen and why it fits the repo conventions.
* A list of the files changed.
* The validation results.
* Explicit confirmation that no live infrastructure commands were run.
