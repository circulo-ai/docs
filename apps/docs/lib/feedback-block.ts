const WHITESPACE_REGEX = /\s+/g;
const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

const normalizeOrder = (value: number) => {
  if (!Number.isFinite(value)) return 1;
  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : 1;
};

const hashFnv1a = (value: string) => {
  let hash = FNV_OFFSET_BASIS;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
};

export const createFeedbackBlockBody = (value: string) =>
  value.replace(WHITESPACE_REGEX, " ").trim();

export const createFeedbackBlockId = (body: string, order: number) => {
  const normalizedBody = createFeedbackBlockBody(body) || "section";
  const normalizedOrder = normalizeOrder(order);
  return `fb-${hashFnv1a(`${normalizedOrder}:${normalizedBody}`)}`;
};
