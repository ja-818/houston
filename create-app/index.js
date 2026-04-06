#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync, copyFileSync, renameSync } from "fs";
import { join, resolve, extname } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createInterface } from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// Built-in tabs available for manifest selection
// ---------------------------------------------------------------------------

const BUILT_IN_TABS = [
  { id: "chat", label: "Chat", builtIn: "chat" },
  { id: "tasks", label: "Tasks", builtIn: "board" },
  { id: "context", label: "Context", builtIn: "context" },
  { id: "skills", label: "Skills", builtIn: "skills" },
  { id: "learnings", label: "Learnings", builtIn: "learnings" },
  { id: "files", label: "Files", builtIn: "files" },
  { id: "channels", label: "Channels", builtIn: "channels" },
  { id: "connections", label: "Connections", builtIn: "connections" },
  { id: "routines", label: "Routines", builtIn: "routines" },
  { id: "events", label: "Events", builtIn: "events" },
];

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".icns", ".webp", ".svg",
  ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".zip", ".gz", ".tar", ".br",
]);

// ---------------------------------------------------------------------------
// Readline helper
// ---------------------------------------------------------------------------

function createPrompt() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (question, defaultValue) =>
    new Promise((res) => {
      const suffix = defaultValue ? ` (${defaultValue})` : "";
      rl.question(`  ${question}${suffix}: `, (answer) => {
        res(answer.trim() || defaultValue || "");
      });
    });
  const close = () => rl.close();
  return { ask, close };
}

// ---------------------------------------------------------------------------
// Parse args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const positional = args.filter((a) => !a.startsWith("--"));

const mode = flags.has("--app") ? "app" : flags.has("--custom") ? "custom" : "manifest";
const nonInteractive = flags.has("--yes") || !process.stdin.isTTY;
const projectName = positional[0];

if (!projectName) {
  console.log(`
  Usage: npx create-houston-experience <name> [flags]

  Modes:
    (default)   Generate a manifest.json experience definition
    --custom    Generate manifest.json + React project with custom tabs
    --app       Generate a full Tauri 2 desktop app (existing template)

  Examples:
    npx create-houston-experience my-experience
    npx create-houston-experience my-experience --custom
    npx create-houston-experience my-experience --app
`);
  process.exit(1);
}

if (existsSync(projectName)) {
  console.error(`\n  Error: directory "${projectName}" already exists.\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toTitleCase(name) {
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function copyDir(src, dest, replacements) {
  mkdirSync(dest, { recursive: true });

  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);

    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath, replacements);
    } else if (BINARY_EXTENSIONS.has(extname(entry).toLowerCase())) {
      copyFileSync(srcPath, destPath);
    } else {
      let content = readFileSync(srcPath, "utf-8");
      for (const [key, value] of Object.entries(replacements)) {
        content = content.replaceAll(key, value);
      }
      writeFileSync(destPath, content);
    }
  }
}

// ---------------------------------------------------------------------------
// Mode: manifest (default) — generate manifest.json only
// ---------------------------------------------------------------------------

async function runManifestMode() {
  console.log(`\n  Creating experience: ${projectName}\n`);

  let name, description, icon, color, category, tabInput;

  if (nonInteractive) {
    name = toTitleCase(projectName);
    description = "An AI-powered experience";
    icon = "Bot";
    color = "#0d0d0d";
    category = "productivity";
    tabInput = "1,2,3";
  } else {
    const { ask, close } = createPrompt();

    name = await ask("Display name", toTitleCase(projectName));
    description = await ask("Description", "An AI-powered experience");
    icon = await ask("Icon (Lucide name)", "Bot");
    color = await ask("Brand color (hex)", "#0d0d0d");
    category = await ask("Category (productivity/development/research/creative/business)", "productivity");

    console.log("\n  Available tabs:");
    BUILT_IN_TABS.forEach((t, i) => console.log(`    ${i + 1}. ${t.label} (${t.id})`));
    tabInput = await ask("\n  Select tabs (comma-separated numbers, e.g. 1,2,3)", "1,2,3");

    close();
  }

  const selectedIndices = tabInput.split(",").map((s) => parseInt(s.trim(), 10) - 1);
  const tabs = selectedIndices
    .filter((i) => i >= 0 && i < BUILT_IN_TABS.length)
    .map((i) => ({ ...BUILT_IN_TABS[i] }));

  if (tabs.length === 0) {
    tabs.push({ ...BUILT_IN_TABS[0] });
  }

  const manifest = {
    id: projectName,
    name,
    description,
    version: "0.1.0",
    icon,
    color,
    category,
    author: "",
    tags: [],
    tabs,
    defaultTab: tabs[0].id,
    claudeMd: `## Instructions\n\nYou are a helpful AI assistant for ${name}.\n\n## Learnings\n`,
  };

  return { manifest, tabs };
}

