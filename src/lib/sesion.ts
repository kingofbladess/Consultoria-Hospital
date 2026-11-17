// Sesión firmada en una cookie. Usa Web Crypto para funcionar tanto en el middleware
// (Edge) como en las rutas de la API (Node).

export const COOKIE_SESION = "sesion";
export const DURACION_SESION = 12 * 60 * 60; // 12 horas, un turno largo.

export type Rol = "ADMIN" | "MEDICO" | "RECEPCION" | "FARMACIA";
/** medicoId: el médico vinculado al usuario, si lo tiene (sus récipes salen a su nombre). */
export type Sesion = { id: string; nombre: string; email: string; rol: Rol; medicoId?: string | null; exp: number };

const codificador = new TextEncoder();

function aBase64Url(bytes: Uint8Array): string {
  let texto = "";
  for (const b of bytes) texto += String.fromCharCode(b);
  return btoa(texto).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deBase64Url(texto: string): Uint8Array<ArrayBuffer> {
  const b64 = texto.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (texto.length % 4)) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function secreto(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("Falta AUTH_SECRET en el archivo .env (mínimo 32 caracteres).");
  return s;
}

async function clave(): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", codificador.encode(secreto()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function firmarSesion(datos: Omit<Sesion, "exp">): Promise<string> {
  const sesion: Sesion = { ...datos, exp: Math.floor(Date.now() / 1000) + DURACION_SESION };
  const cuerpo = aBase64Url(codificador.encode(JSON.stringify(sesion)));
  const firma = new Uint8Array(await crypto.subtle.sign("HMAC", await clave(), codificador.encode(cuerpo)));
  return `${cuerpo}.${aBase64Url(firma)}`;
}

/** Devuelve la sesión si la cookie es auténtica y no ha vencido; si no, null. */
export async function verificarSesion(valor: string | undefined): Promise<Sesion | null> {
  if (!valor) return null;
  const [cuerpo, firma] = valor.split(".");
  if (!cuerpo || !firma) return null;
  try {
    const valida = await crypto.subtle.verify("HMAC", await clave(), deBase64Url(firma), codificador.encode(cuerpo));
    if (!valida) return null;
    const sesion = JSON.parse(new TextDecoder().decode(deBase64Url(cuerpo))) as Sesion;
    return sesion.exp > Date.now() / 1000 ? sesion : null;
  } catch {
    return null;
  }
}

/** Pantalla de inicio según el rol: recepción entra directo a la estación de registro. */
export function inicioPorRol(rol: Rol): string {
  return rol === "RECEPCION" ? "/registro" : "/";
}

export const nombreRol: Record<Rol, string> = {
  ADMIN: "Administración",
  MEDICO: "Médico",
  RECEPCION: "Recepción",
  FARMACIA: "Farmacia",
};
