const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Deleting ALL elements from database...\n');
  
  try {
    // Count current elements
    const count = await prisma.element.count();
    console.log(`Found ${count} elements in database.\n`);
    
    if (count === 0) {
      console.log('No elements to delete.');
      return;
    }
    
    // Delete all elements
    const result = await prisma.element.deleteMany({});
    
    console.log(`\n${'='.repeat(50)}`);
    console.log('✅ Deletion Complete!');
    console.log(`${'='.repeat(50)}`);
    console.log(`Deleted: ${result.count} elements`);
    console.log(`${'='.repeat(50)}\n`);
    
  } catch (e) {
    console.error('❌ Error during deletion:', e.message);
    throw e;
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
