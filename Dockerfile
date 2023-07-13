FROM node:alpine

COPY . .

RUN npm i

EXPOSE 8080

CMD ["npm","start"]