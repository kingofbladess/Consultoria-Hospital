# Lenguaje de producto SIGEFANB

Vigente desde 2026-10-19. Complementa BRANDING.md para consolas de datos y lectura de expedientes. La paleta institucional y los artes
se conservan. Esta capa tiene precedencia sobre las instrucciones heredadas de «todo panel es vidrio» y sobre los tamaños genéricos de
tarjetas y formularios del kit original. Implementación: `packages/ui/src/producto.css`, cargada por `vidrio.css`.

## Diagnóstico y dirección

La identidad estaba bien definida en color y artes, pero faltaba traducirla a patrones de operación. Se mezclaban tarjetas blancas con
borde, vidrio obligatorio, controles nativos sin tratamiento, radios arbitrarios y métricas en renglones separados. Eso produce una
interfaz reconocible como plantilla aunque use oliva. Reducir la letra o añadir más transparencias no corrige ese problema.

La dirección es una consola institucional de lectura precisa: lienzo crema, superficies minerales, selección oliva lateral, datos
tabulares en mono y una jerarquía discreta. La información ocupa el espacio; el marco y las acciones acompañan. La primera aplicación
es la cronología del RUTH; las demás pantallas se migran de forma comprobable, no por un cambio global de todos los controles.

## Fundamentos y tokens

- **Color:** se mantienen `primary`, `background`, `card`, `foreground` y los estados. Las superficies, divisores y selección se derivan
  mediante `color-mix`; no se introducen colores sueltos en las pantallas. Verde significa estado vigente/correcto, no «seleccionado» ni «hito».
- **Material:** lienzo sin caja; superficie de trabajo con separación suave; inspector ligeramente elevado; vidrio solo en capas flotantes
  o marcos con contenido real detrás. Listas densas y textos largos usan superficies estables sin desenfoque por fila.
- **Tipografía:** Inter en títulos y lectura; JetBrains Mono en fechas, contadores, referencias y etiquetas de consola. Texto y metadatos
  de lectura desde 12 px, títulos de fila 13 px, sección 18–20 px. La densidad se gana eliminando envoltorios y repeticiones visuales.
- **Geometría:** controles 7 px de radio, filas 6 px, superficies 12 px. No se aplica el mismo radio de tarjeta a todos los elementos.
- **Densidad compacta:** control 30 px, fila de dos líneas desde 58 px, separación 4/8/12/16 px. Densidad cómoda: control 34 px y fila
  desde 76 px. Nunca se recorta el detalle completo del inspector; las filas pueden resumirse y revelar su texto al seleccionar.
- **Toque:** controles principales de al menos 44 px en dispositivos de puntero grueso. En escritorio, objetivos de al menos 24 px.

Los tokens `--sg-control-h`, `--sg-row-min`, `--sg-row-pad`, `--sg-space-*`, `--sg-radius-*`, `--sg-surface-*`, `--sg-selection`,
`--sg-divider` y `--sg-motion-*` forman el contrato compartido. El ámbito `.sg-workspace` adopta densidad compacta;
`data-densidad="comoda"` cambia la escala sin alterar la fuente o el significado de los datos.

## Componentes y comportamiento

- **Cabecera:** título y cifras juntos cuando hay espacio. Sin una tarjeta por métrica ni una fila por subtítulo.
- **Navegación:** pestañas con selección oliva contenida y un indicador fino. Evitar bandas grandes con una píldora sólida por selección.
- **Barra de herramientas:** búsqueda con anchura razonable, filtros de 30 px, iconografía de trazo consistente y etiquetas accesibles.
  El foco usa outline; el estado abierto/activo se distingue del hover y del estado deshabilitado.
- **Filas:** fecha tabular, icono sin caja decorativa, título/resumen y procedencia alineados. Selección por velo y marcador oliva;
  hover de menor intensidad. El color de estado solo se usa donde el estado tiene significado.
- **Inspector:** fecha del hecho y registro en RUTH separados; datos de detalle en pares compactos, sin convertir cada campo en tarjeta.
  Soporte legal y trazabilidad conservan su acceso. El identificador técnico queda plegado.
- **Movimiento:** hover/foco 120 ms, selección 180 ms y entrada de detalle 220 ms como máximo. Sin rebotes, bucles decorativos, brillos
  alrededor de datos, ni blur por fila. Los controles responden al presionar y se respeta `prefers-reduced-motion`.
- **Vacío, carga y error:** conservar contexto y filtros; esqueleto estable, mensaje concreto y acción de recuperación cuando corresponda.
  Un historial parcial lo declara; una fecha o una fuente ausente no se rellena para mejorar la apariencia.

## Accesibilidad y revisión

