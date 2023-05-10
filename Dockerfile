FROM node:20.1-alpine3.17 AS web-builder

WORKDIR /app
COPY package.json package-lock.json .
RUN npm ci

RUN mkdir -p server/resources/public/hakija/
RUN mkdir -p server/resources/public/virkailija/

COPY soresu-form/web/ soresu-form/web/
COPY va-virkailija/web/ va-virkailija/web/
COPY server/resources/public/translations.json server/resources/public/translations.json
COPY va-hakija/web/ va-hakija/web/
COPY webpack.config.js .
COPY common-tsconfig.json tsconfig.json .
COPY .babelrc .

RUN npm run build-production


FROM eclipse-temurin:8u372-b07-jdk-jammy
LABEL org.opencontainers.image.source=https://github.com/opetushallitus/valtionavustus

WORKDIR /app

# lein downloads itself on first run, so prime it here
COPY lein .
RUN ./lein

# fetch dependencies
COPY project.clj .
RUN ./lein deps

# add project code
COPY server/src/ ./server/src/
COPY server/resources/ ./server/resources/

# add spec files
COPY server/spec/ ./server/spec/
COPY server/test-resources/ ./server/test-resources/

RUN ./lein compile

COPY server/config/ ./server/config/
COPY va-hakija/config/ ./va-hakija/config/
COPY va-virkailija/config/ ./va-virkailija/config/

COPY --from=web-builder /app/server/resources/public/hakija/js/ server/resources/public/hakija/js/
COPY --from=web-builder /app/server/resources/public/virkailija/js/ server/resources/public/virkailija/js/
ENTRYPOINT ["./lein"]