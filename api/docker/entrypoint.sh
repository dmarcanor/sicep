#!/bin/sh
set -e

# Con argumentos, el contenedor se usa como herramienta y no como servicio:
#   docker compose run --rm api php artisan migrate:status
# Va antes de comprobar APP_KEY para que key:generate funcione sin clave.
if [ "$#" -gt 0 ]; then
    exec "$@"
fi

if [ -z "$APP_KEY" ]; then
    echo "ERROR: falta APP_KEY."
    echo "Genere una y póngala en el archivo .env de la raíz del proyecto:"
    echo "  docker compose run --rm --no-deps api php artisan key:generate --show"
    exit 1
fi

echo "Esperando a la base de datos en ${DB_HOST}:${DB_PORT:-3306}..."
intentos=0
until mariadb-admin ping -h"$DB_HOST" -P"${DB_PORT:-3306}" -u"$DB_USERNAME" -p"$DB_PASSWORD" --silent 2>/dev/null; do
    intentos=$((intentos + 1))
    if [ "$intentos" -ge 60 ]; then
        echo "ERROR: la base de datos no respondió tras 120s."
        exit 1
    fi
    sleep 2
done
echo "Base de datos lista."

php artisan migrate --force

# Los seeders usan firstOrCreate: añaden lo que falte sin pisar lo que el
# administrador haya cambiado, así que es seguro ejecutarlos en cada arranque.
php artisan db:seed --force

php artisan config:cache
php artisan route:cache

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
