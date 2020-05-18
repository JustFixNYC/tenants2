# This Dockerfile is common to both production and development.

FROM python:3.8.2-alpine

RUN apk add --no-cache \
    yarn nodejs \
    # gettext is needed for Django internationalization.
    gettext \
    # Add support for GeoDjango.
    binutils \
    proj \
    gdal \
    # These are for WeasyPrint.
    # https://github.com/Kozea/WeasyPrint/issues/699#issuecomment-483269113
    cairo-dev pango-dev gdk-pixbuf

RUN pip install pipenv

ENV PATH /tenants2/node_modules/.bin:/node_modules/.bin:$PATH
