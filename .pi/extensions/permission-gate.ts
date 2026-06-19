/**
 * Permission Gate Extension
 *
 * Blocks dangerous commands that violate .ai/SAFE_OPERATIONS.md.
 * Intercepts bash tool calls and matches against forbidden patterns.
 *
 * In non-interactive mode (print/json/rpc), blocks silently.
 * In interactive mode, prompts for confirmation.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const forbiddenPatterns: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\btofu\s+apply\b/, reason: "tofu apply is forbidden without explicit operator approval" },
  { pattern: /\bterraform\s+apply\b/, reason: "terraform apply is forbidden without explicit operator approval" },
  { pattern: /\btofu\s+destroy\b/, reason: "tofu destroy is forbidden without explicit operator approval" },
  { pattern: /\bterraform\s+destroy\b/, reason: "terraform destroy is forbidden without explicit operator approval" },
  { pattern: /\btofu\s+state\s+(rm|mv|pull|import)\b/, reason: "tofu state modification is forbidden" },
  { pattern: /\bterraform\s+state\s+(rm|mv|pull|import)\b/, reason: "terraform state modification is forbidden" },
  { pattern: /\bansible-playbook\b(?!.*--syntax-check)/, reason: "ansible-playbook against live hosts requires explicit approval (syntax checks are OK)" },
  { pattern: /\bkubectl\s+(apply|delete|patch)\b/, reason: "kubectl apply/delete/patch against live clusters requires explicit approval" },
  { pattern: /\bhelm\s+(install|upgrade|uninstall)\b/, reason: "helm install/upgrade/uninstall against live clusters requires explicit approval" },
  { pattern: /deploy\.sh/, reason: "deploy.sh execution is forbidden without explicit operator approval" },
];

const dangerousPatterns: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\brm\s+(-rf?|--recursive)\s+/, reason: "recursive delete" },
  { pattern: /\bsudo\b/, reason: "sudo usage" },
  { pattern: /\b(chmod|chown)\b.*777/, reason: "chmod/chown 777" },
];

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName !== "bash") return undefined;

    const command = event.input.command as string;

    // Check forbidden patterns first (always blocked)
    for (const { pattern, reason } of forbiddenPatterns) {
      if (pattern.test(command)) {
        if (ctx.hasUI) {
          ctx.ui.notify(`BLOCKED: ${reason}`, "error");
        }
        return { block: true, reason };
      }
    }

    // Check dangerous patterns (confirm in interactive, block in non-interactive)
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
