export function fnv1a(input) {
  let hash = 0x811c9dc5 >>> 0; // 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0; // 16777619
  }
  return hash >>> 0;
}

export function mulberry32(seed) {
  let t = seed >>> 0;
  return function rand() {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t ^ (t >>> 15);
    r = Math.imul(r, 1 | r);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}