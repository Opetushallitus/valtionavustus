FROM node:alpine3.17@sha256:3c63a56bb358fe10657085d47590a0a68ee666db1ed44dfc90462c2288289884

WORKDIR /app

RUN apk add jq && \
    apk add curl && \
    npm i jsonwebtoken

COPY jwt.js getAccessToken.sh ./

ENTRYPOINT [ "/app/getAccessToken.sh" ]
