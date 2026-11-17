"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ACCIONES, MODULOS } from "@/lib/modulos";
import Icono, { type NombreIcono } from "./Icono";

// Paleta de comandos: Ctrl+K abre un buscador para saltar a cualquier módulo, acción o paciente.
// También escucha los atajos Alt+1…6 de las acciones rápidas.

type Opcion = { id: string; titulo: string; detalle?: string; ruta: string; icono: NombreIcono; tecla?: string; color?: string };

const FIJAS: Opcion[] = [
  ...ACCIONES.map((a) => ({ id: a.ruta, titulo: a.nombre, detalle: `Alt + ${a.tecla}`, ruta: a.ruta, icono: a.icono, tecla: a.tecla, color: a.color })),
  { id: "/registro", titulo: "Estación de registro", detalle: "Ir a", ruta: "/registro", icono: "registro", color: "naval" },
  ...MODULOS.map((m) => ({ id: m.ruta, titulo: m.nombre, detalle: "Ir a", ruta: m.ruta, icono: m.icono, color: m.color })),
];

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function Paleta() {
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);
  const [texto, setTexto] = useState("");
  const [pacientes, setPacientes] = useState<Opcion[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [indice, setIndice] = useState(0);
  const entrada = useRef<HTMLInputElement>(null);
  const previo = useRef<HTMLElement | null>(null);

  const abrir = useCallback(() => {
    previo.current = document.activeElement as HTMLElement;
    setTexto("");
    setPacientes([]);
    setIndice(0);
    setAbierta(true);
  }, []);

  const cerrar = useCallback(() => {
    setAbierta(false);
    previo.current?.focus?.();
  }, []);

  const ir = useCallback(
    (ruta: string) => {
      setAbierta(false);
      router.push(ruta);
    },
    [router],
  );

  useEffect(() => {
    function tecla(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        abrir();
        return;
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const accion = ACCIONES.find((a) => a.tecla === e.key);
        if (accion) {
          e.preventDefault();
          ir(accion.ruta);
        }
      }
    }
    const abrirDesdeBoton = () => abrir();
    window.addEventListener("keydown", tecla);
    window.addEventListener("abrir-paleta", abrirDesdeBoton);
    return () => {
      window.removeEventListener("keydown", tecla);
      window.removeEventListener("abrir-paleta", abrirDesdeBoton);
    };
  }, [abrir, ir]);

  useEffect(() => {
    if (abierta) entrada.current?.focus();
  }, [abierta]);

  // Busca pacientes en la API mientras se escribe (con una pausa para no consultar en cada tecla).
  useEffect(() => {
    const q = texto.trim();
    if (!abierta || q.length < 2) {
      setPacientes([]);
      return;
    }
    setBuscando(true);
    const control = new AbortController();
    const espera = setTimeout(async () => {
      try {
        const r = await fetch(`/api/pacientes?q=${encodeURIComponent(q)}&porPagina=6`, { signal: control.signal });
        const d = await r.json();
        setPacientes(
          (d.datos ?? []).map((p: { id: string; nombres: string; apellidos: string; cedula: string | null }) => ({
            id: p.id,
            titulo: `${p.nombres} ${p.apellidos}`,
            detalle: p.cedula ?? "Sin cédula",
            ruta: `/pacientes/${p.id}`,
            icono: "pacientes" as const,
            color: "oliva",
          })),
        );
      } catch {
        /* búsqueda cancelada o sin conexión: se muestran solo las opciones fijas */
      } finally {
        setBuscando(false);
      }
    }, 180);
    return () => {
      clearTimeout(espera);
      control.abort();
    };
  }, [texto, abierta]);

  const filtro = normalizar(texto.trim());
  const fijas = filtro ? FIJAS.filter((o) => normalizar(o.titulo).includes(filtro)) : FIJAS;
  const opciones = [...pacientes, ...fijas];

  useEffect(() => setIndice(0), [texto, pacientes.length]);

  function alTeclear(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      cerrar();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndice((i) => (i + 1) % Math.max(opciones.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndice((i) => (i - 1 + opciones.length) % Math.max(opciones.length, 1));
    } else if (e.key === "Enter" && opciones[indice]) {
      e.preventDefault();
      ir(opciones[indice].ruta);
    } else if (e.key === "Tab") {
      e.preventDefault(); // El foco se queda dentro de la paleta.
    }
  }

  return (
    <>
      <button type="button" className="buscador-global" onClick={abrir}>
        <Icono nombre="buscar" tamano={18} />
        <span>Buscar paciente, módulo o acción…</span>
        <kbd>Ctrl K</kbd>
      </button>

      {abierta && (
        <div className="paleta-fondo" onMouseDown={cerrar}>
          <div
            className="paleta glass-panel glass-subtle"
            role="dialog"
            aria-modal="true"
            aria-label="Buscar"
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={alTeclear}
          >
            <div className="paleta-entrada">
              <Icono nombre="buscar" />
              <input
                ref={entrada}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escriba un nombre, una cédula o qué quiere hacer"
                aria-label="Buscar"
                aria-controls="paleta-lista"
                aria-activedescendant={opciones[indice] ? `op-${indice}` : undefined}
                role="combobox"
                aria-expanded="true"
              />
              {buscando && <span className="girando" aria-label="Buscando" />}
              <kbd>Esc</kbd>
            </div>
            <ul id="paleta-lista" role="listbox" className="paleta-lista">
              {opciones.length === 0 && <li className="paleta-vacia">No hay resultados para «{texto}». Pruebe con la cédula.</li>}
              {opciones.map((o, i) => (
                <li
                  key={`${o.id}-${i}`}
                  id={`op-${i}`}
                  role="option"
                  aria-selected={i === indice}
                  className="paleta-opcion"
                  data-color={o.color}
                  onMouseEnter={() => setIndice(i)}
                  onClick={() => ir(o.ruta)}
                >
                  <span className="chip-icono">
                    <Icono nombre={o.icono} tamano={18} />
                  </span>
                  <span className="paleta-titulo">{o.titulo}</span>
                  {o.detalle && <span className="paleta-detalle">{o.detalle}</span>}
                </li>
              ))}
            </ul>
            <p className="paleta-pie">
              <kbd>↑</kbd> <kbd>↓</kbd> para moverse · <kbd>Enter</kbd> para abrir
            </p>
          </div>
        </div>
      )}
    </>
  );
}
