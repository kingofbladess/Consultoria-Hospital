import { z } from "zod";

// Esquemas y selección de usuarios, compartidos por /api/usuarios y /api/usuarios/[id].

export const datosUsuario = {
  nombre: z.string().trim().min(1),
  email: z.string().trim().toLowerCase().min(3, "Escriba el usuario o el correo").regex(/^[a-z0-9._@-]+$/, "Use letras, números, punto, guion o @"),
  rol: z.enum(["ADMIN", "MEDICO", "RECEPCION", "FARMACIA"]),
  personalId: z.string().trim().optional().nullable(),
  activo: z.boolean().optional(),
};
export const clave = z.string().min(8, "La contraseña debe tener al menos 8 caracteres");

export const SIN_CLAVE = { id: true, email: true, nombre: true, rol: true, activo: true, personalId: true, creadoEn: true, personal: true } as const;
