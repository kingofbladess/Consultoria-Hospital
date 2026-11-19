import Formulario from "@/components/Formulario";
import { Migas } from "@/components/ui";
import { camposPaciente } from "../campos";

export default async function NuevoPaciente({ searchParams }: { searchParams: Promise<{ cedula?: string; nombre?: string }> }) {
  // Desde la estación de registro llega lo que se buscó: se precarga para no escribirlo dos veces.
  const { cedula = "", nombre = "" } = await searchParams;
  const [nombres, ...apellidos] = nombre.trim().split(/\s+/);
  return (
    <>
      <Migas items={[{ href: "/pacientes", texto: "Pacientes" }, { texto: "Registrar" }]} />
      <h1>Registrar paciente</h1>
      <Formulario
        secciones={camposPaciente}
        inicial={{ cedula, nombres: nombres ?? "", apellidos: apellidos.join(" ") }}
        accion="/api/pacientes"
        metodo="POST"
        destino="/pacientes/:id"
        cancelar="/pacientes"
        textoGuardar="Registrar paciente"
        mensajeDuplicado="Ya hay un paciente registrado con esa cédula."
      />
    </>
  );
}
