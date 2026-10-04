# Automatizaciones n8n de William

Proyecto personal de automatizaciones en n8n (self-hosted) para el Ingeniero William Delgado (Bucaramanga, Colombia).
Tres agentes en producción: **Finanzas** (Telegram), **Asistente personal** (Telegram) y **Pagos** (WhatsApp).

## Cómo trabajar con William (leer siempre)
- Dirígete a él como **"Ingeniero William"** en cada respuesta. Responde en **español**, claro y sin relleno.
- Entrega **automatizaciones funcionales y optimizadas**: JSON importable, no fragmentos sueltos, salvo que pida un cambio manual pequeño.
- **Antes de cambios grandes, presenta el plan y espera su "dale".** Él suele pedir primero el resumen y luego la construcción.
- Cada entrega lleva: qué cambió, cómo instalarlo (orden exacto), qué nodos revisar al importar y pruebas sugeridas en Telegram.
- Prueba antes de entregar con **casos válidos, inválidos y duplicados** (skill `n8n-workflow-check`). Di con honestidad qué NO se ejecutó dentro de n8n.
- Antes de decir que algo está listo, corre la skill `auditar-entrega` (diff real, verificación, formato y documentación). La auditoría completa del proyecto es `/auditoria-proyecto [finanzas|asistente|pagos|todo]`, solo cuando William la pida. Skills instaladas y cómo llevarlas a otro proyecto: [docs/instalar-skills.md](docs/instalar-skills.md).
- Si una meta del plan no se cumple (por ejemplo, la reducción del prompt), dilo con el número real.

## Infraestructura (resumen)
Google Cloud **e2-micro** (`n8n-consignaciones`, us-east1-b, 1 GB RAM + 2 GB swap), Ubuntu 26.04, Docker con contenedores `n8n-n8n-1` y `n8n-caddy-1`.
Dominio `pagoswilliam.duckdns.org` → IP **estática** `34.73.72.12`. Zona horaria `America/Bogota` (GENERIC_TIMEZONE y TZ).
El usuario SSH tiene **sudo limitado** (`apt update` sí; `apt upgrade` y `reboot` no). Reiniciar desde la consola con **Restablecer** es seguro, porque la IP es estática.
Para comandos de diagnóstico, actualizaciones, `docker compose` y límites de memoria, ver [docs/infraestructura.md](docs/infraestructura.md).

## IDs y credenciales
La hoja de Finanzas es `1n97Po-FMwXt0XHwrSp4LLjCsyUMpKBdcUksFxkxJ8GM`, el chat de Telegram de William es `7739445962` y el flujo de errores de Finanzas es `qMWZ59kHUj386TnZ`.
Las credenciales se referencian por ID en los JSON (no son secretos, pero **nunca** incluyas tokens ni contraseñas).
Para la lista completa (credenciales, carpetas de Drive, Calendar, Tasks y la hoja del Asistente), ver [docs/ids-y-credenciales.md](docs/ids-y-credenciales.md).

## Estructura del repositorio
- `flujos/<agente>/` → exports JSON de n8n, nombrados `<agente>-<flujo>-v<N>.json` (minúsculas, sin espacios). Solo la **versión vigente**; las anteriores quedan en el historial de git.
- `docs/` → documentación de referencia (infraestructura, IDs, arquitectura, pendientes, lecciones).
- `.claude/rules/` → convenciones que se cargan al editar `flujos/**/*.json`.
- `apps-script/tablero/` → app web en vivo (Apps Script) sobre la hoja de Finanzas: resumen, gastos, ingresos, movimientos, deudas, cuentas e inversiones. Desde la v5 escribe: corrige categoría y detalle, registra pagos con el mismo formato del bot (Origen `Tablero`) y los deshace. Repite el cálculo de saldos y deudas de *Contexto/Reporte*: si cambia esa lógica en el bot, actualízala también en `Codigo.gs`. Instalación: [apps-script/tablero/README.md](apps-script/tablero/README.md).
- `.agents/skills/` → skills instaladas con `npx skills add` (enlazadas en `.claude/skills/`), `google-apps-script`, `frontend-design`, `webapp-testing` y `theme-factory` (las tres últimas, oficiales de Anthropic).
- Inventario de flujos y cómo exportar/importar: [flujos/README.md](flujos/README.md).

## Flujos y versiones actuales
| Flujo | Versión | Nodos | Notas |
|---|---|---|---|
| Finanzas - Bot | **v15** | 88 | Telegram; webhook conservado desde v7. `flujos/finanzas/finanzas-bot-v15.json` (v14 + deuda sin plata: "le debo 10k a Daniela de los postres" → Gasto + Préstamo recibido sin cuenta) |
| Finanzas - Programado | **v6** | 34 | `flujos/finanzas/finanzas-programado-v6.json`. Diario 7:00 (cuotas con botones de cuenta, recurrentes incompletas los domingos); resumen domingo 19:00 con saldos, inversiones, deudas; día 1 a las 8:00 |
| Finanzas - Errores | v1 | 5 | `flujos/finanzas/finanzas-errores-v1.json`. Pendiente v2: Parse Mode HTML y escape en "Avisar error", anti-spam |
| Asistente - Entrada / Reloj / Errores | **v3** | 119 / 29 / 6 | Hoja `1LItc9pXs9iXbNi77a2TqmOA23XZKPDZ71fvp6J-pLyA`. Errores en `flujos/asistente/asistente-errores-v3.json` |
| Agente de Pagos (WhatsApp) | estable | — | Hoja "Registro Pagos"; error workflow `CiiO6RLWImqCMVJS` |
| Tablero (Apps Script) | **v5** | — | `apps-script/tablero/` (4-oct). App web "Solo yo" sobre la hoja de Finanzas; detalle por deudor, tarjeta y cuenta; pestaña Ingresos; diseño "sala de control". v5: corregir categoría y detalle, registrar pagos, deshacer y botón al bot `@AsistenteFinanzasWD_bot` |

