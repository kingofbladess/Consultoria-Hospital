import Link from "next/link";
import { notFound } from "next/navigation";
import BotonEliminar from "@/components/BotonEliminar";
import Lente from "@/components/Lente";
import { GradoConArte } from "@/components/Marca";
import { conGrado } from "@/lib/marca/grados";
import { Dato, Encabezado, Insignia, Migas, SinConexion } from "@/components/ui";
import { estadosCita, fechaHora, nombreCompleto } from "@/lib/formato";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DIAS: Record<string, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

export default async function FichaMedico({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const medico = await prisma.medico
    .findUnique({
      where: { id },
      include: {
        personal: true,
        especialidades: { orderBy: { nombre: "asc" } },
        horarios: { include: { consultorio: true }, orderBy: [{ dia: "asc" }, { horaInicio: "asc" }] },
        citas: {
          where: { fechaHora: { gte: new Date() }, estado: { in: ["PENDIENTE", "CONFIRMADA"] } },
          orderBy: { fechaHora: "asc" },
          take: 8,
          include: { paciente: true },
        },
        _count: { select: { citas: true, consultas: true, recetas: true, plantillas: true } },
      },
    })
    .catch(() => undefined);
  if (medico === undefined) return <SinConexion que="el médico" />;
  if (!medico) notFound();

  const nombre = conGrado(nombreCompleto(medico.personal), medico.personal.grado);
  const { citas, consultas, recetas } = medico._count;
  const bloqueo =
    citas + consultas + recetas > 0
      ? "No se puede eliminar: tiene citas, consultas o récipes registrados. Puede marcarlo como inactivo."
      : undefined;

  return (
    <>
      <Migas items={[{ href: "/medicos", texto: "Médicos" }, { texto: nombre }]} />
      <Lente componente={medico.personal.componente} color="naval">
        <Encabezado
          titulo={nombre}
          subtitulo={`MPPS ${medico.numeroMpps}${medico.especialidades.length ? ` · ${medico.especialidades.map((e) => e.nombre).join(", ")}` : ""}`}
        >
          <Link href={`/recetas/nuevo?medicoId=${id}`} className="boton primario">
            Crear récipe
          </Link>
          <Link href={`/citas/nuevo?medicoId=${id}`} className="boton">
            Agendar cita
          </Link>
          <Link href={`/medicos/${id}/editar`} className="boton">
            Editar datos
          </Link>
          {/* Se elimina el registro de personal; el médico se borra con él. */}
          <BotonEliminar accion={`/api/personal/${medico.personalId}`} nombre={`a ${nombre}`} volverA="/medicos" bloqueado={bloqueo} />
        </Encabezado>

        {(medico.personal.componente || medico.personal.grado) && (
          <div className="afiliacion">
            <GradoConArte componente={medico.personal.componente} grado={medico.personal.grado} />
          </div>
        )}
      </Lente>

      <div className="paneles">
        <section className="panel">
          <h2>Datos personales</h2>
          <dl>
            <Dato etiqueta="Cédula" valor={medico.personal.cedula} />
            <Dato etiqueta="Cargo" valor={medico.personal.cargo} />
            <Dato etiqueta="Teléfono" valor={medico.personal.telefono} />
            <Dato etiqueta="Correo" valor={medico.personal.email} />
            <Dato
              etiqueta="Estado"
              valor={medico.personal.activo ? <Insignia tono="exito">Activo</Insignia> : <Insignia tono="apagado">Inactivo</Insignia>}
            />
          </dl>
        </section>
        <section className="panel">
          <h2>Datos profesionales</h2>
          <dl>
            <Dato etiqueta="Número MPPS" valor={medico.numeroMpps} />
            <Dato etiqueta="Colegio de Médicos" valor={medico.numeroColegio} />
            <Dato etiqueta="Especialidades" valor={medico.especialidades.map((e) => e.nombre).join(", ")} />
            <Dato etiqueta="Plantillas de récipe" valor={<Link href="/recetas/plantillas">{medico._count.plantillas}</Link>} />
          </dl>
        </section>
      </div>

      <section className="panel identidad">
        <div className="panel-titulo">
          <h2>Identidad en el récipe</h2>
          <Link href={`/medicos/${id}/editar`}>Cambiar imágenes</Link>
        </div>
        <div className="imagenes">
          {(
            [
              ["Logo", medico.logoUrl],
              ["Firma", medico.firmaUrl],
              ["Sello", medico.selloUrl],
            ] as const
          ).map(([etiqueta, url]) => (
            <figure key={etiqueta}>
              <div className="imagen-caja">
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={etiqueta} />
                ) : (
                  <span className="suave">Sin cargar</span>
                )}
              </div>
              <figcaption>{etiqueta}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <div className="paneles">
        <section className="panel">
          <div className="panel-titulo">
            <h2>Próximas citas</h2>
            <Link href={`/citas?medicoId=${id}`}>Ver agenda ({citas})</Link>
          </div>
          {medico.citas.length === 0 ? (
            <p className="suave">No tiene citas pendientes.</p>
          ) : (
            <ul className="lista">
              {medico.citas.map((c) => (
                <li key={c.id}>
                  <Link href={`/citas/${c.id}`}>{fechaHora(c.fechaHora)}</Link>
                  <span className="suave"> · {nombreCompleto(c.paciente)}</span>{" "}
                  <Insignia tono={estadosCita[c.estado].tono}>{estadosCita[c.estado].etiqueta}</Insignia>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="panel">
          <h2>Horario semanal</h2>
          {medico.horarios.length === 0 ? (
            <p className="suave">No tiene horarios asignados.</p>
          ) : (
            <ul className="lista">
              {medico.horarios.map((h) => (
                <li key={h.id}>
                  {DIAS[h.dia]} {h.horaInicio}–{h.horaFin}
                  <span className="suave"> · {h.consultorio.nombre}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
