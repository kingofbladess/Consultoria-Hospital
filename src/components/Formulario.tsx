"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Formulario genérico que usan todos los módulos. Cada módulo describe sus campos
// en un archivo campos.ts y este componente se encarga de validar, enviar a la API
// y mostrar los errores.

/** `grupo` agrupa las opciones de un select (por ejemplo, grados por categoría). */
export type Opcion = { valor: string; etiqueta: string; grupo?: string };

export type Campo = {
  /** Nombre del dato en la API. Con punto ("personal.nombres") se envía anidado. */
  nombre: string;
  etiqueta: string;
  tipo?: "texto" | "email" | "tel" | "fecha" | "fechaHora" | "area" | "select" | "casilla" | "varios" | "oculto" | "imagen" | "numero" | "clave";
  opciones?: Opcion[];
  obligatorio?: boolean;
  /** Pista de formato que se muestra dentro del campo vacío. */
  ayuda?: string;
  /** Ocupa todo el ancho del formulario. */
  ancho?: boolean;
  /** Para fechas: no permite fechas posteriores a hoy. */
  noFutura?: boolean;
  /** Texto de la opción vacía de un select. */
  vacio?: string;
  autoComplete?: string;
  /** Select que depende de otro campo: sus opciones salen de `opcionesPor[valor del otro campo]`. */
  dependeDe?: string;
  opcionesPor?: Record<string, Opcion[]>;
  /** Para números: rango aceptado y unidad que se muestra junto al campo. */
  min?: number;
  max?: number;
  unidad?: string;
};

/** Lee un número escrito con coma o punto decimal. */
const aNumero = (v: string) => Number(v.trim().replace(",", "."));

function opcionesDe(campo: Campo, valores: Valores): Opcion[] {
  if (campo.dependeDe) return campo.opcionesPor?.[String(valores[campo.dependeDe] ?? "")] ?? [];
  return campo.opciones ?? [];
}

export type Seccion = { titulo: string; campos: Campo[] };
export type Valor = string | boolean | string[];
export type Valores = Record<string, Valor>;

type Errores = Record<string, string | undefined>;

const DESFASE = "-04:00"; // Hora de Venezuela

function valorInicial(campo: Campo, inicial: Valores): Valor {
  if (campo.nombre in inicial) return inicial[campo.nombre];
  if (campo.tipo === "casilla") return false;
  if (campo.tipo === "varios") return [];
  return "";
}

function validar(campo: Campo, valor: Valor): string | undefined {
  if (campo.obligatorio) {
    if (Array.isArray(valor) ? valor.length === 0 : typeof valor === "string" && !valor.trim()) {
      return campo.tipo === "select" ? "Seleccione una opción" : "Este dato es obligatorio";
    }
  }
  if (typeof valor !== "string" || !valor.trim()) return undefined;
  if (campo.tipo === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim()))
    return "Escriba un correo como nombre@dominio.com";
  if (campo.noFutura && new Date(valor) > new Date()) return "La fecha no puede ser futura";
  if (campo.tipo === "numero") {
    const n = aNumero(valor);
    if (!Number.isFinite(n)) return "Escriba solo números";
    if ((campo.min !== undefined && n < campo.min) || (campo.max !== undefined && n > campo.max))
      return `Debe estar entre ${campo.min} y ${campo.max}${campo.unidad ? ` ${campo.unidad}` : ""}`;
  }
  if (campo.tipo === "clave" && valor.length < 8) return "Use al menos 8 caracteres";
  return undefined;
}

/** Convierte lo escrito en el formulario al cuerpo JSON que espera la API. */
function preparar(campos: Campo[], valores: Valores) {
  const cuerpo: Record<string, unknown> = {};
  for (const campo of campos) {
    const v = valores[campo.nombre];
    let dato: unknown;
    if (campo.tipo === "casilla") dato = Boolean(v);
    else if (campo.tipo === "varios") dato = v;
    else if (typeof v === "string" && v.trim() === "") dato = null;
    else if (campo.tipo === "fechaHora") dato = `${v}:00${DESFASE}`;
    else if (campo.tipo === "numero") dato = aNumero(v as string);
    else if (campo.tipo === "clave") dato = v; // La contraseña se envía tal cual, sin recortar espacios.
    else dato = typeof v === "string" ? v.trim() : v;

    const [padre, hijo] = campo.nombre.split(".");
    if (hijo) cuerpo[padre] = { ...(cuerpo[padre] as object), [hijo]: dato };
    else cuerpo[padre] = dato;
  }
  return cuerpo;
}

