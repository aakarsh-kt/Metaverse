/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const fs = require("node:fs");
const path = require("node:path");

// Seeds avatar *spritesheets* into the Avatar table.
// The Phaser client loads avatars as a spritesheet (32x48 frames), so these must be
// actual spritesheet PNGs under:
// apps/frontend/public/assets/avatars/

const prisma = new PrismaClient();

const AVATARS = [
  { name: "Viking", url: "/assets/avatars/viking.png" },
  { name: "Skeleton", url: "/assets/avatars/skeleton.png" },
  { name: "Basketball Player", url: "/assets/avatars/basketballPlayer.png" },
  { name: "Child", url: "/assets/avatars/child.png" },
  { name: "Monkey", url: "/assets/avatars/monkey.png" },
];

async function main() {
  console.log(`🌱 Upserting ${AVATARS.length} avatars...`);

  const repoRoot = path.resolve(__dirname, "..", "..");
  const avatarPublicDir = path.join(repoRoot, "apps", "frontend", "public");

  for (const a of AVATARS) {
    // Only seed avatars that have a real PNG spritesheet.
    const desiredPath = path.join(avatarPublicDir, a.url);
    if (!fs.existsSync(desiredPath)) {
      console.warn(
        `⚠️ Skipping avatar (missing PNG spritesheet): ${a.name} -> ${a.url}`,
      );
      continue;
    }

    const finalUrl = a.url;

    const existing = await prisma.avatar.findFirst({
      where: { url: finalUrl },
    });
    if (existing) {
      await prisma.avatar.update({
        where: { avatarID: existing.avatarID },
        data: { name: a.name },
      });
    } else {
      await prisma.avatar.create({
        data: { name: a.name, url: finalUrl },
      });
    }
  }

  console.log("✅ Done");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
