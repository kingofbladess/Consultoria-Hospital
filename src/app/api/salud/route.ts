import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Indica si la aplicación y la base de datos responden. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ estado: "ok", baseDeDatos: "conectada" });
  } catch {
    return NextResponse.json({ estado: "error", baseDeDatos: "sin conexión" }, { status: 503 });
  }
}
