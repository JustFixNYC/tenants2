FROM python:3.7.0

ENV NODE_VERSION=8

RUN curl -sL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -

RUN apt-get update && \
  apt-get install -y \
    nodejs

RUN pip install pipenv

ENV PATH /tenants2/node_modules/.bin:$PATH

ENTRYPOINT ["python", "/tenants2/docker_django_management.py"]
