FROM node:lts-alpine

WORKDIR /usr/src/app

COPY ./out ./

CMD ["node", "index.js"]
