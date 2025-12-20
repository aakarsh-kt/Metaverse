const { PrismaClient } = require("@prisma/client");

// Seeds a reusable office MAP (template) that can be used to create Spaces via:
// POST /api/v1/space/create with { mapID }.
//
// Notes:
// - Uses only single-image assets under /assets/elements/* (no sprite sheets).
// - Does not place a floor tile on every cell; the client already renders a base grid.

const prisma = new PrismaClient();

const MAP_NAME = "Realistic Office Map";
const MAP_W = 28;
const MAP_H = 18;

// Walkable path rules:
// - Keep a clear 1-tile walkway around the perimeter inside outer walls.
// - Keep a clear main corridor from the entrance up into the map.
// - Avoid placing blocking furniture on the corridor lines.
const WALKWAY = 1; // inner margin (tiles)
const MAIN_CORRIDOR_X0 = Math.floor(MAP_W / 2) - 1;
const MAIN_CORRIDOR_X1 = Math.floor(MAP_W / 2);
const MAIN_CORRIDOR_Y0 = 1;
const MAIN_CORRIDOR_Y1 = MAP_H - 2;
const CROSS_CORRIDOR_Y0 = 9;
const CROSS_CORRIDOR_Y1 = 10;

function coordKey(x, y) {
  return `${x},${y}`;
}

