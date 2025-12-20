import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

/**
 * Slices `public/assets/furniture.png` (5 cols x 5 rows) into individual
 * transparent PNG sprites under `public/assets/elements/furniture_sheet/`.
 *
 * Assumptions (based on the provided sheet):
 * - Uniform grid: 5 columns x 5 rows
 * - Transparent background is created by color-keying near-white pixels.
 */

const ROOT = path.resolve(process.cwd(), "..", "frontend");
const INPUTS = [
  {
    name: "furniture_sheet",
    input: path.join(ROOT, "public", "assets", "furniture.png"),
    cols: 5,
    rows: 5,
    names: [
      "table",
      "chair",
      "desk",
      "office_chair",
      "cradle",
      "bookcase",
      "sofa",
      "changing_table",
      "coffee_table",
      "double_decker_bed",
      "bed",
      "night_table",
      "dresser",
      "wardrobe",
      "floor_vase",
      "bath",
      "toilet",
      "bidet",
      "bathroom_cabinet",
      "washbasin",
      "drawer",
      "refrigerator",
      "cooker",
      "washer",
      "shower",
    ],
    // Background in this sheet is mostly white.
    backgroundMode: "white",
  },
  {
    name: "office_workplace_set",
    input: path.join(ROOT, "public", "assets", "office_furniture.jpg"),
    // This is not a strict grid. We'll auto-detect sprites by connected components.
    cols: 0,
    rows: 0,
    names: [],
    // Background in this sheet is solid teal.
    backgroundMode: "teal",
  },
];

const clamp01 = (v) => Math.max(0, Math.min(1, v));

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

// Make near-white pixels transparent.
function toTransparentWhite(img) {
  return img
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      const out = Buffer.from(data);
      for (let i = 0; i < out.length; i += 4) {
        const r = out[i];
        const g = out[i + 1];
        const b = out[i + 2];
        // Treat background as white-ish.
        if (r >= 245 && g >= 245 && b >= 245) {
          out[i + 3] = 0;
        }
      }
      return sharp(out, {
        raw: {
          width: info.width,
          height: info.height,
          channels: 4,
        },
      });
    });
}

// Make teal-ish pixels transparent.
function toTransparentTeal(img) {
  // Target: roughly rgb(10, 120, 140) (your sheet's teal background).
  const target = { r: 10, g: 120, b: 140 };
  const threshold = 75; // color distance threshold

  return img
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      const out = Buffer.from(data);
      for (let i = 0; i < out.length; i += 4) {
        const r = out[i];
        const g = out[i + 1];
        const b = out[i + 2];
        const dr = r - target.r;
        const dg = g - target.g;
        const db = b - target.b;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        // Also catch very similar teals.
        if (dist <= threshold) {
          out[i + 3] = 0;
        }
      }
      return sharp(out, {
        raw: {
          width: info.width,
          height: info.height,
          channels: 4,
        },
      });
    });
}

async function detectSpritesByTransparency(img, { minArea = 500 } = {}) {
  // Very simple connected-components detection on alpha>0.
  const { data, info } = await img
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const visited = new Uint8Array(w * h);
  const getA = (x, y) => data[(y * w + x) * 4 + 3];

  const bounds = [];

  const stack = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (visited[idx]) continue;
      visited[idx] = 1;
      if (getA(x, y) === 0) continue;

      let minX = x,
        maxX = x,
        minY = y,
        maxY = y;
      let area = 0;
      stack.length = 0;
      stack.push([x, y]);

      while (stack.length) {
        const [cx, cy] = stack.pop();
        area++;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        const neighbors = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
        ];
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const nIdx = ny * w + nx;
          if (visited[nIdx]) continue;
          visited[nIdx] = 1;
          if (getA(nx, ny) === 0) continue;
          stack.push([nx, ny]);
        }
      }

      if (area >= minArea) {
        bounds.push({
          left: minX,
          top: minY,
          width: maxX - minX + 1,
          height: maxY - minY + 1,
          area,
        });
      }
    }
  }

  // Sort bigger first for stability.
  bounds.sort((a, b) => b.area - a.area);
  return bounds;
}

