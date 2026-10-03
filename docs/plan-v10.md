# Prompt para planear Finanzas - Bot v10

Copia todo lo que está debajo de la línea en una sesión nueva de Claude Code sobre este repositorio (rama con la reorganización ya subida).

---

Ingeniero William aquí. Vamos a **planear** (todavía no construir) la versión **v10 de "Finanzas - Bot"**. Primero preséntame el plan y espera mi "dale".

## Contexto que ya está en el repo (léelo antes de planear)
- `CLAUDE.md`, `docs/finanzas-arquitectura.md`, `docs/pendientes.md` (errores 1 a 6), `docs/lecciones-aprendidas.md` y `.claude/rules/n8n-flujos.md`.
- Flujo vigente: `flujos/finanzas/finanzas-bot-v9.json` (88 nodos). La lógica está en los Code **Contexto**, **Plan**, **Ejecutar** y **Consultar**.
- Verificación: skill `n8n-workflow-check` (`check_workflow.py`, `simular_code.js`, `mapa_flujo.py`) y al final `auditar-entrega`.

## Estado verificado en la sesión anterior (3-oct-2026)
- `check_workflow.py --modo produccion` sobre v9: **0 errores, 2 avisos**. *Preparar archivo* y *Res duplicado* generan `sello` sin `$execution.id`. Además, el flujo está con `active: true` y no tiene `settings.timezone`.
- Simulación a mano: 22/23 casos correctos. Falla el *Atajo* con "cuánto me debe Andrea": no lo reconoce y lo manda a la IA (error 3).
- La voz va **IA audio → Groq → 3.5 FL**. Whisper es solo respaldo, así que el audio nunca pasa por *Atajo*.
- `/prestamos`, `/suscripciones` y `/cobrar` están en *Consultar* y *Plan*.

## Errores prioritarios nuevos (capturas del 3-oct)
1. **Texto:** "Ya me pagó todo mi mamá a nequi" → *"No encontré un préstamo con cuotas para esa persona. Escribe /prestamos para verlos."* Mi mamá **sí me debe**: son pagos que hice por ella con la tarjeta de crédito.
2. **Voz:** "mi mamá también me pagó todo lo que me debía y me lo pagó a Nequi" → *"Listo, registré el pago de Doña Sandra: cuota 4, 5 (parcial) ($240.000) en Nequi. Le quedan $274.200…"*. Se registró **sin confirmar** y a **otra persona**: mi mamá y Doña Sandra son personas diferentes.

### Causas encontradas en el código de v9 (confírmalas)
- Contexto, regla 7 del prompt: `cobrar_cuota` ("Juan me pagó la cuota") solo cubre **préstamos formales** (*Préstamos* + *Cuotas préstamo*).
- Las deudas sueltas se calculan aparte en *Contexto* (`deudas`: *Préstamo dado* sin referencia `PR-` − *Abono recibido*). "Me pagó todo" con una deuda suelta debería ser **registrar Abono recibido**, no `cobrar_cuota`.
- Plan, `buscarPrestamo(id, persona)`:
  - Compara `persona` con igualdad o `includes`, **sin usar el alias de *Personas***, así que "mi mamá" no coincide con el nombre guardado.
  - Si no llega ni ID ni persona, devuelve el único préstamo que exista. **No fue la causa aquí**: hay 3 préstamos (PR-01, PR-02, PR-03), así que la IA devolvió `PR-02` por su cuenta. Igual se quita el comodín.
- Plan, `cobrar_cuota`:
  - No pide confirmación.
  - Acepta el `prestamo` que devuelva la IA aunque su persona no sea la que dije.
  - "todo" no se interpreta como el saldo completo: registró una cuota parcial de $240.000.
- La IA de audio recibe la *conversación reciente* y puede arrastrar nombres de mensajes anteriores. Es el mismo problema del error 1 de `pendientes.md`.

