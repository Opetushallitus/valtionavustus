#
# Builder for frontend JS
#
FROM node:16.20.2-alpine AS web-builder
ARG REVISION

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

RUN mkdir -p server/resources/public/hakija/
RUN mkdir -p server/resources/public/virkailija/

COPY soresu-form/web/ soresu-form/web/
COPY va-virkailija/web/ va-virkailija/web/
COPY server/resources/public/translations.json server/resources/public/translations.json
COPY va-hakija/web/ va-hakija/web/
COPY webpack.config.js .
COPY common-tsconfig.json tsconfig.json ./
COPY .babelrc .

# add git version ID. Fail if missing
RUN test -n "${REVISION}"
RUN echo ${REVISION} > server/resources/public/version.txt

RUN npm run build-production


#
# va-base with all the Clojure stuff
#
FROM eclipse-temurin:8u402-b06-jdk-jammy AS va-base

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

RUN ./lein compile :all

COPY server/config/ ./server/config/
COPY va-hakija/config/ ./va-hakija/config/

COPY --from=web-builder /app/server/resources/public/hakija/js/ server/resources/public/hakija/js/
COPY --from=web-builder /app/server/resources/public/virkailija/js/ server/resources/public/virkailija/js/
COPY --from=web-builder /app/server/resources/public/version.txt server/resources/public/version.txt

#
# uberjar builder
#
FROM va-base AS uberjar-builder
RUN ./lein uberjar


#
# va-uberjar (only contains the built jar for easy extraction)
#
FROM scratch AS va-uberjar
ARG UBERJAR_NAME
COPY --from=uberjar-builder \
  /app/target/uberjar/valtionavustus-0.1.0-SNAPSHOT-standalone.jar \
  /${UBERJAR_NAME}

#
# va-server
#
FROM va-base
LABEL org.opencontainers.image.source=https://github.com/opetushallitus/valtionavustus
ENTRYPOINT ["./lein"]
