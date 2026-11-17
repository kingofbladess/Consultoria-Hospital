"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Aviso from "./Aviso";
import { colorDeRuta, MODULOS, type ColorModulo } from "@/lib/modulos";
import Icono from "./Icono";
import { EmblemaMppd } from "./Marca";
import Paleta from "./Paleta";
import Reloj from "./Reloj";

const CLAVE_LATERAL = "lateral-expandida";

/** Marco de la consola: barra superior, barra lateral y pie institucional (BRANDING.md). */
export default function Marco({ nombre, rol, esAdmin, children }: { nombre: string; rol: string; esAdmin: boolean; children: React.ReactNode }) {
  const ruta = usePathname();
  const router = useRouter();
  // El kit pide la barra lateral colapsada por defecto en escritorio; se recuerda si el usuario la abre.
  const [expandida, setExpandida] = useState(false);
  const [movilAbierta, setMovilAbierta] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    try {
      setExpandida(localStorage.getItem(CLAVE_LATERAL) === "1");
    } catch {
      /* sin almacenamiento: queda colapsada */
    }
  }, []);
  useEffect(() => setMovilAbierta(false), [ruta]);

  function alternar() {
    if (window.matchMedia("(max-width: 900px)").matches) {
      setMovilAbierta((v) => !v);
      return;
    }
    setExpandida((v) => {
      try {
        localStorage.setItem(CLAVE_LATERAL, v ? "0" : "1");
      } catch {
        /* sin almacenamiento */
      }
      return !v;
    });
  }

  async function salir() {
    setSaliendo(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/login");
    router.refresh();
  }

  const activo = (r: string) => (r === "/" ? ruta === "/" : ruta === r || ruta.startsWith(`${r}/`));
  const enlace = (href: string, texto: string, icono: Parameters<typeof Icono>[0]["nombre"], color: ColorModulo) => (
    <Link
      key={href}
      href={href}
      className="enlace-lateral"
      data-color={color}
      aria-current={activo(href) ? "page" : undefined}
      title={expandida ? undefined : texto}
      aria-label={texto}
    >
      <Icono nombre={icono} tamano={18} />
      <span className="enlace-texto">{texto}</span>
    </Link>
  );

  return (
    <div className={`marco ${expandida ? "lateral-expandida" : ""} ${movilAbierta ? "lateral-movil" : ""}`}>
      <header className="barra-superior">
        <button
          type="button"
          className="boton-icono"
          onClick={alternar}
          aria-label={expandida || movilAbierta ? "Contraer menú" : "Expandir menú"}
          aria-expanded={expandida || movilAbierta}
          aria-controls="lateral"
        >
          <Icono nombre={expandida || movilAbierta ? "lateralCerrar" : "lateralAbrir"} tamano={18} />
        </button>
        <Link href="/" className="marca">
          <EmblemaMppd />
          <span className="marca-texto">
            <strong>Consultoría Hospital</strong>
            <small>Gestión Hospitalaria · MPPD</small>
          </span>
        </Link>
        <div className="barra-centro">
          <Paleta />
        </div>
        <div className="barra-derecha">
          <Reloj />
          <Link href="/recetas/nuevo" className="boton dorado">
            <Icono nombre="recetas" />
            <span>Crear récipe</span>
          </Link>
        </div>
      </header>

      <aside id="lateral" className="lateral" aria-label="Navegación">
        <nav>
          {enlace("/", "Panel", "inicio", "oliva")}
          {enlace("/registro", "Estación de registro", "registro", "naval")}
          <hr />
          {MODULOS.map((m) => enlace(m.ruta, m.nombre, m.icono, m.color))}
          {esAdmin && (
            <>
              <hr />
              {enlace("/usuarios", "Usuarios", "usuarios", "naval")}
              {enlace("/auditoria", "Auditoría", "bitacora", "oro")}
            </>
          )}
        </nav>
        <div className="usuario" title={expandida ? undefined : `${nombre} · ${rol}`}>
          <span className="avatar" aria-hidden="true">
            <Icono nombre="usuario" tamano={16} />
          </span>
          <span className="usuario-datos">
            <strong>{nombre}</strong>
            <small>{rol}</small>
          </span>
          <button type="button" className="boton-icono" onClick={salir} disabled={saliendo} aria-label="Cerrar sesión" title="Cerrar sesión">
            <Icono nombre="salir" tamano={16} />
          </button>
        </div>
      </aside>
      {movilAbierta && <div className="velo" onClick={() => setMovilAbierta(false)} aria-hidden="true" />}

      <div className="area">
        <main className="contenido page-enter" id="contenido" key={ruta} data-color={colorDeRuta(ruta)}>
          {children}
        </main>
        <Suspense fallback={null}>
          <Aviso />
        </Suspense>
        <footer className="pie-institucional">Ministerio del Poder Popular para la Defensa · Venezuela</footer>
      </div>
    </div>
  );
}
