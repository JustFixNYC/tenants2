import sys
from pathlib import Path
from typing import Dict, Any, Optional
import pytest


def one_field_err(message: str, field: str = '__all__'):
    '''
    Returns a GraphQL form error validation response of a
    single error for a single field.
    '''

    return [{'field': field, 'messages': [message]}]


class TestWithGraphQL:
    '''
    A class that provides a common fixture to make it easier
    to test GraphQL endpoints.
    '''

    @pytest.fixture(autouse=True)
    def setup_fixture(self, graphql_client, db):
        self.graphql_client = graphql_client
        self.request = graphql_client.request
        self.user = graphql_client.request.user


class GraphQLTestingPal(TestWithGraphQL):
    '''
    A class that makes it easier to test GraphQL endpoints.

    It can be used to test any kind of GraphQL endpoint, but is
    specifically built for testing GraphQL mutations that wrap
    Django forms.
    '''

    # This should be set to a GraphQL mutation that takes an 'input'
    # variable and returns a single result called 'output'.
    QUERY: str = ''

    # This should be set to a dictionary containing the default value
    # of the 'input' variable.
    DEFAULT_INPUT: Dict[str, Any] = {}

    def execute(self, input: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        '''
        Execute the GraphQL query defined by self.QUERY, passing
        in any optional input that will be merged with the default input.

        Returns the single 'output' result of the query.
        '''

        res = self.graphql_client.execute(self.QUERY, variables={'input': {
            **self.DEFAULT_INPUT,
            **(input or {}),
        }})
        return res['data']['output']

    def assert_one_field_err(
        self,
        message: str,
        field: str = '__all__',
        input: Optional[Dict[str, Any]] = None,
    ):
        '''
        Ensures that the GraphQL query defined by self.QUERY raises
        a single error for a single field.
        '''

        errors = self.execute(input=input)['errors']
        expected = one_field_err(message, field)
        if errors != expected:
            raise AssertionError(f"Expected errors to be {expected} but it is {errors}")

    def one_field_err(self, message: str, field: str = '__all__'):
        '''
        Returns a GraphQL form error validation response of a
        single error for a single field.
        '''

        return one_field_err(message, field)


class ClassCachedValue:
    '''
    This class can be used as a superclass for pytest classes when you
    want to perform multiple tests over some data that takes a long
    time to generate.

    Ideally, we'd just use pytest class-scoped fixtures for this, but
    the problem is that in order to generate the cached value, we
    need to use function-scoped fixtures, and class-scoped fixtures
    can't use function-scoped ones.  This allows us to get around that
    problem by having the function-scoped tests (or fixtures) pass
    fixtures on to a class method.
    '''

    # Stores the cached value.
    _cached_value: Any = None

    @classmethod
    def cache_value(cls, *args, **kwargs):
        '''
        Generates the value that should be cached and returns it.
        '''

        raise NotImplementedError()

    @classmethod
    def get_value(cls, *args, **kwargs):
        '''
        Retrieves the cached value, generating it first if it
        doesn't exist yet. All arguments are passed on to
        `cls.cache_value()`, if it's called.
        '''

        if cls._cached_value is None:
            cls._cached_value = cls.cache_value(*args, **kwargs)
        return cls._cached_value


class Blob:
    '''
    A class that lets you easily create objects for testing, e.g.:

        >>> blob = Blob(a=1, b=Blob(c="hi"))
        >>> blob.a
        1
        >>> blob.b.c
        'hi'
    '''

    def __init__(self, **kwargs):
        self.__dict__ = kwargs


class Snapshot:
    '''
    A helper class to make snapshot/golden file testing easier in pytest.

    To use it, pass in the actual output that you want to snapshot test
    against, and a Path to a file that stores the snapshot's expected output.

    If the snapshot file doesn't already exist, it will be created with
    the passed-in actual output.

    The content of the snapshot file will be set to the 'expected'
    attribute, while the passed-in actual output will be set to the
    'actual' attribute.

    You'll want to `assert snapshot.actual == snapshot.expected` in
    your actual test, as this will make sure that helpful diff output
    is displayed if the snapshot test fails.

    To update the snapshot to match the current actual output, you
    will need to manually delete the snapshot file.
    '''

    def __init__(self, actual: str, path: Path):
        self.actual = actual
        self.path = path

        if not path.exists():
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(actual)

        self.expected = path.read_text()

        if self.actual != self.expected:
            sys.stderr.write(
                f"Warning: snapshot does not match! To update the snapshot, "
                f"delete '{self.path}'."
            )