function clampBounds(b, imgW, imgH) {
  // If the detected box starts outside the image, it's not usable.
  if (b.left >= imgW || b.top >= imgH) return null;

  const left = Math.max(0, Math.min(imgW - 1, b.left));
  const top = Math.max(0, Math.min(imgH - 1, b.top));
  const width = Math.max(1, Math.min(imgW - left - 1, b.width));
  const height = Math.max(1, Math.min(imgH - top - 1, b.height));

  // If clamping would produce a crop outside bounds, skip.
  if (left + width >= imgW || top + height >= imgH) return null;
  return { left, top, width, height };
}

function trimAndPad(img) {
  // Trim transparent edges; then add small padding so shadows don't get clipped.
  return img.trim().extend({
    top: 2,
    bottom: 2,
    left: 2,
    right: 2,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
}

async function main() {
  for (const spec of INPUTS) {
    if (!fs.existsSync(spec.input)) {
      // Skip missing optional sheets.
      continue;
    }

    const outDir = path.join(ROOT, "public", "assets", "elements", spec.name);
    ensureDir(outDir);

    const results = [];

    const sheetMeta = await sharp(spec.input).metadata();
    if (!sheetMeta.width || !sheetMeta.height)
      throw new Error("Unable to read image dimensions");
    const imgW = sheetMeta.width;
    const imgH = sheetMeta.height;

    if (spec.cols > 0 && spec.rows > 0) {
      const cellW = Math.floor(imgW / spec.cols);
      const cellH = Math.floor(imgH / spec.rows);

      for (let row = 0; row < spec.rows; row++) {
        for (let col = 0; col < spec.cols; col++) {
          const idx = row * spec.cols + col;
          const baseName = spec.names[idx] ?? `item_${idx}`;
          const left = col * cellW;
          const top = row * cellH;

          const safe = clampBounds(
            { left, top, width: cellW, height: cellH },
            imgW,
            imgH,
          );
          if (!safe) continue;
          const extracted = sharp(spec.input).extract(safe);
          const transparent =
            spec.backgroundMode === "white"
              ? await toTransparentWhite(extracted)
              : await toTransparentTeal(extracted);
          const finalImg = trimAndPad(transparent);

          const outFile = path.join(outDir, `${baseName}.png`);
          await finalImg.png().toFile(outFile);
          const outMeta = await sharp(outFile).metadata();
          results.push({
            name: baseName,
            file: outFile,
            width: outMeta.width,
            height: outMeta.height,
          });
        }
      }
    } else {
      // Auto-detect sprites for irregular sheets.
      const baseForDetect =
        spec.backgroundMode === "teal"
          ? await toTransparentTeal(sharp(spec.input))
          : await toTransparentWhite(sharp(spec.input));
      // NOTE: imgW/imgH computed above.
      const sprites = await detectSpritesByTransparency(baseForDetect, {
        minArea: 1200,
      });

      // Keep only a reasonable number (ignore tiny labels like the footer text).
      const filtered = sprites
        .filter((b) => b.width >= 40 && b.height >= 40)
        // Drop huge boxes (usually footer text / borders).
        .filter((b) => b.width < imgW * 0.9 && b.height < imgH * 0.9)
        .slice(0, 40);

      for (let i = 0; i < filtered.length; i++) {
        const b = filtered[i];
        const outName = `office_${String(i).padStart(2, "0")}`;
        const safe = clampBounds(b, imgW, imgH);
        if (!safe) {
          continue;
        }
        const extractedRaw = sharp(spec.input).extract(safe);
        const extracted =
          spec.backgroundMode === "teal"
            ? await toTransparentTeal(extractedRaw)
            : await toTransparentWhite(extractedRaw);
        const outFile = path.join(outDir, `${outName}.png`);
        try {
          const finalImg = trimAndPad(extracted);
          await finalImg.png().toFile(outFile);
        } catch (e) {
          console.error("Failed writing sprite", { outName, safe, imgW, imgH });
          throw e;
        }
        const outMeta = await sharp(outFile).metadata();
        results.push({
          name: outName,
          file: outFile,
          width: outMeta.width,
          height: outMeta.height,
        });
      }
    }

    const manifestPath = path.join(outDir, "manifest.json");
    fs.writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          source: `/assets/${path.basename(spec.input)}`,
          items: results.map((r) => ({
            name: r.name,
            url: `/assets/elements/${spec.name}/${r.name}.png`,
            width: r.width,
            height: r.height,
            static: true,
          })),
        },
        null,
        2,
      ),
    );

    console.log(`Wrote ${results.length} sprites to: ${outDir}`);
    console.log(`Manifest: ${manifestPath}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
