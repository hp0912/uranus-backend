FROM node:14.7.0-alpine

RUN rm -rf /app && mkdir /app
WORKDIR /app
COPY . /app

RUN npm config set registry https://registry.npm.taobao.org && yarn --ignore-optional --frozen-lockfile --check-files && yarn cache clean

RUN yarn build

CMD ["yarn", "start-server"]