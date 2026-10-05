# Trabajar el proyecto en local (Claude Code en su computador)

## 1. Tener los archivos
Escoja una de las dos formas.

**A. Con git (recomendada: conserva el historial y permite subir cambios)**
```bash
git clone https://github.com/williamxdferney2002-rgb/ClaudeAutomatizacionN8N.git
cd ClaudeAutomatizacionN8N
git checkout claude/peaceful-wozniak-fusa0r   # mientras esta rama no se haya pasado a main
```
- **En Windows**, antes de clonar ejecute `git config --global core.symlinks true` (y tenga activado el *Modo de desarrollador*). Si no, las 4 skills enlazadas (`google-apps-script`, `frontend-design`, `webapp-testing`, `theme-factory`) quedan como archivos de texto. El prompt de abajo también lo revisa y lo arregla.

**B. Con el ZIP** que le entregó Claude. Descomprímalo donde quiera trabajar.
- Trae todo lo del repositorio menos el historial de git, con las skills ya copiadas (sin enlaces).
- Para subir cambios después, cree el repo local con `git init` y conéctelo al remoto, o mejor use la forma A.

## 2. Requisitos en el computador
- **Claude Code**: con el instalador de https://code.claude.com (o `npm install -g @anthropic-ai/claude-code`). Luego abra `claude` dentro de la carpeta.
- **Node.js 18 o superior**: para el simulador de nodos Code, `npx skills` y las pruebas del tablero.
- **Python 3**: para `check_workflow.py` y `mapa_flujo.py`.
- **Opcional**, para probar el tablero en un navegador: `npm install playwright` y `npx playwright install chromium`.

## 3. Prompt para la primera sesión local
Abra Claude Code **dentro de la carpeta del proyecto** y pegue:

```text
Hola. Soy el Ingeniero William Delgado. Continuamos mi proyecto de automatizaciones n8n
(Finanzas en Telegram, Asistente personal en Telegram, Pagos por WhatsApp) y el tablero de
finanzas en Google Apps Script. Venimos de varias sesiones en Claude Code en la nube; todo
lo hecho está en esta carpeta. Respóndeme en español y llámame "Ingeniero William".

1. Contexto. Lee completo CLAUDE.md, luego docs/pendientes.md (estado actual y qué falta,
   actualizado el 5-oct-2026), docs/finanzas-arquitectura.md, docs/lecciones-aprendidas.md
   y apps-script/tablero/README.md. Las reglas de CLAUDE.md mandan: plan y "dale" antes de
   cambios grandes; JSON importable con active:false; conservar IDs, webhookId, credenciales
   y errorWorkflow; Telegram con parse_mode HTML; nunca tokens ni contraseñas;
   n8n-workflow-check y auditar-entrega antes de entregar.

2. Skills. Lista .claude/skills/ y confirma que estén estas 19:
   - n8n (comunidad): n8n-workflow-patterns, n8n-code-javascript, n8n-expression-syntax,
     n8n-error-handling, n8n-subworkflows, n8n-binary-and-data, n8n-agents, n8n-self-hosting
   - n8n (oficiales): n8n-workflow-lifecycle-official, n8n-debugging-official,
     n8n-loops-official, n8n-credentials-and-security-official
   - Tablero y diseño: google-apps-script, frontend-design, webapp-testing, theme-factory
   - Propias: n8n-workflow-check, auditar-entrega, auditoria-proyecto
   Si alguna falta, o es un archivo de texto en vez de una carpeta (pasa en Windows con los
   enlaces), reinstálala copiada:
     npx skills add https://github.com/jezweb/claude-skills -a claude-code --copy -y --skill google-apps-script
     npx skills add https://github.com/anthropics/skills -a claude-code --copy -y --skill frontend-design --skill webapp-testing --skill theme-factory
     npx skills add https://github.com/czlonkowski/n8n-skills -a claude-code --copy -y --skill <nombre>
     npx skills add https://github.com/n8n-io/skills -a claude-code --copy -y --skill <nombre>
   Las 3 propias están en el repo y no se descargan. Si una se dañó, sácala del historial
   de git o del ZIP.

3. Herramientas. Instala Luxon para el simulador: npm install --prefix .claude/skills/n8n-workflow-check
   (el hook .claude/hooks/session-start.sh lo hace solo en Linux/Mac; en Windows hazlo a mano).
   Luego comprueba que todo funciona:
     python3 .claude/skills/n8n-workflow-check/scripts/check_workflow.py flujos/finanzas/finanzas-bot-v15.json --modo produccion
     node .claude/skills/n8n-workflow-check/scripts/simular_code.js flujos/finanzas/finanzas-bot-v15.json "Normalizar" .claude/skills/n8n-workflow-check/ejemplos/normalizar.casos.json
   Se espera "0 errores, 0 avisos" y "5/5 casos correctos". En Windows usa "python" si
   "python3" no existe.

4. Git. Dime en qué rama estamos y si hay cambios sin subir. El trabajo del 3 al 5 de octubre
   está en la rama claude/peaceful-wozniak-fusa0r; si todavía no está en main, recuérdamelo.

5. No cambies nada todavía. Dame un resumen corto: qué versión tiene cada componente, qué me
   toca instalar o probar a mí (sección 1 de docs/pendientes.md), qué datos corregir en la hoja
   y los 3 siguientes pasos que recomiendas, en orden. Luego espera mis instrucciones.
```

## 4. Después
- Cada vez que termine algo, Claude debe actualizar `docs/pendientes.md`, la tabla de versiones del `CLAUDE.md` y hacer commit.
- Los datos personales de prueba (el Excel de la hoja, capturas) **no** se suben al repo.
- Para llevar las skills a otro proyecto: [instalar-skills.md](instalar-skills.md).
