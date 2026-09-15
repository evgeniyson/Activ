/**
 * Small deterministic hashing helpers. Used to derive stable pseudo-random
 * factors (market wobble, mock identification) so that demo data never
 * changes between reloads.
 */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** Deterministic float in [0, 1) derived from a string. */
export function unitHash(input: string): number {
  return fnv1a(input) / 0xffffffff;
}

/** Deterministic float in [-1, 1] derived from a string. */
export function signedHash(input: string): number {
  return unitHash(input) * 2 - 1;
}

export function stableId(prefix: string, input: string): string {
  const h = fnv1a(input).toString(16).padStart(8, "0");
  const h2 = fnv1a(input + "|salt").toString(16).padStart(8, "0");
  return `${prefix}_${h}${h2}`;
}
