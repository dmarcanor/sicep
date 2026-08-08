#!/bin/bash
# Levanta todo el sistema (base de datos, API y frontend) con Docker Compose.
# Sustituye al antiguo guion de "docker run" encadenados.

set -e

cd "$(dirname "$0")"

if [ ! -f .env ]; then
    echo "No existe .env. Cópielo de la plantilla y complete APP_KEY:"
    echo "  cp .env.docker.example .env"
    echo "  docker compose run --rm --no-deps api php artisan key:generate --show"
    exit 1
fi

docker compose up -d --build

echo ""
echo "=== Listo ==="
echo "Sistema:  http://localhost:${WEB_PORT:-8080}"
echo ""
echo "Ver el estado:   docker compose ps"
echo "Ver los logs:    docker compose logs -f"
echo "Detener todo:    docker compose down"
