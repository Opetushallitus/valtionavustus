Technical documentation
=======================

  * [Technologies](#technologies)
    * [Server software](#server-software)
    * [Client (Browser) software](#client-browser-software)
  * [Architecture](#architecture)
    * [Production environment](#production-environment)
    * [Server &amp; Network architecture](#server--network-architecture)
    * [General architecture](#general-architecture)
    * [Data flow](#data-flow)
    * [Application architecture](#application-architecture)
  * [API documentation](#api-documentation)
  * [Database schemas](#database-schemas)
    * [Schema migrations](#schema-migrations)
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
* Postgresql 9.4 database, with support for **jsonb** type field

### Client (Browser) software

* [React](https://facebook.github.io/react) JSX components for rendering HTML in clientside
* [Bacon.js](https://baconjs.github.io/) For handling client side state changes and initiating rerendering of React components
* [Babel](https://babeljs.io) For ES6 javascript support
* [Node.js](https://nodejs.org) For [building](../README.md) JS packages with [Browserify](http://browserify.org)

### In documentation
* [Grip](https://github.com/joeyespo/grip) GitHub Readme Instant Preview for previewing markdown documents
* [yEd](https://www.yworks.com/products/yed) for editing graphs

## Architecture

Valtionavustus application is deployed into CSC Pouta OpenStack environment.
Environment provisioning is done with [Ansible scripts](../servers/README.md).

Software is deployed as jar.
Jar is built and deployed by [Jenkins CI server](https://dev.valtionavustukset.oph.fi/), which also runs in Pouta environment.

Environment specific application configurations are in [va-hakija/config](../va-hakija/config/) and [va-virkailija/config](../va-virkailija/config/)

### Current Server & Network architecture (14.1.2016)

Servers used in test and production environment:

![Server architecture (14.1.2016)](https://rawgit.com/Opetushallitus/valtionavustus/master/doc/deployment.svg)

### Desired Server & Network architecture (14.1.2016)

![Desired production setup (14.1.2016)](https://rawgit.com/Opetushallitus/valtionavustus/master/doc/production-with-build.svg)

### General architecture
General architecture including integrations and data flows (from originator towards receiver) is described in picture below.

![General architecture](https://rawgit.com/Opetushallitus/valtionavustus/master/doc/architecture.svg)

### Data flow

Data flow of application (in Finnish, because all terms are in Finnish):
![Data flow](https://rawgit.com/Opetushallitus/valtionavustus/master/doc/data-flow.svg)

### Application architecture

Valtionavustus application is divided to following major parts:

* [Soresu Form](https://github.com/Opetushallitus/soresu-form), which is the generic form library (including both React client
  UI and Clojure server code),
* [VA common](../va-common/), which contains the React client UI and Clojure server code shared between the
  applications,
* [Virkailija application](../va-virkailija/), which contains React client UI and Clojure server for
  handling the scoring and processing the applications, and
* [Hakija application](../va-hakija/), which has React client UI and Clojure server for
  accepting the applications and showing the forms

Internal structure of application architecture

![Internal architecture](https://rawgit.com/Opetushallitus/valtionavustus/master/doc/internal-architecture.svg)

## API documentation

For Hakija app, the API documentation can be viewed via [Swagger](https://valtionavustukset.oph.fi/doc)

Virkailija app [Swagger](https://virkailija.valtionavustukset.oph.fi/doc) requires signing in with correct account.

## Database schemas

Database is structured as a hybrid of relational database (tabular data and
relations) and document database (containing JSON data). The document store
uses **jsonb** fields storing structured JSON documents within normal
relational tables.

All data is modified transactionally.

Most of the tables have either a sequential id, or composite key formed using
sequential id and version and possibly foreign key references to other tables
using the id-version pairs. The currently valid version has **version_closed**
timestamp with value **NULL**.

Versioning is supported for for several tables, most notably
**form_submissions** and **attachments**. Versioning uses sequential id with
running version index to create unique primary key.

There's also more limited form of versioning in use, called **archiving**. This
is used for **forms** and **avustushaut**. In this case the table in question doesn't have versioning
machinery, but old data is copied to separate archive-table.

### Schema migrations

There are two kinds of Flyway migrations in use:

* SQL migration, which are typically located under *resources/db/migrations/*,
  and
* Code migrations which are located inside the codebase, typically under
  *src/../migrations.clj*

Migrations are automatically performed on server startup for both virkailija
and hakija apps, and are forward-only.

### hakija database

![hakija schema](https://rawgit.com/Opetushallitus/valtionavustus/master/doc/hakija.svg)

### virkailija database

![virkailija schema](https://rawgit.com/Opetushallitus/valtionavustus/master/doc/virkailija.svg)
