import { type Config } from "prettier";

export function getGlobalPrettierConfig({
  plugins,
  ...config
}: Config = {}): Config {
  return {
    plugins: [
      "prettier-plugin-organize-imports",
      "prettier-plugin-packagejson",
      ...(plugins ?? []),
    ],
    ...config,
  };
}

export default getGlobalPrettierConfig();
