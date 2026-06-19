/**
 * Git Checkpoint Extension
 *
 * Creates a lightweight git stash before each agent turn so that /fork
 * can restore the code state to that point. This pairs with your ADR-driven
 * reviewable-change workflow — if the agent goes down a wrong path, forking
 * back also rolls back the files.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  const checkpoints = new Map<string, string>();
  let currentEntryId: string | undefined;

  // Track the current entry ID from the latest tool result
  pi.on("tool_result", async (_event, ctx) => {
    const leaf = ctx.sessionManager.getLeafEntry();
    if (leaf) currentEntryId = leaf.id;
  });

  // Before the LLM makes changes, stash current state
  pi.on("turn_start", async (_event, ctx) => {
    try {
      // Check if we're in a git repo first
      const check = await pi.exec("git", ["rev-parse", "--git-dir"]);
      if (check.code !== 0) return; // not a git repo

      const { stdout } = await pi.exec("git", ["stash", "create"]);
      const ref = stdout.trim();
      if (ref && currentEntryId) {
        checkpoints.set(currentEntryId, ref);
      }
    } catch {
      if (ctx.hasUI) {
        ctx.ui.notify("Git checkpoint failed", "warning");
      }
    }
  });

  // When forking, offer to restore code state
  pi.on("session_before_fork", async (event, ctx) => {
    const ref = checkpoints.get(event.entryId);
    if (!ref) return;

    if (!ctx.hasUI) return;

    const choice = await ctx.ui.select("Restore code state to checkpoint?", [
      "Yes, restore code to that point",
      "No, keep current code",
    ]);

    if (choice?.startsWith("Yes")) {
      await pi.exec("git", ["stash", "apply", ref]);
      ctx.ui.notify("Code restored to checkpoint", "info");
    }
  });

  // Clean up checkpoints when agent finishes
  pi.on("agent_end", async () => {
    checkpoints.clear();
  });
}
