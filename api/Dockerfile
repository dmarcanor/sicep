FROM composer:2 AS vendor
WORKDIR /app

# Sólo los manifiestos primero: la capa de dependencias se reaprovecha mientras
# composer.lock no cambie.
COPY composer.json composer.lock ./
RUN composer install \
      --no-dev \
      --no-scripts \
      --no-autoloader \
      --prefer-dist \
      --no-interaction

FROM php:8.4-fpm-alpine

RUN apk add --no-cache nginx supervisor mariadb-client \
    && docker-php-ext-install pdo pdo_mysql opcache \
    && mkdir -p /var/log/supervisor /run/nginx

# En producción el opcache se valida una vez y se queda en memoria.
RUN { \
      echo 'opcache.enable=1'; \
      echo 'opcache.validate_timestamps=0'; \
      echo 'opcache.max_accelerated_files=10000'; \
      echo 'opcache.memory_consumption=128'; \
    } > /usr/local/etc/php/conf.d/opcache.ini

WORKDIR /var/www/html

COPY --from=vendor /app/vendor ./vendor
COPY . .

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
RUN composer dump-autoload --no-dev --optimize --no-interaction \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD php -r 'exit(@file_get_contents("http://127.0.0.1/up") ? 0 : 1);'

ENTRYPOINT ["/entrypoint.sh"]
