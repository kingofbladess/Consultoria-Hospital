import type { Opcion, Seccion, Valores } from "@/components/Formulario";
import { nombreRol, type Rol } from "@/lib/sesion";

export const opcionesRol: Opcion[] = (Object.keys(nombreRol) as Rol[]).map((r) => ({ valor: r, etiqueta: nombreRol[r] }));

export function camposUsuario(personal: Opcion[], edicion = false): Seccion[] {
  return [
    {
      titulo: "Cuenta",
      campos: [
        { nombre: "nombre", etiqueta: "Nombre para mostrar", obligatorio: true, ayuda: "Recepción turno mañana" },
        { nombre: "email", etiqueta: "Usuario o correo", obligatorio: true, ayuda: "jperez o jperez@hospital.com", autoComplete: "off" },
        { nombre: "rol", etiqueta: "Rol", tipo: "select", obligatorio: true, opciones: opcionesRol },
        {
          nombre: "personalId",
          etiqueta: "Persona de la plantilla",
          tipo: "select",
          opciones: personal,
          vacio: "Sin vincular",
        },
        ...(edicion ? [{ nombre: "activo", etiqueta: "Cuenta activa (puede ingresar)", tipo: "casilla" as const, ancho: true }] : []),
      ],
    },
    {
      titulo: edicion ? "Cambiar contraseña" : "Contraseña",
      campos: [
        {
          nombre: "clave",
          etiqueta: edicion ? "Nueva contraseña (déjela vacía para no cambiarla)" : "Contraseña inicial",
          tipo: "clave",
          obligatorio: !edicion,
          autoComplete: "new-password",
        },
      ],
    },
  ];
}

export function valoresUsuario(u: { nombre: string; email: string; rol: string; personalId: string | null; activo: boolean }): Valores {
  return { nombre: u.nombre, email: u.email, rol: u.rol, personalId: u.personalId ?? "", activo: u.activo, clave: "" };
}
