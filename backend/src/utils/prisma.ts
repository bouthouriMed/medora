import { PrismaClient } from '@prisma/client';

const prismaUrl = process.env.DATABASE_URL || 'file:./dev.db';

const prisma = new PrismaClient({
  datasourceUrl: prismaUrl,
});

export default prisma;
