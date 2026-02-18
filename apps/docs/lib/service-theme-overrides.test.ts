import { describe, expect, it } from "vitest";

import {
  buildServiceThemeOverrideStyles,
  extractServiceThemePreview,
  SERVICE_THEME_OVERRIDE_VARIABLES,
} from "@/lib/service-theme-overrides";

describe("service theme overrides", () => {
  it("maps light and dark token values to service override CSS variables", () => {
    const styles = buildServiceThemeOverrideStyles({
      light: {
        background: "oklch(0.99 0.01 120)",
        primary: "oklch(0.6 0.18 240)",
      },
      dark: {
        background: "oklch(0.2 0.01 250)",
        primary: "oklch(0.8 0.09 230)",
      },
    });

    expect(styles).toEqual({
      "--service-light-background": "oklch(0.99 0.01 120)",
      "--service-light-primary": "oklch(0.6 0.18 240)",
      "--service-dark-background": "oklch(0.2 0.01 250)",
      "--service-dark-primary": "oklch(0.8 0.09 230)",
    });
  });

  it("skips blank token values and returns undefined when nothing is set", () => {
    const styles = buildServiceThemeOverrideStyles({
      light: {
        background: "   ",
      },
      dark: {
        primary: "",
      },
    });

    expect(styles).toBeUndefined();
  });

  it("extracts a 2x2 preview palette from light theme tokens", () => {
    const preview = extractServiceThemePreview({
      light: {
        background: "oklch(0.99 0.01 120)",
        primary: "oklch(0.6 0.18 240)",
        secondary: "oklch(0.95 0.02 110)",
        accent: "oklch(0.9 0.04 180)",
      },
    });

    expect(preview).toEqual({
      background: "oklch(0.99 0.01 120)",
      primary: "oklch(0.6 0.18 240)",
      secondary: "oklch(0.95 0.02 110)",
      accent: "oklch(0.9 0.04 180)",
    });
  });

  it("exposes override variable names for both light and dark modes", () => {
    expect(SERVICE_THEME_OVERRIDE_VARIABLES).toContain(
      "--service-light-background",
    );
    expect(SERVICE_THEME_OVERRIDE_VARIABLES).toContain(
      "--service-dark-background",
    );
  });

  it("can include semantic CSS variables used directly by UI components", () => {
    const styles = buildServiceThemeOverrideStyles(
      {
        light: {
          accent: "oklch(0.9 0.04 180)",
          accentForeground: "oklch(0.2 0.01 250)",
        },
      },
      { includeSemanticTokens: true },
    );

    expect(styles).toMatchObject({
      "--service-light-accent": "oklch(0.9 0.04 180)",
      "--service-light-accent-foreground": "oklch(0.2 0.01 250)",
      "--accent": "oklch(0.9 0.04 180)",
      "--accent-foreground": "oklch(0.2 0.01 250)",
    });
  });

  it("prefers dark semantic token values when semanticColorMode is dark", () => {
    const styles = buildServiceThemeOverrideStyles(
      {
        light: {
          accent: "oklch(0.9 0.04 180)",
        },
        dark: {
          accent: "oklch(0.35 0.09 250)",
        },
      },
      { includeSemanticTokens: true, semanticColorMode: "dark" },
    );

    expect(styles).toMatchObject({
      "--service-light-accent": "oklch(0.9 0.04 180)",
      "--service-dark-accent": "oklch(0.35 0.09 250)",
      "--accent": "oklch(0.35 0.09 250)",
    });
  });
});
