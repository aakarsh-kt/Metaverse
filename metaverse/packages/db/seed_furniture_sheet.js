/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

// Reads the generated manifest from the sprite slicer and upserts Element rows.
//
// Expected manifest location:
// apps/frontend/public/assets/elements/furniture_sheet/manifest.json

const prisma = new PrismaClient();

async function main() {
  const repoRoot = path.resolve(__dirname, "..", "..");

  const manifestPaths = [
    path.join(
      repoRoot,
      "apps",
      "frontend",
      "public",
      "assets",
      "elements",
      "furniture_sheet",
      "manifest.json",
    ),
    path.join(
      repoRoot,
      "apps",
      "frontend",
      "public",
      "assets",
      "elements",
      "office_workplace_set",
      "manifest.json",
    ),
  ];

  for (const manifestPath of manifestPaths) {
    if (!fs.existsSync(manifestPath)) {
      console.warn(`⚠️ Manifest not found at ${manifestPath}, skipping.`);
      continue;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const items = Array.isArray(manifest?.items) ? manifest.items : [];
    if (items.length === 0) {
      console.warn(`⚠️ Manifest has no items at ${manifestPath}, skipping.`);
      continue;
    }

    console.log(
      `🌱 Seeding ${items.length} furniture elements from ${path.basename(path.dirname(manifestPath))}...`,
    );

    for (const item of items) {
      const imageUrl = item.url;
      const width = 1; // grid width (game units) - keep 1x1 by default
      const height = 1; // grid height (game units)
      const isStatic = item.static === true; // default true

      const existing = await prisma.element.findFirst({ where: { imageUrl } });
      if (existing) {
        await prisma.element.update({
          where: { elementID: existing.elementID },
          data: { width, height, static: isStatic },
        });
      } else {
        await prisma.element.create({
          data: { width, height, imageUrl, static: isStatic },
        });
      }
    }
  }

  console.log("✅ Furniture element seeding complete");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