Arquitectura del bot de finanzas, acciones, pestañas de la hoja y modelo de datos: [docs/finanzas-arquitectura.md](docs/finanzas-arquitectura.md).
Asistente personal y bot de pagos: [docs/asistente-y-pagos.md](docs/asistente-y-pagos.md).

## Reglas de oro para editar flujos (resumen)
1. **Una sola lectura** de la hoja por ejecución (`values:batchGet` en el nodo *Leer hoja* → *Tablas*). Las escrituras van **en lote** (*Ejecutar* → *Solicitudes* → *Escribir hoja*).
2. **IDs únicos con el número de ejecución:** `sello = yyMMddHHmmss + '-' + $execution.id`.
3. **Telegram siempre con `parse_mode: HTML`** y el texto escapado (`& < >`) al enviarlo. Sin formato explícito, n8n usa Markdown y `_` o `*` rompen el mensaje ("Bad request").
4. Las **preguntas con botones** pasan por *Por confirmar* con candado anti doble toque (Reservar → Esperar 3 s → Verificar).
5. **No renombrar pestañas ni encabezados** de la hoja: el bot lee por nombre. El archivo y las carpetas sí se pueden renombrar.
6. Al editar un export de William: **conserva IDs de nodos, `webhookId`, credenciales y `settings.errorWorkflow`**. Entrega con `active: false`.
7. **Nunca** usar `N8N_CONCURRENCY_PRODUCTION_LIMIT` (causó triplicados).

Detalle de convenciones de código para nodos Code y JSON: ver [.claude/rules/n8n-flujos.md](.claude/rules/n8n-flujos.md) (se carga al editar JSON de flujos).

## Comandos de verificación (sin n8n)
No hay build ni tests de n8n en el repo; la verificación es estática más la simulación de nodos Code. Luxon lo instala el hook `.claude/hooks/session-start.sh`.
```bash
S=.claude/skills/n8n-workflow-check/scripts
F=flujos/finanzas/finanzas-bot-v15.json
python3 $S/check_workflow.py $F --modo produccion            # revisión completa; "Resultado: N errores, M avisos"
python3 $S/check_workflow.py nuevo.json --base $F            # versión nueva contra el export anterior (IDs, webhookId, credenciales)
# el export anterior sale del historial: git show <commit>:flujos/finanzas/finanzas-bot-v9.json > /tmp/v9.json
python3 $S/mapa_flujo.py $F --rutas --code                   # mapa de rutas y qué $('Nodo') lee cada Code
node $S/simular_code.js $F "Plan" --plantilla > casos.json   # esqueleto de casos para UN nodo Code
node $S/simular_code.js $F "Normalizar" .claude/skills/n8n-workflow-check/ejemplos/normalizar.casos.json
```
La lógica vive en 4 nodos Code grandes: **Contexto** (arma el prompt y `deudas`/`prestamos`), **Plan** (valida y resuelve personas, cuentas y préstamos con `personaExistente`, `buscarCuenta` y `buscarPrestamo`; desde v10 decide los cobros "X me pagó"), **Ejecutar** (convierte la acción en `ops`) y **Consultar**. Para leerlos, extrae `jsCode` del JSON con Python; no edites el JSON a mano.

## IA y cuotas
Gemini (nivel gratuito) es la base: **3.1 Flash Lite** principal, **3.5 Flash Lite** de respaldo para audio e imagen, **Gemma 4 31B** de respaldo de texto (límite de **16K tokens por minuto**, el más ajustado). Groq Whisper como respaldo de audio.
**No usar Gemini 3.8 Flash** (20 peticiones al día). Las cuotas diarias se reinician a medianoche del Pacífico (2:00 a. m. en Colombia; 3:00 a. m. desde noviembre). **No activar facturación.**

## Estado y próximos pasos
Errores abiertos: `/suscripciones` incompleto (del 2 de octubre). En la v11 quedan resueltos el audio, el préstamo registrado como gasto (guardia de "presté") y `/cobrar` sin opciones o con símbolos pegados al nombre.
Los errores del 3 de octubre (pago de la mamá, cobro a Doña Sandra, `/deshacer` de cobros, encabezado de `/cobrar`) y los del audio quedan resueltos desde la **v10** ([docs/plan-v10.md](docs/plan-v10.md)). Falta en la hoja: cuotas PR-02-4/5 y el gasto de Spotify que era un préstamo a Nicolás ([docs/pendientes.md](docs/pendientes.md)).
Pendientes grandes: Bloque 2 de la auditoría (anular en vez de borrar y `/deshacer` completo), Asistente v4 (hábitos y memoria) y dashboard en Looker Studio, que William quiere aprender.
Lista priorizada con causas y soluciones: [docs/pendientes.md](docs/pendientes.md). Lecciones aprendidas y diagnósticos: [docs/lecciones-aprendidas.md](docs/lecciones-aprendidas.md).
