# Technical documentation

## Technologies

### Deployment environment

Valtionavustus application is deployed into CSC Pouta OpenStack environment
Environement Ppovisioning is done with [Ansible scripts](../pouta-env/README.md)

Software is deployed as jar.
Jar is built and deployed by [Jenkins server](https://dev.valtionavustukset.oph.fi/), which runs as separate server in Pouta.

## Software architecture

General architecture including integrations and data flows (from originator towards receiver) is described in picture below.

![General architecture](architecture.png)

## API documentation

For Hakija app, the API documentation can be viewed via [Swagger](https://valtionavustukset.oph.fi/doc)

Virkailija app [Swagger](https://virkailija.valtionavustukset.oph.fi/doc) requires signing in with correct account.

## Database schemas

### hakija database

![hakija schema](hakija.png)

### virkailija database

![virkailija schema](virkailija.png)
