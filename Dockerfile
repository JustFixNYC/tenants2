# This Dockerfile is common to both production and development.

FROM python:3.7.0

ENV NODE_VERSION=8

RUN curl -sL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
  && apt-get update \
  && apt-get install -y \
    nodejs \
    # Install the CLIs for databases so we can use 'manage.py dbshell'.
    postgresql-client \
    sqlite3 \
    # This is for CircleCI.
    ca-certificates \
    # These are for WeasyPrint.
    libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf2.0-0 libffi-dev shared-mime-info \
  && rm -rf /var/lib/apt/lists/* \
  && pip install pipenv

ENV PATH /tenants2/node_modules/.bin:$PATH
