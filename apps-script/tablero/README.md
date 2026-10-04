# Tablero de finanzas (Apps Script)

App web en vivo sobre la hoja *FinanzasWilliam*. **Solo lee** la hoja: no escribe ni borra nada.

| Pestaña | Qué muestra |
|---|---|
| Resumen | Patrimonio neto (y cuánto cambió desde la última foto de *Historial*), disponible, inversiones, te deben, tú debes, CDT; patrimonio semana a semana; gasto por mes; lo que viene (pago de tarjeta y cuotas por cobrar) |
| Gastos | Por mes: gastaste / entró / diferencia, gastos por categoría y presupuesto con ✅ ⚠️ 🚨 |
| Movimientos | Todos los movimientos con búsqueda y filtros (tipo, cuenta, persona, fechas) y totales de lo filtrado |
| Deudas | Quién te debe (suelto y en cuotas, desde cuándo), próximas cuotas (90 días) y lo que tú debes |
| Cuentas | Saldo por cuenta y bolsillo; inversiones con valor, costo y ganancia |

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

## Actualizar a una versión nueva
Pegue los archivos nuevos → **Guardar** → **Implementar → Administrar implementaciones → ✏️ → Versión: Nueva versión → Implementar**. La URL no cambia.

## Seguridad
- Acceso **Solo yo**: nadie más puede abrir la URL, aunque la tenga.
- Permisos que pide: leer esta hoja y mostrar el menú. No usa internet aparte de cargar la librería de gráficas (Chart.js desde cdnjs).
- Todo el texto de la hoja se muestra escapado (un `<script>` en un detalle se ve como texto, no se ejecuta).

## Cómo se probó (fuera de Google)
- `calcular()` con los datos reales del Excel del 3-oct convertidos al formato de `getValues()` (fechas como `Date`): las cifras coinciden con el bot y el resumen semanal (Nequi $720.000, disponible $3.685.100, inversiones $1.056.660, te deben $1.590.600, patrimonio $2.331.112, CDT $1.144.214, mínimo RappiCard $2.886.835) → 17/17.
- `Index.html` en Chromium con `google.script.run` simulado: celular (390 px, modo claro) y PC (1280 px, modo oscuro), las 5 pestañas, filtros, sin errores de JavaScript ni desbordes.
- **No probado dentro de Google:** la implementación como app web, la autorización, `Utilities.formatDate` y el menú de la hoja.

> Mientras no corrija en la hoja las cuotas PR-02-4 y PR-02-5 (ver `docs/pendientes.md`), el tablero, igual que el bot, mostrará a Doña Sandra debiendo $274.200 en cuotas en vez de $514.200.
