FROM node:20.12.2-alpine3.18

WORKDIR /app

COPY code/package*.json ./

RUN npm install

COPY code .
EXPOSE 8080
CMD [ "node", "index.js" ]