/**
 * Shared helpers for reading/writing typed JSON files under `.houston/<type>/<type>.json`.
 *
 * The Rust backend exposes two generic commands (`read_agent_file` / `write_agent_file`);
 * everything else — the per-type folder path, schema validation, timestamps — lives here
 * in TypeScript so the backend stays untyped.
 */

import { invoke } from "@tauri-apps/api/core";
import Ajv, { type ValidateFunction, type Schema } from "ajv";
import { logger } from "../lib/logger";

const ajv = new Ajv({ allErrors: true, strict: false });
const validators = new Map<string, ValidateFunction>();

function getValidator(name: string, schema: Schema): ValidateFunction {
  let v = validators.get(name);
  if (!v) {
    v = ajv.compile(schema);
    validators.set(name, v);
  }
  return v;
}

/** Relative path convention: `.houston/<name>/<name>.json`. */
export function relPath(name: string): string {
  return `.houston/${name}/${name}.json`;
}

/**
 * Read + parse `.houston/<name>/<name>.json`. Returns `fallback` when the file
 * is missing or empty. Validates against the JSON Schema and logs (but doesn't
 * throw) on mismatch — validation failures should surface data bugs, not block
 * the UI.
 */
export async function readAgentJson<T>(
  agentPath: string,
  name: string,
  schema: Schema,
  fallback: T,
): Promise<T> {
  const raw = await invoke<string>("read_agent_file", {
    agent_path: agentPath,
    rel_path: relPath(name),
  });
  if (!raw) return fallback;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    logger.warn(`[agent-file] ${name}: invalid JSON, falling back`, String(e));
    return fallback;
  }
  const validate = getValidator(name, schema);
  if (!validate(parsed)) {
    logger.warn(
      `[agent-file] ${name}: schema validation failed`,
      JSON.stringify(validate.errors),
    );
  }
  return parsed as T;
}

/** Serialize + atomically write `.houston/<name>/<name>.json`. */
export async function writeAgentJson<T>(
  agentPath: string,
  name: string,
  schema: Schema,
  data: T,
): Promise<void> {
  const validate = getValidator(name, schema);
  if (!validate(data)) {
    logger.warn(
      `[agent-file] ${name}: writing data that fails validation`,
      JSON.stringify(validate.errors),
    );
  }
  await invoke<void>("write_agent_file", {
    agent_path: agentPath,
    rel_path: relPath(name),
    content: JSON.stringify(data, null, 2),
  });
}

/** UUID via the Web Crypto API — good enough for in-UI ids. */
export function newId(): string {
  return crypto.randomUUID();
}

/** ISO-8601 timestamp. */
export function now(): string {
  return new Date().toISOString();
}
