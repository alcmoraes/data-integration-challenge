FROM node:carbon

RUN npm i -g pm2 yarn http-server --progress=false --loglevel=error

RUN mkdir -p /var/www

WORKDIR /var/www

COPY . .

EXPOSE 3005 8081 8082
