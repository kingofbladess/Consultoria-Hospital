import path from "node:path";

// Imágenes subidas (logo, firma y sello de los médicos).
// En local se guardan en la carpeta uploads/ del proyecto, que no se sube a git.
// En producción habrá que cambiarlo por un almacenamiento externo (por ejemplo, Vercel Blob o S3).

export const CARPETA_SUBIDAS = path.join(process.cwd(), "uploads");
export const PREFIJO_URL = "/api/subidas/";
export const TAMANO_MAXIMO = 2 * 1024 * 1024;

export type TipoImagen = { extension: "png" | "jpg"; mime: string };

/** Detecta PNG o JPG por los primeros bytes del archivo (no confía en el nombre). */
export function tipoImagen(bytes: Uint8Array): TipoImagen | null {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { extension: "png", mime: "image/png" };
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { extension: "jpg", mime: "image/jpeg" };
  return null;
}

/** Nombre de archivo seguro: solo letras, números y la extensión. */
export const NOMBRE_VALIDO = /^[a-z0-9]{16,40}\.(png|jpg)$/;

/** Devuelve la ruta en disco de una URL /api/subidas/<nombre>, o null si no es una subida válida. */
export function rutaDeUrl(url: string | null | undefined): string | null {
  if (!url?.startsWith(PREFIJO_URL)) return null;
  const nombre = url.slice(PREFIJO_URL.length);
  return NOMBRE_VALIDO.test(nombre) ? path.join(CARPETA_SUBIDAS, nombre) : null;
}
