FROM php:8.2-cli

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    git \
    libpq-dev \
    libonig-dev \
    libzip-dev \
    default-mysql-client \
    && docker-php-ext-install sockets pdo_mysql

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

COPY . .

EXPOSE 8000
CMD ["php", "-S", "0.0.0.0:8000", "index.php"]
