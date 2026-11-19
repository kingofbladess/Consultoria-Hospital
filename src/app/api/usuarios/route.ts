import { NextResponse } from "next/server";
import { z } from "zod";
import { respuestaError } from "@/lib/api";
import { registrar, sesionDePeticion } from "@/lib/auditoria";
import { cifrarClave } from "@/lib/clave";
import { prisma } from "@/lib/prisma";
import { clave, datosUsuario, SIN_CLAVE } from "@/lib/usuarios";

// Usuarios del sistema (solo administración: lo exige el middleware).
// La contraseña se cifra con scrypt y nunca se devuelve.

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({ select: SIN_CLAVE, orderBy: [{ activo: "desc" }, { nombre: "asc" }] });
    return NextResponse.json({ datos: usuarios, total: usuarios.length });
  } catch (error) {
    return respuestaError(error);
  }
}

export async function POST(req: Request) {
  try {
    const d = z.object({ ...datosUsuario, clave }).parse(await req.json());
    const usuario = await prisma.usuario.create({
      data: { nombre: d.nombre, email: d.email, rol: d.rol, personalId: d.personalId || null, activo: d.activo ?? true, claveHash: await cifrarClave(d.clave) },
      select: SIN_CLAVE,
    });
    await registrar(await sesionDePeticion(req), "CREAR", "usuario", usuario.id, `${usuario.email} (${usuario.rol})`);
    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    return respuestaError(error);
  }
}
