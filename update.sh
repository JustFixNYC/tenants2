#! /bin/sh

set -e

echo "----- Clearing Python cache -----"
# https://stackoverflow.com/a/30659970
find . | grep -E "(__pycache__|\.pyc|\.pyo$)" | xargs rm -rf

echo "----- Updating Python Dependencies -----"
pipenv install --dev --keep-outdated
pip install -r requirements.production.txt

echo "----- Updating Node Dependencies -----"
npm install --no-save

echo "----- Rebuilding GraphQL queries -----"
npm run querybuilder

echo "----- Migrating Database -----"
python manage.py migrate --noinput
python manage.py initgroups
