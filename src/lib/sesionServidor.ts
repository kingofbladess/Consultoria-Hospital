import { cookies } from "next/headers";
import { COOKIE_SESION, verificarSesion } from "./sesion";

/** Sesión del usuario actual en componentes de servidor. */
export async function sesionActual() {
  const almacen = await cookies();
  return verificarSesion(almacen.get(COOKIE_SESION)?.value);
}
