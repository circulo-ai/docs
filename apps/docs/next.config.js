import { loadRootEnv, readBooleanEnv, readEnv } from "@repo/env";
import process from "node:process";

loadRootEnv();

const localhostOrigin = new URL("http://localhost:3000");
const cmsOrigin = (() => {
  const configured = readEnv("DOCS_CMS_URL");
  if (!configured) return localhostOrigin;

  try {
    return new URL(configured);
  } catch {
    return localhostOrigin;
  }
})();

const allowLocalIP =
  process.env.NODE_ENV !== "production" ||
  readBooleanEnv("DOCS_ALLOW_LOCAL_IP");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      new URL(`${localhostOrigin.origin}/**`),
      new URL(`${cmsOrigin.origin}/**`),
    ],
    dangerouslyAllowLocalIP: allowLocalIP,
  },
};

export default nextConfig;
