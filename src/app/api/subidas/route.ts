import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { CARPETA_SUBIDAS, PREFIJO_URL, TAMANO_MAXIMO, tipoImagen } from "@/lib/subidas";

/** Recibe una imagen PNG o JPG (campo "archivo") y devuelve la URL para usarla. */
export async function POST(req: Request) {
  try {
    const formulario = await req.formData();
    const archivo = formulario.get("archivo");
    if (!(archivo instanceof File)) {
      return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });
    }
    if (archivo.size > TAMANO_MAXIMO) {
      return NextResponse.json({ error: "La imagen pesa más de 2 MB. Use una más liviana." }, { status: 400 });
    }
    const bytes = new Uint8Array(await archivo.arrayBuffer());
    const tipo = tipoImagen(bytes);
    if (!tipo) {
      return NextResponse.json({ error: "La imagen debe ser PNG o JPG." }, { status: 400 });
    }

    const nombre = `${randomBytes(12).toString("hex")}.${tipo.extension}`;
    await mkdir(CARPETA_SUBIDAS, { recursive: true });
    await writeFile(path.join(CARPETA_SUBIDAS, nombre), bytes);
    return NextResponse.json({ url: `${PREFIJO_URL}${nombre}` }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "No se pudo guardar la imagen. Intente de nuevo." }, { status: 500 });
  }
}
