import { Fragment, createElement, type ReactNode } from "react";

export const renderMultilineText = (value: unknown): ReactNode => {
  if (typeof value !== "string") return null;

  const normalized = value.replace(/\r\n?/g, "\n");
  if (!normalized.includes("\n")) {
    return normalized;
  }

  const lines = normalized.split("\n");
  const nodes: ReactNode[] = [];

  lines.forEach((line, index) => {
    if (index > 0) {
      nodes.push(createElement("br", { key: `linebreak-${index}` }));
    }

    nodes.push(createElement(Fragment, { key: `line-${index}` }, line));
  });

  return createElement(Fragment, {}, ...nodes);
};
