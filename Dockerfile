# This Dockerfile is common to both production and development.

FROM python:3.8.2

ENV NODE_VERSION=12

RUN curl -sL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
  && curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | bash - \
  && curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - \
  && echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list \
  && apt-get update \
  && apt-get install -y \
    nodejs \
    yarn \
    # gettext is needed for Django internationalization.
    gettext \
    # Install the CLIs for databases so we can use 'manage.py dbshell'.
    postgresql-client \
    # Add support for GeoDjango.
    binutils \
    libproj-dev \
    gdal-bin \
    # This is for CircleCI.
    ca-certificates \
    git-lfs \
    # These are for WeasyPrint.
    libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf2.0-0 libffi-dev shared-mime-info \
  && rm -rf /var/lib/apt/lists/* \
  && pip install pipenv \
  && rm -rf ~/.cache/pip \
  # ICU data is needed for server-side NodeJS internationalization.
  && $(node -e 'console.log("npm install --global icu4c-data@"+process.config.variables.icu_ver_major+process.config.variables.icu_endianness)') \
  && npm cache clean --force

ENV NODE_ICU_DATA /usr/lib/node_modules/icu4c-data

ENV PATH /tenants2/node_modules/.bin:/node_modules/.bin:$PATH