La cronología debe funcionar con Tab, flechas y Home/End. Selección y fuente deben estar disponibles al lector de pantalla. Contraste AA
para texto, foco visible, zoom sin pérdida de controles, lectura a 390 px sin desplazamiento lateral de página. El modo sólido y alto
contraste sustituyen sombras/velos por delimitación visible; el color nunca es la única señal.

Antes de extender el patrón a otra pantalla: comprobar alturas y densidad con datos largos, navegación por teclado, modo cómodo y móvil,
movimiento reducido, ausencia de desbordamientos y auditoría de accesibilidad. Comparar el espacio ocupado por la misma cantidad de datos,
no solo el aspecto de una captura. La cronología dispone de un arnés con datos ficticios para esa comparación.

## Lente de identidad de la persona

La cabecera del expediente usa una sola lente de vidrio sobre el escudo institucional real: canto iluminado, desenfoque de 10,8 px y
un velo graduado más opaco bajo los datos. El adorno no lleva interacción ni información exclusiva. Foto de 88 × 116 px, nombre de
20–26 px, datos de 13 px y procedencia de 12 px; verificaciones sin una tarjeta por fuente. En móvil la retícula pasa a dos columnas y
conserva nombres, valores y resultados completos. La alternativa sólida y reducción de transparencia desactivan el material; no se
añaden animaciones decorativas permanentes. Implementación en la cabecera de persona y `ficha-persona.css`.

## Datos personales

El perfil agrupa la identificación en nombre, identificadores y datos personales, con divisores discretos y etiquetas sobre valores.
Las secciones usan títulos superiores; no reservan una columna para el título. Secciones vacías en una línea, campos ausentes bajo el
control existente, procedencia al pie de cada registro. Las subpestañas conservan carga bajo demanda, foco y acceso por teclado.
Retícula de tres grupos en escritorio, dos en tamaños intermedios y uno en móvil; el texto completo puede envolver sin desplazamiento
horizontal. Superficie estable para leer datos, sin desenfoque por grupo.

## Equilibrio de emblemas de certificación

Caja de alineación de 40 × 40 px por institución, centrada entre las dos líneas de texto. Los viewBox eliminan márgenes transparentes
sin deformar las siluetas. El tamaño óptico varía por masa: SAIME 26 × 33, MPPD 30 × 38, IPSFA 36 × 36, SIIPOL 32 × 36 y componente
34 × 38 px contenidos en la caja común. Resultado en esquina inferior derecha fija, independiente del color institucional. Mantener
SVG y texto, sin rasterizar ni estirar los artes; comprobar los cinco juntos en escritorio y el apilado móvil antes de cambiar escalas.

La navegación de retorno y el selector temporal viven junto al nombre dentro de la lente de identidad; no se repite el código del
expediente en una barra externa. En móvil los controles se sitúan antes del nombre y mantienen objetivos táctiles de 44 px. El
contexto histórico se distingue con texto y tinte, y los controles siguen disponibles durante carga o error mediante el retorno a búsqueda.

## Doble fotografía y sellos compactos

La cabecera presenta dos fuentes independientes: IPSFA · Fondo blanco (variante FONDO_BLANCO confirmada por el origen de respuesta) y
SAIME (variante ORIGINAL). Una respuesta de respaldo de SAIME nunca ocupa el espacio de fondo blanco. Cada ausencia tiene su estado
vacío y la copia local mantiene su antigüedad. El rótulo de fondo blanco no acredita la imagen como certificación.

Desde este ajuste, las cajas de certificación y sus artes reducen la escala anterior al 90 % (36 × 36 px de caja). Texto de 12 px con
interlineado 1,15. El escudo de resultado aumenta a 16 × 18 px: verificación positiva con relleno verde y signo claro; pendientes sin
marca positiva. Las fuentes se mantienen legibles y las dos fotografías se adaptan a móvil sin desplazamiento lateral.

La identidad integra edad cumplida junto al nacimiento y tiempo calendario junto al ingreso de la vinculación. El grado muestra su\nduración registrada por separado. Todos usan la fecha efectiva consultada, respetan cierres, datos restringidos y fechas ausentes; el\ntiempo de la vinculación no representa servicio acumulado ni la promoción de origen. Las duraciones usan años y meses explícitos, no\naños decimales ambiguos. Los complementos se presentan en oliva con texto de 12 px.

**Corrección de ingreso de origen:** «Ingreso» en la cabecera toma `primera_vinculacion` de Consulta API: la fecha de ingreso explícita
más antigua del historial visible, incluyendo vínculos cerrados y respetando el corte de registro. Las reincorporaciones no reemplazan
esa fecha. Su duración es tiempo calendario desde el primer ingreso hasta el corte, incluye interrupciones y no representa servicio
computable. La vinculación vigente y su egreso se conservan aparte; no se usa su fecha como sustituto silencioso del primer ingreso.
