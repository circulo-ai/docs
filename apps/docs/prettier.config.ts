import { getGlobalPrettierConfig } from "@repo/prettier-config";

export default getGlobalPrettierConfig({
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindFunctions: ["cn", "cva"],
  tailwindStylesheet: "./app/globals.css",
});
