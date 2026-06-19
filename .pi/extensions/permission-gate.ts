/**
 * Permission Gate Extension
 *
 * Blocks dangerous commands that violate .ai/SAFE_OPERATIONS.md.
 * Intercepts bash tool calls and matches against forbidden patterns.
 *
 * Consent model (per .ai/SAFE_OPERATIONS.md):
 * - Always-blocked patterns (tofu state modifications) are always enforced.
 * - Infrastructure-modifying patterns (tofu apply, ansible-playbook, etc.) require
 *   explicit operator approval. The operator grants approval by calling the
 *   /approve command, which sets a session-wide bypass flag.
 * - The bypass is session-scoped and resets when the agent restarts.
 * - The operator can revoke with /revoke at any time.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** Session-wide approval flag. Set by /approve, cleared by /revoke or restart. */
let operatorApproval = false;

const alwaysBlocked: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\btofu\s+state\s+(rm|mv|pull|import)\b/, reason: "tofu state modification is forbidden" },
  { pattern: /\bterraform\s+state\s+(rm|mv|pull|import)\b/, reason: "terraform state modification is forbidden" },
];

const approvalRequired: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\btofu\s+apply\b/, reason: "tofu apply requires operator approval — use /approve" },
  { pattern: /\bterraform\s+apply\b/, reason: "terraform apply requires operator approval — use /approve" },
  { pattern: /\btofu\s+destroy\b/, reason: "tofu destroy requires operator approval — use /approve" },
  { pattern: /\bterraform\s+destroy\b/, reason: "terraform destroy requires operator approval — use /approve" },
  { pattern: /\bansible-playbook\b(?!.*--syntax-check)/, reason: "ansible-playbook against live hosts requires operator approval — use /approve" },
  { pattern: /\bkubectl\s+(apply|delete|patch)\b/, reason: "kubectl apply/delete/patch requires operator approval — use /approve" },
  { pattern: /\bhelm\s+(install|upgrade|uninstall)\b/, reason: "helm install/upgrade/uninstall requires operator approval — use /approve" },
  { pattern: /deploy\.sh/, reason: "deploy.sh execution requires operator approval — use /approve" },
];

const dangerousPatterns: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\brm\s+(-rf?|--recursive)\s+/, reason: "recursive delete" },
  { pattern: /\bsudo\b/, reason: "sudo usage" },
  { pattern: /\b(chmod|chown)\b.*777/, reason: "chmod/chown 777" },
];

export default function (pi: ExtensionAPI) {
  // Register /approve and /revoke commands
  pi.on("command", async (event) => {
    if (event.name === "/approve") {
      operatorApproval = true;
      return { output: "✅ Operator approval granted. Infrastructure-modifying commands are now allowed for this session." };
    }
    if (event.name === "/revoke") {
      operatorApproval = false;
      return { output: "❌ Operator approval revoked. All infrastructure-modifying commands now require per-command approval." };
    }
    return undefined;
  });

  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName !== "bash") return undefined;

    const command = event.input.command as string;

    // Always-blocked patterns — never allowed
    for (const { pattern, reason } of alwaysBlocked) {
      if (pattern.test(command)) {
        if (ctx.hasUI) {
          ctx.ui.notify(`BLOCKED: ${reason}`, "error");
        }
        return { block: true, reason };
      }
    }

    // Approval-required patterns — allowed if operator has granted approval
    for (const { pattern, reason } of approvalRequired) {
      if (pattern.test(command)) {
        if (operatorApproval) {
          // Operator has granted blanket approval — allow
          return undefined;
        }
        if (ctx.hasUI) {
          ctx.ui.notify(`BLOCKED: ${reason}`, "error");
        }
        return { block: true, reason };
      }
    }

    // Dangerous patterns (confirm in interactive, block in non-interactive)
    for (const { pattern, reason } of dangerousPatterns) {
      if (pattern.test(command)) {
        if (!ctx.hasUI) {
          return { block: true, reason: `${reason} blocked (no UI for confirmation)` };
        }

        const choice = await ctx.ui.select(
          `⚠️ Dangerous command (${reason}):\n\n  ${command}\n\nAllow?`,
          ["Yes", "No"]
        );

        if (choice !== "Yes") {
          return { block: true, reason: "Blocked by user" };
        }
      }
    }

    return undefined;
  });
}
