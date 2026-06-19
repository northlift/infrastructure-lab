# Knowledge Schema (Frontmatter)

## Purpose
This small YAML frontmatter schema makes the Markdown documentation in this repository easier to use for agentic search, Model Context Protocol (MCP), and Retrieval-Augmented Generation (RAG). It adds a few stable metadata fields to the document content without turning metadata into a separate maintenance process.

## Document Types (`doc_type`)
Each classified document uses exactly one of these types:
- **`overview`**: Entry point and navigation. Describes the overall project or major topics at a high level.
- **`adr`**: Architecture Decision Record, including the decision, rationale, and context.
- **`phase-concept`**: Target state, architecture, and explanation for a project phase.
- **`phase-runbook`**: Operational steps, commands, procedures, and troubleshooting.
- **`guide`**: General technical guidance or explanation for a component.
- **`reference`**: Lookup material, specifications, APIs, or detailed references.

For mixed documents, classify by the dominant purpose. If the mixture is known documentation debt, it can be marked in the optional `issues` field.

## Field Definitions

Frontmatter should appear at the top of each documentation file inside a `---` block.
The core fields are `title`, `doc_type`, and `summary`. All other fields are optional and should only be set when the value is clearly supported by the document content, path, or repository context. Omit metadata instead of filling it artificially.

| Field | Type | Description | When to use | When to omit |
|---|---|---|---|---|
| `title` | String | Clear title of the document. | Always (core field). | - |
| `doc_type` | String | Type (`overview`, `adr`, `phase-concept`, `phase-runbook`, `guide`, `reference`). | Always (core field). | - |
| `summary` | String | Short summary in 1-2 sentences. | Always (core field for search and context selection). | Only when no reliable summary is possible. |
| `status` | String | Lifecycle status, e.g. `draft`, `active`, `archived`, `superseded`. | Mainly for ADRs; for overviews only when the status is actually maintained. | For normal guides, references, and phase documents without a maintained status. |
| `phase` | String | Referenced phase, e.g. `phase1` or `phase14`. | When a document clearly belongs to exactly one phase. | When the document spans phases or the assignment would be unclear. |
| `issues` | List | Optional diagnostic field for known documentation debt, e.g. "Mix of concept and runbook". | Only when the marker helps later cleanup or search. | Omit in normal cases; it is not a core part of the schema. |

Additional fields such as `tags`, `related_components`, `source_of_truth`, or `last_verified` are not part of the standard schema. Do not add them just to make frontmatter look more complete.

## Examples

**ADR example (`docs/phase14/adr-023-progressive-delivery-strategy.md`):**
```yaml
---
title: "ADR 023: Progressive Delivery Strategy"
doc_type: adr
status: active
phase: phase14
summary: "Decision to introduce Argo Rollouts for progressive delivery and store deployment events for DORA metrics."
---
```

**Phase concept example (`docs/phase14/progressive-delivery.md`):**
```yaml
---
title: "Phase 14: Progressive Delivery and DORA Metrics"
doc_type: phase-concept
phase: phase14
summary: "Architecture and safety model for Phase 14 progressive delivery, deployment event persistence, and DORA reporting."
---
```

**Phase runbook example (`docs/phase14/progressive-delivery-runbook.md`):**
```yaml
---
title: "Phase 14 Progressive Delivery Runbook"
doc_type: phase-runbook
phase: phase14
summary: "Operational secret generation, rollout verification, deployment-event checks, and Grafana validation for Phase 14 progressive delivery."
---
```
