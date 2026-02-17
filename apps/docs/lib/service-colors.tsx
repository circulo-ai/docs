import { CSSProperties } from "react";

export const serviceColors = ["--primary", "--sidebar-primary"];

export function buildServiceColorStyles(color: string) {
  return Object.fromEntries(
    serviceColors.map((cssVar) => [cssVar, color]),
  ) as CSSProperties;
}
