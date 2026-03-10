import os from "node:os";
import path from "node:path";
import fs from "node:fs";

const DEFAULT_INSTANCE_ID = "default";
const INSTANCE_ID_RE = /^[a-zA-Z0-9_-]+$/;
const PATH_SEGMENT_RE = /^[a-zA-Z0-9_-]+$/;
let resolvedHomeDirCache: string | undefined;

function expandHomePrefix(value: string): string {
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.resolve(os.homedir(), value.slice(2));
  return value;
}

export function resolvePaperclipHomeDir(): string {
  if (resolvedHomeDirCache) return resolvedHomeDirCache;

  const envHome = process.env.PAPERCLIP_HOME?.trim();
  const preferredHome = envHome
    ? path.resolve(expandHomePrefix(envHome))
    : path.resolve(os.homedir(), ".paperclip");

  if (isWritableDirectory(preferredHome)) {
    resolvedHomeDirCache = preferredHome;
    return preferredHome;
  }

  const fallbackHome = path.resolve(os.tmpdir(), "paperclip");
  if (isWritableDirectory(fallbackHome)) {
    console.warn(
      `[paperclip] Home directory '${preferredHome}' is not writable; using fallback '${fallbackHome}'. ` +
      "Set PAPERCLIP_HOME to a writable path to silence this warning.",
    );
    resolvedHomeDirCache = fallbackHome;
    return fallbackHome;
  }

  throw new Error(
    `Paperclip home directory '${preferredHome}' is not writable and fallback '${fallbackHome}' could not be created.`,
  );
}

function isWritableDirectory(dir: string): boolean {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export function resolvePaperclipInstanceId(): string {
  const raw = process.env.PAPERCLIP_INSTANCE_ID?.trim() || DEFAULT_INSTANCE_ID;
  if (!INSTANCE_ID_RE.test(raw)) {
    throw new Error(`Invalid PAPERCLIP_INSTANCE_ID '${raw}'.`);
  }
  return raw;
}

export function resolvePaperclipInstanceRoot(): string {
  return path.resolve(resolvePaperclipHomeDir(), "instances", resolvePaperclipInstanceId());
}

export function resolveDefaultConfigPath(): string {
  return path.resolve(resolvePaperclipInstanceRoot(), "config.json");
}

export function resolveDefaultEmbeddedPostgresDir(): string {
  return path.resolve(resolvePaperclipInstanceRoot(), "db");
}

export function resolveDefaultLogsDir(): string {
  return path.resolve(resolvePaperclipInstanceRoot(), "logs");
}

export function resolveDefaultSecretsKeyFilePath(): string {
  return path.resolve(resolvePaperclipInstanceRoot(), "secrets", "master.key");
}

export function resolveDefaultStorageDir(): string {
  return path.resolve(resolvePaperclipInstanceRoot(), "data", "storage");
}

export function resolveDefaultBackupDir(): string {
  return path.resolve(resolvePaperclipInstanceRoot(), "data", "backups");
}

export function resolveDefaultAgentWorkspaceDir(agentId: string): string {
  const trimmed = agentId.trim();
  if (!PATH_SEGMENT_RE.test(trimmed)) {
    throw new Error(`Invalid agent id for workspace path '${agentId}'.`);
  }
  return path.resolve(resolvePaperclipInstanceRoot(), "workspaces", trimmed);
}

export function resolveHomeAwarePath(value: string): string {
  return path.resolve(expandHomePrefix(value));
}
