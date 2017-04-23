# Using docker for SPA deployment & development

Nowadays it’s become quite popular to automate and provision projects using Docker. But one of the things
that hasn’t been detailed in much depth is how this applies to modern day SPAs.
The following describes a solution to how we can achieve both deployment & development using Docker.
_Note: for this example, I’ll use [create-react-app](https://github.com/facebookincubator/create-react-app)_

## The Problem
You’re currently building a node app that will generate some static content that needs to be served.
With many variables being at play during the deployment of new applications it is often asked for a reproducible
version of your code. One of the ways to minimize those errors is to containerize your applications. Using Docker
you can have a more predictable deployment.
But it doesn’t come with its own questions:
* How should I structure my dockerfile?
* How do I serve my files?

## The Solution
### Initial Attempt
One of the ways of solving this issue would be to create a Dockerfile that builds your static assets
and have nginx to serve it.
`Dockerfile`
```
FROM ubuntu
RUN apt update
RUN apt install nodejs
RUN apt install nginx
COPY ./src/app /app
WORKDIR /app
RUN npm install
RUN npm run build
COPY ./nginx.conf /etc/nginx/sites-enabled/default
CMD nginx
```
Now you could run this in production using:
`docker run -d -p <host_port>:<internal_port> <image_name>`
Or in development:
`docker run -d -p <host_port>:<internal_port> <image_name> npm start`
But this has several flaws:
* Your container has multiple concern: It’s considered best practice to have docker containers only do one thing
* You only account for the production environment. You’re not reusing the same environment when you do your local developing.
* If you change anything inside of `./src` `npm install` will execute again because it will not be cached.

## Second Attempt
Let’s give it an another try and address some of the issues mentioned above:
`Dockerfile`
```
# Image Base
FROM node:alpine
# Dependencies
COPY ./package.json /app/package.json
WORKDIR /app
RUN npm install
# Compiling Javascript
COPY ./ /app
RUN npm run build
# Exposing the assets
VOLUME /app/build
```
Let’s break it down
#### Image Base
```
FROM node:alpine
```
Here we’re able to use `node` instead of `ubuntu` as the base image. This is possible because
we’ve separated the concerns of building and serving the files.
#### Dependencies
```
COPY ./package.json /app/package.json
WORKDIR /app
RUN npm install
```
We’re only copying the `package.json` on the image before running `npm install` ensuring that we
will execute `npm install` only if something has changed in `package.json`.
#### Compiling Javascript
```
COPY ./ /app
RUN npm run build
```
Here we’re copying our code and initiating the build command to compile the assets.
#### Exposing the assets
```
VOLUME /app/build
```
This command is executed to expose a docker volume so it can be reused by other containers. You’ll shortly
be able to understand how this works.
## The Server
So now that we’re capable of generating a build how do we serve it?
Just generate a volume container:
`docker run — name build -v /app/build <image_name>`
And then serve it using nginx:
`docker run -it -v -p <port_number>:80 $PWD/nginx.conf:/etc/nginx.conf — volumes-from build nginx:alpine`
I won’t go into detail about what’s going on in the nginx.conf but it’s just a
proxy to avoid CORS issues.
## I thought you said SPA for deployment & development
Well let’s get to it
`Dockerfile.dev`
```
# Image Base
FROM node:alpine
# Dependencies
COPY ./package.json /app/package.json
WORKDIR /app
RUN npm install
# Compiling Javascript
COPY ./ /app
```
After this, you could just run
`docker run -it -p -v $PWD:/app -p 3000:3000 project-dev npm start`
But did you notice how this is just the first line of the file?
Let’s try to make it DRYer. First, we’re going to create a base image.
```
# Image Base
FROM node:alpine
# Dependencies
COPY ./package.json /app/package.json
WORKDIR /app
RUN npm install
```
And then we can reuse them
`Dockerfile.prod`
```
FROM project-base
# Compiling Javascript
COPY ./ /app
RUN npm run build
VOLUME /app/build
```
In this case, if you’d want to develop you could use:
`docker run -it -p -v $PWD:/app -p 3000:3000 project-base npm start`
Or for production, as before:
```
docker run —-name project-build -v /app/build project-build
docker run -it -v -p <port_number>:80 $PWD/nginx.conf:/etc/nginx.conf — volumes-from build nginx:alpine
```
And with this we’re done!

## Running this example
### What this project does
The expected baseline of this project is to proxy `/` to a `swapi.co` endpoint. So if you did a
```
npm install
npm start
```
And opened to the console you should see that we've fetched an json object.

```
docker build -t project-base .
docker build -t project-build .

# If you want to serve the production build``
docker run —-name project-build -v /app/build project-build
docker run -it -v -p <port_number>:80 $PWD/nginx.conf:/etc/nginx.conf — volumes-from build nginx:alpine

# If you want to develop
`docker run -it -p -v $PWD:/app -p 3000:3000 project-base npm start`
```
## Notes & Remarks
You can see that I used the `alpine` image base for both nginx and node.
It’s just a lightweight image base, you can learn more about it_ [here](https://hub.docker.com/_/alpine/)
If you have any questions or remarks don’t hesitate to leave a comment! story…t's just a lightweight image base, you can learn more about it_ [here](https://hub.docker.com/_/alpine/)
