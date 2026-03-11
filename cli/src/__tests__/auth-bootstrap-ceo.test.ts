import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createDbMock, logMock } = vi.hoisted(() => ({
  createDbMock: vi.fn(),
  logMock: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    message: vi.fn(),
  },
}));

vi.mock("@clack/prompts", () => ({
  log: logMock,
}));

vi.mock("drizzle-orm", () => ({
  and: vi.fn((...args: unknown[]) => ({ and: args })),
  eq: vi.fn((...args: unknown[]) => ({ eq: args })),
  gt: vi.fn((...args: unknown[]) => ({ gt: args })),
  isNull: vi.fn((value: unknown) => ({ isNull: value })),
}));

vi.mock("@paperclipai/db", () => ({
  createDb: createDbMock,
  instanceUserRoles: {
    role: "role",
  },
  invites: {
    inviteType: "inviteType",
    revokedAt: "revokedAt",
    acceptedAt: "acceptedAt",
    expiresAt: "expiresAt",
  },
}));

import { bootstrapCeoInvite } from "../commands/auth-bootstrap-ceo.js";

const ORIGINAL_ENV = { ...process.env };

function createMockDb() {
  const end = vi.fn().mockResolvedValue(undefined);
  return {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([
          { expiresAt: new Date("2026-03-14T00:00:00.000Z") },
        ]),
      })),
    })),
    $client: { end },
  };
}

describe("bootstrapCeoInvite", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("supports authenticated env-only deployments without a config file", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "paperclip-bootstrap-"));
    process.env.PAPERCLIP_CONFIG = path.join(tempDir, "config.json");
    process.env.PAPERCLIP_DEPLOYMENT_MODE = "authenticated";
    process.env.PAPERCLIP_PUBLIC_URL = "https://paperclip.skate-pence.ts.net";

    const mockDb = createMockDb();
    createDbMock.mockReturnValue(mockDb);

    await bootstrapCeoInvite({});

    expect(createDbMock).toHaveBeenCalledWith("postgres://paperclip:paperclip@127.0.0.1:54329/paperclip");
    expect(logMock.error).not.toHaveBeenCalled();
    expect(logMock.success).toHaveBeenCalledWith("Created bootstrap CEO invite.");
    expect(
      logMock.message.mock.calls.some(([message]) =>
        String(message).includes("https://paperclip.skate-pence.ts.net/invite/pcp_bootstrap_"),
      ),
    ).toBe(true);
    expect(mockDb.$client.end).toHaveBeenCalled();
  });
});
