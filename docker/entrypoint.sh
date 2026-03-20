#!/bin/sh

# Exit on error
set -e

# Wait for database if needed (optional)
# sleep 5

# Run migrations if database is connected
# php artisan migrate --force

# Cache configuration and routes for production speed
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start supervisor to run both PHP-FPM and Nginx
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
