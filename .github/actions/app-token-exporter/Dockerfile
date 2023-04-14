FROM node:alpine3.17

WORKDIR /app

RUN apk add jq && \
    apk add curl && \
    npm i jsonwebtoken

COPY jwt.js getAccessToken.sh ./

ENTRYPOINT [ "/app/getAccessToken.sh" ]
