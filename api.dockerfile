FROM node:13-alpine
RUN mkdir /api
COPY ./api /api
WORKDIR /api
RUN npm install
RUN npm audit fix