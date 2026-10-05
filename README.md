# Automatizaciones n8n de William

Flujos de n8n (self-hosted en Google Cloud) para tres agentes en producción, y un tablero web de finanzas en Google Apps Script:

| Agente | Canal | Qué hace |
|---|---|---|
| **Finanzas** | Telegram | Registra gastos, ingresos, préstamos, tarjetas, inversiones y presupuestos en Google Sheets por texto, voz, foto o PDF. Avisos diarios y resúmenes con gráficas. |
| **Asistente personal** | Telegram | Notas, pendientes, recordatorios y claves, sincronizados con Google Calendar y Tasks. |
| **Pagos** | WhatsApp | Registra pagos recibidos (foto, texto o audio) en la hoja "Registro Pagos". |

IA: Gemini (nivel gratuito) con Gemma y Groq Whisper de respaldo.

## Estructura

```
.
├── CLAUDE.md                 # Instrucciones para Claude Code (leer primero)
├── flujos/                   # Exports JSON importables en n8n
│   ├── README.md             # Inventario, convenciones y cómo importar
│   ├── finanzas/
│   ├── asistente/
│   └── pagos/
├── apps-script/tablero/      # Tablero web de finanzas (Apps Script): Codigo.gs, Index.html, README
├── docs/                     # Documentación de referencia
│   ├── finanzas-arquitectura.md
│   ├── asistente-y-pagos.md
│   ├── infraestructura.md
│   ├── ids-y-credenciales.md
│   ├── pendientes.md         # Estado del proyecto y qué falta
│   ├── sesion-local.md       # Trabajar en local y prompt de arranque
│   ├── instalar-skills.md
│   └── lecciones-aprendidas.md
├── .claude/
│   ├── rules/n8n-flujos.md   # Convenciones al editar JSON de flujos
│   ├── skills/               # Skills de Claude Code (propias y de terceros)
│   └── hooks/                # Instala Luxon al iniciar sesión
└── .agents/skills/           # Skills instaladas con npx skills (enlazadas desde .claude/skills)
```

## Por dónde empezar
- **Ver qué hace cada flujo:** [docs/finanzas-arquitectura.md](docs/finanzas-arquitectura.md) y [docs/asistente-y-pagos.md](docs/asistente-y-pagos.md).
- **Importar o actualizar un flujo:** [flujos/README.md](flujos/README.md).
- **Servidor caído o lento:** [docs/infraestructura.md](docs/infraestructura.md) y [docs/lecciones-aprendidas.md](docs/lecciones-aprendidas.md).
- **Tablero web:** [apps-script/tablero/README.md](apps-script/tablero/README.md).
- **Qué sigue:** [docs/pendientes.md](docs/pendientes.md).
- **Trabajar en local:** [docs/sesion-local.md](docs/sesion-local.md).

## Seguridad
Los JSON referencian las credenciales de n8n **por ID** (no son secretos). Nunca se suben tokens, contraseñas ni archivos `.env`.
