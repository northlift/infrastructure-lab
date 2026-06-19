---
title: "Phase 13: Full-Picture Observability"
doc_type: phase-concept
phase: phase13
summary: "Architecture and resource model for the Phase 13 observability stack, combining K3s whitebox telemetry with AWS blackbox canaries."
---

# Phase 13: Full-Picture Observability

Phase 13 introduces a dual-layer observability strategy:

1. Whitebox observability inside K3s with Prometheus + Loki + Grafana.
2. Blackbox uptime validation from AWS with CloudWatch Synthetics.

## Architecture

```mermaid
graph LR
    subgraph K3S["Proxmox K3s (6 GB RAM)"]
      Pods[Pods] -->|scrape every 60s| Prometheus[Prometheus]
      Prometheus --> Grafana[Grafana]
      Pods -->|logs| Promtail[Promtail]
      Promtail --> Loki[Loki]
      Loki --> Grafana
    end

    Grafana -->|tunnel route| CFZT[Cloudflare Zero Trust]
    CFZT --> GH[GitHub OAuth Gate]
    GH --> Operators[Platform Operators]

    subgraph AWS["AWS (EKS lifecycle-coupled)"]
      Canary[CloudWatch Synthetics Canary\n1 run per hour\nchecks northlift.net + aws.northlift.net]
      Canary --> CWAlarm[CloudWatch Alarms\nSuccessPercent < 100 OR Duration > 5000ms]
      CWAlarm --> SNS[SNS: infrastructure-lab-budget-alerts]
    end
```

## Resource Budget

### K3s Observability Limits

| Component | Requests | Limits | Notes |
|---|---|---|---|
| Prometheus | 100m CPU / 192Mi | 300m CPU / 256Mi | Retention 3d, scrape interval 60s |
| Grafana | 50m CPU / 64Mi | 150m CPU / 128Mi | Includes Loki datasource |
| Alertmanager | 20m CPU / 32Mi | 50m CPU / 64Mi | Minimal alert routing footprint |
| kube-state-metrics | 20m CPU / 32Mi | 50m CPU / 64Mi | Cluster object state metrics |
| node-exporter | 10m CPU / 16Mi | 30m CPU / 32Mi | Host/node-level metrics |
| Loki | 50m CPU / 64Mi | 150m CPU / 128Mi | Retention 72h, PVC capped at 5Gi |
| Promtail | 10m CPU / 16Mi | 30m CPU / 32Mi | DaemonSet log shipping |

### Capacity Baseline

| Item | Memory Estimate |
|---|---:|
| K3s platform baseline | ~1.6 Gi |
| Observability stack | ~650 Mi |
| OS safety buffer | ~400 Mi |
| Total baseline | ~2.65 Gi |
| VM provisioned memory | 6.0 Gi |
| Remaining headroom | ~3.35 Gi |

## GitOps Components

| Layer | File |
|---|---|
| ArgoCD app (metrics) | `gitops/apps/observability.yaml` |
| ArgoCD app (logs) | `gitops/apps/loki-stack.yaml` |
| Prometheus/Grafana values | `gitops/values-observability.yaml` |
| Loki/Promtail values | `gitops/values-loki.yaml` |

## Operations

Operational deployment, validation, failure-drill, and lifecycle checks live in the [Phase 13 Observability Runbook](observability-runbook.md).
