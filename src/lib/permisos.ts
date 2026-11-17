import type { Rol } from "./sesion";

// Qué puede modificar cada rol. Leer está permitido a todos los roles con sesión,
// salvo los recursos de administración (usuarios y auditoría).
// Se aplica en el middleware a toda escritura de la API (POST, PATCH, DELETE).

const ESCRITURA: Record<Rol, readonly string[] | "todo"> = {
  ADMIN: "todo",
  MEDICO: ["pacientes", "consultas", "recetas", "plantillas", "protocolos", "citas", "subidas"],
  RECEPCION: ["pacientes", "citas"],
  FARMACIA: ["medicamentos"],
};

/** Recursos que solo administración puede ver y tocar. */
export const SOLO_ADMIN = ["usuarios", "auditoria"] as const;

/** Recursos que solo administración puede eliminar (su historia o su plantilla deben conservarse). */
const BORRADO_ADMIN = ["pacientes", "medicos", "personal", "medicamentos"];

export function puedeEscribir(
  rol: Rol,
  recurso: string,
  metodo: string,
  extra: { idRegistro?: string; medicoId?: string } = {},
): boolean {
  if (rol === "ADMIN") return true;
  if ((SOLO_ADMIN as readonly string[]).includes(recurso)) return false;
  if (metodo === "DELETE" && BORRADO_ADMIN.includes(recurso)) return false;
  // Un médico puede actualizar su propia ficha (por ejemplo, cargar su firma y su sello).
  if (rol === "MEDICO" && recurso === "medicos" && metodo === "PATCH" && extra.medicoId && extra.idRegistro === extra.medicoId) return true;
  const permitidos = ESCRITURA[rol];
  return permitidos === "todo" || permitidos.includes(recurso);
}

export function puedeVerAdministracion(rol: Rol): boolean {
  return rol === "ADMIN";
}
