export function normalizeOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeRequiredName(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}
