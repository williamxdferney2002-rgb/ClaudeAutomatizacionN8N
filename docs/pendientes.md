# Estado del proyecto y pendientes

Actualizado: **5-oct-2026**. Diagnósticos ya resueltos: [lecciones-aprendidas.md](lecciones-aprendidas.md).

## Dónde estamos

| Componente | Versión en el repo | Estado |
|---|---|---|
| Finanzas - Bot | **v15** (88 nodos) | Entregada el 4-oct. Hay que confirmar que esté importada y publicada en n8n. |
| Finanzas - Programado | **v6** (34 nodos) | Entregada el 4-oct. Hay que confirmar que esté publicada. |
| Finanzas - Errores | v1 (5 nodos) | Export de producción. La v2 está pendiente (punto 3). |
| Asistente - Entrada / Reloj | v3 | En producción. **No está en el repo**: falta el export. |
| Asistente - Errores | v3 | En el repo. Le falta `parse_mode: HTML`. |
| Agente de Pagos (WhatsApp) | estable | En producción. **No está en el repo**. |
| Tablero (Apps Script) | **v6** | `Codigo.gs` v5 (escribe) e `Index.html` v6 (diseño "terminal de mar profundo"). Probado fuera de Google; falta instalarlo y probarlo dentro de Google. |

**Git:** todo lo del 3 al 5 de octubre está en la rama `claude/peaceful-wozniak-fusa0r`, 23 commits por delante de `main`. Falta pasarlo a `main` con un *pull request* o un *merge*.

## Por hacer, en orden

### 1. Instalar y probar lo entregado (lo hace William)
- [ ] **Bot v15:** despublicar la versión vieja **antes** de publicar la nueva (si no, n8n borra el webhook) e importar `flujos/finanzas/finanzas-bot-v15.json`. Probar en Telegram:
  - "Debo 10k a Daniela de los postres" → elegir la categoría → confirmar. Los saldos no deben cambiar.
  - "Le pagué a Daniela 10 mil por Nequi".
  - Los errores del 3-oct, resueltos en la v10 pero **nunca probados en Telegram**: "mi mamá ya me pagó todo a Nequi" (no debe ir a Doña Sandra), "Doña Sandra me pagó la cuota", `/deshacer` de un cobro (las cuotas deben volver a pendientes) y `/cobrar Papá`.
  - Corregir respondiendo a un mensaje del bot (v12) y `/tablero`.
- [ ] **Programado v6:** revisar el aviso diario de las 7:00 con los botones de cuenta y el resumen del domingo a las 19:00.
- [ ] **Tablero v6:**
  - Pegar `Codigo.gs` e `Index.html`.
  - Ejecutar `getDatos` una vez en el editor y **autorizar el permiso de edición** (lo pide desde la v5).
  - Crear una nueva versión de la implementación.
  - Probar con un pago pequeño y deshacerlo, y comprobar que `/deshacer` en Telegram también deshace un pago hecho desde el tablero.
- [ ] Enviar el link del tablero al bot una vez: `/tablero https://script.google.com/…/exec`.
- [ ] Pasar la rama a `main`.

### 2. Datos a corregir en la hoja
- [ ] **PR-02-4 y PR-02-5** (*Cuotas préstamo*), daño que dejó el error del 3-oct:
  - PR-02-4: Estado *Pendiente*; vaciar Fecha pago, Valor recibido, Cuenta donde llegó e ID movimiento.
  - PR-02-5: vaciar Valor recibido, Cuenta donde llegó e ID movimiento.
  - Hasta corregirlo, el bot y el tablero muestran $274.200 de Doña Sandra en cuotas, en vez de $514.200.
- [ ] **`MOV-261002145118-2818-1`**: era un préstamo a Nicolás, no un gasto de Spotify. Con la v12 o superior, responda a ese mensaje del bot: *"No era un gasto de Spotify: le presté 7000 a Nicolás para YouTube"*. También puede editar la fila: Tipo *Préstamo dado*, Persona *Nicolás*, sin Categoría ni Comercio.

