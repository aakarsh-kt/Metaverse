/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");

// Creates 2 different office maps.
// - Open Office (team desks + lounge)
// - Meeting Suite (conference rooms + reception)
//
// This script prefers elements that already exist in the DB:
// - Old seeds: /assets/elements/desk_0.png, chair_*.png, table_*.png, plant_*.png
// - New slicer output: /assets/elements/office_workplace_set/*.png
// - Furniture sheet: /assets/elements/furniture_sheet/*.png
//
// It does NOT create new Element rows; it only composes Maps + MapElements.

const prisma = new PrismaClient();

async function findElementByImageUrlContains(substr) {
  return prisma.element.findFirst({
    where: { imageUrl: { contains: substr } },
  });
}

async function findElementByExactUrl(url) {
  return prisma.element.findFirst({ where: { imageUrl: url } });
}

async function ensureFreshMap(name, { width, height, thumbnail }) {
  const existing = await prisma.map.findFirst({ where: { name } });
  if (existing) {
    await prisma.mapElements.deleteMany({ where: { mapID: existing.mapID } });
    await prisma.map.delete({ where: { mapID: existing.mapID } });
  }

  return prisma.map.create({ data: { name, width, height, thumbnail } });
}

function pushIf(mapElements, mapID, element, x, y) {
  if (!element) return;
  mapElements.push({ mapID, elementID: element.elementID, x, y });
}

async function main() {
  console.log("🌱 Seeding 2 office maps...");

  // Common elements (try multiple sources in priority order)
  const plant =
    (await findElementByExactUrl(
      "/assets/elements/furniture_sheet/floor_vase.png",
    )) ?? (await findElementByImageUrlContains("plant_0"));

  const chair =
    (await findElementByExactUrl(
      "/assets/elements/furniture_sheet/office_chair.png",
    )) ?? (await findElementByImageUrlContains("chair_0"));

  const desk =
    (await findElementByExactUrl(
      "/assets/elements/furniture_sheet/desk.png",
    )) ?? (await findElementByImageUrlContains("desk_0"));

  const table =
    (await findElementByExactUrl(
      "/assets/elements/furniture_sheet/table.png",
    )) ?? (await findElementByImageUrlContains("table_0"));

  // A couple of richer assets from office_workplace_set if present.
  // Names are office_00.png... office_33.png; we'll pick a few by existence.
  const ow00 = await findElementByExactUrl(
    "/assets/elements/office_workplace_set/office_00.png",
  );
  const ow02 = await findElementByExactUrl(
    "/assets/elements/office_workplace_set/office_02.png",
  );
  const ow05 = await findElementByExactUrl(
    "/assets/elements/office_workplace_set/office_05.png",
  );
  const ow10 = await findElementByExactUrl(
    "/assets/elements/office_workplace_set/office_10.png",
  );

  // ---- Map 1: Open Office ----
  const map1 = await ensureFreshMap("Open Office", {
    width: 28,
    height: 20,
    thumbnail: "/assets/office_furniture.jpg",
  });

  const map1Elems = [];

  // Border plants
  for (const x of [0, map1.width - 1]) {
    for (const y of [0, map1.height - 1]) {
      pushIf(map1Elems, map1.mapID, plant, x, y);
    }
  }

  // Desk pods (3 columns x 2 rows)
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const baseX = 3 + col * 7;
      const baseY = 3 + row * 7;

      // Core desk/table
      pushIf(map1Elems, map1.mapID, desk ?? table, baseX, baseY);

      // Chairs around
      pushIf(map1Elems, map1.mapID, chair, baseX - 1, baseY);
      pushIf(map1Elems, map1.mapID, chair, baseX + 2, baseY);
    }
  }

  // Lounge area
  pushIf(map1Elems, map1.mapID, ow10 ?? table, 20, 14);
  pushIf(map1Elems, map1.mapID, ow05 ?? chair, 19, 14);
  pushIf(map1Elems, map1.mapID, ow05 ?? chair, 22, 14);

  // Accent assets
  pushIf(map1Elems, map1.mapID, ow00 ?? plant, 14, 1);
  pushIf(map1Elems, map1.mapID, ow02 ?? plant, 14, 18);

  await prisma.mapElements.createMany({ data: map1Elems });
  console.log(
    `✅ Map created: ${map1.name} (${map1.mapID}) elements=${map1Elems.length}`,
  );

  // ---- Map 2: Meeting Suite ----
  const map2 = await ensureFreshMap("Meeting Suite", {
    width: 22,
    height: 22,
    thumbnail: "/assets/carpet.jpg",
  });

  const map2Elems = [];

  // Reception desk-ish
  pushIf(map2Elems, map2.mapID, ow02 ?? desk ?? table, 9, 2);
  pushIf(map2Elems, map2.mapID, chair, 11, 1);

  // Conference room table + chairs (center)
  pushIf(map2Elems, map2.mapID, table ?? desk, 10, 10);
  for (const [x, y] of [
    [9, 9],
    [10, 9],
    [11, 9],
    [9, 12],
    [10, 12],
    [11, 12],
    [8, 10],
    [8, 11],
    [13, 10],
    [13, 11],
  ]) {
    pushIf(map2Elems, map2.mapID, chair, x, y);
  }

  // Plants to soften corners
  for (const [x, y] of [
    [1, 1],
    [20, 1],
    [1, 20],
    [20, 20],
    [1, 11],
    [20, 11],
  ]) {
    pushIf(map2Elems, map2.mapID, plant, x, y);
  }

  // Waiting area
  pushIf(map2Elems, map2.mapID, ow10 ?? table, 5, 18);
  pushIf(map2Elems, map2.mapID, ow05 ?? chair, 4, 18);
  pushIf(map2Elems, map2.mapID, ow05 ?? chair, 7, 18);

  await prisma.mapElements.createMany({ data: map2Elems });
  console.log(
    `✅ Map created: ${map2.name} (${map2.mapID}) elements=${map2Elems.length}`,
  );

  console.log("✅ Done seeding office maps");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
