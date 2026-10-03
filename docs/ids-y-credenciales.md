# IDs y credenciales (sin secretos)

## Credenciales en n8n (por ID)
| Uso | Tipo | ID | Nombre |
|---|---|---|---|
| Google Sheets | googleSheetsOAuth2Api | `EPYsNteTb1B5wNyP` | Google Sheets account |
| Google Drive | googleDriveOAuth2Api | `4pZ4lEzqR7nzLJsq` | Google Drive account |
| Gemini | googlePalmApi | `d6Uz9wf772KM3y85` | Google Gemini(PaLM) Api account |
| Groq (Whisper) | httpHeaderAuth | `tarOwIMiS6uu59RG` | Groq API |
| Telegram Finanzas | telegramApi | `p2lXYE6uXM1K7clR` | Telegram Finanzas (@AsistenteFinanzasWD_bot) |
| Telegram Asistente | telegramApi | `v4cdKmHT2AHZJJun` | Telegram Asistente |
| WhatsApp | whatsAppApi | `V17vPhUYW63x9vvw` | WhatsApp OAuth/Enviar |
| Google Calendar | googleCalendarOAuth2Api | `DFVAh2eI9LZgbqfA` | Google Calendar |
| Google Tasks | googleTasksOAuth2Api | `msxZbtXz7j3NLjpP` | Google Tasks |

## Flujos de error
- Finanzas (Bot y Programado): `qMWZ59kHUj386TnZ` (*Finanzas - Errores*).
- Pagos por WhatsApp: `CiiO6RLWImqCMVJS`.

## Finanzas
- Hoja (Google Sheets nativa, 44 caracteres): `1n97Po-FMwXt0XHwrSp4LLjCsyUMpKBdcUksFxkxJ8GM`. Los IDs de 33 caracteres son `.xlsx` y n8n no puede escribirlos.
- Carpetas de Drive: Comprobantes `1jspoAPdj1IXJPH7PPWt31u_GXVMXWV9R` · Extractos `1ThvjFDicSZQ2MR771nSDvo7UMjrb3rne` · Capturas `1c78fUPdBcdi-s6hWH1ydCbkQ728t5Y6G` · Respaldos `1rVklbnardQaA2fHmLbGIglye4hrVwmyw`.
- Chat de Telegram de William: `7739445962` (el mismo en ambos bots).
- Webhook del Telegram Trigger del bot: se conserva desde el export de la v7. **No regenerar** el `webhookId` al editar.

## Asistente
- Hoja: `1LItc9pXs9iXbNi77a2TqmOA23XZKPDZ71fvp6J-pLyA`.
- Calendario "Asistente": `dee1558983d47b5c43200c99981d783382b660361e8bea26894e8a5eac62f397@group.calendar.google.com`.
- Lista de Tasks: `@default`.

## Pagos por WhatsApp
- Números autorizados: terminan en 2915 y 2914. Hoja "Registro Pagos" (pestañas *Registros* y *Contactos*).
