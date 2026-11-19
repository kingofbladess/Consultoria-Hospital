import { NextResponse } from "next/server";
import { registrar, sesionDePeticion } from "@/lib/auditoria";
import { COOKIE_SESION } from "@/lib/sesion";

export async function POST(req: Request) {
  const sesion = await sesionDePeticion(req);
  if (sesion) await registrar(sesion, "SALIR", "sesion", sesion.id);
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(COOKIE_SESION, "", { httpOnly: true, path: "/", maxAge: 0 });
  return respuesta;
}
