"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import BotonDictar from "@/components/BotonDictar";
import type { Opcion } from "@/components/Formulario";
import Icono from "@/components/Icono";
import { choqueAlergia, describirRegla, dosisPorPeso, grupoPorEdad, nombreGrupo, type Grupo } from "@/lib/protocolos";

/** Dosis por peso que trae un protocolo pediátrico. */
export type ReglaDosis = { dosisMgKg: number; dosisMaxMg: number | null; mgPorMl: number | null };

export type ItemReceta = {
  medicamentoId: string;
  /** Lo que se ve en el campo: el nombre del vademécum o texto libre. */
  nombre: string;
  cantidad: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
  indicaciones: string;
  regla?: ReglaDosis;
};

export type PlantillaOpcion = { id: string; nombre: string; medicoId: string; indicacionesGenerales: string; items: ItemReceta[] };

export type ProtocoloOpcion = {
  id: string;
  enfermedadId: string;
  enfermedad: string;
  grupo: Grupo;
  indicacionesGenerales: string;
  notas: string;
  items: ItemReceta[];
};

/** peso: el último anotado en una consulta, con su fecha, para la dosis pediátrica. */
export type FichaPaciente = { edad: number; alergias: string | null; peso?: number | null; pesoFecha?: string | null };

export type InicialReceta = {
  pacienteId: string;
  medicoId: string;
  consultaId: string;
  enfermedadId: string;
  indicacionesGenerales: string;
  items: ItemReceta[];
};

export const itemVacio: ItemReceta = { medicamentoId: "", nombre: "", cantidad: "", dosis: "", frecuencia: "", duracion: "", indicaciones: "" };

// Sugerencias para escribir rápido la posología.
const DOSIS = ["1 tableta", "2 tabletas", "1/2 tableta", "1 cápsula", "5 ml", "10 ml", "1 aplicación", "2 inhalaciones", "1 gota"];
const FRECUENCIAS = ["cada 6 horas", "cada 8 horas", "cada 12 horas", "una vez al día", "en la mañana", "en la noche", "antes de cada comida", "según necesidad"];
const DURACIONES = ["3 días", "5 días", "7 días", "10 días", "14 días", "30 días", "tratamiento continuo"];

type Errores = Record<string, string>;

const leerPeso = (texto: string) => {
  const n = Number(texto.replace(",", "."));
  return n > 0 && n < 300 ? n : null;
};

/** Pone la dosis calculada por peso en los items que la necesitan. */
function aplicarPeso(items: ItemReceta[], peso: number | null): ItemReceta[] {
  return items.map((i) => (i.regla ? { ...i, dosis: peso ? dosisPorPeso(i.regla, peso).texto : "" } : i));
}

