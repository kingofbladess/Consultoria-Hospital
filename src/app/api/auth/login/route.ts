import { NextResponse } from "next/server";
import { z } from "zod";
import { verificarClave } from "@/lib/clave";
import { registrar } from "@/lib/auditoria";
import { prisma } from "@/lib/prisma";
import { COOKIE_SESION, DURACION_SESION, firmarSesion, inicioPorRol } from "@/lib/sesion";

// Se ingresa con el nombre de usuario (por ejemplo "admin") o con el correo.
const cuerpo = z.object({ email: z.string().trim().toLowerCase().min(1), clave: z.string().min(1) });

// Freno simple contra intentos repetidos: 8 fallos por correo cada 10 minutos.
const fallos = new Map<string, { cuenta: number; desde: number }>();
const VENTANA = 10 * 60 * 1000;
const MAXIMO = 8;

export async function POST(req: Request) {
  const datos = cuerpo.safeParse(await req.json().catch(() => ({})));
  if (!datos.success) {
    return NextResponse.json({ error: "Escriba su usuario y su contraseña." }, { status: 400 });
  }
  const { email, clave } = datos.data;

  const registro = fallos.get(email);
  if (registro && Date.now() - registro.desde < VENTANA && registro.cuenta >= MAXIMO) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espere unos minutos o pida a administración que revise su cuenta." },
      { status: 429 },
    );
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email }, include: { personal: { include: { medico: true } } } });
    const valida = usuario?.activo && (await verificarClave(clave, usuario.claveHash));
    if (!usuario || !valida) {
      const r = registro && Date.now() - registro.desde < VENTANA ? registro : { cuenta: 0, desde: Date.now() };
      fallos.set(email, { ...r, cuenta: r.cuenta + 1 });
      return NextResponse.json({ error: "El usuario o la contraseña no coinciden. Revise e intente de nuevo." }, { status: 401 });
    }
    fallos.delete(email);

    const token = await firmarSesion({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      medicoId: usuario.personal?.medico?.id ?? null,
    });
    await registrar(usuario, "INGRESAR", "sesion", usuario.id);
    const respuesta = NextResponse.json({ destino: inicioPorRol(usuario.rol) });
    respuesta.cookies.set(COOKIE_SESION, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: DURACION_SESION,
    });
    return respuesta;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "No se pudo verificar su cuenta porque la base de datos no responde. Intente en unos segundos." },
      { status: 503 },
    );
  }
}