// ---------------------------------------------------------------------------
// Mode: manifest — write just manifest.json
// ---------------------------------------------------------------------------

async function scaffoldManifest() {
  const { manifest } = await runManifestMode();
  const targetDir = resolve(projectName);

  mkdirSync(targetDir, { recursive: true });
  writeFileSync(
    join(targetDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );

  console.log(`\n  Done! Created ${projectName}/manifest.json`);
  console.log(`\n  To install, copy to ~/.houston/experiences/${projectName}/\n`);
}

// ---------------------------------------------------------------------------
// Mode: custom — manifest.json + React project
// ---------------------------------------------------------------------------

async function scaffoldCustom() {
  const { manifest, tabs } = await runManifestMode();
  const targetDir = resolve(projectName);
  const customTemplateDir = join(__dirname, "templates", "custom");

  // Copy the custom React project template
  const replacements = {
    "{{NAME}}": projectName,
    "{{NAME_TITLE}}": manifest.name,
  };

  copyDir(customTemplateDir, targetDir, replacements);

  // Add custom tab entries to manifest for each non-builtin example
  const customTab = {
    id: "custom-tab",
    label: "Custom",
    customComponent: "CustomTab",
  };
  manifest.tabs.push(customTab);

  // Write manifest.json
  writeFileSync(
    join(targetDir, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );

  console.log(`\n  Done! Created ${projectName}/ with custom React project.\n`);
  console.log(`  To get started:\n`);
  console.log(`    cd ${projectName}`);
  console.log(`    npm install`);
  console.log(`    npm run build\n`);
  console.log(`  This produces bundle.js — copy the folder to ~/.houston/experiences/${projectName}/\n`);
}

// ---------------------------------------------------------------------------
// Mode: app — full Tauri app (existing behavior)
// ---------------------------------------------------------------------------

function scaffoldApp() {
  const templateDir = join(__dirname, "template");
  const targetDir = resolve(projectName);

  const replacements = {
    "{{APP_NAME}}": projectName,
    "{{APP_NAME_SNAKE}}": projectName.replace(/-/g, "_"),
    "{{APP_NAME_TITLE}}": toTitleCase(projectName),
  };

  console.log(`\n  Creating ${projectName} (full Tauri app)...\n`);
  copyDir(templateDir, targetDir, replacements);

  // Rename special files
  const RENAME_MAP = {
    "Cargo.toml.template": "Cargo.toml",
  };

  for (const [from, to] of Object.entries(RENAME_MAP)) {
    const srcPath = join(targetDir, "src-tauri", from);
    const destPath = join(targetDir, "src-tauri", to);
    if (existsSync(srcPath)) {
      renameSync(srcPath, destPath);
    }
  }

  console.log(`  Done! To get started:\n`);
  console.log(`    cd ${projectName}`);
  console.log(`    pnpm install`);
  console.log(`    pnpm tauri dev\n`);
  console.log(`  Prerequisites:`);
  console.log(`    - Rust toolchain (rustup.rs)`);
  console.log(`    - Claude CLI (claude.ai/code)`);
  console.log(`    - pnpm (pnpm.io)\n`);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

switch (mode) {
  case "manifest":
    await scaffoldManifest();
    break;
  case "custom":
    await scaffoldCustom();
    break;
  case "app":
    scaffoldApp();
    break;
}
