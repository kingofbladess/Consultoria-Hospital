import type { Seccion, Valores } from "@/components/Formulario";
import { fechaInput } from "@/lib/formato";
import type { Paciente } from "@prisma/client";
import { camposMilitares } from "@/lib/marca/campos";

const TIPOS_SANGRE = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((t) => ({ valor: t, etiqueta: t }));

export const camposPaciente: Seccion[] = [
  {
    titulo: "Datos personales",
    campos: [
      { nombre: "nombres", etiqueta: "Nombres", obligatorio: true, autoComplete: "given-name" },
      { nombre: "apellidos", etiqueta: "Apellidos", obligatorio: true, autoComplete: "family-name" },
      { nombre: "cedula", etiqueta: "Cédula", ayuda: "V-12345678" },
      { nombre: "fechaNacimiento", etiqueta: "Fecha de nacimiento", tipo: "fecha", obligatorio: true, noFutura: true },
      {
        nombre: "sexo",
        etiqueta: "Sexo",
        tipo: "select",
        obligatorio: true,
        opciones: [
          { valor: "FEMENINO", etiqueta: "Femenino" },
          { valor: "MASCULINO", etiqueta: "Masculino" },
        ],
      },
    ],
  },
  {
    titulo: "Afiliación militar",
    campos: camposMilitares(),
  },
  {
    titulo: "Contacto",
    campos: [
      { nombre: "telefono", etiqueta: "Teléfono", tipo: "tel", ayuda: "0414-1234567", autoComplete: "tel" },
      { nombre: "email", etiqueta: "Correo electrónico", tipo: "email", autoComplete: "email" },
      { nombre: "direccion", etiqueta: "Dirección", tipo: "area" },
    ],
  },
  {
    titulo: "Datos médicos",
    campos: [
      { nombre: "tipoSangre", etiqueta: "Tipo de sangre", tipo: "select", opciones: TIPOS_SANGRE, vacio: "Sin dato" },
      { nombre: "alergias", etiqueta: "Alergias", tipo: "area", ayuda: "Ej.: penicilina, AINES" },
      { nombre: "antecedentes", etiqueta: "Antecedentes", tipo: "area", ayuda: "Personales y familiares" },
    ],
  },
];

export function valoresPaciente(p: Paciente): Valores {
  return {
    nombres: p.nombres,
    apellidos: p.apellidos,
    cedula: p.cedula ?? "",
    fechaNacimiento: fechaInput(p.fechaNacimiento),
    sexo: p.sexo,
    telefono: p.telefono ?? "",
    email: p.email ?? "",
    direccion: p.direccion ?? "",
    tipoSangre: p.tipoSangre ?? "",
    alergias: p.alergias ?? "",
    antecedentes: p.antecedentes ?? "",
    componente: p.componente ?? "",
    grado: p.grado ?? "",
  };
}
