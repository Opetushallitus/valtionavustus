# Technical overview

## Technologies

### Backend software

* Clojure with JDK 1.8
* [Leiningen](http://leiningen.org) for [building](../README.md)
* [HTTP Kit](http://www.http-kit.org/) server
* [RING](https://github.com/ring-clojure/ring) middleware
* [Compojure API](https://github.com/metosin/compojure-api) for defining
  API routes, JSON schemas (with validation) and generating swagger
  documentation
* [Flyway](http://flywaydb.org) for automated database data
  initialization and migrations
* Postgresql 9.4 database, with support for **jsonb** type field

### Frontend (browser) software

* [React](https://facebook.github.io/react) JSX components for rendering
  HTML in clientside
* [Bacon.js](https://baconjs.github.io/) For handling client side state
  changes and initiating rerendering of React components
* [Babel](https://babeljs.io) For ES6 javascript support
* [Node.js](https://nodejs.org) For [building](../README.md) JavaScript
  source and npm packages with [webpack](https://webpack.js.org/)

### Documentation tools

* [yEd](https://www.yworks.com/products/yed) for editing graphs
* [IntelliJ IDEA](https://www.jetbrains.com/idea/) for creating database
  diagrams

## Architecture

Valtionavustus application is deployed into CSC VMware environment.
Environment provisioning is done with [Ansible
scripts](../servers/README.md).

Software is deployed as jar. Jar is built and deployed by [Jenkins CI
server](https://dev.valtionavustukset.oph.fi/), which also runs in
VMware environment.

Environment specific application configurations are in
[va-hakija/config](../va-hakija/config/) and
[va-virkailija/config](../va-virkailija/config/)

### Server and network architecture

![Server architecture](https://rawgit.com/Opetushallitus/valtionavustus/f1de261192b0094a19f28054f955147416d25371/doc/deployment.svg)

### General architecture

General architecture including integrations and data flows (from
originator towards receiver) is described in picture below.

![General architecture](https://rawgit.com/Opetushallitus/valtionavustus/f1de261192b0094a19f28054f955147416d25371/doc/architecture.svg)

### Data flow

Data flow of application (in Finnish, because all terms are in Finnish):

![Data flow](https://rawgit.com/Opetushallitus/valtionavustus/f1de261192b0094a19f28054f955147416d25371/doc/data-flow.svg)

### Application architecture

Valtionavustus application is divided to following major parts:

* [soresu-form](https://github.com/Opetushallitus/soresu-form), which is
  the generic form library (including both React client UI and Clojure
  server code),
* [va-common](../va-common/), which contains the React client UI and
  Clojure server code shared between the applications,
* [va-virkailija](../va-virkailija/), which contains React
  client UI and Clojure server for handling the scoring and processing
  the applications, and
* [va-hakija](../va-hakija/), which has React client UI and Clojure
  server for submitting the applications and showing the forms

Internal structure of application architecture:

![Internal architecture](https://rawgit.com/Opetushallitus/valtionavustus/f1de261192b0094a19f28054f955147416d25371/doc/internal-architecture.svg)

## API documentation

For va-hakija, the API documentation can be viewed via
[Swagger](https://valtionavustukset.oph.fi/doc).

va-virkailija
[Swagger](https://virkailija.valtionavustukset.oph.fi/doc) requires
signing in with correct account.

## Database schemas

Database is structured as a hybrid of relational database (tabular data
and relations) and document database (containing JSON data). The
document store uses **jsonb** fields storing structured JSON documents
within normal relational tables.

All data is modified transactionally.

Most of the tables have either a sequential id, or composite key formed
using sequential id and version and possibly foreign key references to
other tables using the id-version pairs. The currently valid version has
**version_closed** timestamp with value **NULL**.

Versioning is supported for for several tables, most notably
**form_submissions** and **attachments**. Versioning uses sequential id
with running version index to create unique primary key.

There's also more limited form of versioning in use, called
**archiving**. This is used for **forms** and **avustushaut**. In this
case the table in question doesn't have versioning machinery, but old
data is copied to separate archive-table.

### Schema migrations

There are two kinds of Flyway migrations in use:

* SQL migration, which are typically located under
  *resources/db/migrations/*, and
* Code migrations which are located inside the codebase, typically under
  *src/../migrations.clj*

Migrations are automatically performed on server startup for both
virkailija and hakija apps, and are forward-only.

### hakija database

![hakija schema](https://rawgit.com/Opetushallitus/valtionavustus/f1de261192b0094a19f28054f955147416d25371/doc/hakija.svg)

### virkailija database

![virkailija schema](https://rawgit.com/Opetushallitus/valtionavustus/f1de261192b0094a19f28054f955147416d25371/doc/virkailija.svg)

## Localization

* [Common form elements](../va-common/resources/public/translations.json)
* [Virkailija email templates](../va-virkailija/resources/email-templates/)
* [Virkailija titles](../va-virkailija/src/oph/va/virkailija/email.clj)
* [Hakija email templates](../va-hakija/resources/email-templates/)
* [Hakija titles](../va-hakija/src/oph/va/hakija/email.clj)
* [Rejected reasons](../va-virkailija/web/va/hakemus-details/rejectedReasonsByLanguage.json)
