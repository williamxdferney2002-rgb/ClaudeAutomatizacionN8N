# Finanzas: arquitectura y modelo de datos

## Flujo "Finanzas - Bot" (v13, 88 nodos)
Telegram Trigger → Normalizar → ¿Autorizado? → Config → **Leer hoja** (batchGet de ~20 pestañas) → **Tablas** → Buscar en log (anti-duplicados por `update_id`) → Abrir registro (Log Bot) → Escribiendo → Leer movimientos → **Contexto** (estado + prompt) → **Tipo**:
- **Botón** → Contestar → Leer confirmación → Preparar candado → ¿Vigente? → Reservar → Esperar 3 s → Verificar → ¿Es mía? → Editar botones → Marcar respondida → Plan.
- **Comando** (`/saldos`, `/mes`, `/tarjeta`, `/deudas`, `/prestamos`, `/cobrar`, `/inversiones`, `/reventas`, `/presupuesto`, `/metas`, `/flujo`, `/suscripciones`, `/movimientos`, `/revisar`, `/deshacer`) → Plan.
- **Texto** → Texto a procesar → **Atajo** (sin IA: movimientos, saldo, deudas, "cuánto me debe X", suscripciones y "X me pagó todo") → IA texto (3.1 Flash Lite) → respaldo Gemma → Interpretar.
- **Voz** (v10) → Descargar → **Groq Whisper** → Texto a procesar → el mismo camino del texto (Atajo / IA texto). Si Groq falla: IA audio (3.1 FL) → respaldo 3.5 FL → Interpretar.
- **Archivo** (foto o PDF) → Descargar → Buscar documento (repetido solo si quedó *Procesado*) → Drive (Comprobantes) → Registrar documento → IA imagen o PDF (maxOutputTokens 8000/32000) → Interpretar.

**Plan** (valida, completa datos, arma preguntas; en v10 la persona que nombra el mensaje manda sobre la IA y los cobros "X me pagó" eligen solos entre préstamo con cuotas y deuda suelta, siempre con confirmación) → ¿Preguntar? → *Guardar confirmación* → *Botones* → Preguntar 2/4/6 (respaldo: *Aviso sin botones*).
Si no pregunta → **Ruta**: *Borrar* (corregir y deshacer: borra filas de abajo hacia arriba) · *Consultar* · *Escribir* (Ejecutar → ¿Tiene documento? → Actualizar documento → ¿Es extracto? → Mover a Extractos → Solicitudes → Escribir hoja → Resultado).
Salida: **Armar respuesta** → ¿Sigue pregunta? → Responder (respaldo: *Responder simple*) → Cerrar registro → Movimientos a enlazar → Enlazar mensaje (guarda el ID del mensaje para corregir respondiendo).

## Acciones de la IA (JSON)
registrar (Gasto, Ingreso, Transferencia, Pago tarjeta, Préstamo dado/recibido, Abono recibido/pagado; compartidos = Gasto propio + Préstamo dado) · corregir · deshacer · asumir_deuda · crear_prestamo (con `cuotas_tarjeta`) · modificar_prestamo (persona, fechas, frecuencia, `dias_pago`, `cuotas_pagadas`, `valor_cuota`, `cuotas`, `monto`) · cobrar_cuota (cualquier pago de una persona: cuota o deuda suelta; `todo: true` = saldo completo) · consultar_deudas · cobrar · crear_cuenta · modificar_cuenta (alias se **suma**, `alias_quitar`) · cerrar_cuenta · ajustar_saldo · consultar_saldo · consultar_movimientos (cuenta + bolsillos, o persona) · consultar_gasto · consultar_tarjeta · operacion_inversion · ajustar_inversion · compra_reventa · venta_reventa · uso_propio · fijar/copiar/proponer_presupuesto · crear_meta · fijar_ingreso · crear/modificar/consultar_recurrente · extracto · revisar_extracto · charla · fuera_de_fase.

## Flujo "Finanzas - Programado" (v6, 34 nodos)
- **Cada día a las 7:00:** precios (CoinGecko para cripto, open.er-api para el dólar, Stooq para ETF y acciones) → actualiza *Activos* y `usdcop_manual` → **Agenda**: recurrentes (aviso 2 días antes y confirmación con botones el día del cobro; recupera hasta 7 días perdidos con `ultima_agenda`; no repite si ya preguntó), cuotas por cobrar (el día y 3 días después; v6: con botones de cuenta → un toque registra el cobro en el bot, que verifica que la cuota siga pendiente; "⏰ Aún no" no registra), recurrentes activas sin datos (aviso los domingos), pago de tarjeta (3 días antes y el mismo día), CDT (5 días antes y al vencer), revisión de rendimientos los domingos.
- **Resúmenes** (domingo 19:00 y día 1 a las 8:00): mensaje (v6: saldo por cuenta y bolsillo, cada inversión con ganancia, quién te debe y qué debes —tarjeta con fecha y mínimo, personas—) con gráficas de QuickChart (Chart.js v4, 1000 px, doble resolución), foto semanal en *Historial* (una por día), copia del presupuesto al mes nuevo, respaldo de la hoja en Drive (conserva 8) y limpieza (Log Bot de más de 90 días y Por confirmar cerradas de más de 30 días).
- Ejecutarlo a mano: n8n usa el primer disparador. Para probar los resúmenes, desactiva *Cada día 7:00* con la tecla D. En modo manual, `$execution.mode` es `manual` o `test`.

## Hoja FinanzasWilliam (pestañas que lee el bot)
Log Bot · Cuentas · Categorías · Movimientos · Cuotas tarjeta · Por confirmar · Documentos · Préstamos · Cuotas préstamo · Personas · Recurrentes · Parámetros · Activos · Operaciones inversión · Reventas · Extractos (+ columnas `Grupo` y `Detalle (JSON)`) · Comercios · Presupuestos · Metas · Historial.
Vistas solo con fórmulas (no las escribe el bot): Resumen (`GOOGLEFINANCE`), Inversiones, Vistas.
**Si una pestaña falta o se renombra, la lectura única falla y el bot deja de responder.**

### Reglas del modelo de datos
- **Saldo** = Saldo inicial (*Fecha saldo inicial*, hoy 2026-10-01) + movimientos desde esa fecha. Lo anterior es historia: no mueve el saldo.
- Tarjeta: el saldo es la deuda; las compras crean el plan en *Cuotas tarjeta* (corte 30 y pago 10, que se actualizan solos con cada extracto). Pago mínimo = cuotas que vencen en la próxima fecha de pago.
- 4x1000 automático en las salidas de Nu (CTA-01) y Bancolombia (CTA-03), excepto entre una cuenta y sus bolsillos.
- Préstamos formales: *Préstamos* + *Cuotas préstamo* (Capital/Interés; el interés es ganancia al cobrar; las sobrantes quedan *Anulada*). Deudas sueltas: *Préstamo dado* − *Abono recibido* (sin referencia PR-).
- Recurrentes: "Personas que me pagan" admite montos fijos (`Paula: 9000, Andrea: 9000`).
- Cuentas: CTA-01 Nu Ahorros · 02 Nu CDT (10,5% EA, vence 3-nov-2026) · 03 Bancolombia · 04 Rappi Ahorros (padre de 10 Ahorro UIS y 11 Pago Rappi, 9% EA) · 05 RappiCard (cupo 4,2 M; dígitos 3263/0320) · 06 Wenia (inversión) · 07 Nequi (3185482915) · 08 Daviplata · 09 Efectivo · 12 Préstamo (cerrada) · 13 Cajita Nu.
