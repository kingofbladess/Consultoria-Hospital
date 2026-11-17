# Kit de branding SIDEFENSA — aplicable a otro proyecto

Para un agente (o persona) que debe dejar **otro proyecto** con la misma identidad visual que SIDEFENSA Visitantes. Es reproducible: todo lo que define la marca está en esta carpeta y se copia tal cual. La descripción de criterio y los «qué no hacer» completos están en `../branding.md` del proyecto origen; aquí va lo necesario para aplicarla.

> **En este repositorio (SIGEFANB)** el kit ya está aplicado sobre Vite + React + Mantine, no sobre Next + Tailwind: lea [«Aplicación en SIGEFANB»](#aplicación-en-sigefanb-vite--react--mantine) antes de los pasos de «Cómo aplicarlo», que describen el destino original.

> **Evolución de producto (2026-10-19):** para SIGEFANB, [PRODUCTO.md](PRODUCTO.md) define materiales, densidad, tipografía operativa y movimiento. Tiene precedencia sobre los tamaños genéricos y la obligación heredada de usar vidrio en todos los paneles. Sus tokens compartidos viven en `packages/ui/src/producto.css`, importado por `vidrio.css`; la paleta y los artes originales se conservan.

## Contenido de la carpeta

| Archivo | Qué es | Cómo se usa |
| --- | --- | --- |
| `BRANDING.md` | Este documento: pasos, reglas y lista de verificación. | Leerlo completo antes de tocar nada. |
| `globals.css` | **Fuente de verdad** de tokens, vidrio, utilidades y animaciones (copia exacta de `app/globals.css`). | Copiarlo como el CSS global del destino (ver paso 3). |
| `assets/brand/mppd.png` | Emblema fuente del MPPD (432×577). | Entrada de `scripts/optimize-mppd.mjs`. Solo si el destino es del MPPD. |
| `assets/componentes/*.png` + `indice.csv` | **Escudos de los componentes de la FANB** (`ejercito`, `armada`, `aviacion`, `guardia`; 841–976 px de ancho, ~2 MB cada uno salvo el del Ejército). El índice los une al catálogo de componentes. | Entrada de `scripts/optimize-componentes.mjs`. Ver «Artes institucionales». |
| `assets/grados/*.png` + `indice.csv` | **23 insignias de grado**, todas en un lienzo común de 525×120 con fondo transparente. El índice une cada arte con su grado del catálogo y lista los grados que **no** tienen arte. | Entrada de `scripts/optimize-grados.mjs`. Ver «Artes institucionales». |
| `scripts/optimize-mppd.mjs` | Genera `icons/mppd*.avif\|png` desde el emblema. | `node scripts/optimize-mppd.mjs [--public <dir>]` (requiere `sharp`). |
| `scripts/optimize-componentes.mjs` | Genera `componentes/escudos/{slug}-32.avif` y `{slug}.avif` desde los escudos. | `node scripts/optimize-componentes.mjs [--public <dir>]`. |
| `scripts/optimize-grados.mjs` | Genera `grados/{CODIGO}.webp` y el manifiesto TypeScript con las medidas de cada insignia. | `node scripts/optimize-grados.mjs [--public <dir>] [--manifest <archivo.ts>]`. |

Los tres scripts toman `sharp` del **directorio desde el que se ejecutan** (no de esta carpeta) y, sin banderas, escriben donde lo espera un proyecto Next (`public/…`, `lib/military/grade-insignia-manifest.ts`). Con `--public`/`--manifest` sirven a cualquier estructura, p. ej. un monorepo.

Si el destino **no** es una dependencia del MPPD, omita el emblema y use el logo propio con las mismas medidas (ver «Marca gráfica»); la paleta y el sistema no dependen de él. Los escudos y las insignias son de la **FANB**: solo aplican a un destino que hable de sus componentes y grados.

## Requisitos del destino

Next.js (App Router) + Tailwind CSS **v4** + shadcn estilo `radix-nova` con variables CSS. Dependencias: `tw-animate-css`, `shadcn`, `class-variance-authority`, `clsx`, `tailwind-merge`, `radix-ui`, `sonner`, `@tabler/icons-react` (iconos de producto; `lucide-react` solo dentro de `components/ui`), y `sharp` (solo para regenerar los artes). Tipografías: Inter y JetBrains Mono vía `next/font/google`.

Si el destino no es Next/Tailwind 4, los tokens (OKLCH) y las clases de vidrio siguen siendo válidos como CSS plano; hay que reescribir `@theme inline`, `@custom-variant` y los `@apply`. Así se hizo en SIGEFANB (ver su sección).

## Cómo aplicarlo (en orden)

1. **Dependencias.** Instale las del apartado anterior. `components.json` de shadcn: `"style": "radix-nova"`, `"cssVariables": true`, `"baseColor": "neutral"`, `"tailwind.css"` apuntando al CSS global.
2. **`lib/utils.ts`**: `export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }`.
3. **CSS global.** Copie `globals.css` sobre el CSS global del destino (o fusiónelo si ya hay uno: conserve el orden `@import` → `@custom-variant` → `@theme inline` → `:root` → `.dark` → `@layer base` → `@layer components` → keyframes → media queries). No edite valores de tokens: son la marca.
   - Bloques **de marca, siempre**: `@theme inline`, `:root`, `.dark`, `@layer base`, `.page-shell`, `.text-caption`, `.text-field-label`, todo el vidrio (`.glass-*`), `.page-enter`, keyframes y los `@media` de accesibilidad.
   - Bloques **de dominio, opcionales** (bórrelos si el destino no tiene esa pantalla): `.overdue-row` (alertas de permanencia), `.form-dense`/`.field-hero`/`.field-locked` (formulario de portería), `.scan-sweep`/`.hud-frame`/`.portrait-scan`/`.status-dot`/`.data-arrive` (consultas a fuentes y retratos), `.signin-grid-pattern` (login), `video.live-feed` (cámara).
4. **Fuentes y layout raíz** (`app/layout.tsx`):
   ```tsx
   import { Inter, JetBrains_Mono } from "next/font/google";
   const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
   const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], display: "swap" });

   <html lang="es" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
     <body className="h-full flex flex-col font-sans">{children}<Toaster … /></body>
   </html>
   ```
   Los nombres de variable `--font-inter` y `--font-jetbrains` los lee `globals.css`; no los cambie.
5. **Toaster** (una sola vez en el layout raíz), con los colores salidos de los tokens, no de la paleta de la librería:
   ```tsx
   <Toaster theme="light" richColors style={{
     "--normal-bg": "var(--card)", "--normal-text": "var(--foreground)", "--normal-border": "var(--border)",
     "--success-bg": "color-mix(in oklch, var(--success) 12%, var(--card))",
     "--success-border": "color-mix(in oklch, var(--success) 35%, var(--border))", "--success-text": "var(--success)",
     "--warning-bg": "color-mix(in oklch, var(--warning) 16%, var(--card))",
     "--warning-border": "color-mix(in oklch, var(--warning) 40%, var(--border))", "--warning-text": "var(--warning-foreground)",
     "--error-bg": "color-mix(in oklch, var(--destructive) 10%, var(--card))",
     "--error-border": "color-mix(in oklch, var(--destructive) 30%, var(--border))", "--error-text": "var(--destructive)",
     "--info-bg": "color-mix(in oklch, var(--exit) 12%, var(--card))",
     "--info-border": "color-mix(in oklch, var(--exit) 30%, var(--border))", "--info-text": "var(--exit)",
   } as CSSProperties} />
   ```
6. **Emblema/logo** (si aplica): `mkdir -p assets/brand && cp assets/brand/mppd.png <destino>/assets/brand/`, copie `scripts/optimize-mppd.mjs`, `pnpm add -D sharp` y ejecútelo. Genera `public/icons/`: `mppd-28.avif` (barra, 28px), `mppd-72.avif` (login, 72px de alto), `mppd.avif` (adorno, tamaño de la fuente), `mppd-32.png` (favicon) y `mppd-180.png` (apple-touch). Cablee `metadata.icons` a los dos PNG (Safari no acepta AVIF ahí).
7. **Escudos de componente e insignias de grado** (si el destino muestra componentes o grados): copie `assets/componentes/` y `assets/grados/` **con sus `indice.csv`** y los dos scripts, y ejecútelos:
   ```bash
   node scripts/optimize-componentes.mjs                 # → public/componentes/escudos/{slug}-32.avif y {slug}.avif
   node scripts/optimize-grados.mjs                      # → public/grados/{CODIGO}.webp + lib/military/grade-insignia-manifest.ts
   ```
   Después **enlace los artes con el catálogo de su proyecto** siguiendo «Artes institucionales» (la clave es la **abreviatura sin barra** y la **categoría**, no el nombre ni el código interno del grado). Ese enlace es lógica de negocio: el kit solo entrega los artes y el índice.
8. **Verificación**: ejecute la lista del final.

## La marca en una página

**Personalidad.** Consola institucional de operación: calma, densa en datos, sin marketing. Color de marca oliva piedra (hue 107, croma bajo). El verde vivo es solo estado «correcto / entrada / en línea».

**Voz.** Español institucional y directo; segunda persona solo en formularios. Producto: **SIDEFENSA** (sistema) y **SIDEFENSA Visitantes** (módulo); subtítulo «Identificación y Enrolamiento · MPPD»; pie «Ministerio del Poder Popular para la Defensa · Venezuela». Horas en `America/Caracas`, etiqueta **VET**, en mono tabular. Sin tono promocional, gradientes decorativos ni ilustraciones genéricas. *(En otro producto, el nombre y el subtítulo cambian; el resto de la voz no.)*

**Color.** La **marca y los neutros** están en hue 107; **los estados llevan su propio matiz** a propósito (éxito 145, atención 75, error 25, salida 242), de modo que ninguno se confunde con la marca. En código se usan **tokens** (`bg-primary`, `text-muted-foreground`…), nunca hex ni OKLCH sueltos ni la paleta de Tailwind. Claro es el canónico; `.dark` existe pero está reservado (no activar por pantalla).

| Rol | Token | sRGB (claro) |
| --- | --- | --- |
| Lienzo / texto | `--background` / `--foreground` | `#F5F6EF` / `#0C0C04` |
| Superficie elevada | `--card`, `--popover` | `#FFFFFF` |
| Marca, acción principal, foco | `--primary` (= `--ring`) | `#3E3D0E` |
| Texto sobre la marca | `--primary-foreground` | `#F5F6EF` |
| Hover / fondos suaves | `--secondary`, `--accent` | `#E8E9E0` |
| Texto secundario | `--muted-foreground` | `#656454` |
| Bordes y campos | `--border`, `--input` | `#D8D8CD` |
| Error / denegado | `--destructive` | `#B32228` |
| Entrada / ok / en línea | `--success`, `--online` | `#267D30`, `#1C882D` |
| Atención | `--warning` | `#DA950B` |
| Texto sobre atención | `--warning-foreground` | `#2F1E02` |
| Salida | `--exit` | `#215D86` |
| Fuera de línea | `--offline` | `#737365` |
| Cámara / video | `--media` | `#0E0E0A` |
| Panel de acceso (solo login) | `--brand-deep/-mid/-ink/-foreground/-muted/-subtle/-emblem/-line` | ver `globals.css` |

*(Los sRGB de la tabla se recalcularon desde los tokens OKLCH de `globals.css` y coinciden.)*

Reglas de color: el oliva es la marca y el verde es un estado (no pintar la marca con `--success`); `--warning` nunca como texto pequeño (no alcanza AA: sobre el lienzo crema da 2,3:1; para texto sobre atención, `--warning-foreground`, 6,3:1); un rol nuevo se agrega como token OKLCH + mapeo en `@theme`, no como clase suelta. Los **artes** (escudos e insignias) traen sus propios colores (oro, plata, rojo, azul): **no se recolorean ni se les aplica filtro**; la interfaz que los rodea es la que se adapta.

**Marca gráfica.** Emblema `mppd-28.avif` a 28px (`h-7 w-7`) junto al wordmark en la barra; wordmark «SIDEFENSA Visitantes» en `font-bold tracking-wide` con el subtítulo a 11px `text-muted-foreground` debajo. En el login, el panel izquierdo es el único lienzo oscuro (degradado `from-brand-mid via-brand-deep to-brand-ink`, `signin-grid-pattern` al 6 %), con el emblema a 72px en un círculo `bg-brand-emblem border-brand-line`. No inventar otro isotipo.

**Tipografía.** Inter para UI (`font-sans`), JetBrains Mono para datos (`font-mono`, siempre `tabular-nums` si el valor cambia o alinea). Sin display face, sin tercera familia, sin peso black.

| Rol | Clases |
| --- | --- |
| Título de página | `text-2xl font-semibold text-foreground` |
| Título de sección | `text-lg font-semibold` |
| Título de card | `text-base font-medium` |
| Cuerpo | `text-sm` |
| Número de KPI | `font-mono text-2xl font-semibold tabular-nums` |
| Código / TOTP | `font-mono` + `tracking-[0.3em]`–`[0.4em]` |
| Etiqueta de ficha | `.text-field-label` |
| Caption de consola | `.text-caption` (mono 11px, `0.12em`, mayúsculas) |

**Forma y vidrio.** Radio base `--radius: 0.625rem`; botones/inputs `rounded-lg`, paneles de vidrio `rounded-2xl`, filas internas `rounded-xl`, badges pill `rounded-4xl`. Los paneles **son** vidrio: `.glass-panel` (KPIs, listas), `.glass-strong` (modales/formularios), `.glass-subtle` (desplegables), `.glass-deep` (solo con algo real refractado detrás, como un hermano, no un hijo), `.glass-row` (filas internas sin blur). Estado = tinte, no borde: `.glass-tone-warning/-destructive`, y `.glass-edge` + `.glass-edge-success|exit|destructive` para el canto de color. No añadir `border`, `ring-*` ni `shadow-*` a un vidrio; el foco dentro usa `outline`. Un vidrio con scroll lo hace en un hijo. Nada de `bg-card` + borde como tarjeta. **Rendimiento:** cada `.glass-panel` desenfoca lo que tiene detrás; lo que se repite (muchas filas, nodos de un lienzo) usa `.glass-row`, que no desenfoca (medido: con un desenfoque por elemento, 220 nodos bajan de 60 a 33 fps).

**Página.** `.page-shell`. Las vistas de operación caben en el alto con la variante `fit:` (≥ 1024 × 704): `fit:h-dvh fit:overflow-hidden` y solo listas/tablas con scroll interno.

**Movimiento.** `--duration-fast` 160ms (hover, color), `--duration-base` 220ms, `--duration-slow` 320ms (entrada de página, cajón), `--ease-fluid` `cubic-bezier(0.22,1,0.36,1)`. Nunca bounce ni más de 320ms en UI de operación. Botón `active:translate-y-px`; foco `focus-visible:ring-3 focus-visible:ring-ring/50`. Los bucles (`scan-sweep`, `status-pulse`) solo indican un proceso en curso; `prefers-reduced-motion` ya está resuelto en el CSS.

**Semántica de operación.**

| Situación | Tratamiento |
| --- | --- |
| Entrada | `bg-success`; chip `bg-success/12 text-success` |
| Salida | `bg-exit`; chip `bg-exit/12 text-exit` |
| Paso desconocido | chip `bg-muted text-muted-foreground` |
| Denegado | `glass-edge glass-edge-destructive`; barra `bg-destructive` |
| En vivo | velo `bg-media/55 text-media-foreground`, pulso `bg-destructive` |
| KPI principal | barra `bg-primary` (`absolute inset-y-4 left-0 w-1 rounded-r-full`), icono `bg-primary/10 text-primary` |
| KPI de atención / incidencia | `.glass-tone-warning` (o `-destructive` si es grave), caption «Atención» |
| Enrolado / falló / pendiente | `Badge` `default` / `destructive` / `outline` |
| Destructiva | variante `destructive` (fondo rojo al 10 %), no botón rojo sólido |

**Gráficos.** Dos líneas suaves: `--success` entradas y `--exit` salidas; relleno bajo la curva al 10 %; rejilla recesiva; horas en mono; marcador «ahora» solo en gráficos del día. Una magnitud sola: barra `bg-primary` sobre `bg-muted`. `--chart-1…5` (`#7A7500`, `#7C7C67`, `#5B5B4B`, `#474739`, `#2B2B22`) para series múltiples. Nada de colores ni resplandores detrás del gráfico.

**Componentes.** Iconos de producto: Tabler, `currentColor`, 18px en navegación, 16px en filas y botones, trazo 1.75–2.25. Una acción primaria por vista; alturas `sm` 32px, `default` 40px, `lg` 44px. Estados vacíos: `border-dashed`, caption, una frase `text-sm text-muted-foreground`, `max-w-sm`. Barra lateral colapsada por defecto en escritorio; ítem activo con el acento de sidebar, no un píldor primary. Cabecera de página siempre con un `PageHeader` (`caption`, `title`, `description`, `actions`).

## Artes institucionales: componentes y grados

El kit trae los **escudos de los cuatro componentes** y las **23 insignias de grado**. Son los únicos artes que se pintan de la FANB; el resto de la marca (color, vidrio, tipografía) no depende de ellos. Cada carpeta lleva un `indice.csv` generado a partir del catálogo oficial del proyecto (`db/seeds/catalogo/`), que es la tabla de verdad de la correspondencia.

### Escudos de componente

| Componente (catálogo) | Código | Archivo fuente | Archivos generados | Nota |
| --- | --- | --- | --- | --- |
| Ejército Bolivariano | `EJB` | `ejercito.png` (912×1180) | `ejercito-32.avif`, `ejercito.avif` | Trae ~28 % de margen transparente: el script lo **recorta al arte** antes de escalar; sin eso su escudo salía más chico que los demás |
| Armada Bolivariana | `ARBV` | `armada.png` (841×1264) | `armada-32.avif`, `armada.avif` | Componente de denominación naval (`usa_denominacion_naval`) |
| Aviación Militar Bolivariana | `AMB` | `aviacion.png` (960×1106) | `aviacion-32.avif`, `aviacion.avif` | |
| Guardia Nacional Bolivariana | `GNB` | `guardia.png` (976×1076) | `guardia-nacional-32.avif`, `guardia-nacional.avif` | El archivo fuente se llama `guardia`; la **URL pública conserva `guardia-nacional`** |
| Milicia Bolivariana | `MB` | — | — | **Sin escudo en el kit** (componente `ESPECIAL`). Ver «Huecos» |

- **Dos tamaños, dos usos.** `{slug}-32.avif` (alto 64 px = 2× de 32) es la **marca en línea**: KPI a 20 px (`h-5`), fila y ficha a 32 px (`h-8`). `{slug}.avif` (alto 800 px) es el **adorno refractado**: se pinta enorme (`h-[135%]`, `h-[125%]`) como **hermano** detrás de un `.glass-deep`, que lo desenfoca 7 px; no se agranda más porque las fuentes no dan para 3×. Pintar el grande a 32 px es un desperdicio de bytes; el pequeño como adorno se ve borroso.
- Formato **AVIF 4:4:4** (son gráficos —oro, rojo, azul—, no fotos; el submuestreo ensucia los filos).
- El texto alternativo es la **denominación completa** del componente cuando el escudo va solo; si el nombre está escrito al lado, el escudo es decorativo (`alt=""`).

### Insignias de grado

Todas las fuentes comparten un lienzo de **525×120** con fondo transparente, pero el arte cambia de ancho (una barra, `S2`, ocupa ~46 px; los cuatro soles, `GJ`, casi todo). El script recorta cada imagen a su arte en horizontal y **conserva el alto completo del lienzo**, que todas llenan: así, a la misma altura, una estrella del capitán mide lo mismo que la del primer teniente. Salida: `{CODIGO}.webp` a **72 px de alto** (2× del mayor tamaño en que se muestran, 36 px) y un manifiesto con las medidas. WebP y no AVIF: a este tamaño AVIF no pesa menos (113 KB frente a 108 KB las 23) y WebP decodifica más rápido.

**El código del arte es la abreviatura oficial sin barra, en mayúsculas** (`S/A` → `SA`, `C/N` → `CN`, `SM/1` → `SM1`, `G/J` → `GJ`). **No** es el código del catálogo (`TP_SM1`) ni el nivel (`TP5`).

| Categoría | Arte (código de archivo) por nivel, de mayor a menor | Aplica a |
| --- | --- | --- |
| Oficial general (`O10`–`O7`), denominación terrestre | `GJ` General en Jefe · `MG` Mayor General · `GD` General de División · `GB` General de Brigada (1–4 soles) | Ejército, Aviación, Guardia |
| Oficial superior (`O6`–`O4`), terrestre | `CNEL` Coronel · `TCNEL` Teniente Coronel · `MAY` Mayor (3, 2 y 1 estrellas **doradas**) | Ejército, Aviación, Guardia |
| Oficial subalterno (`O3`–`O1`), terrestre | `CAP` Capitán · `PTTE` Primer Teniente · `TTE` Teniente (3, 2 y 1 estrellas **plateadas**) | Ejército, Aviación, Guardia |
| Oficial superior y subalterno, **naval** (`O6`–`O1`) | `CN` Capitán de Navío · `CF` Capitán de Fragata · `CC` Capitán de Corbeta · `TN` Teniente de Navío · `TF` Teniente de Fragata · `TC` Teniente de Corbeta (galones con presilla) | Armada (`ARBV`) |
| Tropa profesional (`TP7`–`TP1`) | `SS` Sargento Supervisor · `SA` Sargento Ayudante · `SM1` · `SM2` · `SM3` Sargento Mayor de 1.ª/2.ª/3.ª · `S1` Sargento Primero · `S2` Sargento Segundo (chevrones y barras) | Los cuatro componentes |

Total: 10 + 6 + 7 = **23 archivos**. Un archivo puede servir a varios grados (varias filas del `indice.csv` apuntan al mismo): los oficiales generales navales usan el arte de su equivalente terrestre (`A/J`=`GJ`, `ALM`=`MG`, `V/A`=`GD`, `C/A`=`GB`) y los sargentos de la tropa alistada (`S/1`, `S/2`) el de `S1` y `S2`. La tabla completa (nombre, nivel, categoría, a qué componentes aplica) está en `assets/grados/indice.csv`.

**Reglas de correspondencia — léalas antes de enlazar con el catálogo:**

1. **Busque el arte por abreviatura *y categoría*, nunca solo por abreviatura.** «Sargento Primero» (`S/1`) y «Sargento Segundo» (`S/2`) existen en **tropa profesional** y en **tropa alistada** con la **misma abreviatura**; ambas usan hoy el mismo arte (`S1`, `S2`), pero la búsqueda sigue siendo por categoría: los cabos (`C/1`, `C/2`) y las demás categorías **no** lo heredan por compartir abreviatura. Tienen arte propio `OFICIAL_GENERAL`, `OFICIAL_SUPERIOR`, `OFICIAL_SUBALTERNO` y `TROPA_PROFESIONAL`; de `TROPA_ALISTADA` solo `S/1` y `S/2` (arte compartido, `ARTE_COMPARTIDO` en `packages/ui/src/marca/grados.ts`); `OFICIAL_TECNICO`, `CADETE`, `MILICIA` y `RESERVA` **no**.
2. **La denominación naval cambia la abreviatura, no el nivel.** Para un grado de la Armada se busca la **abreviatura naval** (`C/N`, no `CNEL`); el arte naval propio existe de `O6` a `O1`; los oficiales generales navales (`O10`–`O7`) llevan el mismo arte que su equivalente terrestre, por decisión del área de diseño (se declara en el índice y en `ARTE_COMPARTIDO`, no se deduce por nivel).
3. **Si no hay arte, no se pinta nada.** No se reutiliza el de otro grado (salvo los casos declarados en el índice), no se pone un genérico ni una imagen rota: el texto del grado es suficiente (y es obligatorio, ver regla 4).
4. **La insignia nunca reemplaza al texto del grado.** Junto al nombre, es decorativa (`alt=""`, `aria-hidden`); sola, lleva la denominación completa como `alt`. El grado se entiende sin verla (no solo por color/forma).
5. **No estirar ni deformar.** El ancho sale del manifiesto (`ancho = alto × width/height`); mostrar a una altura fija mantiene la escala entre grados. Altura máxima de diseño: **36 px**; por encima de eso el arte (72 px de alto) se ve suave.
6. **Sobre superficie clara** (crema `--background`, blanca `--card`, vidrio claro) el oro y la plata se leen bien; **no** colocarlas sobre `--media`, `--brand-*` ni fotos sin probar el contraste: el oro sobre oliva oscuro pierde definición.

### Huecos (qué falta y quién lo decide)

Auditados contra `db/seeds/catalogo/` el 2026-10-12. **No** son errores del kit: son artes que **no existen**; se piden al área de diseño/Gestión Humana del MPPD y, hasta entonces, la interfaz no pinta nada (regla 3).

| Falta | Detalle |
| --- | --- |
| **Tropa alistada** (2 de 4 sembrados) | `C/1` Cabo Primero, `C/2` Cabo Segundo (`S/1` y `S/2` ya usan el arte del sargento profesional) |
| **Niveles sin grado sembrado todavía** | `TA2` Distinguido/Marinero Distinguido, `TA1` Soldado/Marinero/Guardia Nacional, `CAD` Cadete, `MIL` Miliciano (están en `nivel_equivalencia.csv` pero no en `grado_tropa.csv`): primero hay que sembrar el grado y luego pedir el arte |
| **Escudo de la Milicia Bolivariana** | Componente `MB` (`ESPECIAL`) |
| **Oficial técnico y reserva** | `OFICIAL_TECNICO` y `RESERVA` existen en la enumeración del catálogo, pero no tienen grados sembrados ni arte |
| **Cubierto con arte compartido** | Oficiales generales navales (`A/J`, `ALM`, `V/A`, `C/A`) con el arte de `GJ`, `MG`, `GD`, `GB`; sargentos alistados `S/1`, `S/2` con `S1`, `S2`. Si el área de diseño entrega arte propio, se agrega el archivo y se quita la fila de `ARTE_COMPARTIDO` |
| **Pendiente de decisión** | Si la insignia de un grado ha de mostrarse **por componente** (el mismo grado puede tener variantes por componente) o como arte único por abreviatura, como está hoy |

Cuando llegue un arte nuevo: cópielo a `assets/grados/` (o `componentes/`) con el nombre que dicta la regla (abreviatura sin barra), añádalo al `indice.csv` (cambie `estado` a `con arte`) y regenere (ver «Origen y mantenimiento»). La prueba de contrato del proyecto (en SIGEFANB, `apps/portal/test/marca.test.mjs`) falla si el índice, el catálogo, el manifiesto y los archivos generados no coinciden.

## Aplicación en SIGEFANB (Vite + React + Mantine)

SIGEFANB no usa Next, Tailwind ni shadcn, así que el kit se aplicó **traduciendo**, sin cambiar un solo valor de la marca:

| Kit | En SIGEFANB | Dónde |
| --- | --- | --- |
| `:root` / `.dark` (tokens OKLCH) | **Copiados literalmente** a CSS plano; `.dark` también bajo `[data-mantine-color-scheme='dark']`, reservado | `packages/ui/src/marca.css` |
| `.glass-panel/-strong/-subtle/-deep/-row`, `.glass-tone-*`, `.glass-edge-*`, `::before/::after` | **Copiados literalmente** (sin `@apply`) | `packages/ui/src/marca.css` |
| `@media` de accesibilidad (contraste, transparencia, movimiento) | Copiados; más `data-sg-solido` en `<html>` como alternativa sólida explícita | `marca.css`, `vidrio.css` |
| `.page-shell`, `.page-enter`, `.text-caption`, `.text-field-label` | Reescritos en CSS plano con los mismos valores | `marca.css` |
| Inter + JetBrains Mono (`next/font`) | `@fontsource-variable/inter` y `@fontsource-variable/jetbrains-mono` (autoalojadas; sin pedir fuentes a terceros). `--font-sans` y `--font-mono` | `marca.css` |
| Paleta shadcn (`bg-primary`, `text-success`…) | **Tema de Mantine**: escalas de 10 tonos cuyo índice de marca es *exactamente* el sRGB del kit (oliva `#3E3D0E` en el 8; success, destructive, warning y exit en el 6). `green/teal`→success, `red`→destructive, `yellow/orange`→warning, `blue/cyan/indigo`→exit, `gray`→neutros 107: **ningún componente de Mantine pinta fuera de la marca** | `packages/ui/src/tema.ts` |
| Fondo crema, tarjetas blancas, bordes | `cssVariablesResolver` de Mantine apuntando a `--background`, `--card`, `--border`, `--foreground`, `--muted-foreground` | `tema.ts` → `resolvedorVariablesMarca` |
| «No hay interruptor de tema» | **Esquema claro forzado** (`forceColorScheme="light"`); se retiró el conmutador claro/oscuro que existía | `apps/portal/src/App.tsx`, `layout/Shell.tsx` |
| Componentes con vidrio | `Vidrio` (`variante="panel"` con desenfoque, `"fila"` sin él; `tono` para el estado como tinte), `PanelFlotante`, `Metrica`, `EstadoPulso` | `packages/ui/src/componentes/` |
| Escudos, insignias, emblema | `EscudoComponente`, `InsigniaGrado`, `EmblemaMppd` y la correspondencia catálogo→arte (`codigoInsignia`, `slugEscudo`) | `packages/ui/src/componentes/Insignia.tsx`, `src/marca/grados.ts` |
| Grado con su arte en una pantalla | `GradoConArte` (escudo del componente + insignia + texto) y `gradoDelCatalogo`, que toma de las filas del catálogo (`catalogo.grado`: `abreviatura`, `categoria`, `componente_id`) lo que el arte necesita. **En uso:** ficha de persona (campo «Grado», hitos y tabla de grados) | `apps/portal/src/modulos/registro/GradoConArte.tsx`, `descripcion.ts` |
| Artes generados | `pnpm --filter @sigefanb/ui marca:generar` ejecuta los tres scripts de este kit con `--public apps/portal/public/marca` | `apps/portal/public/marca/` y `packages/ui/src/marca/insignias-manifest.ts` (generados: no editar) |

**Decisiones propias de SIGEFANB** (no contradicen el kit; lo completan donde Mantine difiere de shadcn):

- **Los nodos de un lienzo usan `.glass-row`**, nunca `.glass-panel` (rendimiento medido; ver «Forma y vidrio»).
- **El verde es un estado, no la marca:** los botones/avisos que antes usaban el «oliva» como verde de aprobación ahora usan `green` (= `--success`); `oliva` es la marca.
- **`--warning` en gráficos y puntos** no cumple 3:1 sobre el crema (2,3:1); por regla del kit nunca va como texto, y los puntos de estado siempre llevan texto al lado. Las pruebas comprueban 3:1 para éxito, error e información, y que `--warning-foreground` sobre `--warning` supere 4,5:1.
- **Adopción de los artes por pantalla:** la ficha de persona (`GradoConArte`) la **tabla de personas del RUTH** y la tarjeta de identidad de la **ficha** (`CabeceraPersona`: insignia y escudo sobre una placa clara, porque el oro sobre el oliva de la tarjeta pierde definición) (`TablaPersonas`: insignia sobre el nombre del grado y escudo junto al componente, ambos decorativos; el texto siempre se escribe) los pintan; ahí el grado y el componente se resuelven con los catálogos cargados una vez por sesión (`registro/catalogos.ts`). El historial sigue mostrando `grado_codigo` (texto).
- **Colores de estado de Mantine, reasignados al kit:** `oliva` es la marca; lo que antes usaba el «oliva» como verde de estado (vivo, vigente, aprobada, emitida, resuelto) usa ahora `green` (`--success`), y lo que usaba `fanb` (azul de «en curso»/«abierto») usa `blue` (`--exit`). Los colores de Mantine sin equivalente en la marca se mapearon a la familia más cercana en `tema.ts`.
- **Materiales por función (PRODUCTO.md):** el tema base conserva tarjetas sin borde para vistas heredadas. Las pantallas migradas usan superficies estables para listas e inspectores y vidrio solo donde aporta separación real. No se transforma cada lista o fila en un panel con blur. La cronología es la primera aplicación del nuevo lenguaje.
- **Bordes de Mantine en los colores del kit:** la escala `gray` del tema usa los neutros del kit en los tonos claros (`--border`/`--input` `#D8D8CD` en el índice 4, que es el que Mantine pinta en campos y botones; una escala lineal dejaba un gris medio `#99998E` demasiado marcado). Además, campos, botones por defecto, pestañas y tablas toman `--input`/`--border` explícitamente, y la cabecera y la barra lateral (vidrio) no llevan borde propio. Lo comprueban dos pruebas de navegador (`componentes.spec.ts`).
- **Producto y voz:** el sistema es **SIGEFANB**; su registro central es **RUTH** (Registro Único del Talento Humano, directriz D25). El subtítulo y el pie institucional del kit se adaptan; las reglas de voz no.

## Qué no hacer

- Paleta de Tailwind (`bg-sky-600`, `text-red-500`, `border-neutral-200`…), hex u OKLCH sueltos en componentes (en SIGEFANB: colores de Mantine fuera del tema, o hex/OKLCH fuera de `marca.css` y `tema.ts`).
- Pintar la marca con `--success`; `--warning` como texto pequeño.
- Borde, `ring` o `shadow` utilitario sobre un vidrio.
- Tercera tipografía, display face, peso black, `lucide-react` fuera de `components/ui`.
- Bounce, springs llamativos o animaciones de más de 320ms; gradientes decorativos; ilustraciones genéricas.
- Activar `.dark` en una sola vista (no hay interruptor de tema).
- Colores de estado como resplandor de fondo detrás del vidrio.
- **Un `.glass-panel` por cada elemento repetido** (filas, nodos, celdas): usar `.glass-row`.
- **Recolorear, filtrar, recortar a un cuadrado o estirar un escudo o una insignia**; ponerlos sobre fondos oscuros o fotos sin probar la legibilidad.
- **Buscar el arte de un grado solo por abreviatura** (colisión `S/1`, `S/2` entre tropa profesional y alistada) o **reutilizar la insignia de otro grado** cuando no hay arte propia.
- **Mostrar una insignia o un escudo sin el texto correspondiente** como única señal, o con `alt` genérico («insignia»).
- Usar el escudo grande (`{slug}.avif`, 800 px) como icono, o el pequeño (`-32`) como adorno.

## Lista de verificación (el destino quedó bien si…)

1. `grep -rE "(bg|text|border)-(red|green|blue|sky|emerald|gray|neutral|slate)-[0-9]"` en `app/` y `components/` no devuelve nada propio (shadcn base excluido).
2. `grep -rE "#[0-9a-fA-F]{6}|oklch\(" components app --include='*.tsx'` no devuelve nada fuera de `globals.css`.
3. `<html>` lleva `inter.variable` y `jetbrainsMono.variable`; el `body` usa `font-sans`.
4. El fondo de la app es crema (`#F5F6EF`), no blanco; las cards son blancas; el botón primario es oliva oscuro (`#3E3D0E`).
5. Un panel con `.glass-panel` sobre el crema muestra el canto de luz (aro arriba-izquierda) y no tiene borde.
6. Un toast `success` sale tintado de verde sobre `--card`, no con los colores por defecto de sonner.
7. Con `prefers-reduced-motion: reduce` no hay bucles ni slide de entrada.
8. Captura de la pantalla principal junto a una del origen: mismo tono oliva, mismas densidades, mismo mono en cifras.
9. **Artes:** los tres scripts corren sin error y generan 23 `.webp` de insignia (todas de 72 px de alto), 4 escudos × 2 `.avif` y los 5 archivos de emblema; el manifiesto lista exactamente las mismas 23 claves que `assets/grados/*.png`.
10. **Correspondencia:** para cada grado del catálogo, el arte que se pinta coincide con `assets/grados/indice.csv`; la tropa alistada, el oficial general naval y la Milicia **no** muestran imagen (ni rota ni de otro grado).
11. **Proporción:** dos insignias mostradas a la misma altura tienen el mismo alto y su ancho conserva la proporción (los cuatro soles son ≥ 5× más anchos que una barra); ninguna se ve cuadrada ni borrosa a ≤ 36 px.
12. **Accesibilidad de los artes:** junto al texto, `alt=""` y `aria-hidden`; solos, `alt` con la denominación completa.
13. **Marca de SIGEFANB (aplicada):** `pnpm --filter @sigefanb/portal test` (incluye el contrato catálogo↔kit↔código) y `test:e2e` (`marca.spec.ts`, `componentes.spec.ts`: contraste de la paleta en ambos temas, vidrio, artes sin imágenes rotas) pasan.

## Origen y mantenimiento

Copiado de `sidefensa-visitantes` (rama `main`). Cuando cambie `app/globals.css` o `assets/brand/mppd.png` en el origen, regenere el kit: `cp app/globals.css docs/branding-kit/globals.css` y `cp assets/brand/mppd.png docs/branding-kit/assets/`, y actualice las tablas de este documento si cambió algún token. **En SIGEFANB, además, vuelva a copiar los bloques «tokens» y «vidrio» a `packages/ui/src/marca.css` y regenere las escalas de Mantine de `tema.ts`** (la conversión OKLCH→sRGB debe reproducir la tabla de «Color»).

**Artes.** Los escudos y las insignias **no** vienen del repositorio origen: los aportó el equipo de SIGEFANB. Para cambiar uno:

1. Sustituya el PNG en `assets/componentes/` o `assets/grados/` (insignias: lienzo 525×120 transparente; escudos: PNG con alfa).
2. Si cambia el conjunto (alta, baja o cambio de nombre), actualice `indice.csv` **a partir del catálogo** (`db/seeds/catalogo/grado_oficial.csv`, `grado_tropa.csv`, `componente.csv`): el índice y el catálogo deben coincidir fila por fila.
3. Regenere: en SIGEFANB, `pnpm --filter @sigefanb/ui marca:generar`; en otro proyecto, los scripts de `scripts/` (con `--public`/`--manifest` si la estructura difiere). Revise el resumen que imprimen (tamaños y ahorro: PNG ≈ 5,3 MB → AVIF ≈ 0,18 MB los escudos; ≈ 0,97 MB → ≈ 0,11 MB las insignias).
4. Ejecute la prueba de contrato y la de navegador (lista de verificación, punto 13).
