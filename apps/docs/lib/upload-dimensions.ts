type ResolveUploadRenderDimensionsArgs = {
  fieldHeight?: unknown;
  fieldWidth?: unknown;
  mediaHeight?: unknown;
  mediaWidth?: unknown;
};

const toPositiveNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) return undefined;
    const parsed = Number(normalized);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return undefined;
};

export const resolveUploadRenderDimensions = ({
  fieldHeight,
  fieldWidth,
  mediaHeight,
  mediaWidth,
}: ResolveUploadRenderDimensionsArgs): {
  height: number | undefined;
  width: number | undefined;
} => ({
  height: toPositiveNumber(fieldHeight) ?? toPositiveNumber(mediaHeight),
  width: toPositiveNumber(fieldWidth) ?? toPositiveNumber(mediaWidth),
});
