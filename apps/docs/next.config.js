import { loadEnvConfig } from "@next/env";
import path from "node:path";
import process from "node:process";

const projectRoot = path.resolve(process.cwd(), "../..");
loadEnvConfig(projectRoot);

const localhostOrigin = new URL("http://localhost:3000");
const cmsOrigin = (() => {
  const configured = process.env.DOCS_CMS_URL;
  if (!configured) return localhostOrigin;

  try {
    return new URL(configured);
  } catch {
    return localhostOrigin;
  }
})();

const allowLocalIP =
  process.env.NODE_ENV !== "production" ||
  process.env.DOCS_ALLOW_LOCAL_IP === "true";

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
