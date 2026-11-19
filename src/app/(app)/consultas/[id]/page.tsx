import Link from "next/link";
import { notFound } from "next/navigation";
import BotonEliminar from "@/components/BotonEliminar";
import { Dato, Encabezado, Insignia, Migas, SinConexion } from "@/components/ui";
import { alertasSignos, clasificarImc, imc } from "@/lib/clinica";
import { SIGNOS } from "../campos";
import { edad, fechaHora, nombreCompleto } from "@/lib/formato";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function Bloque({ titulo, texto }: { titulo: string; texto: string | null }) {
  return (
    <section className="panel">
      <h2>{titulo}</h2>
      {texto ? <p className="texto-largo">{texto}</p> : <p className="suave">Sin registrar</p>}
    </section>
  );
}

export default async function FichaConsulta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const consulta = await prisma.consulta
    .findUnique({
      where: { id },
      include: {
        paciente: true,
        medico: { include: { personal: true, especialidades: true } },
        enfermedad: true,
        cita: true,
        recetas: { orderBy: { numero: "desc" } },
        _count: { select: { recetas: true } },
      },
    })
    .catch(() => undefined);
  if (consulta === undefined) return <SinConexion que="la consulta" />;
  if (!consulta) notFound();

  const paciente = nombreCompleto(consulta.paciente);
  const edadEnConsulta = edad(consulta.paciente.fechaNacimiento, consulta.fecha);
  const valorImc = imc(consulta.pesoKg, consulta.tallaCm);
  const alertas = alertasSignos(consulta, edadEnConsulta);

  return (
    <>
      <Migas items={[{ href: "/consultas", texto: "Consultas" }, { texto: `${paciente} · ${fechaHora(consulta.fecha)}` }]} />
      <Encabezado titulo={`Consulta de ${paciente}`} subtitulo={`${fechaHora(consulta.fecha)} · ${nombreCompleto(consulta.medico.personal)}`}>
        <Link href={`/recetas/nuevo?consultaId=${id}`} className="boton primario">
          Crear récipe
        </Link>
        <Link href={`/consultas/${id}/editar`} className="boton">
          Editar consulta
        </Link>
        <BotonEliminar
          accion={`/api/consultas/${id}`}
          nombre="esta consulta"
          volverA={`/consultas?pacienteId=${consulta.pacienteId}`}
          bloqueado={consulta._count.recetas > 0 ? "No se puede eliminar: tiene récipes emitidos." : undefined}
        />
      </Encabezado>

      {consulta.paciente.alergias && (
        <p className="aviso alerta">
          <strong>Alergias:</strong> {consulta.paciente.alergias}
        </p>
      )}

      <div className="paneles">
        <section className="panel">
          <h2>Paciente</h2>
          <dl>
            <Dato etiqueta="Nombre" valor={<Link href={`/pacientes/${consulta.pacienteId}`}>{paciente}</Link>} />
            <Dato etiqueta="Cédula" valor={consulta.paciente.cedula} />
            <Dato etiqueta="Edad" valor={`${edad(consulta.paciente.fechaNacimiento, consulta.fecha)} años al momento de la consulta`} />
            <Dato etiqueta="Antecedentes" valor={consulta.paciente.antecedentes} />
          </dl>
        </section>
        <section className="panel">
          <h2>Atención</h2>
          <dl>
            <Dato
              etiqueta="Médico"
              valor={<Link href={`/medicos/${consulta.medicoId}`}>{nombreCompleto(consulta.medico.personal)}</Link>}
            />
            <Dato etiqueta="Especialidad" valor={consulta.medico.especialidades.map((e) => e.nombre).join(", ")} />
            <Dato etiqueta="Cita" valor={consulta.cita && <Link href={`/citas/${consulta.cita.id}`}>{fechaHora(consulta.cita.fechaHora)}</Link>} />
            <Dato
              etiqueta="Diagnóstico CIE-10"
              valor={consulta.enfermedad && `${consulta.enfermedad.codigoCie10} · ${consulta.enfermedad.nombre}`}
            />
            <Dato
              etiqueta="Récipes"
              valor={
                consulta.recetas.length > 0 &&
                consulta.recetas.map((r, i) => (
                  <span key={r.id}>
                    {i > 0 && ", "}
                    <Link href={`/recetas/${r.id}`}>N° {r.numero}</Link>
                  </span>
                ))
              }
            />
          </dl>
        </section>
      </div>

      {SIGNOS.some((x) => consulta[x.nombre] !== null) && (
        <section className="panel signos" data-color="petroleo">
          <div className="panel-titulo">
            <h2>Signos vitales</h2>
            {alertas.length > 0 && (
              <span className="acciones">
                {alertas.map((a) => (
                  <Insignia key={a} tono="peligro">
                    {a}
                  </Insignia>
                ))}
              </span>
            )}
          </div>
          <div className="signos-rejilla">
            {consulta.tensionSistolica !== null && (
              <div className="signo">
                <span className="text-caption">Tensión arterial</span>
                <strong className="cifra">
                  {consulta.tensionSistolica}/{consulta.tensionDiastolica ?? "—"}
                </strong>
                <span className="suave">mmHg</span>
              </div>
            )}
            {SIGNOS.filter((x) => !x.nombre.startsWith("tension") && consulta[x.nombre] !== null).map((x) => (
              <div className="signo" key={x.nombre}>
                <span className="text-caption">{x.etiqueta}</span>
                <strong className="cifra">{String(consulta[x.nombre]).replace(".", ",")}</strong>
                <span className="suave">{x.unidad}</span>
              </div>
            ))}
            {valorImc !== null && (
              <div className="signo">
                <span className="text-caption">IMC</span>
                <strong className="cifra">{String(valorImc).replace(".", ",")}</strong>
                <Insignia tono={clasificarImc(valorImc, edadEnConsulta).tono}>{clasificarImc(valorImc, edadEnConsulta).texto}</Insignia>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="paneles">
        <Bloque titulo="Motivo de consulta" texto={consulta.motivo} />
        <Bloque titulo="Examen físico" texto={consulta.examenFisico} />
        <Bloque titulo="Diagnóstico" texto={consulta.diagnostico} />
        <Bloque titulo="Plan e indicaciones" texto={consulta.plan} />
      </div>
    </>
  );
}
