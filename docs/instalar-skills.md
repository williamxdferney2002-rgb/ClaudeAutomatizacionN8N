# Instalar las skills de n8n en otro proyecto de Claude Code

En **este** repositorio no hay que hacer nada: las skills están en `.claude/skills/` y el hook `.claude/hooks/session-start.sh` instala Luxon al iniciar cada sesión.
Este documento es para llevarlas a **otro** proyecto (otro repositorio o una carpeta nueva en su computador).

## Prompt para copiar y pegar en Claude Code

```text
Instala en este proyecto las skills de n8n que uso, a nivel de proyecto para Claude Code
(copiadas, no enlazadas, para que queden en el repositorio). Ejecuta:

1. Skills de la comunidad (czlonkowski/n8n-skills — https://github.com/czlonkowski/n8n-skills):
npx skills add https://github.com/czlonkowski/n8n-skills -a claude-code --copy -y \
  --skill n8n-workflow-patterns --skill n8n-code-javascript --skill n8n-expression-syntax \
  --skill n8n-error-handling --skill n8n-subworkflows --skill n8n-binary-and-data \
  --skill n8n-agents --skill n8n-self-hosting

2. Skills oficiales de n8n (n8n-io/skills — https://github.com/n8n-io/skills):
npx skills add https://github.com/n8n-io/skills -a claude-code --copy -y \
  --skill n8n-workflow-lifecycle-official --skill n8n-debugging-official \
  --skill n8n-loops-official --skill n8n-credentials-and-security-official

3. Mis skills propias (repositorio privado williamxdferney2002-rgb/ClaudeAutomatizacionN8N —
https://github.com/williamxdferney2002-rgb/ClaudeAutomatizacionN8N/tree/main/.claude/skills):
npx skills add https://github.com/williamxdferney2002-rgb/ClaudeAutomatizacionN8N -a claude-code --copy -y \
  --skill n8n-workflow-check --skill auditar-entrega --skill auditoria-proyecto

4. Instala Luxon para el simulador de nodos Code:
npm install --prefix .claude/skills/n8n-workflow-check
y agrega "node_modules/" al .gitignore de esa carpeta si no está.

5. Copia también el hook de arranque para que Luxon se instale solo en cada sesión:
.claude/hooks/session-start.sh y la sección "hooks" de .claude/settings.json del mismo repositorio
(https://github.com/williamxdferney2002-rgb/ClaudeAutomatizacionN8N/tree/main/.claude).
Si ya existe un .claude/settings.json, combina la sección SessionStart en vez de reemplazar el archivo.

6. Revisa lo instalado (solo Markdown y los scripts .py/.js de n8n-workflow-check; nada que
descargue o ejecute código externo), lista las skills en .claude/skills/, haz commit y push.

Notas:
- Las skills propias asumen las reglas de mi CLAUDE.md (parse_mode HTML, sello con $execution.id,
  una sola lectura de la hoja, versiones de nodo). Si el proyecto nuevo es distinto, ajusta
  VERSIONES y las reglas de Telegram/hoja en .claude/skills/n8n-workflow-check/scripts/check_workflow.py.
- auditoria-proyecto lee CLAUDE.md y docs/: adapta la tabla "Fuentes en este repo" de su SKILL.md.
- No instales las skills que dependen del servidor n8n-mcp (n8n-mcp-tools-expert, n8n-multi-instance,
  n8n-validation-expert, n8n-node-configuration, using-n8n-mcp-skills, using-n8n-skills-official,
  n8n-node-configuration-official, n8n-extending-mcp-official) salvo que tenga n8n-mcp conectado.
```

## Si el paso 3 falla
El repositorio de las skills propias es privado:
- **En la nube (claude.ai/code):** la sesión debe tener acceso a `williamxdferney2002-rgb/ClaudeAutomatizacionN8N`. Pídale a Claude que lo agregue a la sesión.
- **En su computador:** debe tener la sesión de GitHub iniciada (`gh auth login`, o git con sus credenciales).
- **Alternativa sin red:** si tiene este repositorio clonado al lado, use la ruta local: `npx skills add ../ClaudeAutomatizacionN8N -a claude-code --copy -y --skill n8n-workflow-check --skill auditar-entrega --skill auditoria-proyecto`.

## Qué queda instalado

| Origen | Skills |
|---|---|
| [czlonkowski/n8n-skills](https://github.com/czlonkowski/n8n-skills) | n8n-workflow-patterns, n8n-code-javascript, n8n-expression-syntax, n8n-error-handling, n8n-subworkflows, n8n-binary-and-data, n8n-agents, n8n-self-hosting |
| [n8n-io/skills](https://github.com/n8n-io/skills) | n8n-workflow-lifecycle-official, n8n-debugging-official, n8n-loops-official, n8n-credentials-and-security-official |
| [Propias](https://github.com/williamxdferney2002-rgb/ClaudeAutomatizacionN8N/tree/main/.claude/skills) | n8n-workflow-check, auditar-entrega, auditoria-proyecto |

## Cómo se usan
- Solas, según el tema (Claude las elige por su descripción).
- A mano: `/n8n-workflow-check`, `/auditar-entrega`, `/auditoria-proyecto finanzas|asistente|pagos|todo` (esta última solo se ejecuta a mano).

## Actualizar
`npx skills update -p -y` actualiza las skills de terceros según `skills-lock.json`. Las propias se actualizan editándolas en este repositorio y volviendo a correr el paso 3.
