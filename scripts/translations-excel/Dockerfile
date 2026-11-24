# Builds the hakija translations .xlsx; see translations-to-xlsx.mjs for arguments.
# Self-contained: inputs come in through a volume mount, nothing from the repo is baked in.
FROM node:22-alpine
WORKDIR /app
RUN npm install --no-save --no-audit --no-fund exceljs@4.4.0
COPY translations-to-xlsx.mjs .
ENTRYPOINT ["node", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "/app/translations-to-xlsx.mjs"]