async function main() {
  console.log("Seeding realistic office map...");

  // Remove legacy elements that use remote URLs (these were causing the '12 chairs' style images).
  // We only keep local `/assets/...` elements for consistency.
  try {
    const legacy = await prisma.element.findMany({
      where: { imageUrl: { startsWith: "http" } },
      select: { elementID: true },
    });

    if (legacy.length) {
      const ids = legacy.map((e) => e.elementID);

      // Delete dependents first to satisfy FK constraints.
      await prisma.mapElements.deleteMany({
        where: { elementID: { in: ids } },
      });
      await prisma.spaceElement.deleteMany({
        where: { elementID: { in: ids } },
      });
      await prisma.element.deleteMany({ where: { elementID: { in: ids } } });
    }
  } catch (e) {
    // If Postgres is down / DATABASE_URL is wrong, Prisma throws here.
    console.error(
      "[seed_office_map] Database not reachable. Prisma needs Postgres running (check DATABASE_URL / localhost:5432).\n",
      e,
    );
    throw e;
  }

  const ensureElement = async ({
    width,
    height,
    imageUrl,
    static: isStatic,
  }) => {
    let el = await prisma.element.findFirst({ where: { imageUrl } });
    if (!el) {
      el = await prisma.element.create({
        data: { width, height, imageUrl, static: isStatic },
      });
    } else {
      // Keep element definitions consistent even across multiple seed runs.
      if (
        el.width !== width ||
        el.height !== height ||
        el.static !== isStatic
      ) {
        el = await prisma.element.update({
          where: { elementID: el.elementID },
          data: { width, height, static: isStatic },
        });
      }
    }
    return el;
  };

  // Prefer stable, existing single-image assets.
  const E = {
    wall: await ensureElement({
      width: 1,
      height: 1,
      imageUrl: "/assets/elements/wall.svg",
      static: true,
    }),
    door: await ensureElement({
      width: 1,
      height: 1,
      imageUrl: "/assets/elements/door.svg",
      // doors should be passable
      static: false,
    }),
    desk: await ensureElement({
      width: 2,
      height: 1,
      imageUrl: "/assets/elements/desk_0.png",
      static: true,
    }),
    chair: await ensureElement({
      width: 1,
      height: 1,
      imageUrl: "/assets/elements/chair_0.png",
      static: true,
    }),
    officeChair: await ensureElement({
      width: 1,
      height: 1,
      imageUrl: "/assets/elements/office_chair.png",
      static: true,
    }),
    plant0: await ensureElement({
      width: 1,
      height: 1,
      imageUrl: "/assets/elements/plant_0.png",
      static: true,
    }),
    plant1: await ensureElement({
      width: 1,
      height: 1,
      imageUrl: "/assets/elements/plant_2.png",
      static: true,
    }),
    water: await ensureElement({
      width: 1,
      height: 1,
      imageUrl: "/assets/elements/water_cooler.png",
      static: true,
    }),
    table0: await ensureElement({
      width: 2,
      height: 2,
      imageUrl: "/assets/elements/table_0.png",
      static: true,
    }),
    table1: await ensureElement({
      width: 2,
      height: 2,
      imageUrl: "/assets/elements/table_2.png",
      static: true,
    }),
  };

  let map = await prisma.map.findFirst({ where: { name: MAP_NAME } });
  if (!map) {
    map = await prisma.map.create({
      data: {
        name: MAP_NAME,
        width: MAP_W,
        height: MAP_H,
        // Schema validation often expects a URL.
        thumbnail:
          "https://dummyimage.com/600x400/0b1320/ffffff&text=Office+Map",
      },
    });
  } else {
    if (map.width !== MAP_W || map.height !== MAP_H) {
      map = await prisma.map.update({
        where: { mapID: map.mapID },
        data: { width: MAP_W, height: MAP_H },
      });
    }
  }

  await prisma.mapElements.deleteMany({ where: { mapID: map.mapID } });

  const occupied = new Set();
  const placements = [];

  const isInPerimeterWalkway = (x, y) => {
    // Inside the outer wall, keep a buffer.
    return (
      x >= 1 &&
      y >= 1 &&
      x <= MAP_W - 2 &&
      y <= MAP_H - 2 &&
      (x <= WALKWAY ||
        y <= WALKWAY ||
        x >= MAP_W - 2 - WALKWAY ||
        y >= MAP_H - 2 - WALKWAY)
    );
  };

  const isInMainCorridor = (x, y) => {
    return (
      x >= MAIN_CORRIDOR_X0 &&
      x <= MAIN_CORRIDOR_X1 &&
      y >= MAIN_CORRIDOR_Y0 &&
      y <= MAIN_CORRIDOR_Y1
    );
  };

  const isInCrossCorridor = (x, y) => {
    return (
      y >= CROSS_CORRIDOR_Y0 &&
      y <= CROSS_CORRIDOR_Y1 &&
      x >= 1 &&
      x <= MAP_W - 2
    );
  };

  const isReservedWalkable = (x, y) => {
    // We still allow outer walls and doors to be placed by calling `placeRaw` for them.
    return (
      isInPerimeterWalkway(x, y) ||
      isInMainCorridor(x, y) ||
      isInCrossCorridor(x, y)
    );
  };

  const placeRaw = (element, x, y) => {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return;
    const k = coordKey(x, y);
    if (occupied.has(k)) return;
    occupied.add(k);
    placements.push({ elementID: element.elementID, x, y });
  };

  const place = (element, x, y) => {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return;
    // Keep planned paths clear from blocking elements.
    // Doors are allowed (passable) but still visually occupy a tile.
    const isDoor = element.elementID === E.door.elementID;
    if (!isDoor && isReservedWalkable(x, y)) return;
    const k = coordKey(x, y);
    if (occupied.has(k)) return;
    occupied.add(k);
    placements.push({ elementID: element.elementID, x, y });
  };

  const unoccupy = (x, y) => {
    occupied.delete(coordKey(x, y));
  };

  // Perimeter walls.
  for (let x = 0; x < MAP_W; x++) {
    placeRaw(E.wall, x, 0);
    placeRaw(E.wall, x, MAP_H - 1);
  }
  for (let y = 0; y < MAP_H; y++) {
    placeRaw(E.wall, 0, y);
    placeRaw(E.wall, MAP_W - 1, y);
  }

  // Doorway at bottom center (visible door tile).
  const doorX = Math.floor(MAP_W / 2);
  unoccupy(doorX, MAP_H - 1);
  unoccupy(doorX - 1, MAP_H - 1);
  placeRaw(E.door, doorX, MAP_H - 1);
  placeRaw(E.door, doorX - 1, MAP_H - 1);

  // Meeting room box (top-right).
  const room = { x1: 18, y1: 2, x2: 26, y2: 9 };
  for (let x = room.x1; x <= room.x2; x++) {
    place(E.wall, x, room.y1);
    place(E.wall, x, room.y2);
  }
  for (let y = room.y1; y <= room.y2; y++) {
    place(E.wall, room.x1, y);
    place(E.wall, room.x2, y);
  }
  // Door on left wall (visible door tile).
  const roomDoorY = Math.floor((room.y1 + room.y2) / 2);
  unoccupy(room.x1, roomDoorY);
  place(E.door, room.x1, roomDoorY);

  // Interior partitions (keeps movement open; no full-width blocking wall).
  // Two short walls create "rooms" but keep a wide central corridor.
  for (let y = 2; y <= 8; y++) {
    // left partition
    place(E.wall, 7, y);
    // right partition
    place(E.wall, 20, y);
  }
  // Add door gaps so partitions are passable.
  for (const dy of [4, 6]) {
    unoccupy(7, dy);
    placeRaw(E.door, 7, dy);
    unoccupy(20, dy);
    placeRaw(E.door, 20, dy);
  }

  // Reception (near entrance) - keep the main corridor clear.
  place(E.desk, doorX - 6, MAP_H - 4);
  place(E.chair, doorX - 5, MAP_H - 3);
  place(E.plant0, doorX - 8, MAP_H - 4);

  // Break corner (bottom-left) - keep inside perimeter walkway clear.
  place(E.water, 3, MAP_H - 4);
  place(E.plant1, 4, MAP_H - 5);
  place(E.plant0, 5, MAP_H - 4);

  // Open office pods (upper area) - keep clear around central corridor and partitions.
  const pods = [
    { x: 2, y: 2 },
    { x: 2, y: 6 },
    { x: 10, y: 2 },
    { x: 10, y: 6 },
    { x: 14, y: 2 },
    { x: 14, y: 6 },
  ];
  for (const p of pods) {
    place(E.desk, p.x, p.y);
    place(E.desk, p.x + 3, p.y);
    place(E.chair, p.x + 1, p.y + 1);
    place(E.chair, p.x + 4, p.y + 1);
    place(E.plant0, p.x + 2, p.y);
  }

  // Cubicles (lower-left) - avoid blocking the cross-corridor and main corridor.
  const cubStart = { x: 2, y: 12 };
  const cubCols = 3;
  const cubRows = 2;
  const cellW = 4;
  const cellH = 3;
  for (let r = 0; r < cubRows; r++) {
    for (let c = 0; c < cubCols; c++) {
      const ox = cubStart.x + c * cellW;
      const oy = cubStart.y + r * cellH;
      place(E.wall, ox, oy);
      place(E.wall, ox + 1, oy);
      place(E.wall, ox, oy + 1);
      place(E.desk, ox + 1, oy + 1);
      place(E.officeChair, ox + 2, oy + 2);
    }
  }

  // Meeting room contents.
  place(E.table0, 21, 5);
  place(E.table1, 23, 5);
  for (const cx of [21, 22, 23, 24]) {
    place(E.officeChair, cx, 4);
    place(E.officeChair, cx, 7);
  }

  // Plants along the corridor.
  for (const x of [6, 10, 14, 18, 22]) place(E.plant1, x, 10);

  await prisma.mapElements.createMany({
    data: placements.map((p) => ({ ...p, mapID: map.mapID })),
  });

  console.log(
    `Seeded map '${MAP_NAME}' (${MAP_W}x${MAP_H}) with ${placements.length} placed elements.`,
  );
  console.log(`Map ID: ${map.mapID}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
