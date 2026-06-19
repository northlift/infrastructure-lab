You are working in the repository /home/excalt/Projects/infrastracture/infrastructure-lab.

Goal:
Perform a small consistency polish pass on the new Phase 15 Forgejo docs.
This is documentation-only.
Do not change infrastructure, implementation files, or any live deployment logic.

Files to inspect:
- docs/phase15/adr-024-forgejo-second-brain-foundation.md
- docs/phase15/forgejo-second-brain.md
- docs/phase15/forgejo-second-brain-runbook.md
- docs/index.md
- mkdocs.yml
- .ai/KNOWLEDGE_SCHEMA.md
- AGENTS.md

Context:
The Phase 15 docs are already structurally good.
The remaining work is a consistency polish pass:
- The ADR should align more explicitly with the concept doc on initial private access vs future remote access.
- The runbook should stay preparatory and not drift too far into implementation-shaped detail.
- GitHub mirror/bootstrap wording should remain very strict and clearly temporary.
- The docs must stay architecture-first, not deployment-first.

What to fix:
1. ADR access wording:
   - Make the initial state explicitly private/internal only.
   - Make Cloudflare Tunnel + Access clearly future/deferred only.
   - Avoid wording that sounds like remote access is part of the Phase 15 target state.

2. Runbook specificity:
   - Soften any wording that prematurely fixes implementation layout decisions, especially:
     - where configuration files must live in the repo,
     - exact package lists,
     - exact port numbers or network rules,
     - exact backup paths.
   - Keep the runbook useful, but as a preparation guide, not a hidden implementation script.
   - If something is not decided yet, say so plainly.

3. GitHub mirror discipline:
   - Make it explicit that GitHub is temporary support during the proving period.
   - Make it explicit that Forgejo is the target source of truth.
   - Make mirror sync / anti-divergence expectations stronger and clearer.

Constraints:
- Documentation-only.
- No Terraform, Helm, Docker Compose, secrets, or deployment commands.
- No changes to live infra.
- No unrelated doc rewrites.
- Keep the edits small and reviewable.

Preferred style:
- Preserve the existing tone and structure.
- Make only targeted wording changes.
- Do not add new concepts or new sections unless absolutely necessary.
- Do not broaden scope.

Validation:
- If feasible, run `uv run mkdocs build --strict`.
- Do not hide validation failures.
- Report clearly what changed and whether validation passed.

Expected outcome:
- ADR and concept wording are fully aligned.
- The runbook remains preparatory rather than overly implementation-specific.
- GitHub mirror language is unambiguous and temporary.
- No infrastructure is modified.

Final response:
- Summarize the exact wording adjustments made.
- State whether the consistency pass is complete.
- State validation result.
- Confirm no infrastructure was modified.
