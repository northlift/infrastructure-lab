---
description: Transform a specific task prompt into a reusable prompt template
argument-hint: "<path-to-specific-prompt>"
---
## Goal

Transform the specific task prompt at $1 into a reusable prompt template. Read the file first, then output the template to stdout for review.

## Required Reading for Context

Read these files first to understand the repo's template conventions:
1. `.pi/prompts/plan.md` — existing general template to mirror structure
2. `AGENTS.md` — agent rules and validation requirements
3. `.ai/KNOWLEDGE_SCHEMA.md` — frontmatter standards for doc-type tasks

## Transformation Rules

1. **Keep the structure.** Preserve required-reading lists, hard rules, validation steps, and final-response format.
2. **Generalize task-specific content.** Replace hardcoded values (phase numbers, service names, file paths, specific technologies) with positional arguments (`$1`, `$2`, `$@`).
3. **Update frontmatter.**
   - `description`: Describe what the template does generically, so it appears correctly in pi's autocomplete.
   - `argument-hint`: Specify required args in `<angle brackets>` and optional args in `[square brackets]`.
4. **Keep constraints intact.** Hard rules, do-not-do lists, and validation requirements must remain explicit and repo-specific.
5. **Do NOT execute the task.** Only transform the prompt text. This is a meta-task: prompt engineering, not task execution.
6. **Keep it concise.** Merge repetitive sections. Remove prose that only made sense for the one-shot version.

## Validation

After producing the template:
1. Read back both the specific prompt and the generated template side by side.
2. Verify no task-specific content is hardcoded in the template.
3. Verify all `$1`/`$@` placeholders are defined in `argument-hint`.
4. Flag any ambiguities a future agent would face when invoked via `/template-name <args>`.

## Final Response

Summarize:
- What was generalized (list specific → generic mappings)
- The generated template text
- Any remaining ambiguities or trade-offs
- Validation result

Do not run `mkdocs build` or any other validation commands — this is purely a text transformation task.
