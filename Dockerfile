FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Jakarta

# Install base dependencies
RUN apt-get update && apt-get install -y \
    software-properties-common \
    curl \
    unzip \
    git \
    supervisor \
    nginx \
    gnupg2 \
    ca-certificates \
    lsb-release \
    apt-transport-https

# Add PHP PPA
RUN add-apt-repository ppa:ondrej/php -y && apt-get update

# Install PHP packages
RUN apt-get install -y \
    php8.3-fpm \
    php8.3-pgsql \
    php8.3-mbstring \
    php8.3-xml \
    php8.3-curl \
    php8.3-zip \
    php8.3-bcmath \
    php8.3-tokenizer \
    php8.3-ctype \
    php8.3-fileinfo \
    php8.3-cli \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Working directory
WORKDIR /var/www/smartfarming

# Copy project files
COPY . .

# Install PHP dependencies (production only)
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Build React frontend
RUN cd frontend && npm ci && npm run build

# Copy React build to a static directory
RUN mkdir -p /var/www/html/frontend \
    && cp -r frontend/dist/. /var/www/html/frontend/

# Laravel permissions
RUN chown -R www-data:www-data /var/www/smartfarming/storage \
                                /var/www/smartfarming/bootstrap/cache \
    && chmod -R 775 /var/www/smartfarming/storage \
                    /var/www/smartfarming/bootstrap/cache

# Copy configs
COPY docker/nginx.conf /etc/nginx/sites-available/default
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

CMD ["/entrypoint.sh"]
