import { NextResponse } from "next/server";
import { z } from "zod";
import { respuestaError } from "@/lib/api";
import { obtenerProveedorMedicamentos } from "@/lib/integraciones";
import { prisma } from "@/lib/prisma";

const cuerpo = z.object({
  busqueda: z.string().trim().min(2),
  limite: z.number().int().min(1).max(100).optional(),
});

/**
 * Busca medicamentos en la API externa configurada y los guarda en el vademécum local.
 * Los que ya existen (misma fuente y código externo) se actualizan.
 */
export async function POST(req: Request) {
  try {
    const { busqueda, limite } = cuerpo.parse(await req.json());
    const proveedor = obtenerProveedorMedicamentos();
    const encontrados = await proveedor.buscar(busqueda, limite ?? 20);

    const guardados = await prisma.$transaction(
      encontrados.map((m) =>
        prisma.medicamento.upsert({
          where: { fuente_codigoExterno: { fuente: proveedor.nombre, codigoExterno: m.codigoExterno } },
          create: { ...m, fuente: proveedor.nombre },
          update: { ...m },
        }),
      ),
    );
    return NextResponse.json({ proveedor: proveedor.nombre, importados: guardados.length, datos: guardados });
  } catch (error) {
    return respuestaError(error);
  }
}
