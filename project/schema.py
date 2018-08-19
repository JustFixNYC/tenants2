import graphene
from graphene_django.forms.mutation import DjangoFormMutation
from graphene_django.forms.types import ErrorType as DjangoFormErrorType
from graphene.utils.str_converters import to_camel_case
from graphql import ResolveInfo
from django.contrib.auth import logout, login
from django.middleware import csrf

from . import forms


class JustfixDjangoFormMutation(DjangoFormMutation):
    class Meta:
        abstract = True

    @classmethod
    def mutate_and_get_payload(cls, root, info, **input):
        '''
        Graphene-Django's default implementation for form field validation
        errors doesn't convert field names to camel case, but we want to,
        because the input was provided using camel case field names, so the
        errors should use them too.
        '''

        form = cls.get_form(root, info, **input)

        if form.is_valid():
            return cls.perform_mutate(form, info)
        else:
            errors = []
            for key, value in form.errors.items():
                if key != '__all__':
                    key = to_camel_case(key)
                errors.append(DjangoFormErrorType(field=key, messages=value))
            return cls(errors=errors)


class Login(JustfixDjangoFormMutation):
    '''
    A mutation to log in the user. Returns whether or not the login was successful
    (if it wasn't, it's because the credentials were invalid). It also returns
    a new CSRF token, because as the Django docs state, "For security reasons,
    CSRF tokens are rotated each time a user logs in":

        https://docs.djangoproject.com/en/2.1/ref/csrf/
    '''

    class Meta:
        form_class = forms.LoginForm

    csrf_token = graphene.String()

    @classmethod
    def perform_mutate(cls, form: forms.LoginForm, info: ResolveInfo):
        request = info.context
        login(request, form.authenticated_user)
        return cls(errors=[], csrf_token=csrf.get_token(request))


class Logout(graphene.Mutation):
    '''
    Logs out the user, returning whether the logout was successful. It also
    returns a new CSRF token, because apparently this changes on logout too.
    '''

    ok = graphene.Boolean(required=True)
    csrf_token = graphene.String(required=True)

    def mutate(self, info: ResolveInfo) -> 'Logout':
        request = info.context
        if request.user.is_authenticated:
            logout(request)
        return Logout(ok=True, csrf_token=csrf.get_token(request))


class Mutations(graphene.ObjectType):
    logout = Logout.Field(required=True)
    login = Login.Field(required=True)


class Query(graphene.ObjectType):
    '''
    Here is some help text that gets passed back to
    GraphQL clients as part of our schema.
    '''

    hello = graphene.String(thing=graphene.String(required=True), required=True)
    there = graphene.Int()

    def resolve_hello(self, info: ResolveInfo, thing: str) -> str:
        if info.context.user.is_authenticated:
            status = "logged in"
        else:
            status = "not logged in"
        return f'Hello from GraphQL! You passed in "{thing}" and are {status}'

    def resolve_there(self, info) -> int:
        return 123


schema = graphene.Schema(query=Query, mutation=Mutations)
