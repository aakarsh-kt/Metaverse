const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Creates a small catalog of avatars (at least 5) so users can pick one.
// Avatar URLs are served by the frontend dev server as static assets.
const DEFAULT_AVATARS = [
  { name: "Blue", url: "/assets/avatars/avatar_blue.svg" },
  { name: "Green", url: "/assets/avatars/avatar_green.svg" },
  { name: "Purple", url: "/assets/avatars/avatar_purple.svg" },
  { name: "Orange", url: "/assets/avatars/avatar_orange.svg" },
  { name: "Red", url: "/assets/avatars/avatar_red.svg" },
];

async function main() {
  console.log("Seeding avatars...");

  for (const a of DEFAULT_AVATARS) {
    const existing = await prisma.avatar.findFirst({ where: { url: a.url } });
    if (existing) {
      if (existing.name !== a.name) {
        await prisma.avatar.update({
          where: { avatarID: existing.avatarID },
          data: { name: a.name },
        });
      }
      continue;
    }

    await prisma.avatar.create({
      data: {
        name: a.name,
        url: a.url,
      },
    });
  }

  const count = await prisma.avatar.count();
  console.log(`Avatar seed complete. Total avatars in DB: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
