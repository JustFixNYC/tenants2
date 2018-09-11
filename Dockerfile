# This Dockerfile is common to both production and development.

FROM python:3.7.0

ENV NODE_VERSION=8

RUN curl -sL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
  && apt-get update \
  && apt-get install -y \
    nodejs \
  && rm -rf /var/lib/apt/lists/* \
  && pip install pipenv

ENV PATH /tenants2/node_modules/.bin:$PATH
