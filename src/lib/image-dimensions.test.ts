import { describe, expect, it } from "vitest";
import { dimensionsFromHeader } from "./image-dimensions";

/*
 * Real headers, hand-built, because the point of this module is that it reads
 * a width without downloading a 6000px photograph.
 */
function png(width: number, height: number): Buffer {
  const b = Buffer.alloc(26);
  b.writeUInt32BE(0x89504e47, 0);
  b.writeUInt32BE(width, 16);
  b.writeUInt32BE(height, 20);
  return b;
}

function jpeg(width: number, height: number, padding = 0): Buffer {
  // SOI, an APPn segment of `padding` bytes to push SOF0 off any fixed offset,
  // then SOF0 with the dimensions. This is what EXIF does in a real file.
  const app = padding > 0 ? Buffer.concat([Buffer.from([0xff, 0xe1]), lengthOf(padding), Buffer.alloc(padding)]) : Buffer.alloc(0);
  const sof = Buffer.alloc(11);
  sof.writeUInt8(0xff, 0);
  sof.writeUInt8(0xc0, 1);
  sof.writeUInt16BE(8, 2);
  sof.writeUInt8(8, 4);
  sof.writeUInt16BE(height, 5);
  sof.writeUInt16BE(width, 7);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app, sof, Buffer.alloc(16)]);
}

function lengthOf(padding: number): Buffer {
  const b = Buffer.alloc(2);
  b.writeUInt16BE(padding + 2, 0);
  return b;
}

function gif(width: number, height: number): Buffer {
  const b = Buffer.alloc(14);
  b.write("GIF89a", 0, "ascii");
  b.writeUInt16LE(width, 6);
  b.writeUInt16LE(height, 8);
  return b;
}

describe("dimensionsFromHeader", () => {
  it("reads PNG from the IHDR chunk", () => {
    expect(dimensionsFromHeader(png(1600, 900))).toEqual({ width: 1600, height: 900 });
  });

  it("reads JPEG by walking to SOF0, wherever EXIF has pushed it", () => {
    expect(dimensionsFromHeader(jpeg(4000, 2250))).toEqual({ width: 4000, height: 2250 });
    expect(dimensionsFromHeader(jpeg(4000, 2250, 600))).toEqual({ width: 4000, height: 2250 });
  });

  it("reads GIF", () => {
    expect(dimensionsFromHeader(gif(800, 600))).toEqual({ width: 800, height: 600 });
  });

  /*
   * Unknown must be null, never a number. The publish rule treats null as "no
   * verdict" and lets the save through -- refusing to publish because a header
   * was truncated would be worse than the thing the rule is for.
   */
  it("returns null rather than guessing", () => {
    expect(dimensionsFromHeader(Buffer.alloc(0))).toBeNull();
    expect(dimensionsFromHeader(Buffer.from("not an image at all"))).toBeNull();
    // A JPEG whose segment chain never reaches a frame header.
    expect(dimensionsFromHeader(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00]))).toBeNull();
  });

  it("does not loop forever on a malformed segment length", () => {
    // A declared length of 0 would leave the cursor where it was.
    expect(dimensionsFromHeader(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x00, 0, 0, 0, 0, 0, 0]))).toBeNull();
  });
});
