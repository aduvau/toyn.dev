/** Width and height of a WebP file (lossy `VP8 `, lossless `VP8L` or extended `VP8X`), or undefined. */
export function webpSize(bytes: Uint8Array): { width: number; height: number } | undefined {
  const text = (start: number, length: number) =>
    String.fromCharCode(...bytes.subarray(start, start + length));
  if (bytes.length < 30 || text(0, 4) !== "RIFF" || text(8, 4) !== "WEBP") return undefined;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  switch (text(12, 4)) {
    case "VP8 ":
      return {
        width: view.getUint16(26, true) & 0x3fff,
        height: view.getUint16(28, true) & 0x3fff,
      };
    case "VP8L": {
      const bits = view.getUint32(21, true);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    case "VP8X": {
      const u24 = (at: number) =>
        (bytes[at] ?? 0) | ((bytes[at + 1] ?? 0) << 8) | ((bytes[at + 2] ?? 0) << 16);
      return { width: u24(24) + 1, height: u24(27) + 1 };
    }
    default:
      return undefined;
  }
}
