web: php artisan config:clear && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=$PORT
worker: php artisan mqtt:listen
coop: php artisan mqtt:listen --broker=coop
