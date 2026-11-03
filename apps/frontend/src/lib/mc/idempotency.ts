/**
 * One idempotency key per user intent (contract §3): create it when the form opens, reuse it for
 * every retry of that same submission, and mint a new one only after the intent succeeded or the
 * user starts a different one. The API requires a UUIDv7 (its timestamp feeds the key-age rule).
 */
export function newIdempotencyKey(now: number = Date.now(), random?: Uint8Array): string {
  const bytes = random ?? crypto.getRandomValues(new Uint8Array(10))
  const b = new Uint8Array(16)
  // 48-bit big-endian millisecond timestamp
  let ms = Math.floor(now)
  for (let i = 5; i >= 0; i--) {
    b[i] = ms % 256 // ms stays below 2^53, so plain arithmetic is exact
    ms = Math.floor(ms / 256)
  }
  b.set(bytes.subarray(0, 10), 6)
  b[6] = (b[6]! & 0x0f) | 0x70 // version 7
  b[8] = (b[8]! & 0x3f) | 0x80 // RFC 4122 variant
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export const UUID_V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
