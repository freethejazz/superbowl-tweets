FROM node:5.5.0

RUN mkdir -p /usr/src/app && mkdir -p /etc/simple-consumer
WORKDIR /usr/src/app

COPY start.sh /usr/src/app
COPY package.json /usr/src/app
RUN npm install

COPY config.json /etc/simple-consumer
COPY app.js /usr/src/app

CMD [ "/usr/src/app/start.sh", "npm", "start" ]
