FROM java:8
COPY ./hakija-0.1.0-SNAPSHOT-standalone.jar /usr/local/va-hakija/hakija-latest.jar
COPY ./config/defaults.edn /usr/local/va-hakija/config/defaults.edn
COPY ./config/dev.edn /usr/local/va-hakija/config/dev.edn
COPY ./config/config.edn /usr/local/va-hakija/config/config.edn
WORKDIR /usr/local/va-hakija
CMD ["java", "-jar", "hakija-latest.jar"]
