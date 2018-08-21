import graphene
from graphql import ResolveInfo
from django.contrib.auth import logout, login
from django.middleware import csrf

from project.util.django_graphql_forms import DjangoFormMutation
from . import forms


class Login(DjangoFormMutation):
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
