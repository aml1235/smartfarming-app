#!/bin/bash
set -e

cd /var/www/smartfarming

# Generate app key if not set
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

# Run migrations
php artisan migrate --force

# Run seeders (only if needed)
php artisan db:seed --class=UpdateSectorsMqttConfig --force 2>/dev/null || true

# Clear and cache config for production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Update Nginx listen port if PORT environment variable is set by Railway
if [ -n "$PORT" ]; then
    sed -i "s/listen 8080;/listen ${PORT};/g" /etc/nginx/sites-available/default
fi

# Create PHP-FPM run directory
mkdir -p /run/php

# Start all services via supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
