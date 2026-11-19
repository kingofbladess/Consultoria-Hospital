import { prisma } from "./prisma";
import { COOKIE_SESION, type Sesion, verificarSesion } from "./sesion";

export type Accion = "CREAR" | "ACTUALIZAR" | "ELIMINAR" | "INGRESAR" | "SALIR";

/** Sesión de una petición de la API (lee la cookie de la cabecera). */
export async function sesionDePeticion(req: Request): Promise<Sesion | null> {
  const cookie = req.headers.get("cookie") ?? "";
  const valor = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_SESION}=`))
    ?.slice(COOKIE_SESION.length + 1);
  return verificarSesion(valor);
}

/**
 * Anota en la bitácora. Nunca hace fallar la operación principal: si la bitácora
 * no se puede escribir, se informa en el registro del servidor y se sigue.
 */
export async function registrar(
  sesion: Pick<Sesion, "id" | "nombre"> | null,
  accion: Accion,
  recurso: string,
  registroId?: string | null,
  detalle?: string,
) {
  try {
    await prisma.auditoria.create({
      data: {
        usuarioId: sesion?.id ?? null,
        usuarioNombre: sesion?.nombre ?? "Sistema",
        accion,
        recurso,
        registroId: registroId ?? null,
        detalle: detalle?.slice(0, 500),
      },
    });
  } catch (error) {
    console.error("No se pudo escribir la auditoría:", error);
  }
}
