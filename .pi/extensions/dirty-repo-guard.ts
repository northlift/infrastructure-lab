/**
 * Dirty Repo Guard Extension
 *
 * Prevents /new, /resume, /fork when there are uncommitted git changes.
 * Forces commit discipline so IaC changes are never lost during context switches.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

async function checkDirtyRepo(
  pi: ExtensionAPI,
  ctx: ExtensionContext,
  action: string,
): Promise<{ cancel: boolean } | undefined> {
  try {
    const { stdout, code } = await pi.exec("git", ["status", "--porcelain"]);
    if (code !== 0) return; // not a git repo, allow

    const changedFiles = stdout.trim().split("\n").filter(Boolean);
    if (changedFiles.length === 0) return; // clean, allow

    if (!ctx.hasUI) {
      return { cancel: true }; // non-interactive: block
    }

    const choice = await ctx.ui.select(
      `You have ${changedFiles.length} uncommitted file(s). ${action} anyway?`,
      ["Yes, proceed anyway", "No, let me commit first"],
    );

    if (choice !== "Yes, proceed anyway") {
      ctx.ui.notify("Commit your changes first", "warning");
      return { cancel: true };
    }
  } catch {
    // git not available, allow
  }
}

export default function (pi: ExtensionAPI) {
  pi.on("session_before_switch", async (event, ctx) => {
    const action = event.reason === "new" ? "Start new session" : "Switch session";
    return checkDirtyRepo(pi, ctx, action);
  });

  pi.on("session_before_fork", async (_event, ctx) => {
    return checkDirtyRepo(pi, ctx, "Fork session");
  });
}
