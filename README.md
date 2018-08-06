This is an attempt at creating a new Tenants app for JustFix.

## Quick start

You'll need Python 3.7 and [pipenv][].

```
pipenv install --python 3.7
pipenv shell
python manage.py migrate
python manage.py runserver
```

Then visit http://localhost:8000/ in your browser.

[pipenv]: https://docs.pipenv.org/
