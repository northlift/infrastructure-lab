/**
 * Infrastructure Commands Extension
 *
 * Custom commands for the infrastructure-lab workflow:
 *   /validate     — Run all relevant validators based on what changed
 *   /phase-status — Show implemented vs deferred items for a phase
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";

export default function (pi: ExtensionAPI) {
  // ── /validate ──────────────────────────────────────────────────────
  pi.registerCommand("validate", {
    description: "Run all relevant validators for the project",
    handler: async (_args, ctx) => {
      const cwd = ctx.cwd;
      const results: string[] = [];

      const hasFile = (p: string) => fs.existsSync(path.join(cwd, p));
      const hasDir = (p: string) => {
        try { return fs.statSync(path.join(cwd, p)).isDirectory(); } catch { return false; }
      };

      // ── Terraform / OpenTofu ───────────────────────────────────────
      if (hasDir("terraform")) {
        const checkTofu = await pi.exec("which", ["tofu"]);
        if (checkTofu.code === 0) {
          const tfDirs: string[] = [];
          for (const provider of fs.readdirSync(path.join(cwd, "terraform"))) {
            const providerDir = path.join(cwd, "terraform", provider);
            try {
              if (fs.statSync(providerDir).isDirectory()) {
                const hasTf = fs.readdirSync(providerDir).some(f => f.endsWith(".tf"));
                if (hasTf) tfDirs.push(provider);
              }
            } catch { /* skip */ }
          }
          // Per-VM subdirectories under proxmox
          const proxDir = path.join(cwd, "terraform", "proxmox");
          if (fs.existsSync(proxDir)) {
            for (const entry of fs.readdirSync(proxDir)) {
              const entryDir = path.join(proxDir, entry);
              try {
                if (fs.statSync(entryDir).isDirectory()) {
                  const hasTf = fs.readdirSync(entryDir).some(f => f.endsWith(".tf"));
                  if (hasTf && !tfDirs.includes(`proxmox/${entry}`)) {
                    tfDirs.push(`proxmox/${entry}`);
                  }
                }
              } catch { /* skip */ }
            }
          }

          for (const dir of tfDirs) {
            const dirPath = path.join(cwd, "terraform", dir);
            const fmtResult = await pi.exec("tofu", ["fmt", "-check", "-recursive"], { cwd: dirPath });
            if (fmtResult.code !== 0) {
              await pi.exec("tofu", ["fmt", "-recursive"], { cwd: dirPath });
              results.push(`✅ terraform/${dir}: fmt (auto-fixed)`);
            } else {
              results.push(`✅ terraform/${dir}: fmt`);
            }

            const initResult = await pi.exec("tofu", ["init", "-backend=false"], { cwd: dirPath });
            if (initResult.code === 0) {
              const valResult = await pi.exec("tofu", ["validate"], { cwd: dirPath });
              results.push(valResult.code === 0
                ? `✅ terraform/${dir}: validate`
                : `❌ terraform/${dir}: validate — ${valResult.stderr.trim()}`);
            } else {
              results.push(`⚠️ terraform/${dir}: init failed, skipping validate`);
            }
          }
        } else {
          results.push("⚠️ tofu not found, skipping Terraform validation");
        }
      }

      // ── Ansible ────────────────────────────────────────────────────
      const playbooksDir = path.join(cwd, "ansible", "playbooks");
      if (hasDir("ansible") && fs.existsSync(playbooksDir)) {
        const checkAnsible = await pi.exec("which", ["ansible-playbook"]);
        if (checkAnsible.code === 0) {
          try {
            const playbooks = fs.readdirSync(playbooksDir)
              .filter(f => f.endsWith(".yml") || f.endsWith(".yaml"));
            for (const pb of playbooks) {
              const result = await pi.exec("ansible-playbook", ["--syntax-check", pb], { cwd: playbooksDir });
              results.push(result.code === 0
                ? `✅ ansible: ${pb}`
                : `❌ ansible: ${pb} — ${result.stderr.trim()}`);
            }
          } catch { /* no playbooks */ }
        } else {
          results.push("⚠️ ansible-playbook not found, skipping Ansible validation");
        }
      }

      // ── Helm ───────────────────────────────────────────────────────
      if (hasDir("helm")) {
        const checkHelm = await pi.exec("which", ["helm"]);
        if (checkHelm.code === 0) {
          try {
            const entries = fs.readdirSync(path.join(cwd, "helm"));
            for (const entry of entries) {
              const chartDir = path.join(cwd, "helm", entry);
              try {
                if (fs.statSync(chartDir).isDirectory() && fs.existsSync(path.join(chartDir, "Chart.yaml"))) {
                  const result = await pi.exec("helm", ["lint", "."], { cwd: chartDir });
                  results.push(result.code === 0
                    ? `✅ helm: ${entry}`
                    : `❌ helm: ${entry} — ${result.stderr.trim()}`);
                }
              } catch { /* skip */ }
            }
          } catch { /* no charts */ }
        } else {
          results.push("⚠️ helm not found, skipping Helm validation");
        }
      }

      // ── Python / pytest ────────────────────────────────────────────
      if (hasFile("pytest.ini") || hasFile("pyproject.toml") || hasDir("tests")) {
        const checkPytest = await pi.exec("which", ["pytest"]);
        if (checkPytest.code === 0) {
          const result = await pi.exec("pytest", ["-q", "--tb=short"], { cwd });
          results.push(result.code === 0 ? "✅ pytest" : `❌ pytest — ${result.stdout}\n${result.stderr}`);
        } else {
          results.push("⚠️ pytest not found, skipping Python tests");
        }
      }

      // ── Docs / mkdocs ──────────────────────────────────────────────
      if (hasFile("mkdocs.yml")) {
        const checkUv = await pi.exec("which", ["uv"]);
        if (checkUv.code === 0) {
          const result = await pi.exec("uv", ["run", "mkdocs", "build", "--strict"], { cwd });
          results.push(result.code === 0 ? "✅ mkdocs" : `❌ mkdocs — ${result.stderr.trim()}`);
        } else {
          results.push("⚠️ uv not found, skipping mkdocs validation");
        }
      }

      if (results.length === 0) {
        ctx.ui.notify("No recognized project files to validate", "info");
      } else {
        ctx.ui.notify(results.join("\n"), "info");
      }
    },
  });

  // ── /phase-status ──────────────────────────────────────────────────
  pi.registerCommand("phase-status", {
    description: "Show implemented vs deferred items for a phase (usage: /phase-status <N>)",
    getArgumentCompletions: (prefix) => {
      const phases = Array.from({ length: 15 }, (_, i) => String(i + 1));
      const filtered = phases.filter(p => p.startsWith(prefix));
      return filtered.length > 0 ? filtered.map(p => ({ value: p, label: `Phase ${p}` })) : null;
    },
    handler: async (args, ctx) => {
      const phaseNum = args.trim();
      if (!phaseNum) {
        ctx.ui.notify("Usage: /phase-status <phase-number>", "warning");
        return;
      }

      const cwd = ctx.cwd;
      const phaseDir = path.join(cwd, "docs", `phase${phaseNum}`);

      if (!fs.existsSync(phaseDir)) {
        ctx.ui.notify(`No docs directory for Phase ${phaseNum}`, "warning");
        return;
      }

      const files = fs.readdirSync(phaseDir).filter(f => f.endsWith(".md"));
      const adrs: string[] = [];
      const runbooks: string[] = [];
      const others: string[] = [];

      for (const f of files) {
        if (f.startsWith("adr-")) adrs.push(f);
        else if (f.includes("-runbook")) runbooks.push(f);
        else others.push(f);
      }

      // Check implementation artifacts
      const artifacts: Array<{ label: string; path: string }> = [];

      const tfDir = path.join(cwd, "terraform");
      if (fs.existsSync(tfDir)) {
        for (const provider of fs.readdirSync(tfDir)) {
          const providerPath = path.join(tfDir, provider);
          try {
            if (fs.statSync(providerPath).isDirectory()) {
              artifacts.push({ label: `Terraform/${provider}`, path: `terraform/${provider}` });
            }
          } catch { /* skip */ }
        }
      }

      const playbooksDir = path.join(cwd, "ansible", "playbooks");
      if (fs.existsSync(playbooksDir)) {
        try {
          const playbooks = fs.readdirSync(playbooksDir).filter(f => f.endsWith(".yml"));
          for (const pb of playbooks) {
            artifacts.push({ label: `Ansible: ${pb}`, path: `ansible/playbooks/${pb}` });
          }
        } catch { /* skip */ }
      }

      const appsDir = path.join(cwd, "gitops", "apps");
      if (fs.existsSync(appsDir)) {
        const count = fs.readdirSync(appsDir).filter(f => f.endsWith(".yaml")).length;
        if (count > 0) artifacts.push({ label: `GitOps apps (${count})`, path: "gitops/apps/" });
      }

      const helmDir = path.join(cwd, "helm");
      if (fs.existsSync(helmDir)) {
        try {
          for (const entry of fs.readdirSync(helmDir)) {
            const entryPath = path.join(helmDir, entry);
            if (fs.statSync(entryPath).isDirectory()) {
              artifacts.push({ label: `Helm: ${entry}`, path: `helm/${entry}` });
            }
          }
        } catch { /* skip */ }
      }

      const lines: string[] = [
        `## Phase ${phaseNum} Status`,
        "",
        `### Documentation`,
        ...adrs.map(f => `- 📋 ADR: ${f}`),
        ...others.map(f => `- 📄 ${f}`),
        ...runbooks.map(f => `- 📝 Runbook: ${f}`),
        "",
        `### Implementation artifacts`,
        ...artifacts.map(a => `- ✅ ${a.label} (\`${a.path}\`)`),
      ];

      if (artifacts.length === 0) {
        lines.push("- (no implementation artifacts detected — documentation-only phase)");
      }

      ctx.ui.notify(lines.join("\n"), "info");
    },
  });
}
