import { NextResponse } from "next/server";
import { z } from "zod";
import { respuestaError } from "@/lib/api";
import { registrar, sesionDePeticion } from "@/lib/auditoria";
import { cifrarClave } from "@/lib/clave";
import { prisma } from "@/lib/prisma";
import { datosUsuario, SIN_CLAVE } from "@/lib/usuarios";

type Contexto = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Contexto) {
  try {
    const { id } = await params;
    const usuario = await prisma.usuario.findUnique({ where: { id }, select: SIN_CLAVE });
    return usuario ? NextResponse.json(usuario) : NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  } catch (error) {
    return respuestaError(error);
  }
}

/** Cambia datos, rol, estado o contraseña. Una contraseña vacía deja la actual. */
export async function PATCH(req: Request, { params }: Contexto) {
  try {
    const { id } = await params;
    const sesion = await sesionDePeticion(req);
    const d = z
      .object({ ...datosUsuario, clave: z.string().optional().nullable() })
      .partial()
      .parse(await req.json());
    if (d.clave && d.clave.length < 8) {
      return NextResponse.json({ error: "Datos inválidos", detalles: { clave: ["La contraseña debe tener al menos 8 caracteres"] } }, { status: 400 });
    }
    // Nadie se quita a sí mismo el acceso de administración: el sistema quedaría sin administrador.
    if (sesion?.id === id && ((d.rol && d.rol !== "ADMIN") || d.activo === false)) {
      return NextResponse.json({ error: "No puede quitarse su propio rol de administración ni desactivar su propia cuenta." }, { status: 409 });
    }
    const { clave, ...resto } = d;
    const usuario = await prisma.usuario.update({
      where: { id },
      data: { ...resto, personalId: resto.personalId === undefined ? undefined : resto.personalId || null, ...(clave ? { claveHash: await cifrarClave(clave) } : {}) },
      select: SIN_CLAVE,
    });
    await registrar(sesion, "ACTUALIZAR", "usuario", id, [...Object.keys(resto), ...(clave ? ["contraseña"] : [])].join(", "));
    return NextResponse.json(usuario);
  } catch (error) {
    return respuestaError(error);
  }
}

export async function DELETE(req: Request, { params }: Contexto) {
  try {
    const { id } = await params;
    const sesion = await sesionDePeticion(req);
    if (sesion?.id === id) return NextResponse.json({ error: "No puede eliminar su propia cuenta." }, { status: 409 });
    await prisma.usuario.delete({ where: { id } });
    await registrar(sesion, "ELIMINAR", "usuario", id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return respuestaError(error);
  }
}