### Datos confirmados con el Excel del 3-oct (ya no hay que preguntarlos)
- *Personas*: **Mamá** (alias `mi mamá, mamá, mama, mi mama, doña Leo`, relación Familia). **Doña Sandra** (alias `sandra, doña sandra`). Los alias están bien: "mamá" no es alias de Sandra.
- La deuda de Mamá era **suelta**: tres *Préstamo dado* sin `PR-` (Pastillas $105.000, Creatina $135.000, Supermercado $132.596) menos un *Abono recibido* de $132.596 = **$240.000**. **No tenía préstamo formal**, por eso `cobrar_cuota` no la encontró.
- William ya registró el abono de $240.000 de Mamá a Nequi (MOV-261003145400-3426-1). Mamá queda en $0.
- *Log Bot* 3411: la voz se registró como `cobrar_cuota` de PR-02. El 3412-3414 lo deshizo con `/deshacer`, que **borró el movimiento pero NO revirtió *Cuotas préstamo***. PR-02-4 quedó *Pagada* y PR-02-5 con $68.600 recibidos, ambas con `ID movimiento` MOV-261003144424-3411-1, que ya no existe. **Doña Sandra aparece debiendo $274.200 y en realidad debe $514.200** (3 cuotas de $171.400) más $9.000 de Netflix.
- **Error nuevo G: `/deshacer` no revierte cobros de préstamo.** *Filas a borrar* y *Cuotas a borrar* solo cubren *Movimientos* y *Cuotas tarjeta*. Se arregla en la v10 con un mínimo: al deshacer un `Cobro cuota`, restar lo pagado en las cuotas con ese `ID movimiento` y devolverlas a *Pendiente*. El resto del Bloque 2 sigue pendiente.
- **Corrección H, pedida por William:** en `/cobrar` (nodo *Consultar*), el mensaje empezaba con "📋 Mensaje para X (cópialo y reenvíalo):", y eso estorbaba al copiar. El mensaje debe ser **solo** el texto para la persona. William puede aplicarlo a mano en v9 mientras tanto.

## Soluciones propuestas para la v10 (punto de partida)
- **A. Nunca registrar un cobro sin confirmar cuando la persona no coincide.**
  - En *Plan*: si el mensaje nombra a alguien, resolverlo primero con `buscarPersona` (nombre + alias). Si el préstamo elegido es de otra persona, **no registrar**: preguntar con botones.
  - Quitar el comodín "si hay un solo préstamo, usar ese" cuando el texto trae una persona.
  - `cobrar_cuota` siempre con confirmación: *"¿Registro $X de <persona> en <cuenta>?"*.
- **B. Un solo "me pagó" para todo tipo de deuda.**
  - Si la persona tiene préstamo formal, usar `cobrar_cuota`.
  - Si solo tiene deuda suelta o de tarjeta, convertirla a **Abono recibido**.
  - Si tiene ambas, preguntar a cuál abona.
  - "todo" o "lo que me debía" = **saldo pendiente total** de esa persona, no una cuota.
  - Si no tiene deuda: *"<persona> no te debe nada registrado"*, con botones para registrar el préstamo.
- **C. Personas y parentescos.**
  - Palabras como mamá, papá, hermano o tía solo se resuelven por el **alias** en *Personas*.
  - Si nadie tiene ese alias, preguntar *"¿Quién es tu mamá?"* con botones de personas y guardar el alias con la respuesta.
  - Regla en el prompt de *Contexto*: la conversación reciente **nunca** cambia a la persona nombrada en el mensaje.
- **D. Deudas por compras con tarjeta para otra persona.**
  - Revisar que "pagué X con la tarjeta por mi mamá" cree la deuda: *Préstamo dado* o `crear_prestamo` con `cuotas_tarjeta`.
  - Revisar que `/deudas` y `consultar_deudas` la muestren.
- **E. Voz por el mismo camino que el texto.**
  - Whisper primero, luego *Atajo* y luego IA de texto, con el multimodal como respaldo (error 1 de `pendientes.md`).
  - Atajo nuevo: "X me pagó todo" → resolver sin IA cuando la persona y la deuda son claras.
- **G. `/deshacer` de un cobro de préstamo** revierte *Cuotas préstamo* (ver arriba).
- **H. `/cobrar` sin encabezado**: solo el texto para la persona.
- **F. Arrastrar a la v10 lo pequeño:**
  - `sello` con `$execution.id` en *Preparar archivo* y *Res duplicado*.
  - `active: false` y `settings.timezone = "America/Bogota"`.
  - Atajo "cuánto me debe X" → `consultar_deudas`.
  - `/suscripciones` mostrando las filas incompletas.
  - `/cobrar` con botones.

## Lo que espero de ti en esta sesión
1. Lee el código real de *Contexto*, *Plan*, *Ejecutar* y *Atajo* para confirmar o corregir las causas de arriba, con la línea o el fragmento exacto.
2. Los datos ya están confirmados (sección anterior). Pregunta solo si algo no cuadra con el código.
3. Preséntame el plan de la v10:
   - qué nodos cambian;
   - nodos nuevos, si hay;
   - impacto en la cuota de Gemini y Gemma (tamaño del prompt);
   - casos de prueba (válidos, inválidos y duplicados) para mamá, Doña Sandra, una persona sin deuda, una con préstamo formal y una con deuda suelta.
4. Espera mi "dale". Después construye `flujos/finanzas/finanzas-bot-v10.json` (borrando la v9 en el mismo commit). Pasa `check_workflow.py --base` contra v9, simula *Plan* con los casos y corre `auditar-entrega` antes de decirme que está listo.
