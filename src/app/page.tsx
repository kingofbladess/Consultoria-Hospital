import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const modulos = [
  { nombre: "Plantilla de personal", ruta: "personal", descripcion: "Médicos, enfermería, administración y farmacia", contar: () => prisma.personal.count() },
  { nombre: "Médicos", ruta: "medicos", descripcion: "MPPS, Colegio de Médicos, firma y sello", contar: () => prisma.medico.count() },
  { nombre: "Especialidades", ruta: "especialidades", descripcion: "Catálogo de especialidades médicas", contar: () => prisma.especialidad.count() },
  { nombre: "Consultorios", ruta: "consultorios", descripcion: "Espacios y horarios de atención", contar: () => prisma.consultorio.count() },
  { nombre: "Pacientes", ruta: "pacientes", descripcion: "Datos personales y antecedentes", contar: () => prisma.paciente.count() },
  { nombre: "Citas", ruta: "citas", descripcion: "Agenda por médico y consultorio", contar: () => prisma.cita.count() },
  { nombre: "Consultas", ruta: "consultas", descripcion: "Historia clínica y diagnósticos", contar: () => prisma.consulta.count() },
  { nombre: "Récipes", ruta: "recetas", descripcion: "Récipes e indicaciones", contar: () => prisma.receta.count() },
  { nombre: "Enfermedades", ruta: "enfermedades", descripcion: "Catálogo CIE-10", contar: () => prisma.enfermedad.count() },
  { nombre: "Medicamentos", ruta: "medicamentos", descripcion: "Vademécum farmacéutico", contar: () => prisma.medicamento.count() },
];

async function contarTodo(): Promise<(number | null)[] | null> {
  try {
    return await Promise.all(modulos.map((m) => m.contar()));
  } catch {
    return null;
  }
}

export default async function Inicio() {
  const totales = await contarTodo();

  return (
    <>
      <h1>Panel principal</h1>
      {!totales && (
        <p className="aviso">
          No hay conexión con la base de datos. Revise la variable <code>DATABASE_URL</code> en el archivo <code>.env</code>.
        </p>
      )}
      <div className="rejilla">
        {modulos.map((m, i) => (
          <section className="modulo" key={m.ruta}>
            <h2>{m.nombre}</h2>
            <p>{m.descripcion}</p>
            <div className="total">{totales?.[i] ?? "—"}</div>
            <code>/api/{m.ruta}</code>
          </section>
        ))}
      </div>
    </>
  );
}
