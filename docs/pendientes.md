# Pendientes priorizados

## Errores detectados el 2-oct-2026 (capturas)
1. **CRÍTICO · Préstamo registrado como gasto y con otro nombre.** Por voz dijo *"le presté 7000 pesos a Nicolás para pagar YouTube, la plata salió de Rappi Ahorros"* y quedó como *"gasto de $7.000 en Suscripciones (Pago a Spotify)"*, sin confirmar.
   - Causa: la IA de audio mezcló la conversación reciente (se venía hablando de Spotify) y no detectó la palabra "presté".
   - Solución: (a) transcribir primero con Groq Whisper y usar el mismo camino que el texto (con atajos y el modelo de texto); (b) en el prompt, la conversación reciente solo resuelve "este/ese" y **nunca reemplaza nombres ni marcas** del mensaje; (c) guardia en Plan: si el mensaje dice "presté/prestar" y no hay Préstamo dado, o si el detalle menciona una marca o persona que no está en el mensaje, **pedir confirmación**.
2. **CRÍTICO · `/suscripciones` no muestra todas.** La consulta filtra las filas sin *Monto total* numérico, mientras que la búsqueda de duplicados no filtra. Si una fila pegada a mano quedó corrida (por ejemplo Spotify), queda **oculta** pero **bloquea** crearla de nuevo (*"Ya tienes Spotify"*).
   - Solución: listar todas las filas y marcar las incompletas (*"⚠️ falta el valor"*); validar las columnas al crear o editar; la detección de duplicados solo con coincidencia exacta del nombre.
3. **Audio "¿cuánto me debe Andrea?"** → una vez respondió con los movimientos de Nu del día; al repetirlo, bien. Causa: la IA de audio eligió `consultar_movimientos` (no determinista). Solución: el mismo camino Whisper + atajos (*"cuánto me debe X"* → `consultar_deudas` sin IA) y una regla explícita en el prompt.
4. **`/cobrar` sin nombre** solo pide el nombre. Mejora: botones con quienes te deben.

## Hallazgos de `n8n-workflow-check` (3-oct-2026, exports en producción)
- **Asistente - Errores › Avisar error** sin `parse_mode: HTML` ni escape: un `_` o `*` en el mensaje de error rompe el aviso (el mismo pendiente manual que Finanzas - Errores).
- **Bot v9 › Preparar archivo** y **Res duplicado**: `sello` sin `$execution.id`; dos archivos en el mismo segundo chocan.
- **Bot v9 › ¿Es corrección?**: las dos ramas van a *Ejecutar*; el IF sobra o falta la ruta distinta.
- **Bot v9 › Borrar movimientos / Borrar cuotas**: sin reintento ni `onError` (además del borrado físico del Bloque 2).
- **Programado v5 › Enviar gráfica**: caption sin `parse_mode` HTML.

## Bloque 2 de la auditoría (v10)
- Anular en vez de borrar (columna Estado registro), bitácora *Cambios* y `/deshacer` completo (préstamos, cobros, reventas, inversiones, cuentas). Ajustar las fórmulas de *Resumen* y Looker para ignorar los anulados.
- Escrituras por número de fila (S3) y escritura no atómica (S4).

## Otros
- Asistente v4 (ver asistente-y-pagos.md). Bot de pagos: invertir el modelo principal.
- Bot del gimnasio (idea): ejercicios, pesos, rutinas y *"¿cuándo fue la última vez que hice pierna?"*.
- Dashboard en Looker Studio (William quiere aprenderlo; guía paso a paso en el historial del chat).
- Servidor: confirmar la ruta del compose, revisar `sudo -l` y aplicar las actualizaciones con n8n detenido.
