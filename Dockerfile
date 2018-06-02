FROM node:carbon

RUN npm i -g pm2 nyc http-server

RUN mkdir -p /var/www

WORKDIR /var/www

COPY . .

RUN npm i

CMD ["npm", "run", "start"]

EXPOSE 3005 8081 8082
