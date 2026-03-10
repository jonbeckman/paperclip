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

  it("throws when PAPERCLIP_HOME is not writable", async () => {
    process.env.PAPERCLIP_HOME = "/paperclip";

    const originalMkdirSync = fs.mkdirSync;
    vi.spyOn(fs, "mkdirSync").mockImplementation(((target: fs.PathLike, options?: fs.MakeDirectoryOptions & { recursive?: boolean }) => {
      if (path.resolve(String(target)) === "/paperclip") {
        const err = new Error("permission denied") as NodeJS.ErrnoException;
        err.code = "EACCES";
        throw err;
      }
      return originalMkdirSync(target, options as any);
    }) as typeof fs.mkdirSync);

    const homePaths = await import("../home-paths.js");
    expect(() => homePaths.resolvePaperclipHomeDir()).toThrow("is not writable");
  });
});
