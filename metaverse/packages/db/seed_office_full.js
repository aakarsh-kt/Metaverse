const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Office Elements and Map...');

  // 1. Seed Elements
  const elementData = [
    // 12 Chairs
    ...Array.from({ length: 12 }).map((_, i) => ({
      width: 1,
      height: 1,
      imageUrl: `/assets/elements/chair_${i}.png`
    })),
    // 4 Tables
    ...Array.from({ length: 4 }).map((_, i) => ({
      width: 2,
      height: 2,
      imageUrl: `/assets/elements/table_${i}.png`
    })),
    // 4 Plants
    ...Array.from({ length: 4 }).map((_, i) => ({
      width: 1,
      height: 1,
      imageUrl: `/assets/elements/plant_${i}.png`
    })),
    // 1 Desk
    {
      width: 3,
      height: 2,
      imageUrl: `/assets/elements/desk_0.png`
    }
  ];

  const elements = [];
  for (const data of elementData) {
    // Find existing by imageUrl or create
    let element = await prisma.element.findFirst({
        where: { imageUrl: data.imageUrl }
    });
    
    if (!element) {
        element = await prisma.element.create({ data });
    }
    elements.push(element);
  }

  const findElem = (pattern) => elements.find(e => e.imageUrl.includes(pattern));

  // 2. Create Map "Corporate Office"
  const mapWidth = 25;
  const mapHeight = 25;
  const mapName = "Corporate Office";

  // Check if map exists
  let existingMap = await prisma.map.findFirst({ where: { name: mapName } });
  if (existingMap) {
      await prisma.mapElements.deleteMany({ where: { mapID: existingMap.mapID } });
      await prisma.map.delete({ where: { mapID: existingMap.mapID } });
  }

  const officeMap = await prisma.map.create({
    data: {
      name: mapName,
      width: mapWidth,
      height: mapHeight,
      thumbnail: "/assets/carpet.jpg" // Placeholder thumbnail
    }
  });

  const mapElements = [];

  // Corner Plants
  const plantElem = findElem('plant_0');
  if (plantElem) {
    mapElements.push({ mapID: officeMap.mapID, elementID: plantElem.elementID, x: 0, y: 0 });
    mapElements.push({ mapID: officeMap.mapID, elementID: plantElem.elementID, x: 24, y: 0 });
    mapElements.push({ mapID: officeMap.mapID, elementID: plantElem.elementID, x: 0, y: 24 });
    mapElements.push({ mapID: officeMap.mapID, elementID: plantElem.elementID, x: 24, y: 24 });
  }

  // Meeting Room (Top Right)
  const bigTable = findElem('table_0');
  const chair1 = findElem('chair_0');
  if (bigTable && chair1) {
    // Large Table in center of meeting room
    mapElements.push({ mapID: officeMap.mapID, elementID: bigTable.elementID, x: 20, y: 5 });
    // Chairs around it
    mapElements.push({ mapID: officeMap.mapID, elementID: chair1.elementID, x: 19, y: 5 });
    mapElements.push({ mapID: officeMap.mapID, elementID: chair1.elementID, x: 19, y: 6 });
    mapElements.push({ mapID: officeMap.mapID, elementID: chair1.elementID, x: 22, y: 5 });
    mapElements.push({ mapID: officeMap.mapID, elementID: chair1.elementID, x: 22, y: 6 });
    mapElements.push({ mapID: officeMap.mapID, elementID: chair1.elementID, x: 20, y: 4 });
    mapElements.push({ mapID: officeMap.mapID, elementID: chair1.elementID, x: 21, y: 4 });
    mapElements.push({ mapID: officeMap.mapID, elementID: chair1.elementID, x: 20, y: 7 });
    mapElements.push({ mapID: officeMap.mapID, elementID: chair1.elementID, x: 21, y: 7 });
  }

  // Work Stations (Left side)
  const workstationTable = findElem('table_1');
  const chair2 = findElem('chair_1');
  if (workstationTable && chair2) {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 2; c++) {
        const x = 2 + c * 6;
        const y = 2 + r * 6;
        mapElements.push({ mapID: officeMap.mapID, elementID: workstationTable.elementID, x, y });
        mapElements.push({ mapID: officeMap.mapID, elementID: chair2.elementID, x: x - 1, y: y });
        mapElements.push({ mapID: officeMap.mapID, elementID: chair2.elementID, x: x + 2, y: y });
      }
    }
  }

  // Executive Desk (Bottom Right)
  const execDesk = findElem('desk_0');
  const chairExec = findElem('chair_5');
  if (execDesk && chairExec) {
    mapElements.push({ mapID: officeMap.mapID, elementID: execDesk.elementID, x: 20, y: 20 });
    mapElements.push({ mapID: officeMap.mapID, elementID: chairExec.elementID, x: 21, y: 19 });
  }

  await prisma.mapElements.createMany({ data: mapElements });

  console.log(`✅ Office Seeding Complete! Map: "${mapName}" (ID: ${officeMap.mapID})`);
  console.log(`Total elements in map: ${mapElements.length}`);
}

main()
  .catch(e => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
