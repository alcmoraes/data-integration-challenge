FROM node:wheezy

RUN npm i -g pm2 yarn http-server --progress=false --loglevel=error

RUN mkdir -p /var/www

WORKDIR /var/www

COPY . .

COPY docker/run.sh /tmp/run.sh

RUN yarn

RUN chmod +x /tmp/run.sh

CMD ["bash", "/tmp/run.sh"]

EXPOSE 3005 8081 8082
