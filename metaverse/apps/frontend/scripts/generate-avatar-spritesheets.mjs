import fs from "node:fs";
import path from "node:path";

// Writes minimal, original pixel-art-ish spritesheets.
// Layout matches existing anim expectations in `game.tsx`:
// - frameWidth: 32, frameHeight: 48
// - total frames: 9 horizontally (0..8)
// - left: 0..3, turn: 4, right: 5..8

const ROOT = path.resolve(
  "c:/Users/Akarsh/OneDrive/Desktop/Projects/Metaverse/metaverse/apps/frontend",
);
const OUT_DIR = path.join(ROOT, "public", "assets", "avatars");

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type);
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function adler32(buf) {
  let a = 1;
  let b = 0;
  for (let i = 0; i < buf.length; i++) {
    a = (a + buf[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function zlibStore(raw) {
  // ZLIB header + DEFLATE stored blocks (no compression) + Adler32
  const parts = [];
  parts.push(Buffer.from([0x78, 0x01])); // zlib header (fastest)

  let i = 0;
  while (i < raw.length) {
    const len = Math.min(0xffff, raw.length - i);
    const final = i + len >= raw.length ? 1 : 0;

    const blockHdr = Buffer.alloc(5);
    blockHdr[0] = final; // BFINAL + BTYPE=00
    blockHdr.writeUInt16LE(len, 1);
    blockHdr.writeUInt16LE(~len & 0xffff, 3);

    parts.push(blockHdr);
    parts.push(raw.subarray(i, i + len));
    i += len;
  }

  const ad = Buffer.alloc(4);
  ad.writeUInt32BE(adler32(raw), 0);
  parts.push(ad);
  return Buffer.concat(parts);
}

function writePngRGBA({ width, height, rgba, outPath }) {
  // raw scanlines: filter byte 0 + RGBA pixels
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter type 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const idat = zlibStore(raw);

  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const out = Buffer.concat([
    pngSig,
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", idat),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);

  fs.writeFileSync(outPath, out);
}

function clamp(v) {
  return Math.max(0, Math.min(255, v | 0));
}

function fillRect(buf, width, x, y, w, h, r, g, b, a = 255) {
  for (let yy = 0; yy < h; yy++) {
    const py = y + yy;
    for (let xx = 0; xx < w; xx++) {
      const px = x + xx;
      const i = (py * width + px) * 4;
      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
      buf[i + 3] = a;
    }
  }
}

function putPixel(buf, width, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0) return;
  const i = (y * width + x) * 4;
  if (i < 0 || i + 3 >= buf.length) return;
  buf[i] = r;
  buf[i + 1] = g;
  buf[i + 2] = b;
  buf[i + 3] = a;
}

function lineH(buf, width, x, y, w, c) {
  for (let i = 0; i < w; i++)
    putPixel(buf, width, x + i, y, c.r, c.g, c.b, c.a ?? 255);
}

function lineV(buf, width, x, y, h, c) {
  for (let i = 0; i < h; i++)
    putPixel(buf, width, x, y + i, c.r, c.g, c.b, c.a ?? 255);
}

function outlineRect(buf, width, x, y, w, h, c) {
  lineH(buf, width, x, y, w, c);
  lineH(buf, width, x, y + h - 1, w, c);
  lineV(buf, width, x, y, h, c);
  lineV(buf, width, x + w - 1, y, h, c);
}

function shade(color, delta) {
  return {
    r: clamp(color.r + delta),
    g: clamp(color.g + delta),
    b: clamp(color.b + delta),
  };
}

const OUTLINE = { r: 15, g: 20, b: 30 };
const PANTS = { r: 60, g: 70, b: 100 };
const SHOE = { r: 30, g: 30, b: 30 };

function drawFaceDetails(buf, sheetW, ox, type, skin) {
  // CHIBI face: larger, with more features.
  const eyeWhite = { r: 250, g: 250, b: 250 };
  const pupil = { r: 20, g: 25, b: 35 };
  const cheek = shade(skin, 15);
  const shadow = shade(skin, -25);

  // eyes (big head but slightly smaller now)
  fillRect(
    buf,
    sheetW,
    ox + 11,
    13,
    3,
    3,
    eyeWhite.r,
    eyeWhite.g,
    eyeWhite.b,
    255,
  );
  fillRect(
    buf,
    sheetW,
    ox + 18,
    13,
    3,
    3,
    eyeWhite.r,
    eyeWhite.g,
    eyeWhite.b,
    255,
  );
  putPixel(buf, sheetW, ox + 12, 15, pupil.r, pupil.g, pupil.b);
  putPixel(buf, sheetW, ox + 19, 15, pupil.r, pupil.g, pupil.b);
  // highlights
  putPixel(buf, sheetW, ox + 11, 13, 255, 255, 255);
  putPixel(buf, sheetW, ox + 18, 13, 255, 255, 255);

  // brows / lashes
  if (type === "woman") {
    lineH(buf, sheetW, ox + 10, 12, 5, { r: 30, g: 20, b: 35 });
    lineH(buf, sheetW, ox + 17, 12, 5, { r: 30, g: 20, b: 35 });
    // lashes
    putPixel(buf, sheetW, ox + 10, 13, 10, 10, 10);
    putPixel(buf, sheetW, ox + 22, 13, 10, 10, 10);
  } else if (type === "old") {
    lineH(buf, sheetW, ox + 10, 12, 5, { r: 210, g: 210, b: 210 });
    lineH(buf, sheetW, ox + 17, 12, 5, { r: 210, g: 210, b: 210 });
  } else {
    lineH(buf, sheetW, ox + 10, 12, 5, { r: 50, g: 35, b: 25 });
    lineH(buf, sheetW, ox + 17, 12, 5, { r: 50, g: 35, b: 25 });
  }

  // Nose
  putPixel(buf, sheetW, ox + 16, 18, shadow.r, shadow.g, shadow.b);
  putPixel(buf, sheetW, ox + 16, 19, shadow.r, shadow.g, shadow.b);

  // Mouth
  if (type === "robot") {
    lineH(buf, sheetW, ox + 11, 21, 10, { r: 140, g: 150, b: 170 });
    // grill
    for (let x = 11; x <= 20; x += 2) {
      putPixel(buf, sheetW, ox + x, 20, 120, 130, 150);
      putPixel(buf, sheetW, ox + x, 22, 120, 130, 150);
    }
  } else if (type === "woman") {
    lineH(buf, sheetW, ox + 12, 21, 8, { r: 190, g: 70, b: 110 });
    putPixel(buf, sheetW, ox + 13, 20, 255, 190, 210); // lip shine
  } else {
    lineH(buf, sheetW, ox + 12, 21, 8, { r: 90, g: 40, b: 50 });
  }

  // cheeks / blush
  if (type === "woman") {
    putPixel(buf, sheetW, ox + 9, 20, 230, 120, 150);
    putPixel(buf, sheetW, ox + 23, 20, 230, 120, 150);
  } else {
    putPixel(buf, sheetW, ox + 9, 20, cheek.r, cheek.g, cheek.b);
    putPixel(buf, sheetW, ox + 23, 20, cheek.r, cheek.g, cheek.b);
  }

  // Extra details
  if (type === "old") {
    // wrinkles
    lineH(buf, sheetW, ox + 10, 19, 5, shadow);
    lineH(buf, sheetW, ox + 18, 19, 5, shadow);
    putPixel(buf, sheetW, ox + 9, 22, shadow.r, shadow.g, shadow.b);
    putPixel(buf, sheetW, ox + 24, 22, shadow.r, shadow.g, shadow.b);
    // glasses
    outlineRect(buf, sheetW, ox + 10, 13, 6, 6, { r: 20, g: 20, b: 20 });
    outlineRect(buf, sheetW, ox + 17, 13, 6, 6, { r: 20, g: 20, b: 20 });
    lineH(buf, sheetW, ox + 16, 16, 2, { r: 20, g: 20, b: 20 });
  }
  if (type === "robot") {
    // LED cheeks
    putPixel(buf, sheetW, ox + 9, 21, 255, 60, 80);
    putPixel(buf, sheetW, ox + 23, 21, 60, 255, 120);
  }
}

function drawHead(buf, sheetW, ox, type, palette) {
  const skin = palette.skin;

  // EXTREME CHIBI: big head, but a bit smaller and much rounder now (24x24).
  // Center it in the 32px frame: x=4..27, y=2..25.
  const headX = ox + 4;
  const headY = 2;
  const headS = 24;
  fillRect(
    buf,
    sheetW,
    headX,
    headY,
    headS,
    headS,
    skin.r,
    skin.g,
    skin.b,
    255,
  );
  outlineRect(buf, sheetW, headX, headY, headS, headS, OUTLINE);

  // Make the silhouette *very* circular.
  // We mask using a circle equation and then re-outline the edge pixels.
  const skinHi = shade(skin, 10);
  const skinLo = shade(skin, -15);

  // Circle mask params.
  const cx = headX + (headS - 1) / 2;
  const cy = headY + (headS - 1) / 2;
  const r = headS / 2;
  const r2 = r * r;
  const inner2 = (r - 0.75) * (r - 0.75);

  for (let y = 0; y < headS; y++) {
    for (let x = 0; x < headS; x++) {
      const px = headX + x;
      const py = headY + y;
      const dx = px + 0.5 - cx;
      const dy = py + 0.5 - cy;
      const d2 = dx * dx + dy * dy;

      // Outside circle => fully transparent.
      if (d2 > r2) {
        putPixel(buf, sheetW, px, py, 0, 0, 0, 0);
        continue;
      }

      // Near the edge => outline ring.
      if (d2 > inner2) {
        putPixel(buf, sheetW, px, py, OUTLINE.r, OUTLINE.g, OUTLINE.b, 255);
        continue;
      }
    }
  }

  // Highlights & shadows around the curve.
  putPixel(
    buf,
    sheetW,
    headX + 6,
    headY + 3,
    skinHi.r,
    skinHi.g,
    skinHi.b,
    255,
  );
  putPixel(
    buf,
    sheetW,
    headX + headS - 7,
    headY + 3,
    skinHi.r,
    skinHi.g,
    skinHi.b,
    255,
  );
  putPixel(
    buf,
    sheetW,
    headX + 6,
    headY + headS - 4,
    skinLo.r,
    skinLo.g,
    skinLo.b,
    255,
  );
  putPixel(
    buf,
    sheetW,
    headX + headS - 7,
    headY + headS - 4,
    skinLo.r,
    skinLo.g,
    skinLo.b,
    255,
  );
  // Forehead highlight block and chin shadow line
  fillRect(
    buf,
    sheetW,
    headX + 1,
    headY + 1,
    headS - 2,
    8,
    shade(skin, 10).r,
    shade(skin, 10).g,
    shade(skin, 10).b,
    255,
  );
  lineH(buf, sheetW, headX + 1, headY + headS - 1, headS - 2, shade(skin, -10));

  // Hair / helmet / turban
  if (type === "woman") {
    const hair = palette.hair;
    // hair cap + sides + gradient strands
    fillRect(buf, sheetW, headX, headY, headS, 11, hair.r, hair.g, hair.b, 255);
    fillRect(
      buf,
      sheetW,
      headX,
      headY + 11,
      4,
      14,
      shade(hair, -20).r,
      shade(hair, -20).g,
      shade(hair, -20).b,
      255,
    );
    fillRect(
      buf,
      sheetW,
      headX + headS - 4,
      headY + 11,
      4,
      14,
      shade(hair, -20).r,
      shade(hair, -20).g,
      shade(hair, -20).b,
      255,
    );
    fillRect(
      buf,
      sheetW,
      headX + 6,
      headY + 12,
      2,
      12,
      shade(hair, -10).r,
      shade(hair, -10).g,
      shade(hair, -10).b,
      255,
    );
    fillRect(
      buf,
      sheetW,
      headX + headS - 8,
      headY + 12,
      2,
      12,
      shade(hair, -10).r,
      shade(hair, -10).g,
      shade(hair, -10).b,
      255,
    );
  } else if (type === "old") {
    const hair = palette.hair;
    // fluffy hair ring + bald shine
    fillRect(buf, sheetW, headX, headY, headS, 6, hair.r, hair.g, hair.b, 255);
    fillRect(buf, sheetW, headX, headY + 6, 4, 8, hair.r, hair.g, hair.b, 255);
    fillRect(
      buf,
      sheetW,
      headX + headS - 4,
      headY + 6,
      4,
      8,
      hair.r,
      hair.g,
      hair.b,
      255,
    );
    fillRect(
      buf,
      sheetW,
      headX + 10,
      headY + 2,
      6,
      3,
      shade(skin, 20).r,
      shade(skin, 20).g,
      shade(skin, 20).b,
      255,
    );
  } else if (type === "robot") {
    const metal = palette.metal;
    fillRect(
      buf,
      sheetW,
      headX,
      headY,
      headS,
      headS,
      metal.r,
      metal.g,
      metal.b,
      255,
    );
    outlineRect(buf, sheetW, headX, headY, headS, headS, {
      r: 40,
      g: 45,
      b: 60,
    });
    // panel lines
    lineH(buf, sheetW, headX + 2, headY + 8, headS - 4, {
      r: 150,
      g: 160,
      b: 180,
    });
    lineH(buf, sheetW, headX + 2, headY + 14, headS - 4, {
      r: 150,
      g: 160,
      b: 180,
    });
    lineV(buf, sheetW, ox + 16, headY + 1, headS - 2, {
      r: 150,
      g: 160,
      b: 180,
    });
    // antenna
    lineV(buf, sheetW, ox + 16, 0, 1, { r: 90, g: 100, b: 125 });
    putPixel(buf, sheetW, ox + 16, 0, 80, 220, 230);
  } else if (type === "sikh") {
    const turban = palette.turban;
    fillRect(
      buf,
      sheetW,
      headX,
      headY,
      headS,
      12,
      turban.r,
      turban.g,
      turban.b,
      255,
    );
    outlineRect(buf, sheetW, headX, headY, headS, 12, OUTLINE);
    // folds
    for (let y = headY + 3; y <= headY + 11; y += 2) {
      lineH(buf, sheetW, headX + 1, y, headS - 2, shade(turban, -25));
    }
    // emblem
    putPixel(buf, sheetW, ox + 16, headY + 5, 255, 220, 120);
  } else {
    // default: small hair strip
    const hair = palette.hair;
    fillRect(buf, sheetW, headX, headY, headS, 7, hair.r, hair.g, hair.b, 255);
  }

  drawFaceDetails(buf, sheetW, ox, type, skin);

  if (type === "sikh") {
    // Beard
    const beard = palette.beard;
    fillRect(buf, sheetW, ox + 6, 25, 20, 5, beard.r, beard.g, beard.b, 255);
    // beard texture
    for (let x = 6; x < 26; x += 2) {
      putPixel(
        buf,
        sheetW,
        ox + x,
        26,
        shade(beard, -25).r,
        shade(beard, -25).g,
        shade(beard, -25).b,
      );
      putPixel(
        buf,
        sheetW,
        ox + x,
        29,
        shade(beard, -35).r,
        shade(beard, -35).g,
        shade(beard, -35).b,
      );
    }
  }
}

function drawBodyShort(buf, sheetW, ox, tint, type, walk) {
  // Short torso per request.
  const shirt = tint;
  const shirtDark = {
    r: clamp(shirt.r - 20),
    g: clamp(shirt.g - 20),
    b: clamp(shirt.b - 20),
  };

  // EXTREME tiny torso ("bits")
  // Place the body right under the giant head (reduce the neck gap).
  const bodyY = 27;
  fillRect(buf, sheetW, ox + 14, bodyY, 4, 3, shirt.r, shirt.g, shirt.b, 255);
  outlineRect(buf, sheetW, ox + 14, bodyY, 4, 3, OUTLINE);

  // Character-specific chest details
  if (type === "robot") {
    // chest panel + LED
    outlineRect(buf, sheetW, ox + 14, bodyY, 4, 3, { r: 40, g: 45, b: 60 });
    putPixel(buf, sheetW, ox + 16, bodyY + 1, 80, 220, 230);
  }
  if (type === "sikh") {
    // kurta buttons
    putPixel(buf, sheetW, ox + 16, bodyY, 255, 220, 150);
    putPixel(buf, sheetW, ox + 16, bodyY + 2, 255, 220, 150);
  }
  if (type === "woman") {
    // necklace
    lineH(buf, sheetW, ox + 14, bodyY - 1, 4, { r: 255, g: 220, b: 120 });
    putPixel(buf, sheetW, ox + 16, bodyY, 255, 220, 120);
  }

  // arms (swing)
  const armDx = walk % 2 === 0 ? 0 : 1;
  // arms as tiny bits
  fillRect(
    buf,
    sheetW,
    ox + 12 - armDx,
    bodyY + 1,
    2,
    2,
    shirtDark.r,
    shirtDark.g,
    shirtDark.b,
    255,
  );
  fillRect(
    buf,
    sheetW,
    ox + 18 + armDx,
    bodyY + 1,
    2,
    2,
    shirtDark.r,
    shirtDark.g,
    shirtDark.b,
    255,
  );
  // hands (1px dots)
  putPixel(buf, sheetW, ox + 12 - armDx, bodyY + 3, 240, 200, 170, 255);
  putPixel(buf, sheetW, ox + 20 + armDx, bodyY + 3, 240, 200, 170, 255);

  // Old person: tiny cane hint (1px) near right hand
  if (type === "old") {
    lineV(buf, sheetW, ox + 22, bodyY + 3, 10, { r: 140, g: 110, b: 70 });
  }

  // legs as tiny bits
  const leg1 = walk % 2 === 0 ? -1 : 1;
  const leg2 = -leg1;
  fillRect(
    buf,
    sheetW,
    ox + 14 + leg1,
    bodyY + 5,
    2,
    4,
    PANTS.r,
    PANTS.g,
    PANTS.b,
    255,
  );
  fillRect(
    buf,
    sheetW,
    ox + 16 + leg2,
    bodyY + 5,
    2,
    4,
    PANTS.r,
    PANTS.g,
    PANTS.b,
    255,
  );

  // extra robot legs
  if (type === "robot") {
    lineV(buf, sheetW, ox + 15 + leg1, bodyY + 4, 7, {
      r: 140,
      g: 150,
      b: 170,
    });
    lineV(buf, sheetW, ox + 17 + leg2, bodyY + 4, 7, {
      r: 140,
      g: 150,
      b: 170,
    });
  }

  // feet
  fillRect(
    buf,
    sheetW,
    ox + 14 + leg1,
    bodyY + 10,
    2,
    2,
    SHOE.r,
    SHOE.g,
    SHOE.b,
    255,
  );
  fillRect(
    buf,
    sheetW,
    ox + 16 + leg2,
    bodyY + 10,
    2,
    2,
    SHOE.r,
    SHOE.g,
    SHOE.b,
    255,
  );
}

function drawPlayerFrame(buf, sheetW, frameIndex, tint, type, palette) {
  const fw = 32;
  const fh = 48;
  const ox = frameIndex * fw;

  // clear frame (transparent)
  fillRect(buf, sheetW, ox, 0, fw, fh, 0, 0, 0, 0);

  // simple char: head, body, legs + slight arm/leg offsets based on frame
  const phase =
    frameIndex <= 3 ? frameIndex : frameIndex >= 5 ? frameIndex - 5 : 0;
  const walk = frameIndex === 4 ? 0 : phase;

  const shadowAlpha = 60;

  // shadow (wider to match big head)
  fillRect(buf, sheetW, ox + 8, 44, 16, 3, 0, 0, 0, shadowAlpha);

  drawHead(buf, sheetW, ox, type, palette);
  drawBodyShort(buf, sheetW, ox, tint, type, walk);
}

// Map color-name to a character archetype so you get distinct looks without changing DB schema.
// (Signup still uses avatar_* SVGs; Phaser maps those to player_* sheets by color.)
const CHARACTERS = {
  blue: {
    type: "robot",
    shirt: { r: 80, g: 130, b: 255 },
    palette: {
      skin: { r: 180, g: 190, b: 210 },
      metal: { r: 190, g: 200, b: 220 },
      hair: { r: 50, g: 60, b: 80 },
    },
  },
  green: {
    type: "sikh",
    shirt: { r: 60, g: 200, b: 120 },
    palette: {
      skin: { r: 224, g: 186, b: 150 },
      turban: { r: 30, g: 160, b: 110 },
      beard: { r: 35, g: 30, b: 28 },
      hair: { r: 35, g: 30, b: 28 },
    },
  },
  purple: {
    type: "woman",
    shirt: { r: 170, g: 90, b: 240 },
    palette: {
      skin: { r: 240, g: 205, b: 175 },
      hair: { r: 80, g: 45, b: 110 },
    },
  },
  orange: {
    type: "old",
    shirt: { r: 245, g: 145, b: 50 },
    palette: {
      skin: { r: 238, g: 200, b: 165 },
      hair: { r: 210, g: 210, b: 210 },
    },
  },
  red: {
    type: "default",
    shirt: { r: 235, g: 70, b: 70 },
    palette: {
      skin: { r: 235, g: 195, b: 160 },
      hair: { r: 60, g: 40, b: 20 },
    },
  },
};

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const [name, cfg] of Object.entries(CHARACTERS)) {
  const width = 32 * 9;
  const height = 48;
  const rgba = Buffer.alloc(width * height * 4);

  for (let frame = 0; frame < 9; frame++) {
    drawPlayerFrame(rgba, width, frame, cfg.shirt, cfg.type, cfg.palette);
  }

  const outPath = path.join(OUT_DIR, `player_${name}.png`);
  writePngRGBA({ width, height, rgba, outPath });
  console.log(`Wrote ${outPath}`);
}
