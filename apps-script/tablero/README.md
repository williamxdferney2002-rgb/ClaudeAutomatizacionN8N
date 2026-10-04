# Tablero de finanzas (Apps Script)

App web en vivo sobre la hoja *FinanzasWilliam*. **Solo lee** la hoja: no escribe ni borra nada.

| Pestaña | Qué muestra |
|---|---|
| Inicio | El patrimonio neto como un billete (y cuánto cambió desde la última foto de *Historial*); disponible, inversiones, te deben y tú debes (tocar cada uno lleva a su sección); lo que viene (pago de la tarjeta y cuotas por cobrar); patrimonio semana a semana y gasto por mes (tocar un mes abre sus gastos) |
| Gastos | Meses como botones; gastaste, entró y te quedó; gastos por categoría (tocar una lleva a sus movimientos) y presupuesto |
| Movimientos | Agrupados por día, con búsqueda y filtros (tipo, cuenta, persona, categoría, fechas) que se quitan uno por uno; tocar un movimiento muestra su detalle |
| Deudas | **Te deben**: cada persona con barra suelto/cuotas; al tocarla, una hoja con lo que te debe (y qué ya pagó), sus abonos, sus préstamos con cada cuota y los pagos de cuotas. **Tú debes**: la tarjeta con sus cuotas agrupadas por fecha de pago (explica el mínimo) y las personas a las que les debes |
| Cuentas | Árbol de cuentas: las que tienen bolsillos se despliegan al tocarlas; tocar una cuenta abre sus últimos movimientos. Inversiones con total, ganancia y el peso de cada activo |

En el celular las pestañas van abajo (al alcance del pulgar) y el detalle sube como una hoja; en pantalla grande, menú a la izquierda y detalle a la derecha.

Se actualiza al abrirla, al volver a la pestaña del navegador y cada 5 minutos (botón ↻ para hacerlo ya).
Los cálculos son los mismos del bot (nodos *Contexto* y *Reporte*): saldo inicial + movimientos desde la *Fecha saldo inicial*, tarjeta como deuda, CDT con interés, inversiones con el dólar de *Parámetros* (`usdcop_manual`).

## Instalar (una sola vez, unos 5 minutos)
1. Abra la hoja **FinanzasWilliam** → **Extensiones → Apps Script**.
2. En el editor:
   - Cambie el contenido de `Código.gs` por el de [`Codigo.gs`](Codigo.gs).
   - **Archivo `+` → HTML**, nómbrelo `Index` (sin `.html`) y pegue [`Index.html`](Index.html).
   - **Configuración del proyecto (⚙️)** → active *Mostrar el archivo de manifiesto "appsscript.json"* → abra `appsscript.json` y pegue [`appsscript.json`](appsscript.json).
3. **Guardar** (💾).
4. **Implementar → Nueva implementación → ⚙️ Tipo: App web**:
   - Descripción: `Tablero v1`
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Solo yo**
   - **Implementar** → **Autorizar acceso** → elija su cuenta → *Configuración avanzada* → *Ir a … (no seguro)* → **Permitir**. (Es normal: el script es suyo y no está publicado en Google.)
5. Copie la **URL de la app web** (termina en `/exec`). Ábrala en el celular con la misma cuenta de Google y agréguela a la pantalla de inicio (Chrome → ⋮ → *Agregar a la pantalla principal*).
6. Recargue la hoja: aparece el menú **📊 Tablero** (*Abrir tablero aquí* y *Ver enlace para el celular*).
7. Con el bot v14 o superior, mándele el link una vez a Telegram: `/tablero https://script.google.com/macros/s/…/exec`. Desde ahí, `/tablero` (o "tablero") le devuelve el link cuando lo necesite.

## Actualizar a una versión nueva
Pegue los archivos nuevos → **Guardar** → **Implementar → Administrar implementaciones → ✏️ → Versión: Nueva versión → Implementar**. La URL no cambia.

## Seguridad
- Acceso **Solo yo**: nadie más puede abrir la URL, aunque la tenga.
- Permisos que pide: leer esta hoja y mostrar el menú. Además de la hoja, solo carga la librería de gráficas (Chart.js desde cdnjs) y la tipografía (Google Fonts).
- Todo el texto de la hoja se muestra escapado (un `<script>` en un detalle se ve como texto, no se ejecuta).

## Diseño (v2, 4-oct)
Identidad del billete colombiano: el patrimonio es un billete verde con guilloché; el resto, sobrio como un libro de cuentas sobre papel de seguridad. Tipografía *Schibsted Grotesk* (Google Fonts; si no carga, usa la del sistema). Colores de las gráficas validados para daltonismo en modo claro y oscuro (verde $100.000 `#0b7a49` / morado $50.000 `#8a4fa0`).

## Cómo se probó (fuera de Google)
- `calcular()` con los datos reales del Excel del 3-oct convertidos al formato de `getValues()` (fechas como `Date`): las cifras coinciden con el bot y el resumen semanal (Nequi $720.000, disponible $3.685.100, inversiones $1.056.660, te deben $1.590.600, patrimonio $2.331.112, CDT $1.144.214, mínimo RappiCard $2.886.835) → 17/17.
- `Index.html` en Chromium con `google.script.run` simulado: celular (390 px, modo claro) y PC (1366 px, modo oscuro), las 5 pestañas y 19 comprobaciones de interacción (hoja de Papá y de Doña Sandra, tarjeta, desplegar Rappi Ahorros, categoría → movimientos, Esc cierra, texto con HTML escapado), sin errores de JavaScript ni desbordes.
- **No probado dentro de Google:** la implementación como app web, la autorización, `Utilities.formatDate` y el menú de la hoja.

> Mientras no corrija en la hoja las cuotas PR-02-4 y PR-02-5 (ver `docs/pendientes.md`), el tablero, igual que el bot, mostrará a Doña Sandra debiendo $274.200 en cuotas en vez de $514.200.
