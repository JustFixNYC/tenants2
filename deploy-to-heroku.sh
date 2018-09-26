#! /bin/bash

# Uh, I would use 'set -e' here except heroku seems to return non-zero
# exit codes even when it's successful? How bizarre:
#
#   https://github.com/heroku/cli/issues/1051

heroku maintenance:on
heroku container:push -R
heroku container:release web
heroku run --exit-code python manage.py migrate
heroku maintenance:off
