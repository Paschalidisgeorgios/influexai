/**
 * Shared helpers for i18n sync scripts.
 * Align locale files to de.json structure; missing values fall back to en.json (not de).
 */

export function flatten(obj, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flatten(value, pathKey));
    } else if (typeof value === "string") {
      out[pathKey] = value;
    }
  }
  return out;
}

export function setByPath(obj, pathKey, value) {
  const parts = pathKey.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== "object") cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

export function sortKeys(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortKeys(obj[key]);
      return acc;
    }, {});
}

/** Match de.json key tree; fill gaps with en.json; drop keys not in de.json. */
export function alignToMaster(deNode, enNode, locNode) {
  const out = {};
  for (const [key, deVal] of Object.entries(deNode)) {
    const enVal = enNode?.[key];
    const locVal = locNode?.[key];
    if (deVal && typeof deVal === "object" && !Array.isArray(deVal)) {
      out[key] = alignToMaster(
        deVal,
        typeof enVal === "object" && enVal ? enVal : {},
        typeof locVal === "object" && locVal ? locVal : {}
      );
    } else {
      out[key] =
        typeof locVal === "string"
          ? locVal
          : typeof enVal === "string"
            ? enVal
            : deVal;
    }
  }
  return out;
}
