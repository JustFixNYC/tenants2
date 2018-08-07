[![CircleCI](https://circleci.com/gh/JustFixNYC/tenants2.svg?style=svg)](https://circleci.com/gh/JustFixNYC/tenants2)

This is an attempt at creating a new Tenants app for JustFix.

## Quick start

You'll need Python 3.7 and [pipenv][], as well as Node 8.

First, set up the front-end and configure it to
continuously re-build itself as you change the source code:

```
npm install
npm run watch
```

Then, in a separate terminal, you'll want to instantiate
your Python virtual environment and enter it:

```
pipenv install --python 3.7
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

## Running tests

To run the back-end Python/Django tests, use:

```
pytest
```

To run the front-end Node/TypeScript tests, use:

```
npm test
```

You can also use `npm run test:watch` to have Jest
continuously watch the front-end tests for changes and
re-run them as needed.

[pipenv]: https://docs.pipenv.org/
