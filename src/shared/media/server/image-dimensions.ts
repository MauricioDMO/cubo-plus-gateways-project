import "server-only";
import { open } from "node:fs/promises";

/*
 * Intrinsic width and height of an image, read from its header.
 *
 * The media table has no width column, and adding one needs a migration, so
 * the size is read off the file itself. Only the first 64KB is fetched: every
 * format below declares its dimensions in the first few dozen bytes, and
 * pulling a 6000px photograph in full to learn it is 6000px wide would make
 * saving a post slow for no reason.
 *
 * Returns null when the format is not recognised or the header is truncated.
 * Callers must treat that as "unknown", never as "too small" -- refusing to
 * publish because a CDN hiccuped would be worse than the thing the check is
 * for.
 */

export type ImageDimensions = { width: number; height: number };

const HEADER_BYTES = 65536;

/** Read only the header of a local photograph, preserving its natural aspect ratio. */
export async function readImageDimensions(filePath: string): Promise<ImageDimensions | null> {
  const file = await open(filePath, "r").catch(() => null);
  if (!file) return null;
  try {
    const { buffer, bytesRead } = await file.read(Buffer.alloc(HEADER_BYTES), 0, HEADER_BYTES, 0);
    return dimensionsFromHeader(buffer.subarray(0, bytesRead));
  } finally {
    await file.close();
  }
}

export function dimensionsFromHeader(buf: Buffer): ImageDimensions | null {
  // PNG: IHDR is always the first chunk, at a fixed offset.
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  // JPEG: walk the segment chain to the first SOFn. There is no fixed offset,
  // because EXIF and colour profiles sit in front of it and vary in size.
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buf[i + 1];
      // SOF0..SOF15 carry the frame header, except DHT (c4), JPG (c8) and DAC
      // (cc), which share the range and do not.
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      const length = buf.readUInt16BE(i + 2);
      if (length < 2) return null;
      i += 2 + length;
    }
    return null;
  }

  // WebP, in its three container flavours.
  if (buf.length > 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const format = buf.toString("ascii", 12, 16);
    if (format === "VP8X") {
      return { width: (buf.readUIntLE(24, 3) & 0xffffff) + 1, height: (buf.readUIntLE(27, 3) & 0xffffff) + 1 };
    }
    if (format === "VP8 ") {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
    if (format === "VP8L") {
      const bits = buf.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }

  // GIF
  if (buf.length > 10 && buf.toString("ascii", 0, 3) === "GIF") {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }

  return null;
}

export async function fetchImageDimensions(url: string): Promise<ImageDimensions | null> {
  try {
    const res = await fetch(url, {
      headers: { Range: `bytes=0-${HEADER_BYTES - 1}` },
      cache: "no-store",
    });
    if (!res.ok && res.status !== 206) return null;
    return dimensionsFromHeader(Buffer.from(await res.arrayBuffer()));
  } catch {
    return null;
  }
}
