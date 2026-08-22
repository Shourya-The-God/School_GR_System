import { PrismaClient } from '@prisma/client';

// Global singleton instance for PrismaClient across the application
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

export default prisma;
