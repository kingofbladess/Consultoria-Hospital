import Link from "next/link";
import { notFound } from "next/navigation";
import BotonEliminar from "@/components/BotonEliminar";
import { Dato, Encabezado, Insignia, Migas, SinConexion } from "@/components/ui";
import Icono from "@/components/Icono";
import { edad, estadosCita, fechaHora, fechaLarga, hora, nombreCompleto, telefonoWhatsapp } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import AccionesCita from "./AccionesCita";

export const dynamic = "force-dynamic";

export default async function FichaCita({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cita = await prisma.cita
    .findUnique({
      where: { id },
      include: { paciente: true, medico: { include: { personal: true, especialidades: true } }, consultorio: true, consulta: true },
    })
    .catch(() => undefined);
  if (cita === undefined) return <SinConexion que="la cita" />;
  if (!cita) notFound();

  const paciente = nombreCompleto(cita.paciente);
  const estado = estadosCita[cita.estado];
  // Recordatorio por WhatsApp: abre el chat del paciente con el mensaje ya escrito.
  const recordatorio =
    cita.paciente.telefono && ["PENDIENTE", "CONFIRMADA"].includes(cita.estado) && cita.fechaHora > new Date()
      ? `https://wa.me/${telefonoWhatsapp(cita.paciente.telefono)}?text=${encodeURIComponent(
          `Hola ${cita.paciente.nombres}, le recordamos su cita del ${fechaLarga(cita.fechaHora)} a las ${hora(cita.fechaHora)} con ${nombreCompleto(cita.medico.personal)}${cita.consultorio ? ` en ${cita.consultorio.nombre}` : ""}. Por favor llegue 15 minutos antes y traiga su cédula. Si no puede asistir, avísenos por este medio.`,
        )}`
      : null;

  return (
    <>
      <Migas items={[{ href: "/citas", texto: "Citas" }, { texto: `${paciente} · ${fechaHora(cita.fechaHora)}` }]} />
      <Encabezado
        titulo={`Cita de ${paciente}`}
        subtitulo={
          <>
            {fechaLarga(cita.fechaHora)}, {hora(cita.fechaHora)} <Insignia tono={estado.tono}>{estado.etiqueta}</Insignia>
          </>
        }
      >
        {cita.consulta ? (
          <Link href={`/consultas/${cita.consulta.id}`} className="boton primario">
            Ver consulta
          </Link>
        ) : (
          cita.estado !== "CANCELADA" && (
            <Link href={`/consultas/nuevo?citaId=${id}`} className="boton primario">
              Registrar consulta
            </Link>
          )
        )}
        {recordatorio && (
          <a href={recordatorio} target="_blank" rel="noopener" className="boton">
            <Icono nombre="enviar" />
            Recordar por WhatsApp
          </a>
        )}
        <Link href={`/citas/${id}/editar`} className="boton">
          Editar cita
        </Link>
        <BotonEliminar
          accion={`/api/citas/${id}`}
          nombre="esta cita"
          volverA="/citas"
          bloqueado={cita.consulta ? "No se puede eliminar: ya tiene una consulta registrada." : undefined}
        />
      </Encabezado>

      <AccionesCita id={id} estado={cita.estado} />

      <div className="paneles">
        <section className="panel">
          <h2>Paciente</h2>
          <dl>
            <Dato etiqueta="Nombre" valor={<Link href={`/pacientes/${cita.pacienteId}`}>{paciente}</Link>} />
            <Dato etiqueta="Cédula" valor={cita.paciente.cedula} />
            <Dato etiqueta="Edad" valor={`${edad(cita.paciente.fechaNacimiento)} años`} />
            <Dato etiqueta="Teléfono" valor={cita.paciente.telefono} />
            {cita.paciente.alergias && <Dato etiqueta="Alergias" valor={<strong>{cita.paciente.alergias}</strong>} />}
          </dl>
        </section>
        <section className="panel">
          <h2>Atención</h2>
          <dl>
            <Dato etiqueta="Médico" valor={<Link href={`/medicos/${cita.medicoId}`}>{nombreCompleto(cita.medico.personal)}</Link>} />
            <Dato etiqueta="Especialidad" valor={cita.medico.especialidades.map((e) => e.nombre).join(", ")} />
            <Dato etiqueta="Consultorio" valor={cita.consultorio?.nombre} />
            <Dato etiqueta="Motivo" valor={cita.motivo} />
            <Dato etiqueta="Agendada el" valor={fechaHora(cita.creadoEn)} />
          </dl>
        </section>
      </div>
    </>
  );
}
