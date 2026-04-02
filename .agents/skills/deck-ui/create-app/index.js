#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import { join, resolve, basename } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// Parse args
// ---------------------------------------------------------------------------

const projectName = process.argv[2];

if (!projectName) {
  console.error("\n  Usage: npx create-keel-and-deck-app <project-name>\n");
  process.exit(1);
}

if (existsSync(projectName)) {
  console.error(`\n  Error: directory "${projectName}" already exists.\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Copy template
// ---------------------------------------------------------------------------

const templateDir = join(__dirname, "template");
const targetDir = resolve(projectName);

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });

  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);

    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      let content = readFileSync(srcPath, "utf-8");
      content = content.replaceAll("{{APP_NAME}}", projectName);
      content = content.replaceAll(
        "{{APP_NAME_SNAKE}}",
        projectName.replace(/-/g, "_"),
      );
      content = content.replaceAll(
        "{{APP_NAME_TITLE}}",
        projectName
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
      );
      writeFileSync(destPath, content);
    }
  }
}

console.log(`\n  Creating ${projectName}...\n`);
copyDir(templateDir, targetDir);

// ---------------------------------------------------------------------------
// Done
// ---------------------------------------------------------------------------

console.log(`  Done! To get started:\n`);
console.log(`    cd ${projectName}`);
console.log(`    pnpm install`);
console.log(`    pnpm tauri dev\n`);
console.log(`  Prerequisites:`);
console.log(`    - Rust toolchain (rustup.rs)`);
console.log(`    - Claude CLI (claude.ai/code)`);
console.log(`    - pnpm (pnpm.io)\n`);
