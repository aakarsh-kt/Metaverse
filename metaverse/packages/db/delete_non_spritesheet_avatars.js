/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");

// Deletes avatar rows that point to non-spritesheet JPGs.
// These JPGs are large photos and cannot be loaded as Phaser spritesheets.

const prisma = new PrismaClient();

async function main() {
  const urls = [
    "/assets/avatars/skeleton.jpg",
    "/assets/avatars/basketballPlayer.jpg",
    "/assets/avatars/child.jpg",
    "/assets/avatars/monkey.jpg",
  ];

  const del = await prisma.avatar.deleteMany({ where: { url: { in: urls } } });
  console.log(`🧹 Deleted ${del.count} non-spritesheet JPG avatars`);
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