/** Sube una imagen PNG o JPG al elegirla y guarda su URL como valor del campo. */
function CampoImagen({
  id,
  etiqueta,
  ayuda,
  url,
  alCambiar,
}: {
  id: string;
  etiqueta: string;
  ayuda?: string;
  url: string;
  alCambiar: (url: string) => void;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState("");

  async function subir(archivo: File | undefined) {
    if (!archivo) return;
    setError("");
    setSubiendo(true);
    try {
      const datos = new FormData();
      datos.append("archivo", archivo);
      const respuesta = await fetch("/api/subidas", { method: "POST", body: datos });
      const r = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) setError(r.error ?? "No se pudo subir la imagen. Intente de nuevo.");
      else alCambiar(r.url);
    } catch {
      setError("No se pudo conectar con el servidor. Intente de nuevo.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="campo imagen">
      <label htmlFor={id}>{etiqueta}</label>
      <div className="imagen-caja">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={etiqueta} />
        ) : (
          <span className="suave">{subiendo ? "Subiendo…" : "Sin imagen"}</span>
        )}
      </div>
      <div className="acciones">
        <label className="boton" htmlFor={id}>
          {url ? "Cambiar imagen" : "Subir imagen"}
        </label>
        <input
          id={id}
          type="file"
          accept="image/png,image/jpeg"
          className="oculto"
          disabled={subiendo}
          onChange={(e) => {
            subir(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {url && (
          <button type="button" className="boton" onClick={() => alCambiar("")}>
            Quitar
          </button>
        )}
      </div>
      {ayuda && !error && <span className="suave ayuda">{ayuda}</span>}
      {error && <span className="error-campo">{error}</span>}
    </div>
  );
}

export default function Formulario({
  secciones,
  inicial = {},
  accion,
  metodo,
  destino,
  cancelar,
  textoGuardar,
  mensajeDuplicado = "Ya existe un registro con esos datos.",
}: {
  secciones: Seccion[];
  inicial?: Valores;
  /** Ruta de la API, por ejemplo "/api/pacientes" o "/api/pacientes/abc". */
  accion: string;
  metodo: "POST" | "PATCH";
  /** Pantalla a la que va al guardar; ":id" se reemplaza por el id guardado. */
  destino: string;
  cancelar: string;
  textoGuardar: string;
  mensajeDuplicado?: string;
}) {
  const router = useRouter();
  const campos = secciones.flatMap((s) => s.campos);
  const [valores, setValores] = useState<Valores>(() =>
    Object.fromEntries(campos.map((c) => [c.nombre, valorInicial(c, inicial)])),
  );
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);

  function cambiar(campo: Campo, valor: Valor) {
    setValores((v) => {
      const nuevos = { ...v, [campo.nombre]: valor };
      // Si cambia el campo del que depende otro (componente → grado) y la opción ya no existe, se vacía.
      for (const hijo of campos.filter((c) => c.dependeDe === campo.nombre)) {
        if (!opcionesDe(hijo, nuevos).some((o) => o.valor === nuevos[hijo.nombre])) nuevos[hijo.nombre] = "";
      }
      return nuevos;
    });
    // El error desaparece en cuanto el dato vuelve a ser válido.
    if (errores[campo.nombre] && !validar(campo, valor)) setErrores((e) => ({ ...e, [campo.nombre]: undefined }));
  }

  function alSalir(campo: Campo) {
    setErrores((e) => ({ ...e, [campo.nombre]: validar(campo, valores[campo.nombre]) }));
  }

  async function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    setErrorGeneral("");

    const nuevos: Errores = {};
    for (const campo of campos) nuevos[campo.nombre] = validar(campo, valores[campo.nombre]);
    setErrores(nuevos);
    if (Object.values(nuevos).some(Boolean)) {
      setErrorGeneral("Revise los datos marcados en rojo.");
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await fetch(accion, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preparar(campos, valores)),
      });
      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        if (respuesta.status === 409) {
          setErrorGeneral(`No se pudo guardar. ${mensajeDuplicado}`);
        } else if (datos.detalles) {
          const delServidor: Errores = {};
          for (const [nombre, mensajes] of Object.entries(datos.detalles as Record<string, string[]>)) {
            delServidor[nombre] = mensajes[0];
          }
          setErrores((e) => ({ ...e, ...delServidor }));
          setErrorGeneral("Revise los datos marcados en rojo.");
        } else {
          setErrorGeneral(
            respuesta.status >= 500
              ? "No se pudo guardar porque el servidor no responde. Verifique la conexión con la base de datos e intente de nuevo."
              : (datos.error ?? "No se pudo guardar. Intente de nuevo."),
          );
        }
        return;
      }

      const ruta = destino.replace(":id", datos.id);
      router.push(`${ruta}${ruta.includes("?") ? "&" : "?"}aviso=${metodo === "POST" ? "creado" : "guardado"}`);
      router.refresh();
    } catch {
      setErrorGeneral("No se pudo conectar con el servidor. Verifique su conexión e intente de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  function control(campo: Campo) {
    const valor = valores[campo.nombre];
    const error = errores[campo.nombre];
    const id = campo.nombre.replace(".", "-");
    const comunes = {
      id,
      name: campo.nombre,
      onBlur: () => alSalir(campo),
      "aria-invalid": !!error,
      "aria-describedby": error ? `${id}-error` : undefined,
    };

    if (campo.tipo === "oculto") return null;

    if (campo.tipo === "imagen") {
      return (
        <CampoImagen
          key={campo.nombre}
          id={id}
          etiqueta={campo.etiqueta}
          ayuda={campo.ayuda}
          url={valor as string}
          alCambiar={(url) => cambiar(campo, url)}
        />
      );
    }

    if (campo.tipo === "casilla") {
      return (
        <div className={`campo casilla ${campo.ancho ? "ancho" : ""}`} key={campo.nombre}>
          <label htmlFor={id}>
            <input {...comunes} type="checkbox" checked={Boolean(valor)} onChange={(e) => cambiar(campo, e.target.checked)} />
            {campo.etiqueta}
          </label>
        </div>
      );
    }

    if (campo.tipo === "varios") {
      const elegidos = valor as string[];
      return (
        <fieldset className="campo ancho varios" key={campo.nombre}>
          <legend>{campo.etiqueta}</legend>
          {campo.opciones?.length ? (
            <div className="opciones">
              {campo.opciones.map((o) => (
                <label key={o.valor}>
                  <input
                    type="checkbox"
                    checked={elegidos.includes(o.valor)}
                    onChange={(e) =>
                      cambiar(campo, e.target.checked ? [...elegidos, o.valor] : elegidos.filter((v) => v !== o.valor))
                    }
                  />
                  {o.etiqueta}
                </label>
              ))}
            </div>
          ) : (
            <p className="suave">No hay opciones cargadas todavía.</p>
          )}
          {error && <span className="error-campo">{error}</span>}
        </fieldset>
      );
    }

    let entrada: React.ReactNode;
    if (campo.tipo === "select") {
      const opciones = opcionesDe(campo, valores);
      const opcion = (o: Opcion) => (
        <option key={o.valor} value={o.valor}>
          {o.etiqueta}
        </option>
      );
      // Agrupadas (optgroup) cuando las opciones traen grupo.
      const grupos = [...new Set(opciones.map((o) => o.grupo).filter(Boolean))] as string[];
      entrada = (
        <select
          {...comunes}
          value={valor as string}
          onChange={(e) => cambiar(campo, e.target.value)}
          disabled={campo.dependeDe ? opciones.length === 0 : undefined}
        >
          <option value="">
            {campo.dependeDe && opciones.length === 0 ? "Elija primero el componente" : (campo.vacio ?? "Seleccione…")}
          </option>
          {grupos.length
            ? grupos.map((g) => (
                <optgroup key={g} label={g}>
                  {opciones.filter((o) => o.grupo === g).map(opcion)}
                </optgroup>
              ))
            : opciones.map(opcion)}
        </select>
      );
    } else if (campo.tipo === "area") {
      entrada = (
        <textarea
          {...comunes}
          rows={3}
          value={valor as string}
          placeholder={campo.ayuda}
          onChange={(e) => cambiar(campo, e.target.value)}
        />
      );
    } else {
      const tipos = { email: "email", tel: "tel", fecha: "date", fechaHora: "datetime-local", clave: "password" } as const;
      entrada = (
        <input
          {...comunes}
          type={tipos[campo.tipo as keyof typeof tipos] ?? "text"}
          value={valor as string}
          placeholder={campo.ayuda}
          autoComplete={campo.autoComplete}
          max={campo.noFutura && campo.tipo === "fecha" ? new Date().toISOString().slice(0, 10) : undefined}
          inputMode={campo.tipo === "numero" ? "decimal" : undefined}
          autoCapitalize={campo.tipo === "clave" ? "none" : undefined}
          onChange={(e) => cambiar(campo, e.target.value)}
        />
      );
      if (campo.unidad) entrada = <span className="entrada-unidad">{entrada}<span>{campo.unidad}</span></span>;
    }

    return (
      <div className={`campo ${campo.ancho || campo.tipo === "area" ? "ancho" : ""}`} key={campo.nombre}>
        <label htmlFor={id}>
          {campo.etiqueta}
          {campo.obligatorio && <span className="requerido"> *</span>}
        </label>
        {entrada}
        {error && (
          <span className="error-campo" id={`${id}-error`}>
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <form className="formulario" onSubmit={guardar} noValidate>
      {errorGeneral && (
        <p className="aviso error" role="alert">
          {errorGeneral}
        </p>
      )}

      {secciones.map((s) => (
        <fieldset key={s.titulo}>
          <legend>{s.titulo}</legend>
          <div className="campos">{s.campos.map(control)}</div>
        </fieldset>
      ))}

      <div className="acciones">
        <button type="submit" className="boton primario" disabled={guardando}>
          {guardando ? "Guardando…" : textoGuardar}
        </button>
        <Link href={cancelar} className="boton">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
