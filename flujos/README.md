# Flujos de n8n

## Inventario
| Agente | Flujo | Versión | Archivo | Estado en el repo |
|---|---|---|---|---|
| Finanzas | Bot | v13 | [finanzas/finanzas-bot-v13.json](finanzas/finanzas-bot-v13.json) | ✅ (v9 a v12 en el historial de git) |
| Finanzas | Programado | v6 | [finanzas/finanzas-programado-v6.json](finanzas/finanzas-programado-v6.json) | ✅ (v5 en el historial de git) |
| Finanzas | Errores | v1 | [finanzas/finanzas-errores-v1.json](finanzas/finanzas-errores-v1.json) | ✅ (export de producción, 5 nodos) |
| Asistente | Entrada | v3 | `asistente/asistente-entrada-v3.json` | — no se versiona por ahora |
| Asistente | Reloj | v3 | `asistente/asistente-reloj-v3.json` | — no se versiona por ahora |
| Asistente | Errores | v3 | [asistente/asistente-errores-v3.json](asistente/asistente-errores-v3.json) | ✅ |
| Pagos | Agente WhatsApp | estable | `pagos/pagos-agente.json` | — no se versiona por ahora |
| Pagos | Errores | estable | `pagos/pagos-errores.json` | — no se versiona por ahora |

## Convenciones
- Nombre del archivo: `<agente>-<flujo>-v<N>.json`, en minúsculas y sin espacios. El nombre **dentro** de n8n puede seguir siendo "Finanzas - Bot v9".
- Solo se guarda la **versión vigente**. Al subir una versión nueva se borra la anterior en el mismo commit; git conserva el historial.
- Al subir una versión nueva, actualiza esta tabla y la de `CLAUDE.md`.
- Las reglas para editar los JSON están en [../.claude/rules/n8n-flujos.md](../.claude/rules/n8n-flujos.md).

## Exportar desde n8n
1. Abrir el flujo → menú **⋯** → **Download**.
2. Renombrar el archivo según la convención y guardarlo en su carpeta.
3. Revisar que `pinData` esté vacío (sin datos personales de pruebas).

## Importar una versión nueva
1. En n8n: **Create workflow** → menú **⋯** → **Import from file**.
2. Revisar credenciales (por ID; ver [../docs/ids-y-credenciales.md](../docs/ids-y-credenciales.md)) y `Settings → Error workflow`.
3. **Despublicar la versión vieja antes de publicar la nueva** (si no, n8n borra el webhook de Telegram del bot).
4. Publicar la nueva y probar en Telegram con casos válidos, inválidos y duplicados.
