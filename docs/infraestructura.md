# Infraestructura

## Servidor
- Google Cloud Compute Engine **e2-micro**, instancia `n8n-consignaciones`, zona `us-east1-b`.
- 952 MiB de RAM y 2 GiB de swap; disco de 28 GB (≈28% usado a oct-2026). Ubuntu 26.04.1 LTS (kernel 7.0.0-10xx-gcp).
- IP externa **estática** `34.73.72.12` (promovida el 1-oct-2026). Dominio DuckDNS `pagoswilliam.duckdns.org`.
- Usuario SSH: `williamxdferney2002` (SSH desde el navegador, en la consola de Google Cloud).
- Contenedores: `n8n-n8n-1` (≈400 MiB) y `n8n-caddy-1` (≈16 MiB, HTTPS con certificado automático).
- Variables relevantes en `docker-compose.yml`: `GENERIC_TIMEZONE=America/Bogota`, `TZ=America/Bogota`.
- Carpeta del compose: probablemente `~/n8n` (por confirmar con `ls ~`).

## Permisos
- `sudo` está **limitado**: `sudo apt update` funciona; `sudo apt upgrade` y `sudo reboot` responden "I'm sorry … I'm afraid I can't do that".
- Pendiente revisar con `groups` y `sudo -l`. Opciones: `sudo.ws` (sudo clásico de Ubuntu) o el rol IAM "Acceso de administrador de SO de Compute".

## Diagnóstico rápido
```bash
free -h                                   # disponible >150 MB = bien; <100 MB o swap >1 GB = preocuparse
uptime                                    # carga normal ≈ 0.1–0.3
docker stats --no-stream                  # n8n normal: 250–450 MiB
df -h /
docker exec $(docker ps --filter "name=n8n" -q | head -1) sh -c 'du -sh /home/node/.n8n'   # ≈265 MB
docker ps --format "table {{.Names}}\t{{.Status}}"
docker logs --tail 30 n8n-n8n-1
docker logs --tail 30 n8n-caddy-1
getent hosts pagoswilliam.duckdns.org     # debe dar 34.73.72.12
curl -sI https://pagoswilliam.duckdns.org | head -5   # debe dar HTTP/2 200
```

## Incidente del 1-oct-2026 (referencia)
- `sudo apt update` con ~240 MB libres dejó la máquina sin responder (swap a fondo).
- Se reinició con **Restablecer** desde la consola, con la IP ya estática. n8n tardó unos minutos en arrancar: el *Task Runner* dio "invalid or expired grant token" y Caddy respondía 502 mientras tanto.
- Mejora sugerida (no aplicada aún) para arranques lentos:
```bash
cd ~/n8n && grep -q N8N_RUNNERS_GRANT_TOKEN_TTL docker-compose.yml || sed -i '/GENERIC_TIMEZONE/a\      - N8N_RUNNERS_GRANT_TOKEN_TTL=120' docker-compose.yml && docker compose up -d
```
- **Lección:** no correr `apt upgrade` con n8n encendido en 1 GB. Si hace falta, detener n8n unos minutos antes.

## Reinicios
- **Restablecer** (Compute Engine → ⋮) conserva la IP. *Detener → Iniciar* también la conserva, porque ahora es estática.
- Telegram y WhatsApp reintentan los webhooks durante horas, así que los mensajes enviados mientras el servidor está caído se procesan al volver.
- Si se cambia de máquina: e2-small (2 GB) cuesta ≈US$13/mes; solo si la RAM disponible baja de 100 MB de forma sostenida.
