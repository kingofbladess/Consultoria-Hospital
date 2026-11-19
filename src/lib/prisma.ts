import { PrismaClient } from "@prisma/client";

// Reutiliza una sola conexión en desarrollo (Next.js recarga módulos en caliente).
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalParaPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalParaPrisma.prisma = prisma;
