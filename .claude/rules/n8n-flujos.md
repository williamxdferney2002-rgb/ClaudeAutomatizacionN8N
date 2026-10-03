---
paths:
  - "**/*.json"
---
# Convenciones al editar JSON de flujos n8n de William

- Partir del **export** que entregue William: conservar `id` de nodos, `webhookId`, `credentials` (por ID) y `settings` (incluido `errorWorkflow`); agregar `settings.timezone = "America/Bogota"`; entregar con `active: false`.
- Versiones de nodo en uso: Code 2, If 2.3, Switch 3.4, Set 3.4, Google Sheets 4.7, HTTP Request 4.5, Telegram 1.2, Telegram Trigger 1.2, Google Gemini (langchain) 1.2, Google Drive 3, Schedule 1.2, Wait 1.1.
- Code nodes: utilidades comunes `num()` (montos "25.000", "$ 25.000,50", "(3.797.362)"), `fecha()` (ISO, d/M/yyyy, número de serie de Sheets), `pesos()` (formato "$1.234" sin depender del ICU), `sello` con `$execution.id`.
- Lectura: un solo HTTP `values:batchGet` (`valueRenderOption=UNFORMATTED_VALUE`, `dateTimeRenderOption=FORMATTED_STRING`) → nodo *Tablas* (filas con `row_number` y encabezados en `_h`).
- Escritura: *Ejecutar* arma `ops` `{tabla, tipo: append|update, fila|row+cambios}` → *Solicitudes* (un append por pestaña y un `values:batchUpdate`; protege `= + @` y textos tipo "1/2" fuera de las columnas de fecha) → *Escribir hoja* (batchSize 1).
- Telegram: `additionalFields: {appendAttribution: false, parse_mode: "HTML"}` y el texto con `.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')` en la expresión. Botones: callback `pc:<ID Por confirmar>:<valor>` (máx. 64 bytes); botones en pares (2/4/6) con ❌ Cancelar.
- Nunca enviar un número 0 o una categoría vacía en Gasto/Ingreso (Plan lo rechaza). Montos en COP redondeados a enteros.
- Antes de entregar: `python3 .claude/skills/n8n-workflow-check/scripts/check_workflow.py NUEVO.json --base ANTERIOR.json` (0 ❌) + `simular_code.js` de los Code modificados con datos reales (Node + Luxon) en casos válidos, inválidos y duplicados. Ver la skill `n8n-workflow-check`.
