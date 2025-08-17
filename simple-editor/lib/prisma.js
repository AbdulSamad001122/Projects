// lib/prisma.js
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis; // This will be shared in development

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"], // Optional logging
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma; // Prevents creating multiple PrismaClient instances in dev
}
