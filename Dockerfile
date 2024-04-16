FROM node:20-alpine AS development

WORKDIR /app

COPY package.json yarn.lock vite.config.mts tsconfig.json /app/
copy src /app/src

RUN yarn install
RUN yarn build

EXPOSE 8080

CMD [ "yarn", "preview", "--host" ]
