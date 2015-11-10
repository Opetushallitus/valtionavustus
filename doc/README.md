Technical documentation
=======================

  * [Technologies](#technologies)
    * [Server software](#server-software)
    * [Client (Browser) software](#client-browser-software)
    * [Deployment environment](#deployment-environment)
  * [Software architecture](#software-architecture)
  * [API documentation](#api-documentation)
  * [Database schemas](#database-schemas)
    * [hakija database](#hakija-database)
    * [virkailija database](#virkailija-database)
      
## Technologies

### Server software

* Clojure with JDK 1.8
* [Leiningen](http://leiningen.org) for [building](../README.md)
* [HTTP Kit](http://www.http-kit.org/) server
* [RING](https://github.com/ring-clojure/ring) middleware
* [Compojure API](https://github.com/metosin/compojure-api) for defining API routes, JSON schemas (with validation) and generating swagger documentation
* [Flyway](http://flywaydb.org) for automated database data initialization and migrations 
* Postgresql 9.4 database

### Client (Browser) software

* [React](https://facebook.github.io/react) JSX components for rendering HTML in clientside
* [Bacon.js](https://baconjs.github.io/) For handling client side state changes and initiating rerendering of React components
* [Babel](https://babeljs.io) For ES6 javascript support
* [Node.js](https://nodejs.org) For [building](../README.md) JS packages with [Browserify](http://browserify.org)

### Deployment environment

Valtionavustus application is deployed into CSC Pouta OpenStack environment.
Environment provisioning is done with [Ansible scripts](../pouta-env/README.md).

Software is deployed as jar.
Jar is built and deployed by [Jenkins CI server](https://dev.valtionavustukset.oph.fi/), which also runs in Pouta environment.

Environment specific application configurations are in [va-hakija/config](../va-hakija/config/) and [va-virkailija/config](../va-virkailija/config/)

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
