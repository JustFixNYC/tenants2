[![CircleCI](https://circleci.com/gh/JustFixNYC/tenants2.svg?style=svg)](https://circleci.com/gh/JustFixNYC/tenants2)
[![Maintainability](https://api.codeclimate.com/v1/badges/de475123649c132f858b/maintainability)](https://codeclimate.com/github/JustFixNYC/tenants2/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/de475123649c132f858b/test_coverage)](https://codeclimate.com/github/JustFixNYC/tenants2/test_coverage)

This is the JustFix.nyc Tenant Platform.

In addition to this README, please feel free to consult the
[project wiki][], which contains details on the project's
principles and architecture, development tips, and more.

[project wiki]: https://github.com/JustFixNYC/tenants2/wiki

## Getting started

**Note**: It's highly recommended you follow the
[Developing with Docker](#developing-with-docker) instructions, as it
makes development much easier. But if you'd really rather set
everything up without Docker, read on!

You'll need Python 3.8.2 and [pipenv][], as well as Node 12, yarn, and
[Git Large File Storage (LFS)][git-lfs]. You will also need to
set up Postgres version 10 or later.

If you didn't have Git LFS installed before cloning the repository,
you can obtain the repository's large files by running `git lfs pull`.

First create an environment file and optionally edit it as you
see fit:

```
cp .justfix-env.sample .justfix-env
```

Since you're not using Docker, you will want to set `DATABASE_URL`
to your Postgres instance, using the [Database URL schema][].

Then set up the front-end and configure it to
continuously re-build itself as you change the source code:

```
yarn
yarn start
```

Then, in a separate terminal, you'll want to instantiate
your Python virtual environment and enter it:

```
pipenv install --dev --python 3.8
pipenv shell
```

(Note that if you're on Windows and have `bash`, you
might want to run `pipenv run bash` instead of
`pipenv shell`, to avoid a bug whereby command-line
history doesn't work with `cmd.exe`.)

Then start the app:

```
python manage.py migrate
python manage.py runserver
```

Then visit http://localhost:8000/ in your browser.

[Database URL schema]: https://github.com/kennethreitz/dj-database-url#url-schema

### Creating an Admin User

You'll want to create an admin user account to access the App's "Admin Site." Django has this functionality preset, so just navigate to the root directory and use the Django command for creating a super user:

```
python manage.py createsuperuser
```

The following prompts on your terminal window will set up the account for you. Once created, visit http://localhost:8000/admin and log in with your new credentials to access the Admin Site.


### Production dependencies

Some of this project's dependencies are cumbersome
to install on some platforms, so they're not installed
by default.

However, they are present in the Docker development
environment (described below), and they are
required to develop some functionality, as well as
for production deployment. They can be installed via:

```
pipenv run pip install -r requirements.production.txt
```

These dependencies are described below.

#### WeasyPrint

[WeasyPrint][] is used for PDF generation. If it's
not installed during development, then any PDF-related
functionality will fail.

Instructions for installing it can be found on the
[WeasyPrint installation docs][].

[WeasyPrint]: http://weasyprint.org/
[WeasyPrint installation docs]: https://weasyprint.readthedocs.io/en/latest/install.html

## Running tests

To run the back-end Python/Django tests, use:

```
pytest
```

To run the front-end Node/TypeScript tests, use:

```
yarn test
```

You can also use `yarn test:watch` to have Jest
continuously watch the front-end tests for changes and
re-run them as needed.

## Prettier

We use [Prettier][] to automatically format some of our non-Python code.
Before committing or pushing to GitHub, you may want to run the following
to ensure that any files you've changed are properly formatted:

```
yarn prettier:fix
```

Note that if you don't either use this or some kind of editor plug-in
before pushing to GitHub, continuous integration will fail.

[Prettier]: https://prettier.io

## Black

[Black][] is a formatting tool similar to Prettier, but for Python code.

Before committing or pushing to GitHub, you may want to run the following
to ensure that any files you've changed are properly formatted:

```
black .
```

Note that if you don't either use this or some kind of editor plug-in
before pushing to GitHub, continuous integration will fail.

[Black]: https://black.readthedocs.io/

## Environment variables

For help on environment variables related to the
Django app, run:

```
python manage.py envhelp
```

Alternatively, you can examine
[project/justfix_environment.py](project/justfix_environment.py).

For the Node front-end:

* `NODE_ENV`, can be set to `production` for production or any
  other value for development.
* See [frontend/webpack/webpack-defined-globals.d.ts](frontend/webpack/webpack-defined-globals.d.ts) for more values.

## Common data

Some data that is shared between the front-end and back-end is
in the [`common-data/`](common-data/) directory.  The
back-end generally reads this data in JSON format, while the
front-end reads a TypeScript file that is generated from
the JSON.

A utility called `commondatabuilder` is used to generate the
TypeScript file. To execute it, run:

```
node commondatabuilder.js
```

You will need to run this whenever you make any changes to
the underlying JSON files.

If you need to add a new common data file, see
[`common-data/config.ts`](common-data/config.ts), which
defines how the conversion from JSON to TypeScript occurs.

## GraphQL

The communication between server and client occurs via [GraphQL][]
and has been structured for type safety. This means that we'll
get notified if there's ever a mismatch between the server's
schema and the queries the client is generating.

[GraphQL]: https://graphql.org/

### Interactive environment (GraphiQL)

To manually experiment with GraphQL queries, use the interactive in-browser
environment called **GraphiQL**, which is built-in to the development
server.  It can be accessed via the "Developer" menu at the top-right of
almost any page on the site, or directly at `http://localhost:8000/graphiql`.

### Server-side GraphQL schema

The server uses [Graphene-Django][] for its GraphQL needs. It also
uses a custom "schema registry" to make it easier to define new
fields and mutations on the schema; see
[`project/schema_registry.py`](project/schema_registry.py) for
documentation on how to use it.

The JSON representation of the schema is in `schema.json` and
is automatically regenerated by the development server,
though developers can manually regenerate it via
`python manage.py graphql_schema` if needed.

[Graphene-Django]: http://docs.graphene-python.org/projects/django/en/latest/

### Client-side GraphQL queries

Client-side GraphQL code is generated as follows:

1. Raw queries are in `frontend/lib/queries/` and given a `.graphql`
   extension.  Currently, they must consist of **one** query,
   mutation, or fragment that has the same name as the base name of the file.
   For instance, if the file is called `SimpleQuery.graphql`,
   then the contained query should be called `SimpleQuery`, e.g.:

    ```graphql
    query SimpleQuery($thing: String) {
        hello(thing: $thing)
    }
    ```

2. Some GraphQL queries are automatically generated based on
   the configuration in
   [`frontend/lib/queries/autogen-config.toml`](frontend/lib/queries/autogen-config.toml).

3. The querybuilder, which runs as part of `yarn start`, will notice
   changes to any of these raw queries *or* `autogen-config.toml`
   *or* the server's `schema.json`, and do the following:

    1. It automatically generates any GraphQL queries that need
       generating.

    2. It runs [Apollo Code Generation][] to validate the raw queries
       against the server's GraphQL schema and create TypeScript
       interfaces for them.

    3. For queries and mutations, it adds a function to the TypeScript
       interfaces that is responsible for performing the query in a
       type-safe way.
       
    4. The resultant TypeScript interfaces and/or function is written
       to a file that is created next to the original `.graphql` file
       (e.g., `SimpleQuery.ts`).

    If the developer prefers not to rely on `yarn start`
    to automatically rebuild queries for them, they can also manually
    run `node querybuilder.js`.

At this point the developer can import the final TS file and use the query.

[Apollo Code Generation]: https://github.com/apollographql/apollo-cli#code-generation

## Developing with Docker

You can alternatively develop the app via [Docker][], which
means you don't have to install any dependencies. However,
Docker takes a bit of time to learn how to use.

As with the non-Docker setup, you'll first want to create an environment
file and optionally edit it as you see fit:

```
cp .justfix-env.sample .justfix-env
```

Then, to set everything up, run:

```
bash docker-update.sh
```

Then run:

```
docker-compose up
```

This will start up all services and you can visit
http://localhost:8000/ to visit the app.

[Docker]: https://docs.docker.com/install/

### Updating the containers

Whenever you update your repository via e.g. `git pull` or
`git checkout`, you should update your containers by running:

```
bash docker-update.sh
```

### Starting over

If your Docker setup appears to be in an irredeemable state
and `bash docker-update.sh` doesn't fix it--or
if you just want to free up extra disk space used up by
the app--you can destroy everything by running:

```
docker-compose down -v
```

Note that this may delete all the data in your
instance's database.

At this point you can re-run `bash docker-update.sh` to set
everything up again.

### Accessing the app container

To access the app container, run:

```sh
docker-compose run app bash
```

This will run an interactive bash session inside the main app container.
In this container, the `/tenants2` directory is mapped to the root of
the repository on your host; you can run any command, like `python manage.py`
or `pytest`, from there. Specifically, within this bash session is where you can [create an Admin User](#creating-an-admin-user) to access the App's Admin Site. 


## Changing the Dockerfile

Development, production, and our continuous integration
pipeline ([CircleCI][]) use a built image from the
`Dockerfile` on Docker Hub as their base to ensure
[dev/prod parity][].

Changes to `Dockerfile` should be pretty infrequent, as
they define the lowest level of our application's software
stack, such as its Linux distribution. However, changes
do occasionally need to be made.

Whenever you change the `Dockerfile`, you will need to
push the new version to Docker Hub and change the
tag in a few files to correspond to the new version you've pushed.

To push your new version, you will need to:

1. Come up with a unique tag name; preferably one that isn't
   [already taken][].  (While you can use an existing one, it's
   recommended that you create a new one so that other pull
   requests using the existing one don't break.)

   For the rest of these instructions we'll assume your new
   tag is called `0.1`.

2. Run `docker build -t justfixnyc/tenants2_base:0.1 .`
   to build the new image.

3. Run `docker push justfixnyc/tenants2_base:0.1` to
   push the new image to Docker Hub.

4. In `Dockerfile.web`, `docker-services.yml`, `.circleci/config.yml`,
   and `.devcontainer/Dockerfile`, edit the references to
   `justfixnyc/tenants2_base` to point to the new tag.

[CircleCI]: https://circleci.com/
[already taken]: https://hub.docker.com/r/justfixnyc/tenants2_base/tags/

## Deployment

The app uses the [twelve-factor methodology][], so
deploying it should be relatively straightforward.

At the time of this writing, however, the app's
runtime environment does need *both* Python and Node
to execute properly, which could complicate matters.

A Python 3 script, `deploy.py`, is located in the
repository's root directory and can assist with
deployment. It has no dependencies other than
Python 3.

### Deploying to Heroku via Docker

It's possible to deploy to Heroku using their
[Container Registry and Runtime][].  To build
and push the container to their registry, run:

```
python3 deploy.py heroku
```

You'll likely want to use [Heroku Postgres][] as your
ndatabase backend.

## Internationalization

This project uses the [PO file format][] to store most of its
localization data in the [`locales`](locales/) directory.

[PO file format]: https://www.gnu.org/software/gettext/manual/html_node/PO-Files.html

### Back-end internationalization

The back-end uses the [Django translation framework][] for internationalization.
To extract messages for localization, run:

```
yarn django:makemessages
```

One `.po` files have been updated, the catalogs can be compiled with:

```
yarn django:compilemessages
```

[Django translation framework]: https://docs.djangoproject.com/en/3.0/topics/i18n/translation/

### Front-end internationalization

The front-end uses [Lingui][] for internationalization. To extract
messages for localization, run:

```
yarn lingui:extract
```

Once `.po` files have been updated, the catalogs can be compiled to JS
with:

```
yarn lingui:compile
```

[Lingui]: https://lingui.js.org/

## Optional integrations

The codebase has a number of optional integations with third-party services
and data sources. Run `python manage.py envhelp` for a listing of all
environment variables related to them.

### NYCHA offices

You can load all the NYCHA offices into the database via:

```
python manage.py loadnycha nycha/data/Block-and-Lot-Guide-08272018.csv
```

Once imported, any users from NYCHA who file a letter of complaint will
automatically have their landlord address populated.

Note that the CSV loaded by this command was originally generated by
the [JustFixNYC/nycha-scraper](https://github.com/JustFixNYC/nycha-scraper)
tool. It can be re-used to create new CSV files that may be more up-to-date
than the one in this repository.

### NYC geographic regions

The tenant assistance directory, known within the project as `findhelp`, needs
shapefiles of New York City geographic regions to allow staff to define
the catchment areas of tenant resources. These shapefiles can be loaded via
the following command:

```
python manage.py loadfindhelpdata
```

The shapefile data is stored within the repository using Git LFS
and has the following provenance:

* `findhelp/data/ZIP_CODE_040114` - https://data.cityofnewyork.us/Business/Zip-Code-Boundaries/i8iw-xf4u
* `findhelp/data/Borough-Boundaries.geojson` - https://data.cityofnewyork.us/City-Government/Borough-Boundaries/tqmj-j8zm
* `findhelp/data/Community-Districts.geojson` - https://data.cityofnewyork.us/City-Government/Community-Districts/yfnk-k7r4
* `findhelp/data/ZillowNeighborhoods-NY` - https://www.zillow.com/howto/api/neighborhood-boundaries.htm
* `findhelp/data/nys_counties.geojson` - http://gis.ny.gov/gisdata/inventories/details.cfm?DSID=927 (reprojected into the WGS 84 CRS and converted to GeoJson via QGIS)

[pipenv]: https://docs.pipenv.org/
[git-lfs]: https://git-lfs.github.com/
[twelve-factor methodology]: https://12factor.net/
[multiple buildpacks]: https://devcenter.heroku.com/articles/using-multiple-buildpacks-for-an-app
[Heroku Postgres]: https://www.heroku.com/postgres
[Container Registry and Runtime]: https://devcenter.heroku.com/articles/container-registry-and-runtime
[dev/prod parity]: https://12factor.net/dev-prod-parity

### Celery

You can optionally integrate the app with Celery to ensure that some long-running
tasks will not cause web requests to time out.

If you're using Docker, Celery isn't enabled by default. To enable it, you need
to extend the default Docker Compose configuration with `docker-compose.celery.yml`.
For details on this, see Docker's documentation on [Multiple Compose files][].

For example, to start up all services with Celery integration enabled, you can run:

```
docker-compose -f docker-compose.yml -f docker-compose.celery.yml up
```

[Multiple Compose files]: https://docs.docker.com/compose/extends/

### NoRent.org website

The codebase can also serve an entirely different website, NoRent.org.

To view this alternate website, you'll need to either add a new
[Django Site model][] or modify the built-in default one to have
a name that includes the text "NoRent" somewhere in it (the match is
case-insensitive, so it can be "norent" or "NORENT", etc).

If you added a new Django Site model, you'll need to make sure it
has a domain that matches whatever domain you're visiting the
site at, or else the code won't be able to map your request to
the new Site you added.

[Django Site model]: https://docs.djangoproject.com/en/3.0/ref/contrib/sites/#django.contrib.sites.models.Site
