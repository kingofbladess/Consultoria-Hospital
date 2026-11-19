import type { Metadata } from "next";
import Link from "next/link";
import Icono from "@/components/Icono";
import { Encabezado, Insignia, SinConexion } from "@/components/ui";
import { fechaHora, nombreCompleto } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { nombreRol, type Rol } from "@/lib/sesion";

export const metadata: Metadata = { title: "Usuarios" };
export const dynamic = "force-dynamic";

export default async function Usuarios() {
  const usuarios = await prisma.usuario
    .findMany({ include: { personal: true }, orderBy: [{ activo: "desc" }, { nombre: "asc" }] })
    .catch(() => null);
  const ultimos = usuarios
    ? await prisma.auditoria
        .groupBy({ by: ["usuarioId"], where: { accion: "INGRESAR" }, _max: { fecha: true } })
        .catch(() => [])
    : [];
  const ultimoIngreso = new Map(ultimos.map((u) => [u.usuarioId, u._max.fecha]));

  return (
    <>
      <Encabezado caption="Administración" titulo="Usuarios" subtitulo="Quién puede ingresar al sistema y qué puede hacer cada uno.">
        <Link href="/usuarios/nuevo" className="boton primario">
          <Icono nombre="mas" />
          Crear usuario
        </Link>
      </Encabezado>

      <div className="paneles permisos">
        {(
          [
            ["ADMIN", "Todo, incluidos usuarios y auditoría."],
            ["MEDICO", "Pacientes, consultas, récipes, protocolos y citas. Su propia ficha (firma y sello)."],
            ["RECEPCION", "Registrar pacientes y agendar citas. Consulta el resto."],
            ["FARMACIA", "Vademécum. Consulta récipes y el resto."],
          ] as [Rol, string][]
        ).map(([rol, texto]) => (
          <div key={rol} className="glass-row permiso">
            <strong>{nombreRol[rol]}</strong>
            <span className="suave">{texto}</span>
          </div>
        ))}
      </div>

      {!usuarios ? (
        <SinConexion que="los usuarios" />
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Persona vinculada</th>
                <th>Último ingreso</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>
                    <Link href={`/usuarios/${u.id}/editar`}>{u.nombre}</Link>
                  </td>
                  <td className="cifra">{u.email}</td>
                  <td>{nombreRol[u.rol]}</td>
                  <td>{u.personal ? nombreCompleto(u.personal) : <span className="suave">—</span>}</td>
                  <td className="cifra">{ultimoIngreso.get(u.id) ? fechaHora(ultimoIngreso.get(u.id)!) : <span className="suave">Nunca</span>}</td>
                  <td>{u.activo ? <Insignia tono="exito">Activa</Insignia> : <Insignia tono="apagado">Desactivada</Insignia>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
