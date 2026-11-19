import Link from "next/link";

// Piezas de pantalla compartidas por todos los módulos.

export function Migas({ items }: { items: { href?: string; texto: string }[] }) {
  return (
    <nav className="migas" aria-label="Ubicación">
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && " / "}
          {item.href ? <Link href={item.href}>{item.texto}</Link> : item.texto}
        </span>
      ))}
    </nav>
  );
}

/** Cabecera de página del kit (PageHeader): caption de consola, título, descripción y acciones. */
export function Encabezado({
  caption,
  titulo,
  subtitulo,
  children,
}: {
  caption?: string;
  titulo: string;
  subtitulo?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="encabezado">
      <div>
        {caption && <p className="text-caption caption-pagina">{caption}</p>}
        <h1>{titulo}</h1>
        {subtitulo && <p className="suave">{subtitulo}</p>}
      </div>
      {children && <div className="acciones">{children}</div>}
    </div>
  );
}

export function SinConexion({ que = "los datos" }: { que?: string }) {
  return (
    <p className="aviso">
      No se pudieron cargar {que} porque no hay conexión con la base de datos. Revise la variable{" "}
      <code>DATABASE_URL</code> en el archivo <code>.env</code> y recargue la página.
    </p>
  );
}

/** Formulario GET de búsqueda y filtros de una lista. */
export function Busqueda({
  q,
  placeholder,
  children,
  limpiar,
}: {
  q: string;
  placeholder: string;
  /** Filtros adicionales (selects, fechas) con su atributo name. */
  children?: React.ReactNode;
  /** Ruta sin filtros; si viene, se muestra el enlace para quitarlos. */
  limpiar?: string;
}) {
  return (
    <form className="busqueda" role="search">
      <label htmlFor="q" className="oculto">
        Buscar
      </label>
      <input id="q" name="q" type="search" defaultValue={q} placeholder={placeholder} />
      {children}
      <button type="submit" className="boton">
        Buscar
      </button>
      {limpiar && (
        <Link href={limpiar} className="enlace-suave">
          Quitar filtros
        </Link>
      )}
    </form>
  );
}

export function Paginacion({
  pagina,
  paginas,
  enlace,
}: {
  pagina: number;
  paginas: number;
  enlace: (n: number) => string;
}) {
  if (paginas <= 1) return null;
  return (
    <nav className="paginacion" aria-label="Páginas">
      {pagina > 1 ? <Link href={enlace(pagina - 1)}>← Anterior</Link> : <span />}
      <span className="suave">
        Página {pagina} de {paginas}
      </span>
      {pagina < paginas ? <Link href={enlace(pagina + 1)}>Siguiente →</Link> : <span />}
    </nav>
  );
}

export function Vacio({ texto, accion }: { texto: string; accion?: { href: string; texto: string; primaria?: boolean } }) {
  return (
    <div className="vacio">
      <p>{texto}</p>
      {accion && (
        <Link href={accion.href} className={`boton ${accion.primaria ? "primario" : ""}`}>
          {accion.texto}
        </Link>
      )}
    </div>
  );
}

export function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div className="dato">
      <dt>{etiqueta}</dt>
      <dd>{valor === null || valor === undefined || valor === "" || valor === false ? <span className="suave">Sin registrar</span> : valor}</dd>
    </div>
  );
}

export function Insignia({ tono = "neutro", children }: { tono?: string; children: React.ReactNode }) {
  return <span className={`insignia ${tono}`}>{children}</span>;
}

/** Arma la URL de una lista conservando los filtros actuales. */
export function enlaceConFiltros(base: string, filtros: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filtros)) if (v) params.set(k, v);
  const texto = params.toString();
  return texto ? `${base}?${texto}` : base;
}

/** Lee la página pedida en la URL. */
export function leerPagina(valor?: string) {
  return Math.max(1, Number(valor) || 1);
}
