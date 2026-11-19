// Esqueleto estable mientras carga una pantalla: conserva la forma de la página y no salta al llegar los datos.
export default function Cargando() {
  return (
    <div className="esqueleto" aria-busy="true" aria-label="Cargando">
      <div className="esqueleto-bloque cabecera" />
      <div className="esqueleto-fila">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="esqueleto-bloque tarjeta" />
        ))}
      </div>
      <div className="esqueleto-bloque tabla" />
    </div>
  );
}
