/**
 * Status Line Extension
 *
 * Shows a persistent status in the footer:
 *   - Current detected phase (from the latest phase-N directory with content)
 *   - Turn progress indicator
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";

function detectActivePhase(cwd: string): string | null {
  const docsDir = path.join(cwd, "docs");
  if (!fs.existsSync(docsDir)) return null;

  let latestPhase: number | null = null;
  for (const entry of fs.readdirSync(docsDir)) {
    const match = entry.match(/^phase(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (latestPhase === null || num > latestPhase) {
        latestPhase = num;
      }
    }
  }
  return latestPhase !== null ? `Phase ${latestPhase}` : null;
}

export default function (pi: ExtensionAPI) {
  let turnCount = 0;

  pi.on("session_start", async (_event, ctx) => {
    const phase = detectActivePhase(ctx.cwd);
    const theme = ctx.ui.theme;
    const base = phase ? `${phase} • ` : "";
    ctx.ui.setStatus("infra-status", theme.fg("dim", base + "ready"));
  });

  pi.on("turn_start", async (_event, ctx) => {
    turnCount++;
    const theme = ctx.ui.theme;
    const spinner = theme.fg("accent", "●");
    const text = theme.fg("dim", ` turn ${turnCount}`);
    ctx.ui.setStatus("infra-status", spinner + text);
  });

  pi.on("turn_end", async (_event, ctx) => {
    const theme = ctx.ui.theme;
    const check = theme.fg("success", "✔");
    const text = theme.fg("dim", ` turn ${turnCount} done`);
    ctx.ui.setStatus("infra-status", check + text);
  });
}
