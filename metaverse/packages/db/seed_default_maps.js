const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Creating beautiful default maps...");

  // 1. Zen Garden (10x10)
  const zenGarden = await prisma.map.upsert({
    where: { mapID: "zen-garden-template" },
    update: {},
    create: {
      mapID: "zen-garden-template",
      name: "Zen Garden",
      width: 10,
      height: 10,
      thumbnail: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&q=80&w=400",
      mapElements: {
        create: [
          // Water center
          { elementID: "cmjbahd0j0004lvn0n20k35tb", x: 4, y: 4 },
          { elementID: "cmjbahd0j0004lvn0n20k35tb", x: 4, y: 5 },
          { elementID: "cmjbahd0j0004lvn0n20k35tb", x: 5, y: 4 },
          { elementID: "cmjbahd0j0004lvn0n20k35tb", x: 5, y: 5 },
          // Plants
          { elementID: "cmjbaan600005lvcg2lmpruh4", x: 1, y: 1 },
          { elementID: "cmjbaan600005lvcg2lmpruh4", x: 1, y: 8 },
          { elementID: "cmjbaan600005lvcg2lmpruh4", x: 8, y: 1 },
          { elementID: "cmjbaan600005lvcg2lmpruh4", x: 8, y: 8 },
          // Chairs
          { elementID: "cmj8fh9dy0001lvgcvh1u7myo", x: 3, y: 3 },
          { elementID: "cmj8fh9dy0001lvgcvh1u7myo", x: 6, y: 3 },
          { elementID: "cmj8fh9dy0001lvgcvh1u7myo", x: 3, y: 6 },
          { elementID: "cmj8fh9dy0001lvgcvh1u7myo", x: 6, y: 6 },
        ]
      }
    }
  });

  // 2. Executive Suite (15x10)
  const execSuite = await prisma.map.upsert({
    where: { mapID: "exec-suite-template" },
    update: {},
    create: {
      mapID: "exec-suite-template",
      name: "Executive Suite",
      width: 15,
      height: 10,
      thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400",
      mapElements: {
        create: [
          // Large meeting table
          { elementID: "cmjbahd0v0006lvn0rwzlfq6z", x: 7, y: 4 },
          { elementID: "cmjbahd0v0006lvn0rwzlfq6z", x: 7, y: 5 },
          // Desks
          { elementID: "cmjbahd050002lvn0rusd239m", x: 2, y: 2 },
          { elementID: "cmjbahd050002lvn0rusd239m", x: 2, y: 7 },
          { elementID: "cmjbahd050002lvn0rusd239m", x: 12, y: 2 },
          { elementID: "cmjbahd050002lvn0rusd239m", x: 12, y: 7 },
          // Chairs
          { elementID: "cmj8fh9dy0001lvgcvh1u7myo", x: 3, y: 2 },
          { elementID: "cmj8fh9dy0001lvgcvh1u7myo", x: 3, y: 7 },
          { elementID: "cmj8fh9dy0001lvgcvh1u7myo", x: 11, y: 2 },
          { elementID: "cmj8fh9dy0001lvgcvh1u7myo", x: 11, y: 7 },
          // Plants
          { elementID: "cmjbaan600005lvcg2lmpruh4", x: 0, y: 0 },
          { elementID: "cmjbaan600005lvcg2lmpruh4", x: 14, y: 0 },
          { elementID: "cmjbaan600005lvcg2lmpruh4", x: 0, y: 9 },
          { elementID: "cmjbaan600005lvcg2lmpruh4", x: 14, y: 9 },
        ]
      }
    }
  });

  // 3. Mini Lounge (8x8)
  const miniLounge = await prisma.map.upsert({
    where: { mapID: "mini-lounge-template" },
    update: {},
    create: {
      mapID: "mini-lounge-template",
      name: "Mini Lounge",
      width: 8,
      height: 8,
      thumbnail: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=400",
      mapElements: {
        create: [
          // Tables
          { elementID: "cmjbaan5a0001lvcgkwuf2xrn", x: 2, y: 2 },
          { elementID: "cmjbaan5a0001lvcgkwuf2xrn", x: 5, y: 5 },
          // Chairs
          { elementID: "cmj8fh9dy0001lvgcvh1u7myo", x: 2, y: 1 },
          { elementID: "cmj8fh9dy0001lvgcvh1u7myo", x: 2, y: 3 },
          { elementID: "cmj8fh9dy0001lvgcvh1u7myo", x: 5, y: 4 },
          { elementID: "cmj8fh9dy0001lvgcvh1u7myo", x: 5, y: 6 },
          // Water Cooler
          { elementID: "cmjbahd100007lvn091lylip1", x: 0, y: 0 },
        ]
      }
    }
  });

  console.log("✅ Default maps created successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
