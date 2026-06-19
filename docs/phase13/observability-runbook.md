---
title: "Phase 13 Observability Runbook"
doc_type: phase-runbook
phase: phase13
summary: "Operational deployment, validation, failure-drill, and lifecycle checks for the Phase 13 observability stack."
---

# Phase 13 Observability Runbook

This runbook accompanies [Phase 13: Full-Picture Observability](observability.md).

## Operations Runbook

### 1. Deploy/Sync

```bash
kubectl -n argocd get applications observability loki-stack cloudflare-tunnel
kubectl -n monitoring get pods
```

### 2. Validate Whitebox Resource Envelope

```bash
kubectl top pods -n monitoring
```

Expected upper bounds:

1. Prometheus < 256Mi
2. Grafana < 128Mi
3. Loki < 128Mi
4. Promtail < 32Mi per node

### 3. Validate Prometheus Targets and Scrape Interval

```bash
kubectl -n monitoring get svc
# Open Grafana and verify Prometheus datasource/targets health.
```

### 4. Validate Loki Retention and Storage Cap

```bash
kubectl get pvc -n monitoring
kubectl -n monitoring exec deploy/loki -- printenv | grep -i loki
```

Validation goals:

1. Loki PVC size remains 5Gi.
2. Effective retention is 72h.

### 5. Validate Zero Trust Access for Grafana

```bash
# Access through browser:
# https://grafana.northlift.net
```

Validation goals:

1. Access is gated by Cloudflare Access with GitHub OAuth.
2. No direct public ingress bypass.

### 6. Validate Canary and Alarms

```bash
cd terraform/aws
BUDGET_ALERT_EMAIL="you@example.com" ./scripts/up_and_down.sh up
```

Then in AWS Console:

1. Canary reports Passed for both endpoints.
2. Alarms remain OK in normal state.

### 7. Failure Drill

Scale cloud workload to zero and confirm alarming:

```bash
kubectl --context aws-eks-prod -n production scale deploy/status-api-cloud --replicas=0
```

Validation goal:

1. CloudWatch alarm transitions to ALARM within one evaluation window.

### 8. Lifecycle Coupling Verification

```bash
cd terraform/aws
BUDGET_ALERT_EMAIL="you@example.com" ./scripts/up_and_down.sh down
```

Validation goal:

1. Canary and related alarms are absent after teardown.
