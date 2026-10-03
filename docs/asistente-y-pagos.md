# Asistente personal y bot de pagos

## Asistente (Telegram, v3)
- Flujos: *Asistente - Entrada v3* (119 nodos), *Asistente - Reloj v3* (29, cada 10 min) y *Asistente - Errores* (5).
- Hoja `1LItc9pXs9iXbNi77a2TqmOA23XZKPDZ71fvp6J-pLyA` con pestañas Notas, Pendientes, Recordatorios, Claves, Operaciones y Por confirmar. **Todas las columnas de fecha en "Texto sin formato".**
- Acciones: guardar y buscar notas, crear, listar y completar pendientes (códigos P1…), fecha de pendiente, crear, listar y cancelar recordatorios (R1…; acepta varios), cancelar todos, guardar y consultar claves, ver agenda, posponer y aclarar (botones pendiente/recordatorio).
- Sincroniza con Google Calendar (calendario "Asistente") y Tasks, **solo lo que creó el bot**.
- Agenda: se ocultan los eventos de hoy que ya pasaron (cambio manual en el nodo *Armar agenda*).
- IA: Gemini Flash Lite principal y Gemma de respaldo (Gemma es lenta).
- **Pendiente para la v4:** borrar recordatorios por fecha, eliminar un pendiente sin completarlo, comentario solo si la acción salió bien, memoria de los últimos intercambios (reutilizar la de Finanzas) y **seguimiento de hábitos con rachas**, con un solo check-in diario, el gym marcado como hecho y sincronía con Google Tasks.

## Agente de pagos (WhatsApp)
- WhatsApp Trigger → ¿Autorizado? (números que terminan en 2915 y 2914) → contactos → Switch (Foto, Texto, Audio, Edición) → IA → Guardar pago en "Registro Pagos" (columna *ID WhatsApp* y nodo *¿Duplicado?*).
- IA actual: **Gemma 4 31B principal** y 3.5 Flash Lite de respaldo. **Recomendado invertirlo** (3.1 Flash Lite principal) para aliviar el límite por minuto de Gemma.
- try/catch en los Code de IA; distingue `error_ia` de "no es un pago".
