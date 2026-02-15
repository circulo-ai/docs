import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(packageDir, "..", "..");

describe("@repo/env", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads root env once", async () => {
    const loadEnvConfig = vi.fn();
    vi.doMock("@next/env", () => ({
      default: {
        loadEnvConfig,
      },
    }));

    const { loadRootEnv } = await import("./index.js");
    loadRootEnv();
    loadRootEnv();

    expect(loadEnvConfig).toHaveBeenCalledTimes(1);
    expect(loadEnvConfig).toHaveBeenCalledWith(repoRoot);
  });

  it("reads and normalizes env values", async () => {
    const { readEnv } = await import("./index.js");
    const env = {
      QUOTED: " ' hello ' ",
      MULTILINE_ESCAPED: "'line-1\\nline-2'",
      BLANK: "    ",
    };

    expect(readEnv("QUOTED", { env, load: false })).toBe("hello");
    expect(readEnv("MULTILINE_ESCAPED", { env, load: false })).toBe(
      "line-1\nline-2",
    );
    expect(readEnv("BLANK", { env, load: false })).toBeUndefined();
    expect(
      readEnv("MISSING", { env, load: false, defaultValue: "fallback" }),
    ).toBe("fallback");
  });

  it("reads booleans and multiline values", async () => {
    const { readBooleanEnv, readMultilineEnv } = await import("./index.js");
    const env = {
      BOOL_TRUE: "true",
      BOOL_FALSE: "false",
      MULTILINE: "'line-1\\nline-2'",
    };

    expect(readBooleanEnv("BOOL_TRUE", { env, load: false })).toBe(true);
    expect(readBooleanEnv("BOOL_FALSE", { env, load: false })).toBe(false);
    expect(
      readBooleanEnv("MISSING_BOOL", {
        env,
        load: false,
        defaultValue: true,
      }),
    ).toBe(true);

    expect(readMultilineEnv("MULTILINE", { env, load: false })).toBe(
      "line-1\nline-2",
    );
  });
});
