FROM java:8
COPY ./virkailija-0.1.0-SNAPSHOT-standalone.jar /usr/local/va-virkailija/virkailija-latest.jar
COPY ./config/secret-va-dev.edn /usr/local/va-virkailija/config/secret-va-dev.edn
COPY ./config/defaults.edn /usr/local/va-virkailija/config/defaults.edn
COPY ./config/dev.edn /usr/local/va-virkailija/config/dev.edn
COPY ./config/config_ssh /root/.ssh/config
RUN touch /root/.ssh/config
WORKDIR /usr/local/va-virkailija
CMD ["java", "-jar", "virkailija-latest.jar"]
