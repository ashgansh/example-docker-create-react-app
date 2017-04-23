# Image Base
FROM node:alpine

# Dependencies
COPY ./package.json /app/package.json
WORKDIR /app
RUN npm install
