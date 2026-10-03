# Pendientes priorizados

## Errores detectados el 3-oct-2026 (capturas) — resueltos en la v10 (falta probar en Telegram)
5. **CRÍTICO · Pago de la mamá registrado a Doña Sandra.** Por voz: *"mi mamá también me pagó todo lo que me debía y me lo pagó a Nequi"* → *"registré el pago de Doña Sandra: cuota 4, 5 (parcial) ($240.000) en Nequi"*, **sin confirmar**. Son personas distintas.
   - Causa probable: la IA de audio eligió `cobrar_cuota` y devolvió el préstamo de Doña Sandra o `persona: null`. En *Plan*, `buscarPrestamo` toma el **único préstamo** si no hay ID ni persona, y `cobrar_cuota` no confirma ni compara la persona dicha con la del préstamo.
   - Solución: ver [plan-v10.md](plan-v10.md), puntos A y C.
6. **CRÍTICO · "Ya me pagó todo mi mamá a nequi" no encuentra la deuda.** Responde *"No encontré un préstamo con cuotas para esa persona"*. La deuda de la mamá viene de compras hechas por ella con la tarjeta.
   - Causa probable: (a) la IA eligió `cobrar_cuota`, que solo busca préstamos formales (*Préstamos*), no las deudas sueltas (*Préstamo dado* − *Abono recibido*); (b) "mamá" no coincide con el nombre guardado (`buscarPrestamo` compara `persona` por igualdad o `includes`, sin alias de *Personas*); (c) las compras con tarjeta quizá no quedaron como deuda de ella.
   - Confirmado con el Excel: la deuda era suelta (*Préstamo dado* − *Abono*), sin préstamo formal. Solución: ver [plan-v10.md](plan-v10.md), punto B.
7. **CRÍTICO · `/deshacer` de un cobro de préstamo deja las cuotas pagadas.** Al deshacer el cobro equivocado a Doña Sandra se borró el movimiento, pero PR-02-4 quedó *Pagada* y PR-02-5 con $68.600. Corrección manual de datos en la hoja y arreglo en la v10 (punto G).
8. **`/cobrar`: el encabezado "📋 Mensaje para X (cópialo y reenvíalo)" estorba al copiar.** Arreglo en *Consultar* (punto H).
- **Datos a corregir a mano** (lo dejó el error 7): en *Cuotas préstamo*, PR-02-4 → Estado *Pendiente* y vaciar Fecha pago, Valor recibido, Cuenta donde llegó e ID movimiento; PR-02-5 → vaciar Valor recibido, Cuenta donde llegó e ID movimiento. Doña Sandra debe $514.200 de PR-02.

## Errores detectados el 2-oct-2026 (capturas)
1. **(v10: mitigado — voz por Whisper y el camino del texto, regla de conversación reciente en el prompt; falta la guardia de "presté" → Préstamo dado)** **CRÍTICO · Préstamo registrado como gasto y con otro nombre.** Por voz dijo *"le presté 7000 pesos a Nicolás para pagar YouTube, la plata salió de Rappi Ahorros"* y quedó como *"gasto de $7.000 en Suscripciones (Pago a Spotify)"*, sin confirmar.
   - Causa: la IA de audio mezcló la conversación reciente (se venía hablando de Spotify) y no detectó la palabra "presté".
   - Solución: (a) transcribir primero con Groq Whisper y usar el mismo camino que el texto (con atajos y el modelo de texto); (b) en el prompt, la conversación reciente solo resuelve "este/ese" y **nunca reemplaza nombres ni marcas** del mensaje; (c) guardia en Plan: si el mensaje dice "presté/prestar" y no hay Préstamo dado, o si el detalle menciona una marca o persona que no está en el mensaje, **pedir confirmación**.
2. **CRÍTICO · `/suscripciones` no muestra todas.** La consulta filtra las filas sin *Monto total* numérico, mientras que la búsqueda de duplicados no filtra. Si una fila pegada a mano quedó corrida (por ejemplo Spotify), queda **oculta** pero **bloquea** crearla de nuevo (*"Ya tienes Spotify"*).
   - Solución: listar todas las filas y marcar las incompletas (*"⚠️ falta el valor"*); validar las columnas al crear o editar; la detección de duplicados solo con coincidencia exacta del nombre.
3. **(v10: resuelto con Whisper primero + atajo)** **Audio "¿cuánto me debe Andrea?"** → una vez respondió con los movimientos de Nu del día; al repetirlo, bien. Causa: la IA de audio eligió `consultar_movimientos` (no determinista). Solución: el mismo camino Whisper + atajos (*"cuánto me debe X"* → `consultar_deudas` sin IA) y una regla explícita en el prompt.
4. **`/cobrar` sin nombre** solo pide el nombre. Mejora: botones con quienes te deben.

## Hallazgos de `n8n-workflow-check` (3-oct-2026, exports en producción)
- **Asistente - Errores › Avisar error** sin `parse_mode: HTML` ni escape: un `_` o `*` en el mensaje de error rompe el aviso (el mismo pendiente manual que Finanzas - Errores).
- ~~Bot v9 › Preparar archivo y Res duplicado: `sello` sin `$execution.id`~~ (corregido en v10).
- **Bot v10 (encontrado al probar v9)**: al confirmar "Sí, de Nequi" cuando una cuenta queda en negativo, v9 volvía a preguntar sin fin porque se perdía `cuenta_ok`; corregido en v10.
- **Bot v10 › ¿Es corrección?**: las dos ramas van a *Ejecutar*; el IF sobra o falta la ruta distinta.
- **Bot v10 › Borrar movimientos / Borrar cuotas**: sin reintento ni `onError` (además del borrado físico del Bloque 2).
- **Programado v5 › Enviar gráfica**: caption sin `parse_mode` HTML.

## Bloque 2 de la auditoría (v11)
- v10 ya revierte en `/deshacer` las cuotas de préstamo de un cobro (detalle `Cuotas préstamo: ID=valor` en *Comentarios*).
- Anular en vez de borrar (columna Estado registro), bitácora *Cambios* y `/deshacer` completo (préstamos, cobros, reventas, inversiones, cuentas). Ajustar las fórmulas de *Resumen* y Looker para ignorar los anulados.
- Escrituras por número de fila (S3) y escritura no atómica (S4).

## Otros
- Asistente v4 (ver asistente-y-pagos.md). Bot de pagos: invertir el modelo principal.
- Bot del gimnasio (idea): ejercicios, pesos, rutinas y *"¿cuándo fue la última vez que hice pierna?"*.
- Dashboard en Looker Studio (William quiere aprenderlo; guía paso a paso en el historial del chat).
- Servidor: confirmar la ruta del compose, revisar `sudo -l` y aplicar las actualizaciones con n8n detenido.