### 3. Errores abiertos
- [ ] **`/suscripciones` no muestra todas** (2-oct). La consulta descarta las filas sin *Monto total* numérico, pero la búsqueda de duplicados sí las cuenta. Una fila pegada a mano y corrida (Spotify) queda oculta y además bloquea crearla de nuevo ("Ya tienes Spotify").
  - Solución: listar todas y marcar las incompletas ("⚠️ falta el valor"); validar columnas al crear o editar; detectar duplicados solo por nombre exacto.
- [ ] **Finanzas - Errores v2:**
  - *Avisar error* con `parse_mode: HTML` y texto escapado;
  - anti-spam (un aviso por error repetido);
  - mensaje claro cuando es cuota de Gemini;
  - marcar la fila en *Log Bot*.
- [ ] **Asistente - Errores › Avisar error:** el mismo arreglo de `parse_mode: HTML` y escape.
- [ ] **Bot › ¿Es corrección?:** las dos ramas van a *Ejecutar*. Sobra el IF o falta la ruta distinta.
- [ ] **Bot › Borrar movimientos / Borrar cuotas:** no tienen reintento ni `onError`.

### 4. Mejoras grandes (requieren plan y "dale")
- [ ] **Bloque 2 de la auditoría:**
  - anular en vez de borrar (columna de estado del registro), con bitácora de *Cambios*;
  - `/deshacer` completo: préstamos, reventas, inversiones y cuentas;
  - escrituras por número de fila (S3) y escritura no atómica (S4);
  - ajustar *Resumen*, Looker y el tablero para ignorar lo anulado.
- [ ] **Asistente v4:**
  - borrar recordatorios por fecha;
  - eliminar un pendiente sin completarlo;
  - memoria de los últimos intercambios;
  - hábitos con rachas y un check-in diario.

  Detalle en [asistente-y-pagos.md](asistente-y-pagos.md).
- [ ] **Bot de pagos:** invertir el modelo principal y versionar su export en el repo.
- [ ] **Dashboard en Looker Studio:** William quiere aprenderlo. La guía paso a paso está en el historial del chat.
- [ ] **Bot del gimnasio** (idea): ejercicios, pesos, rutinas y "¿cuándo fue la última vez que hice pierna?".
- [ ] **Tablero, ideas siguientes:** token por enlace para celulares con varias cuentas de Google (hoy solo abre en incógnito); que el candado coordine con el bot (hoy solo bloquea al propio tablero).

### 5. Orden del repositorio
- [ ] Subir los exports que faltan: Asistente Entrada y Reloj v3, y Pagos (agente y errores), con los nombres de [../flujos/README.md](../flujos/README.md).
- [ ] Llevar las pruebas del tablero al repo con **datos inventados**. Hoy viven fuera porque usan el Excel real.
- [ ] Servidor: confirmar la ruta del `docker compose`, revisar `sudo -l` y aplicar actualizaciones con n8n detenido ([infraestructura.md](infraestructura.md)).
- [ ] Repo **Oura**: tiene instaladas las skills y un `CLAUDE.md` base. Falta definir de qué trata.

## Hecho (resumen por versión)
- **Bot:**
  - **v10:** "X me pagó" unificado (deuda suelta o préstamo, con confirmación), Whisper primero en voz, `/deshacer` que revierte cuotas, `/cobrar` sin encabezado y IDs con `$execution.id`.
  - **v11:** `/cobrar` con botones y guardia de "presté".
  - **v12:** corrección por botones sin perderse.
  - **v13:** botones de cuotas del Programado.
  - **v14:** `/tablero`.
  - **v15:** deuda sin plata.
- **Programado v6:** cuotas con botones de cuenta, recurrentes incompletas y resumen semanal detallado.
- **Tablero:**
  - **v1:** lectura en vivo.
  - **v2:** detalle por deudor, tarjeta y cuenta.
  - **v3:** pestaña Ingresos.
  - **v4:** diseño "sala de control" y colores coral y morado.
  - **v5:** corregir, registrar pagos, deshacer y botón al bot.
  - **v6:** diseño "terminal de mar profundo".
- **Herramientas:**
  - skills propias: `n8n-workflow-check`, `auditar-entrega` (también revisa el tablero) y `auditoria-proyecto`;
  - 16 skills de terceros al día;
  - hook de Luxon;
  - guía para trabajar en local: [sesion-local.md](sesion-local.md).
