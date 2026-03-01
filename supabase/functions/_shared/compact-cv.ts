/**
 * Shared utility: compact CV data for AI consumption.
 * Removes nulls, empty strings, empty arrays, photo_base64, and placeholder values.
 */

const PLACEHOLDER_VALUES = new Set([
  "None", "none", "null", "N/A", "n/a", "undefined", "N/D", "n/d",
  "Not specified", "not specified", "Non specificato", "non specificato",
]);

export function compactCV(data: unknown): unknown {
  if (Array.isArray(data)) {
    const filtered = data
      .map((item) =>
        typeof item === "object" && item !== null
          ? compactCV(item)
          : item
      )
      .filter((item) => item !== null && item !== undefined && item !== "");
    return filtered.length > 0 ? filtered : undefined;
  }

  if (typeof data === "object" && data !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (key === "photo_base64") continue;
      if (value === null || value === undefined || value === "") continue;
      if (typeof value === "string" && PLACEHOLDER_VALUES.has(value.trim())) continue;
      if (Array.isArray(value) && value.length === 0) continue;

      const compacted =
        typeof value === "object" && value !== null
          ? compactCV(value)
          : value;

      if (compacted !== undefined && compacted !== null) {
        result[key] = compacted;
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }

  return data;
}
