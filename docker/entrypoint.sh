#!/bin/sh

# Exit on error
set -e

# Wait for database if needed (optional)
# sleep 5

# Run migrations if database is connected
php artisan migrate --force

# Ensure .env exists
if [ ! -f .env ]; then
    cp .env.example .env
fi

# Generate APP_KEY if it's missing or empty
if ! grep -q "APP_KEY=base64:" .env || [ -z "$(grep "APP_KEY=" .env | cut -d '=' -f2)" ]; then
    php artisan key:generate --force
fi

# Ensure SQLite database exists if needed
if [ "$(grep "DB_CONNECTION=" .env | cut -d '=' -f2)" = "sqlite" ]; then
    touch database/database.sqlite
fi

# Cache configuration and routes for production speed
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start supervisor to run both PHP-FPM and Nginx
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
