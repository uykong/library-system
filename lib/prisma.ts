// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// This creates a single connection to your database so Next.js 
// doesn't accidentally open hundreds of connections while you are testing.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;