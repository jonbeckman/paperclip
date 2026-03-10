import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

describe("resolvePaperclipHomeDir", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("uses PAPERCLIP_HOME when writable", async () => {
    process.env.PAPERCLIP_HOME = "~/paperclip-home";

    const homePaths = await import("../home-paths.js");
    expect(homePaths.resolvePaperclipHomeDir()).toBe(path.resolve(os.homedir(), "paperclip-home"));
  });

  it("falls back to os.tmpdir() when PAPERCLIP_HOME is not writable", async () => {
    process.env.PAPERCLIP_HOME = "/paperclip";
    const fallbackHome = path.resolve(os.tmpdir(), "paperclip");

    const originalMkdirSync = fs.mkdirSync;
    vi.spyOn(fs, "mkdirSync").mockImplementation(((target: fs.PathLike, options?: fs.MakeDirectoryOptions & { recursive?: boolean }) => {
      if (path.resolve(String(target)) === "/paperclip") {
        const err = new Error("permission denied") as NodeJS.ErrnoException;
        err.code = "EACCES";
        throw err;
      }
      return originalMkdirSync(target, options as any);
    }) as typeof fs.mkdirSync);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const homePaths = await import("../home-paths.js");
    expect(homePaths.resolvePaperclipHomeDir()).toBe(fallbackHome);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});
