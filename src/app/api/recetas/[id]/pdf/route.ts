import { NextResponse } from "next/server";
import { respuestaError } from "@/lib/api";
import { generarPdfReceta } from "@/lib/pdfReceta";
import { prisma } from "@/lib/prisma";

/** Devuelve el récipe en PDF. Con ?descargar=1 el navegador lo guarda en vez de abrirlo. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const receta = await prisma.receta.findUnique({
      where: { id },
      include: {
        paciente: true,
        medico: { include: { personal: true, especialidades: true } },
        items: { include: { medicamento: true }, orderBy: { orden: "asc" } },
      },
    });
    if (!receta) return NextResponse.json({ error: "Récipe no encontrado" }, { status: 404 });

    const bytes = await generarPdfReceta(receta);
    const archivo = `Recipe-${receta.numero}-${receta.paciente.apellidos}.pdf`.normalize("NFD").replace(/[^\w.-]/g, "");
    const descargar = new URL(req.url).searchParams.has("descargar");
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${descargar ? "attachment" : "inline"}; filename="${archivo}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return respuestaError(error);
  }
}
