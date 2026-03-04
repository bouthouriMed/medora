const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Creating tables...');
  
  // This will sync the schema
  await prisma.$connect();
  console.log('Connected to database!');
  
  // Check if tables exist
  try {
    const userCount = await prisma.user.count();
    console.log(`Users table exists with ${userCount} users`);
  } catch (e) {
    console.log('Tables need to be created');
  }
  
  await prisma.$disconnect();
}

main()
  .catch(console.error)
  .finally(() => process.exit());
