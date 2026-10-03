# Lecciones aprendidas (diagnósticos reales)

| Síntoma | Causa | Solución |
|---|---|---|
| "Bad request - please check your parameters" en Telegram | n8n pone `parse_mode: Markdown` por defecto; un `_` o un `*` sueltos lo rompen | `parse_mode: HTML` + escapar `& < >` al enviar (v9) |
| El bot no recibe nada tras cambiar de versión | Al despublicar la versión vieja, n8n borra el webhook de Telegram del mismo bot | Despublicar la vieja **antes** de publicar la nueva; si pasa, despublicar y publicar la nueva |
| "The service is receiving too many requests" (Sheets) | Varias lecturas por mensaje, con cuota compartida entre bots | Una sola lectura (`batchGet`) y escrituras en lote |
| Registros o bolsillos duplicados | Doble toque en un botón o reintento de Telegram | Candado en *Por confirmar* + `Buscar en log` |
| Triplicados en el bot de pagos | `N8N_CONCURRENCY_PRODUCTION_LIMIT=1` + reintentos de Meta | Quitar la variable; anti-duplicados por ID de WhatsApp |
| Pregunta en bucle (comprobante) | Las "dudas" de la IA se reaplicaban después de responder | Quitar la duda respondida; no reconfirmar si ya respondió |
| Dólar distinto en hoja y bot | Valor manual viejo; CoinGecko no daba COP | open.er-api para USD/COP, CoinGecko de respaldo |
| Gráficas feas y sin títulos | QuickChart usa Chart.js v2 por defecto | `version: '4'` + funciones de formato como texto |
| Resumen no corre a mano | Se ejecutó el disparador equivocado / modo `test` | Desactivar el otro disparador (tecla D); aceptar `manual` y `test` |
| Historial con filas repetidas | Cada ejecución manual agregaba una | Una foto por día (actualiza si ya existe) |
| Extracto: Netflix "no coincide" | La compra estaba dividida en partes | Comparar por sentido y por suma de la operación (v8) |
| Máquina colgada | `apt` con poca RAM | No correr upgrades con n8n encendido; Restablecer con IP estática |
| n8n 502 tras reinicio | Task Runner lento ("grant token") | Esperar; opcional `N8N_RUNNERS_GRANT_TOKEN_TTL=120` |
| Aviso de cuota de Gemma | 16K tokens por minuto | Flash Lite principal; atajos sin IA; prompt compacto |
| Gemini 3.8 Flash al 20/20 | Límite de 20 al día | No usarlo en ningún flujo |
