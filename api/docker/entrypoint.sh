#!/bin/sh
set -e

echo "Waiting for MariaDB to be ready..."
sleep 5

php artisan config:clear
php artisan cache:clear
php artisan migrate --force
php artisan db:seed --force

php-fpm &
nginx -g "daemon off;"
