#!/bin/bash
php artisan config:clear
php artisan migrate --force

# Jalankan kedua pendengar MQTT di background
php artisan mqtt:listen &
php artisan mqtt:listen --broker=coop &

# Jalankan web server di foreground agar container tetap hidup
php artisan serve --host=0.0.0.0 --port=$PORT
