/**
 * Native audio chunks arrive as base64-encoded 16-bit little-endian PCM. This
 * converts them to the normalized Float32 samples (range [-1, 1]) that the
 * pitch detector expects. Implemented without `atob`/`Buffer` so it runs the
 * same on Hermes (iOS/Android) and in Node tests.
 */

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const LOOKUP = new Uint8Array(256);
for (let i = 0; i < BASE64_CHARS.length; i++) {
  LOOKUP[BASE64_CHARS.charCodeAt(i)] = i;
}

function base64ToBytes(base64: string): Uint8Array {
  let length = base64.length;
  if (base64[length - 1] === '=') length--;
  if (base64[length - 1] === '=') length--;
  const byteLength = (length * 3) >> 2;
  const bytes = new Uint8Array(byteLength);

  let p = 0;
  for (let i = 0; i + 3 < base64.length; i += 4) {
    const a = LOOKUP[base64.charCodeAt(i)];
    const b = LOOKUP[base64.charCodeAt(i + 1)];
    const c = LOOKUP[base64.charCodeAt(i + 2)];
    const d = LOOKUP[base64.charCodeAt(i + 3)];
    if (p < byteLength) bytes[p++] = (a << 2) | (b >> 4);
    if (p < byteLength) bytes[p++] = (b << 4) | (c >> 2);
    if (p < byteLength) bytes[p++] = (c << 6) | d;
  }
  return bytes;
}

/** Decode a base64 16-bit PCM chunk to normalized Float32 samples. */
export function base64Pcm16ToFloat32(base64: string): Float32Array {
  const bytes = base64ToBytes(base64);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const sampleCount = view.byteLength >> 1;
  const samples = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    // little-endian signed 16-bit -> [-1, 1)
    samples[i] = view.getInt16(i * 2, true) / 32768;
  }
  return samples;
}
