---
name: gitops-patterns
description: GitOps deployment patterns for this repository. Use when creating, modifying, or troubleshooting ArgoCD Applications, SealedSecrets, Helm value overrides, or multi-cluster delivery. Covers App of Apps structure, sync waves, secret lifecycle, and hub-and-spoke targeting.
---

# GitOps Patterns Skill

## Architecture

Hub-and-Spoke model: on-prem ArgoCD (K3s) is the control plane. Two destinations:

| Destination | Target | Name in ArgoCD |
|-------------|--------|----------------|
| `in-cluster` | Local K3s | default (no `name` field) |
| Remote EKS | AWS EKS | `name: aws-eks-prod` |

Single Git repository is the source of truth for both.

## Application Structure

All Applications are in `gitops/apps/*.yaml`. The root app auto-discovers them via `directory: { recurse: false, exclude: root.yaml, include: "*.yaml" }`.

Every Application has:
- `metadata.name` — unique, kebab-case (e.g. `status-api-lab`, `sealed-secrets-aws`)
- `metadata.annotations["argocd.argoproj.io/sync-wave"]` — ordering (see below)
- `spec.project: default`
- `spec.syncPolicy.automated` with `prune: true` and `selfHeal: true`
- `spec.syncOptions: [CreateNamespace=true, ServerSideApply=true, ApplyOutOfSyncOnly=true]`

### Source Patterns

**Helm from Helm repo** (platform components like sealed-secrets, cert-manager):
```yaml
source:
  repoURL: <helm-repo-url>
  chart: <chart-name>
  targetRevision: <pinned-version>    # Always pin, never float
  helm:
    releaseName: <name>
    values: |
      fullnameOverride: <override>
      resources: { requests: { cpu: 25m, memory: 64Mi }, limits: { cpu: 200m, memory: 256Mi } }
```

**Helm from Git** (first-party apps like status-api):
```yaml
source:
  repoURL: https://github.com/northlift/infrastructure-lab.git
  targetRevision: main
  path: helm/<chart-name>
  helm:
    releaseName: <name>
    valueFiles: [values-prod.yaml, values-<env>-override.yaml]
```

**Multi-source** (ArgoCD self-management only):
```yaml
sources:
  - repoURL: <chart-repo>    # chart source
  - repoURL: <this-repo>     # values source
    ref: values
```

## Sync Wave Ordering

Lower waves reconcile first. Standard wave assignments:

| Wave | Purpose | Examples |
|------|---------|---------|
| `-1` | ArgoCD self-management | `argocd` app |
| `0` | Platform prerequisites | `sealed-secrets`, `cert-manager` |
| `1` | Cluster config | `cluster-issuers`, `platform-secrets` |
| `2` | Infrastructure controllers | `external-dns`, `ingress-nginx` |
| `3` | Observability | `loki-stack`, `observability` |
| `4`+ | Workload apps | `status-api`, `redis` |

When adding a new app, assign the lowest wave that matches its dependency level.

## Multi-Cluster Targeting

To deploy the same chart to both clusters, create two Application files:

```yaml
# K3s (local) — no name field = in-cluster
spec:
  destination:
    server: https://kubernetes.default.svc
    namespace: <ns>

# AWS EKS (remote) — name references registered cluster
spec:
  destination:
    name: aws-eks-prod
    namespace: <ns>
```

Both can share the same source chart but use different `valueFiles` for environment-specific overrides.

## Cluster Registration

```bash
aws eks update-kubeconfig --name <cluster> --region <region> --alias <alias>
argocd cluster add <alias> --name <alias> --grpc-web
```

## SealedSecrets Workflow

### Creating a Secret

```bash
kubectl create secret generic <secret-name> \
  --namespace <namespace> \
  --from-literal=<key>=<value> \
  --dry-run=client -o json | kubeseal \
  --controller-name sealed-secrets \
  --controller-namespace kube-system \
  --format yaml > gitops/secrets/<descriptive-name>-sealedsecret.yaml
```

Commit only the SealedSecret output. Never commit plaintext Secret manifests.

### Master Key Backup (Disaster Recovery)

The Sealed Secrets private key is required to decrypt existing SealedSecrets. If lost, encrypted manifests become unrecoverable.

```bash
# Backup
kubectl -n kube-system get secret \
  -l sealedsecrets.bitnami.com/sealed-secrets-key=active \
  -o yaml > sealed-secrets-master-key.yaml

# Encrypt with age or gpg before offline storage
# Do NOT use openssl enc -aes-256-cbc (no authenticated encryption)

# Restore (break-glass)
kubectl -n kube-system apply -f sealed-secrets-master-key.yaml
kubectl -n kube-system rollout restart deploy/sealed-secrets
```

### Service Classification

| Class | Exposure | Examples | Namespace |
|-------|----------|----------|-----------|
| Public | Ingress + public DNS | `lab.northlift.net`, `aws.northlift.net` | `default` |
| Tunnel-only | Cloudflare Tunnel + Access | `argocd.northlift.net`, `git.northlift.net` | service-specific |
| Internal-only | ClusterIP, no external route | Redis, sealed-secrets, cert-manager | `kube-system`, service-specific |

## ArgoCD Self-Management

Strict Day-0/Day-2 boundary:
- **Day-0 / break-glass**: `scripts/install_argocd.sh` (imperative `helm upgrade --install`). Recovery mechanism if ArgoCD is down.
- **Day-2**: `gitops/apps/argocd.yaml` drives reconciliation from Git. Never run manual `helm upgrade` for routine config changes.

**Safe adoption**: Pin `targetRevision` in `argocd.yaml` to the currently deployed chart version (`helm list -n argocd`). Sync first as no-op, verify Healthy, then bump version for controlled upgrades.

## Validation Checklist

- [ ] All `targetRevision` values are pinned (not floating)
- [ ] Sync waves ordered correctly (prerequisites before dependents)
- [ ] `ServerSideApply=true` on apps adopting pre-existing resources
- [ ] SealedSecrets generated with `--controller-name sealed-secrets --controller-namespace kube-system`
- [ ] Remote cluster apps use `name:` (not `server:`) for destination
- [ ] Master key backup exists, encrypted, stored offline

## Reference Files

- `gitops/apps/root.yaml`, `argocd.yaml`, `sealed-secrets.yaml`, `status-api.yaml`
- `gitops/secrets/` — SealedSecret manifests
- `gitops/argocd-values.yaml`
- `scripts/install_argocd.sh` — Day-0 bootstrap
