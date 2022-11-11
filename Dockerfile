FROM node:16-alpine AS development

WORKDIR /app

COPY package.json /app
COPY yarn.lock /app
COPY src/ /app
RUN yarn install
RUN yarn build

EXPOSE 8080

CMD [ "yarn", "serve", "--host" ]
