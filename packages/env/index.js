import nextEnv from "@next/env";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const packageDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(packageDir, "..", "..");
const { loadEnvConfig } = nextEnv;

let hasLoadedRootEnv = false;

const stripWrappingQuotes = (value) => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
};

const normalizeEscapedNewlines = (value) => value.replace(/\\n/g, "\n");

const normalizeEnvValue = (value) => {
  if (typeof value !== "string") return undefined;
  const normalized = normalizeEscapedNewlines(
    stripWrappingQuotes(value.trim()),
  ).trim();
  return normalized.length > 0 ? normalized : undefined;
};

const shouldLoadRootEnv = (env, load) => load && env === process.env;

export const loadRootEnv = () => {
  if (hasLoadedRootEnv) return;

  loadEnvConfig(repoRoot);
  hasLoadedRootEnv = true;
};

export const readEnv = (name, options = {}) => {
  const { env = process.env, defaultValue, load = true } = options;
  if (shouldLoadRootEnv(env, load)) {
    loadRootEnv();
  }

  return normalizeEnvValue(env[name]) ?? defaultValue;
};

export const readBooleanEnv = (name, options = {}) => {
  const { defaultValue = false, ...rest } = options;
  const value = readEnv(name, rest);
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === "true";
};

export const readMultilineEnv = (name, options = {}) => {
  const value = readEnv(name, options);
  if (value === undefined) return undefined;
  return value.replace(/\\n/g, "\n").trim();
};
