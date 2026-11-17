import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { PREFIJO_URL, rutaDeUrl, tipoImagen } from "@/lib/subidas";

export async function GET(_req: Request, { params }: { params: Promise<{ nombre: string }> }) {
  const { nombre } = await params;
  const ruta = rutaDeUrl(`${PREFIJO_URL}${nombre}`);
  if (!ruta) return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
  try {
    const bytes = await readFile(ruta);
    const tipo = tipoImagen(bytes);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": tipo?.mime ?? "application/octet-stream",
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
  }
}
