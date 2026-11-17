import Link from "next/link";
import { notFound } from "next/navigation";
import BotonEliminar from "@/components/BotonEliminar";
import Lente from "@/components/Lente";
import { GradoConArte } from "@/components/Marca";
import { Dato, Encabezado, Insignia, Migas, SinConexion } from "@/components/ui";
import { edad, estadosCita, fechaCorta, fechaHora, nombreCompleto, nombreSexo } from "@/lib/formato";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FichaPaciente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paciente = await prisma.paciente
    .findUnique({
      where: { id },
      include: {
        citas: {
          where: { fechaHora: { gte: new Date() } },
          orderBy: { fechaHora: "asc" },
          take: 5,
          include: { medico: { include: { personal: true } } },
        },
        consultas: {
          orderBy: { fecha: "desc" },
          take: 5,
          include: { medico: { include: { personal: true } }, enfermedad: true },
        },
        _count: { select: { citas: true, consultas: true, recetas: true } },
      },
    })
    .catch(() => undefined);
  if (paciente === undefined) return <SinConexion que="el paciente" />;
  if (!paciente) notFound();

  const nombre = nombreCompleto(paciente);
  const { citas, consultas, recetas } = paciente._count;
  // Al borrar un paciente se borran en cascada sus citas y consultas: se bloquea si tiene historia.
  const bloqueo =
    citas + consultas + recetas > 0
      ? "No se puede eliminar: tiene citas, consultas o récipes. Su historia clínica debe conservarse."
      : undefined;

  return (
    <>
      <Migas items={[{ href: "/pacientes", texto: "Pacientes" }, { texto: nombre }]} />
      <Lente componente={paciente.componente} color="oliva">
        <Encabezado
          titulo={nombre}
          subtitulo={`${paciente.cedula ?? "Sin cédula"} · ${edad(paciente.fechaNacimiento)} años · ${nombreSexo[paciente.sexo]}`}
        >
          <Link href={`/recetas/nuevo?pacienteId=${id}`} className="boton primario">
            Crear récipe
          </Link>
          <Link href={`/citas/nuevo?pacienteId=${id}`} className="boton">
            Agendar cita
          </Link>
          <Link href={`/consultas/nuevo?pacienteId=${id}`} className="boton">
            Registrar consulta
          </Link>
          <Link href={`/pacientes/${id}/editar`} className="boton">
            Editar datos
          </Link>
          <BotonEliminar accion={`/api/pacientes/${id}`} nombre={`a ${nombre}`} volverA="/pacientes" bloqueado={bloqueo} />
        </Encabezado>

        {(paciente.componente || paciente.grado) && (
          <div className="afiliacion">
            <GradoConArte componente={paciente.componente} grado={paciente.grado} />
          </div>
        )}
      </Lente>

      {paciente.alergias && (
        <p className="aviso alerta">
          <strong>Alergias:</strong> {paciente.alergias}
        </p>
      )}

      <div className="paneles">
        <section className="panel">
          <h2>Datos personales</h2>
          <dl>
            <Dato etiqueta="Fecha de nacimiento" valor={fechaCorta(paciente.fechaNacimiento)} />
            <Dato etiqueta="Teléfono" valor={paciente.telefono} />
            <Dato etiqueta="Correo" valor={paciente.email} />
            <Dato etiqueta="Dirección" valor={paciente.direccion} />
          </dl>
        </section>
        <section className="panel">
          <h2>Datos médicos</h2>
          <dl>
            <Dato etiqueta="Tipo de sangre" valor={paciente.tipoSangre} />
            <Dato etiqueta="Alergias" valor={paciente.alergias} />
            <Dato etiqueta="Antecedentes" valor={paciente.antecedentes} />
            <Dato etiqueta="Récipes" valor={<Link href={`/recetas?pacienteId=${id}`}>{recetas} emitidos</Link>} />
          </dl>
        </section>
      </div>

      <div className="paneles">
        <section className="panel">
          <div className="panel-titulo">
            <h2>Próximas citas</h2>
            <Link href={`/citas?pacienteId=${id}`}>Ver todas ({citas})</Link>
          </div>
          {paciente.citas.length === 0 ? (
            <p className="suave">No tiene citas próximas.</p>
          ) : (
            <ul className="lista">
              {paciente.citas.map((c) => (
                <li key={c.id}>
                  <Link href={`/citas/${c.id}`}>{fechaHora(c.fechaHora)}</Link>
                  <span className="suave"> · {nombreCompleto(c.medico.personal)}</span>{" "}
                  <Insignia tono={estadosCita[c.estado].tono}>{estadosCita[c.estado].etiqueta}</Insignia>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel">
          <div className="panel-titulo">
            <h2>Historia clínica</h2>
            <Link href={`/consultas?pacienteId=${id}`}>Ver todas ({consultas})</Link>
          </div>
          {paciente.consultas.length === 0 ? (
            <p className="suave">No tiene consultas registradas.</p>
          ) : (
            <ul className="lista">
              {paciente.consultas.map((c) => (
                <li key={c.id}>
                  <Link href={`/consultas/${c.id}`}>{fechaHora(c.fecha)}</Link>
                  <span className="suave"> · {c.enfermedad?.nombre ?? c.diagnostico ?? c.motivo}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
