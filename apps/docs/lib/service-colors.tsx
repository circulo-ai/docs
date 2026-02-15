import { CSSProperties } from "react";

export const serviceColors = [
  "--primary",
  "--accent",
  "--sidebar-primary",
  "--sidebar-accent",
];

export function buildServiceColorStyles(color: string) {
  return Object.fromEntries(
    serviceColors.map((cssVar) => [cssVar, color]),
  ) as CSSProperties;
}
