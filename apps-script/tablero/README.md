# Tablero de finanzas (Apps Script)

App web en vivo sobre la hoja *FinanzasWilliam*. Lee la hoja y, desde la v5, hace tres correcciones: cambiar la categoría o el detalle de un movimiento, registrar que alguien te pagó y deshacer esas dos cosas. Arriba, el botón **Bot** abre el chat con `@AsistenteFinanzasWD_bot` en Telegram.

| Pestaña | Qué muestra |
|---|---|
| Inicio | El patrimonio neto como titular grande (y cuánto cambió desde la última foto de *Historial*); disponible, inversiones, te deben y tú debes (tocar cada uno lleva a su sección); lo que viene (pago de la tarjeta y cuotas por cobrar); patrimonio semana a semana y gasto por mes (tocar un mes abre sus gastos) |
| Gastos | Meses como botones; gastaste, entró y te quedó; gastos por categoría (tocar una lleva a sus movimientos) y presupuesto |
| Ingresos | Por mes: entró, promedio mensual y cambio contra el mes anterior; de dónde vino (por categoría, tocar abre esos movimientos); otras entradas que no son ingreso (abonos, cuotas cobradas, préstamos recibidos); ingresos contra gastos de los últimos 6 meses; lista de ingresos del mes |
| Movimientos | Agrupados por día, con búsqueda y filtros (tipo, cuenta, persona, categoría, fechas) que se quitan uno por uno; tocar un movimiento muestra su detalle y el botón **Corregir** (categoría y detalle) |
| Deudas | **Te deben**: cada persona con barra suelto/cuotas; al tocarla, una hoja con lo que te debe (y qué ya pagó), sus abonos, sus préstamos con cada cuota y los pagos de cuotas, con **Registrar pago** para lo suelto y para cada préstamo (monto, cuenta donde llegó y fecha). **Tú debes**: la tarjeta con sus cuotas agrupadas por fecha de pago (explica el mínimo) y las personas a las que les debes |
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

## Correcciones desde el tablero (v5)
- **Corregir:** cambia solo la categoría (de las activas en *Categorías*, del mismo tipo: gasto o ingreso) y el detalle, más la columna *Modificado*. El monto, la cuenta y la fecha se corrigen desde el bot, porque cambian saldos.
- **Registrar pago:** escribe lo mismo que el bot cuando le dices "X me pagó". Lo suelto queda como *Abono recibido*. En un préstamo, reparte el pago de la cuota más vieja a la más nueva: marca *Cuotas préstamo* y crea el *Cobro cuota* con el capital, más el *Ingreso* "Intereses cuota N" si la cuota tiene interés. Los IDs tienen el formato del bot (`MOV-…`, `OP-…`), *Origen* = `Tablero`.
- **Deshacer:** después de guardar aparece *Deshacer* por 15 segundos. El `/deshacer` del bot también deshace un pago hecho aquí, porque es el último `MOV-` registrado. Una corrección de categoría solo se deshace desde el tablero.
- **Control:** cada escritura pasa por un candado y se valida en el servidor (la categoría existe, la cuenta está activa y no es tarjeta, CDT ni inversión, el monto es mayor que 0 y no supera la deuda, y la fecha no es futura). Cada una queda en *Log Bot* con *Origen* `Tablero`. Un doble toque no duplica: cada formulario lleva una clave única (`Clave origen` = `tablero_<clave>_N`).
- **Usuario del bot:** está en `Codigo.gs` (`BOT_TELEGRAM`); se puede cambiar sin tocar código con una fila `usuario_bot` en *Parámetros*.

## Actualizar a una versión nueva
Pegue los archivos nuevos → **Guardar** → **Implementar → Administrar implementaciones → ✏️ → Versión: Nueva versión → Implementar**. La URL no cambia.
Al pasar a la **v5**, Google pide autorizar de nuevo: antes el script solo leía y ahora también edita la hoja. Antes de publicar, ejecute una vez `getDatos` desde el editor (▶) y acepte el permiso de *Ver, editar, crear y eliminar hojas de cálculo*.

