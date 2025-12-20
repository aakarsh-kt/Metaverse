const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Best 12 chairs extracted from sprite sheet (quality-scored)
const selectedChairs = [
  'chair_0.png',
  'chair_1.png',
  'chair_2.png',
  'chair_3.png',
  'chair_4.png',
  'chair_5.png',
  'chair_6.png',
  'chair_7.png',
  'chair_8.png',
  'chair_9.png',
  'chair_10.png',
  'chair_11.png'
];

async function main() {
  console.log('🪑 Seeding 12 selected chairs from office_chairs.png...\n');
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const chairFile of selectedChairs) {
    const imageUrl = `/assets/elements/${chairFile}`;
    
    try {
      const existing = await prisma.element.findFirst({
        where: { imageUrl }
      });

      if (!existing) {
        await prisma.element.create({
          data: {
            imageUrl,
            width: 1,
            height: 1,
            static: false
          }
        });
        created++;
        console.log(`✓ Created: ${chairFile}`);
      } else {
        skipped++;
        console.log(`⊘ Skipped: ${chairFile} (already exists)`);
      }
    } catch (e) {
      console.error(`✗ Error with ${chairFile}:`, e.message);
      errors++;
    }
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log('✅ Seeding Complete!');
  console.log(`${'='.repeat(50)}`);
  console.log(`Total selected: ${selectedChairs.length}`);
  console.log(`Created: ${created}`);
  console.log(`Skipped (already exist): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`${'='.repeat(50)}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
