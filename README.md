This is an attempt at creating a new Tenants app for JustFix.

## Quick start

You'll need Python 3.7 and [pipenv][].

First you'll want to instantiate your Python virtual
environment and enter it:

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

To run tests:

```
pytest
```

[pipenv]: https://docs.pipenv.org/
