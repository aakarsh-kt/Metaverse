const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const defaultThumbnails = [
    "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&q=80&w=800" // Neon abstract
];

async function main() {
  console.log("🛠️ Patching existing spaces with thumbnails...");

  const spaces = await prisma.space.findMany({
    where: {
      OR: [
        { thumbnail: null },
        { thumbnail: "" }
      ]
    }
  });

  console.log(`Found ${spaces.length} spaces needing updates.`);

  for (const space of spaces) {
    const randomThumb = defaultThumbnails[Math.floor(Math.random() * defaultThumbnails.length)];
    await prisma.space.update({
      where: { spaceID: space.spaceID },
      data: { thumbnail: randomThumb }
    });
  }

  console.log("✅ All spaces now have thumbnails!");
}

main()
  .catch((e) => {
    console.error("❌ Patch failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
