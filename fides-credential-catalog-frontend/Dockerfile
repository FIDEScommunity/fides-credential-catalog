# Step 1
FROM node:22-alpine AS build-step
RUN apk add --update python3 make g++ && rm -rf /var/cache/apk/*
RUN mkdir /app
WORKDIR /app
COPY package.json /app
RUN node --version
RUN npm --version
#RUN python3 --version
#RUN npm config set strict-ssl false
RUN npm install
COPY . /app
RUN npm run build

# Stage 2
FROM nginx:1.27.2-alpine
RUN rm -rf /etc/nginx/conf.d
COPY docker /etc/nginx

COPY --from=build-step /app/build /usr/share/nginx/html