export default function FormularioReceta({
  pacientes,
  fichas,
  medicos,
  enfermedades,
  medicamentos,
  plantillas,
  protocolos,
  inicial,
}: {
  pacientes: Opcion[];
  fichas: Record<string, FichaPaciente>;
  medicos: Opcion[];
  enfermedades: Opcion[];
  /** Vademécum: valor = id, etiqueta = nombre completo. */
  medicamentos: Opcion[];
  plantillas: PlantillaOpcion[];
  protocolos: ProtocoloOpcion[];
  inicial: InicialReceta;
}) {
  const router = useRouter();
  const [pacienteId, setPacienteId] = useState(inicial.pacienteId);
  const [medicoId, setMedicoId] = useState(inicial.medicoId);
  const [enfermedadId, setEnfermedadId] = useState(inicial.enfermedadId);
  const pesoDe = (id: string) => (fichas[id]?.peso ? String(fichas[id]!.peso).replace(".", ",") : "");
  const [peso, setPeso] = useState(() => pesoDe(inicial.pacienteId));
  const [items, setItems] = useState<ItemReceta[]>(inicial.items.length ? inicial.items : [{ ...itemVacio }]);
  const [indicaciones, setIndicaciones] = useState(inicial.indicacionesGenerales);
  // Si el médico ya escribió algo a mano, el protocolo no lo pisa sin preguntar.
  const [editado, setEditado] = useState(inicial.items.length > 0);
  const [aplicado, setAplicado] = useState<string | null>(null);
  const [guardarPlantilla, setGuardarPlantilla] = useState(false);
  const [nombrePlantilla, setNombrePlantilla] = useState("");
  const [guardarProtocolo, setGuardarProtocolo] = useState(false);
  const [revisoAlergias, setRevisoAlergias] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);
  const campoPeso = useRef<HTMLInputElement>(null);

  const idPorNombre = useMemo(() => new Map(medicamentos.map((m) => [m.etiqueta, m.valor])), [medicamentos]);
  const plantillasDelMedico = plantillas.filter((p) => p.medicoId === medicoId);
  const ficha = pacienteId ? fichas[pacienteId] : undefined;
  const grupo = ficha ? grupoPorEdad(ficha.edad) : null;
  const protocolo = enfermedadId && grupo ? protocolos.find((p) => p.enfermedadId === enfermedadId && p.grupo === grupo) : undefined;
  const nombreEnfermedad = enfermedades.find((e) => e.valor === enfermedadId)?.etiqueta;
  const pesoKg = leerPeso(peso);
  const necesitaPeso = items.some((i) => i.regla);
  const choques = items.map((i) => choqueAlergia(ficha?.alergias, i.nombre));
  const hayChoques = choques.some(Boolean);

  function aplicarProtocolo(p: ProtocoloOpcion) {
    setItems(aplicarPeso(p.items.map((i) => ({ ...i })), pesoKg));
    // Lo que venía escrito (por ejemplo, el plan de la consulta) se conserva debajo de las indicaciones del protocolo.
    setIndicaciones((previas) => {
      const propias = aplicado ? "" : previas.trim();
      return propias && !p.indicacionesGenerales.includes(propias) ? `${p.indicacionesGenerales}\n${propias}`.trim() : p.indicacionesGenerales;
    });
    setAplicado(p.id);
    setEditado(false);
    setErrores({});
    setRevisoAlergias(false);
    // Si el protocolo calcula por peso y todavía no hay peso, se lleva el foco a ese campo.
    if (p.items.some((i) => i.regla) && !pesoKg) setTimeout(() => campoPeso.current?.focus(), 50);
  }

  // Llenado automático: al tener paciente (edad) y diagnóstico, se aplica el protocolo que corresponde.
  useEffect(() => {
    if (protocolo && protocolo.id !== aplicado && !editado) aplicarProtocolo(protocolo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocolo?.id, editado]);

  // El peso y la confirmación de alergias son de un paciente: se borran al cambiarlo.
  const pacienteAnterior = useRef(pacienteId);
  useEffect(() => {
    if (pacienteAnterior.current === pacienteId) return;
    pacienteAnterior.current = pacienteId;
    setPeso(pesoDe(pacienteId));
    setRevisoAlergias(false);
  }, [pacienteId]);

  // Al cambiar el peso se recalculan las dosis por kg.
  useEffect(() => {
    setItems((lista) => aplicarPeso(lista, pesoKg));
  }, [pesoKg]);

  function limpiarError(clave: string) {
    if (errores[clave]) setErrores(({ [clave]: _, ...resto }) => resto);
  }

  function cambiarItem(i: number, campo: keyof ItemReceta, valor: string) {
    setEditado(true);
    setItems((lista) =>
      lista.map((item, j) => {
        if (j !== i) return item;
        if (campo === "nombre") return { ...item, nombre: valor, medicamentoId: idPorNombre.get(valor) ?? "", regla: undefined };
        // Si el médico escribe la dosis a mano, deja de calcularse por peso.
        if (campo === "dosis") return { ...item, dosis: valor, regla: undefined };
        return { ...item, [campo]: valor };
      }),
    );
    limpiarError(`items.${i}.${campo}`);
  }

  function usarPlantilla(id: string) {
    const p = plantillas.find((x) => x.id === id);
    if (!p) return;
    setEditado(true);
    setItems((lista) => [...lista.filter((x) => x.nombre.trim()), ...p.items.map((x) => ({ ...x }))]);
    if (p.indicacionesGenerales && !indicaciones.trim()) setIndicaciones(p.indicacionesGenerales);
    setErrores({});
  }

  function validar(): Errores {
    const e: Errores = {};
    if (!pacienteId) e.pacienteId = "Seleccione el paciente";
    if (!medicoId) e.medicoId = "Seleccione el médico";
    if (necesitaPeso && !pesoKg) e.peso = "Escriba el peso para calcular la dosis";
    items.forEach((item, i) => {
      for (const campo of ["nombre", "dosis", "frecuencia", "duracion"] as const) {
        if (!item[campo].trim() && !(campo === "dosis" && item.regla)) e[`items.${i}.${campo}`] = "Obligatorio";
      }
    });
    if (hayChoques && !revisoAlergias) e.alergias = "Confirme que revisó la alergia antes de emitir";
    if (guardarPlantilla && !nombrePlantilla.trim()) e.nombrePlantilla = "Escriba un nombre para la plantilla";
    return e;
  }

  const aApi = (item: ItemReceta) => ({
    medicamentoId: item.medicamentoId || null,
    descripcion: item.medicamentoId ? null : item.nombre.trim(),
    cantidad: item.cantidad.trim() || null,
    dosis: item.dosis.trim(),
    frecuencia: item.frecuencia.trim(),
    duracion: item.duracion.trim(),
    indicaciones: item.indicaciones.trim() || null,
  });

  // El protocolo guarda la regla por peso (no la dosis de este paciente) para recalcularla con el próximo.
  const aProtocolo = (item: ItemReceta) => ({
    ...aApi(item),
    dosis: item.regla ? "" : item.dosis.trim(),
    dosisMgKg: item.regla?.dosisMgKg ?? null,
    dosisMaxMg: item.regla?.dosisMaxMg ?? null,
    mgPorMl: item.regla?.mgPorMl ?? null,
  });

  async function enviar(ruta: string, cuerpo: unknown, metodo = "POST") {
    const r = await fetch(ruta, { method: metodo, headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
    return { ok: r.ok, status: r.status, datos: await r.json().catch(() => ({})) };
  }

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    setErrorGeneral("");
    const e = validar();
    setErrores(e);
    if (Object.keys(e).length) {
      setErrorGeneral(e.alergias && Object.keys(e).length === 1 ? e.alergias : "Revise los datos marcados en rojo.");
      return;
    }

    setGuardando(true);
    try {
      const lista = items.map(aApi);
      if (guardarPlantilla) {
        const p = await enviar("/api/plantillas", { nombre: nombrePlantilla.trim(), medicoId, indicacionesGenerales: indicaciones.trim() || null, items: lista });
        if (!p.ok) {
          setErrorGeneral(
            p.status === 409
              ? "Ya tiene una plantilla con ese nombre. Use otro nombre o desmarque «Guardar como plantilla»."
              : "No se pudo guardar la plantilla. El récipe no se creó; intente de nuevo.",
          );
          return;
        }
      }
      if (guardarProtocolo && enfermedadId && grupo) {
        const cuerpo = { indicacionesGenerales: indicaciones.trim() || null, items: items.map(aProtocolo) };
        const p = protocolo
          ? await enviar(`/api/protocolos/${protocolo.id}`, cuerpo, "PATCH")
          : await enviar("/api/protocolos", { ...cuerpo, enfermedadId, grupo });
        if (!p.ok) {
          setErrorGeneral("No se pudo guardar el protocolo. El récipe no se creó; intente de nuevo.");
          return;
        }
      }
      const r = await enviar("/api/recetas", {
        pacienteId,
        medicoId,
        consultaId: inicial.consultaId || null,
        enfermedadId: enfermedadId || null,
        indicacionesGenerales: indicaciones.trim() || null,
        items: lista,
      });
      if (!r.ok) {
        setErrorGeneral(
          r.status >= 500
            ? "No se pudo crear el récipe porque el servidor no responde. Intente de nuevo."
            : (r.datos.error ?? "No se pudo crear el récipe. Revise los datos e intente de nuevo."),
        );
        return;
      }
      router.push(`/recetas/${r.datos.id}?nuevo=1`);
      router.refresh();
    } catch {
      setErrorGeneral("No se pudo conectar con el servidor. Verifique su conexión e intente de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  const error = (clave: string) =>
    errores[clave] ? (
      <span className="error-campo" id={`${clave}-error`}>
        {errores[clave]}
      </span>
    ) : null;

  const select = (id: string, etiqueta: string, valor: string, cambiar: (v: string) => void, opciones: Opcion[], vacio = "Seleccione…", obligatorio = true) => (
    <div className="campo">
      <label htmlFor={id}>
        {etiqueta}
        {obligatorio && <span className="requerido"> *</span>}
      </label>
      <select
        id={id}
        value={valor}
        aria-invalid={!!errores[id]}
        onChange={(e) => {
          cambiar(e.target.value);
          limpiarError(id);
        }}
      >
        <option value="">{vacio}</option>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
      {error(id)}
    </div>
  );

  return (
    <form className="formulario ancho-completo" onSubmit={guardar} noValidate>
      {errorGeneral && (
        <p className="aviso error" role="alert">
          {errorGeneral}
        </p>
      )}

      <datalist id="vademecum">
        {medicamentos.map((m) => (
          <option key={m.valor} value={m.etiqueta} />
        ))}
      </datalist>
      <datalist id="sug-dosis">{DOSIS.map((d) => <option key={d} value={d} />)}</datalist>
      <datalist id="sug-frecuencia">{FRECUENCIAS.map((d) => <option key={d} value={d} />)}</datalist>
      <datalist id="sug-duracion">{DURACIONES.map((d) => <option key={d} value={d} />)}</datalist>

      <fieldset>
        <legend>Paciente y diagnóstico</legend>
        <div className="campos">
          {select("pacienteId", "Paciente", pacienteId, setPacienteId, pacientes)}
          {select("medicoId", "Médico", medicoId, setMedicoId, medicos)}
          <div className="campo ancho">
            {select("enfermedadId", "Diagnóstico (CIE-10)", enfermedadId, setEnfermedadId, enfermedades, "Sin diagnóstico: llenar a mano", false)}
          </div>
        </div>

        {ficha && (
          <div className="ficha-rapida" aria-live="polite">
            <span className="insignia info">{ficha.edad} años</span>
            <span className={`insignia ${grupo === "PEDIATRICO" ? "alerta" : ""}`}>{grupo === "PEDIATRICO" ? "Dosis pediátrica" : "Dosis de adulto"}</span>
            {ficha.alergias ? (
              <span className="insignia peligro">Alergias: {ficha.alergias}</span>
            ) : (
              <span className="insignia exito">Sin alergias anotadas</span>
            )}
          </div>
        )}
      </fieldset>

      {/* Estado del llenado automático */}
      {protocolo && aplicado === protocolo.id && !editado && (
        <div className="aviso-protocolo" role="status">
          <span className="chip-icono">
            <Icono nombre="check" tamano={18} />
          </span>
          <div>
            <strong>
              Llenado con el protocolo de {protocolo.enfermedad} · {nombreGrupo[protocolo.grupo]}
            </strong>
            <p>
              Revise las dosis y emita. {protocolo.notas && <span className="suave">{protocolo.notas}</span>}
            </p>
          </div>
        </div>
      )}
      {protocolo && (aplicado !== protocolo.id || editado) && (
        <div className="aviso-protocolo pendiente">
          <span className="chip-icono">
            <Icono nombre="plantilla" tamano={18} />
          </span>
          <div>
            <strong>Hay un protocolo para {protocolo.enfermedad} · {nombreGrupo[protocolo.grupo]}</strong>
            <p className="suave">Reemplaza los medicamentos que escribió por los del protocolo.</p>
          </div>
          <button type="button" className="boton primario chico" onClick={() => aplicarProtocolo(protocolo)}>
            Aplicar protocolo
          </button>
        </div>
      )}
      {enfermedadId && grupo && !protocolo && (
        <p className="aviso">
          Todavía no hay protocolo para {nombreEnfermedad} en {nombreGrupo[grupo].toLowerCase()}s. Escriba el tratamiento y marque «Guardar
          como protocolo» al final: la próxima vez el récipe se llenará solo.
        </p>
      )}

      <fieldset>
        <legend>Medicamentos</legend>

        {necesitaPeso && (
          <div className="campo-peso">
            <label htmlFor="peso">
              Peso del paciente<span className="requerido"> *</span>
            </label>
            <div className="entrada-unidad">
              <input
                ref={campoPeso}
                id="peso"
                inputMode="decimal"
                value={peso}
                placeholder="20"
                aria-invalid={!!errores.peso}
                aria-describedby="peso-ayuda"
                onChange={(e) => {
                  setPeso(e.target.value);
                  limpiarError("peso");
                }}
              />
              <span>kg</span>
            </div>
            <span className="suave ayuda" id="peso-ayuda">
              {ficha?.peso && peso === pesoDe(pacienteId)
                ? `Peso de la consulta del ${ficha.pesoFecha}. Corríjalo si cambió.`
                : "La dosis pediátrica se calcula con el peso."}
            </span>
            {error("peso")}
          </div>
        )}

        {medicoId && plantillasDelMedico.length > 0 && (
          <div className="usar-plantilla">
            <label htmlFor="plantilla">Agregar desde una plantilla</label>
            <select id="plantilla" value="" onChange={(e) => usarPlantilla(e.target.value)}>
              <option value="">Elegir plantilla…</option>
              {plantillasDelMedico.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.items.length})
                </option>
              ))}
            </select>
          </div>
        )}

        <ol className="items-receta">
          {items.map((item, i) => {
            const campo = (nombre: keyof Omit<ItemReceta, "regla">, etiqueta: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => {
              const clave = `items.${i}.${nombre}`;
              return (
                <div className={`campo ${nombre === "nombre" || nombre === "indicaciones" ? "ancho" : ""}`}>
                  <label htmlFor={clave}>{etiqueta}</label>
                  <input
                    id={clave}
                    value={item[nombre]}
                    aria-invalid={!!errores[clave]}
                    aria-describedby={errores[clave] ? `${clave}-error` : undefined}
                    onChange={(e) => cambiarItem(i, nombre, e.target.value)}
                    {...props}
                  />
                  {error(clave)}
                </div>
              );
            };
            return (
              <li key={i} className={`item-receta ${choques[i] ? "con-alergia" : ""}`}>
                <div className="item-cabecera">
                  <strong>Medicamento {i + 1}</strong>
                  {item.medicamentoId ? (
                    <span className="insignia exito">Del vademécum</span>
                  ) : item.nombre.trim() ? (
                    <span className="insignia">Texto libre</span>
                  ) : null}
                  {item.regla && <span className="insignia alerta">Dosis por peso</span>}
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="boton chico"
                      onClick={() => {
                        setEditado(true);
                        setItems((lista) => lista.filter((_, j) => j !== i));
                      }}
                      aria-label={`Quitar medicamento ${i + 1}`}
                    >
                      Quitar
                    </button>
                  )}
                </div>
                {choques[i] && (
                  <p className="alerta-alergia" role="alert">
                    El paciente tiene anotada alergia a «{choques[i]}». Revise este medicamento.
                  </p>
                )}
                <div className="campos cuatro">
                  {campo("nombre", "Medicamento *", { list: "vademecum", placeholder: "Escriba para buscar en el vademécum", autoFocus: i > 0 && !item.nombre })}
                  {item.regla ? (
                    <div className="campo">
                      <label htmlFor={`items.${i}.dosis`}>Dosis *</label>
                      <input id={`items.${i}.dosis`} value={item.dosis || "Escriba el peso"} readOnly className="calculada" aria-describedby={`regla-${i}`} />
                      <span className="suave ayuda" id={`regla-${i}`}>
                        {describirRegla(item.regla)}
                        {pesoKg && dosisPorPeso(item.regla, pesoKg).limitada && " · se aplicó el máximo"}
                      </span>
                    </div>
                  ) : (
                    campo("dosis", "Dosis *", { list: "sug-dosis", placeholder: "1 tableta" })
                  )}
                  {campo("frecuencia", "Frecuencia *", { list: "sug-frecuencia", placeholder: "cada 8 horas" })}
                  {campo("duracion", "Duración *", { list: "sug-duracion", placeholder: "7 días" })}
                  {campo("cantidad", "Cantidad", { placeholder: "1 caja" })}
                  {campo("indicaciones", "Indicaciones", { placeholder: "Tomar después de las comidas" })}
                </div>
              </li>
            );
          })}
        </ol>
        <button
          type="button"
          className="boton"
          onClick={() => {
            setEditado(true);
            setItems((lista) => [...lista, { ...itemVacio }]);
          }}
        >
          <Icono nombre="mas" tamano={18} /> Agregar otro medicamento
        </button>
      </fieldset>

      <fieldset>
        <legend>Indicaciones generales</legend>
        <div className="campo ancho">
          <div className="etiqueta-con-accion">
            <label htmlFor="indicaciones">Reposo, dieta, signos de alarma, próximo control…</label>
            <BotonDictar
              alTexto={(t) => {
                setEditado(true);
                setIndicaciones((v) => (v.trim() ? `${v.trim()} ${t}` : t));
              }}
            />
          </div>
          <textarea
            id="indicaciones"
            rows={4}
            value={indicaciones}
            onChange={(e) => {
              setEditado(true);
              setIndicaciones(e.target.value);
            }}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend>Guardar para la próxima vez</legend>
        {enfermedadId && grupo && (
          <div className="campo casilla">
            <label>
              <input type="checkbox" checked={guardarProtocolo} onChange={(e) => setGuardarProtocolo(e.target.checked)} />
              {protocolo ? "Actualizar" : "Guardar como"} protocolo de {nombreEnfermedad} para {nombreGrupo[grupo].toLowerCase()}s
            </label>
          </div>
        )}
        <div className="campo casilla">
          <label>
            <input type="checkbox" checked={guardarPlantilla} onChange={(e) => setGuardarPlantilla(e.target.checked)} />
            Guardar como plantilla personal del médico
          </label>
        </div>
        {guardarPlantilla && (
          <div className="campo">
            <label htmlFor="nombrePlantilla">
              Nombre de la plantilla<span className="requerido"> *</span>
            </label>
            <input
              id="nombrePlantilla"
              value={nombrePlantilla}
              placeholder="Hipertensión leve"
              aria-invalid={!!errores.nombrePlantilla}
              onChange={(e) => {
                setNombrePlantilla(e.target.value);
                limpiarError("nombrePlantilla");
              }}
            />
            {error("nombrePlantilla")}
          </div>
        )}
      </fieldset>

      {hayChoques && (
        <div className={`confirmar-alergia ${errores.alergias ? "con-error" : ""}`}>
          <label>
            <input
              type="checkbox"
              checked={revisoAlergias}
              onChange={(e) => {
                setRevisoAlergias(e.target.checked);
                limpiarError("alergias");
              }}
            />
            Revisé la alergia del paciente y mantengo la indicación.
          </label>
        </div>
      )}

      <div className="acciones">
        <button type="submit" className="boton primario grande" disabled={guardando}>
          {guardando ? (
            <>
              <span className="girando" aria-hidden="true" /> Emitiendo récipe…
            </>
          ) : (
            <>
              <Icono nombre="recetas" tamano={20} /> Emitir récipe con firma y sello
            </>
          )}
        </button>
        <Link href="/recetas" className="boton">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
