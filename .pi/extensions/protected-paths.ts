/**
 * Protected Paths Extension
 *
 * Blocks write/edit operations to sensitive files that should never be
 * accidentally overwritten by an agent session.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const protectedPaths: Array<{ pattern: string; reason: string }> = [
  { pattern: ".env", reason: ".env files may contain secrets" },
  { pattern: "terraform.tfvars", reason: "terraform.tfvars may contain credentials" },
  { pattern: ".git/", reason: ".git/ is managed by git" },
  { pattern: "node_modules/", reason: "node_modules/ is managed by npm" },
  { pattern: "sealed-secrets-master-key", reason: "Sealed Secrets master key backup" },
];

export default function (pi: ExtensionAPI) {
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName !== "write" && event.toolName !== "edit") {
      return undefined;
    }

    const path = event.input.path as string;

    for (const { pattern, reason } of protectedPaths) {
      if (path.includes(pattern)) {
        if (ctx.hasUI) {
          ctx.ui.notify(`BLOCKED: Write to "${path}" — ${reason}`, "error");
        }
        return { block: true, reason: `Path "${path}" is protected: ${reason}` };
      }
    }

    return undefined;
  });
}