## Seguridad
- Acceso **Solo yo**: nadie más puede abrir la URL, aunque la tenga.
- Permisos que pide: leer y editar esta hoja (desde la v5) y mostrar el menú. Además de la hoja, solo carga la librería de gráficas (Chart.js desde cdnjs) y la tipografía (Google Fonts).
- Todo el texto de la hoja se muestra escapado (un `<script>` en un detalle se ve como texto, no se ejecuta).

## Diseño (v6, 5-oct): terminal de mar profundo
Solo modo oscuro y plano: fondo azul marino `#17202e`, tarjetas `#202a3e` con borde negro de 1 px, sin sombras ni brillos, y un único acento cian `#6ae4ff` para bordes de acción, íconos y el monto de "te deben".
- **Portada:** el patrimonio como bloque de cifra (hasta 100 px) sobre el resplandor azul que nace arriba a la izquierda. El cambio desde la última foto va en una insignia con el degradado verde-cian, o con borde coral si bajó.
- **Menú y meses:** barra de filtros tipo casa de cambio; la opción activa es una píldora blanca con texto negro.
- **Botones:** la acción principal es una píldora blanca (Registrar pago, Guardar, Bot); la secundaria, un enlace con borde cian (Corregir, Volver, Ver movimientos).
- **Medidas:** tarjetas con esquinas de 15 px, paneles de 24 px, botones y chips de 80 px, campos de 4 px; 24 px dentro de las tarjetas y 16 px entre elementos.
- **Letras:** *Open Sans* (700 en títulos y cifras, con espaciado -0,036 em) y *Source Sans 3* para montos y datos de las listas (Google Fonts; si no cargan, usa las del sistema).
- **Colores de dinero:** ingresos en cian `#6ae4ff`, gastos y alertas en coral `#e66767`, cuotas en morado `#a066bd`. Se distinguen con los tres tipos comunes de daltonismo (diferencia mínima 22, el umbral cómodo es 20).

## Cómo se probó (fuera de Google)
- `calcular()` con los datos reales del Excel del 3-oct convertidos al formato de `getValues()` (fechas como `Date`): las cifras coinciden con el bot y el resumen semanal (Nequi $720.000, disponible $3.685.100, inversiones $1.056.660, te deben $1.590.600, patrimonio $2.331.112, CDT $1.144.214, mínimo RappiCard $2.886.835) → 17/17.
- `Index.html` en Chromium con `google.script.run` simulado: celular (390 px) y PC (1366 px), las 6 pestañas y 23 comprobaciones de interacción (hoja de Papá y de Doña Sandra, tarjeta, desplegar Rappi Ahorros, categoría → movimientos, Esc cierra, texto con HTML escapado), sin errores de JavaScript ni desbordes.
- Escrituras (v5), con `Codigo.gs` real sobre una hoja simulada con los mismos datos → 52/52. Cubren corregir, pago suelto, pago de cuotas con y sin interés, pago parcial, deshacer, doble toque, candado ocupado, fórmulas y textos como "1/2", y 15 casos inválidos.
- De punta a punta: `Index.html` en Chromium conectado a ese `Codigo.gs` → 24/24. Incluye corregir y deshacer, pago de Papá con aviso y deshacer, cuota de Venuz con el atajo "Una cuota", doble toque, errores del formulario, Bot → t.me y HTML escapado.
- **No probado dentro de Google:** la implementación como app web, la autorización, `Utilities.formatDate`, `LockService`, cómo convierte Sheets las fechas escritas con `appendRow` y el menú de la hoja.

> Mientras no corrija en la hoja las cuotas PR-02-4 y PR-02-5 (ver `docs/pendientes.md`), el tablero, igual que el bot, mostrará a Doña Sandra debiendo $274.200 en cuotas en vez de $514.200.
