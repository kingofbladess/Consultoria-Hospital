import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// Contraseñas guardadas con scrypt: "scrypt$<sal>$<hash>". Nunca se guarda la clave en texto plano.

const derivar = promisify(scrypt) as (clave: string, sal: Buffer, largo: number) => Promise<Buffer>;

export async function cifrarClave(clave: string): Promise<string> {
  const sal = randomBytes(16);
  const hash = await derivar(clave, sal, 64);
  return `scrypt$${sal.toString("base64")}$${hash.toString("base64")}`;
}

export async function verificarClave(clave: string, guardada: string): Promise<boolean> {
  const [algoritmo, sal, hash] = guardada.split("$");
  if (algoritmo !== "scrypt" || !sal || !hash) return false;
  const esperado = Buffer.from(hash, "base64");
  const calculado = await derivar(clave, Buffer.from(sal, "base64"), esperado.length);
  return timingSafeEqual(esperado, calculado);
}
