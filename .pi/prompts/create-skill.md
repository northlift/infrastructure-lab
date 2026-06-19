# /create-skill — Distill Knowledge into a Pi Skill

## Purpose
Transform accumulated repo knowledge — from post-mortems, ADRs, phase work, or
archived prompts — into a reusable `.pi/skills/<name>/SKILL.md` that an agent
can load on-demand instead of re-deriving patterns from source files.

## Required Reading
Before starting, read:
- Any existing `.pi/skills/*/SKILL.md` files — use these as reference for
  skill structure and depth
- `AGENTS.md` → "Known Pitfalls" — ensure the skill captures any relevant pitfalls
- Any post-mortems in the docs directory related to the target domain

## Input
Provide one of the following as the knowledge source:
- A domain name (e.g. "gitops", "sealed-secrets") → agent reads all relevant
  ADRs, phase docs, and source files
- A path to a specific archived one-shot or post-mortem → agent uses it as
  primary source
- A freeform description of the pattern to encode

## Design Step (explain before creating)
Before writing the skill, state:
1. What knowledge sources you are drawing from (ADRs, post-mortems, source files)
2. What the skill's scope boundary is — what it covers and explicitly what it
   does NOT cover
3. Any conflicts or gaps found between sources

## Skill Structure
Every skill must include these sections:

### Overview
One paragraph: what this skill covers, when to load it, what it does NOT cover.

### Conventions & Patterns
The repo-specific patterns an agent must follow. Not generic docs — only what
is specific to THIS repo. Use concrete examples from actual files where possible.

### Common Pitfalls
Failures that have actually happened (from post-mortems or ADRs). Format:
- **Pitfall**: what went wrong
- **Symptom**: how it manifests
- **Fix**: what to do

### Validation Checklist
A short checklist the agent runs before considering the task done.

### Reference Files
Paths to the canonical source files for this domain in the repo. Keep this
list short — only files the agent should read for this domain.

## Hard Rules
- NEVER copy generic documentation — only repo-specific conventions
- NEVER include patterns not evidenced in the actual repo files
- Keep the skill under 200 lines — if it's longer, split into two skills
- Prefer concrete examples over abstract descriptions
- Every pitfall must come from a real incident or ADR, not speculation

## Final Response Format
1. Path of the created skill file
2. Knowledge sources used (list each ADR/post-mortem/file consulted)
3. Scope boundary summary (what's in, what's explicitly out)
4. Suggested skill name to use when loading: `load skill <name>`
5. Any gaps found — patterns that exist in the repo but couldn't be fully
   encoded because source material was ambiguous
6. Confirmation: no infrastructure was modified, no apply commands executed
