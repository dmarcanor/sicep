#!/bin/bash

set -e

echo "=== Stopping existing containers ==="
docker stop lopna-container 2>/dev/null || true
docker rm lopna-container 2>/dev/null || true
docker stop sicep-mariadb 2>/dev/null || true
docker rm sicep-mariadb 2>/dev/null || true
docker stop sicep-api 2>/dev/null || true
docker rm sicep-api 2>/dev/null || true

echo "=== Creating Docker network ==="
docker network create sicep-network 2>/dev/null || true

echo "=== Starting MariaDB ==="
docker run -d \
  --name sicep-mariadb \
  --network sicep-network \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=sicep \
  -e MYSQL_USER=sicep \
  -e MYSQL_PASSWORD=sicep \
  -p 3306:3306 \
  mariadb:11

echo "=== Waiting for MariaDB to be ready ==="
sleep 10

echo "=== Building Laravel API image ==="
docker build -t sicep-api /Users/danielmarcano/dev/lopna/api

echo "=== Starting Laravel API ==="
docker run -d \
  --name sicep-api \
  --network sicep-network \
  -p 8000:80 \
  -e DB_HOST=mariadb \
  -e DB_DATABASE=sicep \
  -e DB_USERNAME=sicep \
  -e DB_PASSWORD=sicep \
  sicep-api

echo "=== Building React app ==="
cd /Users/danielmarcano/dev/lopna
npm run build

echo "=== Starting React app container ==="
docker run -d \
  --name lopna-container \
  --network sicep-network \
  -p 8080:80 \
  -v /Users/danielmarcano/dev/lopna/dist:/usr/share/nginx/html \
  nginx:alpine

echo ""
echo "=== Setup complete ==="
echo "React app: http://localhost:8080"
echo "Laravel API: http://localhost:8000"
echo ""
echo "To stop all containers:"
echo "  docker stop lopna-container sicep-api sicep-mariadb"
echo ""
echo "To remove all containers:"
echo "  docker rm lopna-container sicep-api sicep-mariadb"
