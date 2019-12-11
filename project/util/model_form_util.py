from graphql import ResolveInfo
from django.forms import ModelForm

from project.util.session_mutation import SessionFormMutation


def get_model_for_user(model_class, user):
    '''
    Given a model class that has a OneToOneField called 'user'
    that maps to a user, returns the model instance for the
    given user.

    If no such model exists, or if the user is not logged in,
    returns None.
    '''

    if not user.is_authenticated:
        return None
    try:
        return model_class.objects.get(user=user)
    except model_class.DoesNotExist:
        return None


def get_models_for_user(model_class, user):
    '''
    Given a model class that has a ForeignKey called 'user'
    that maps to a user, returns a list of model instances for the
    given user.

    If the user is not logged in, returns None.
    '''

    if not user.is_authenticated:
        return None
    return list(model_class.objects.filter(user=user))


def _make_resolver(func, model_class):
    def resolver(parent, info: ResolveInfo):
        return func(model_class, info.context.user)

    return resolver


def create_models_for_user_resolver(model_class):
    '''
    Creates a GraphQL resolver that returns the model instances
    associated with a given user.
    '''

    return _make_resolver(get_models_for_user, model_class)


def create_model_for_user_resolver(model_class):
    '''
    Creates a GraphQL resolver that returns the model instance
    associated with a given user.
    '''

    return _make_resolver(get_model_for_user, model_class)


class ManyToOneUserModelFormMutation(SessionFormMutation):
    '''
    A base class that can be used to make any
    ModelForm that represents a many-to-one relationship
    with the user into a GraphQL mutation.
    '''

    class Meta:
        abstract = True

    login_required = True

    @classmethod
    def __init_subclass_with_meta__(cls, exclude_fields=('user',), **options):
        super().__init_subclass_with_meta__(exclude_fields=exclude_fields, **options)

    @classmethod
    def perform_mutate(cls, form, info: ResolveInfo):
        for formset in form.formsets.values():
            formset.save()
        return cls.mutation_success()

    @classmethod
    def get_formset_kwargs(cls, root, info: ResolveInfo, formset_name, input, all_input):
        initial_forms = len([form for form in input if form.get('id')])
        kwargs = {
            "data": cls.get_data_for_formset(input, initial_forms),
            "instance": info.context.user,
            "prefix": "form"
        }
        return kwargs


class OneToOneUserModelFormMutation(SessionFormMutation):
    '''
    A base class that can be used to make any
    ModelForm that represents a one-to-one relationship
    with the user into a GraphQL mutation.
    '''

    class Meta:
        abstract = True

    login_required = True

    @classmethod
    def get_form_kwargs(cls, root, info: ResolveInfo, **input):
        '''
        Either create a new instance of our model, or get the
        existing one, and pass it on to the ModelForm.
        '''

        user = info.context.user
        model = cls._meta.form_class._meta.model
        try:
            instance = model.objects.get(user=user)
        except model.DoesNotExist:
            instance = model(user=user)
        return {"data": input, "instance": instance}

    @classmethod
    def perform_mutate(cls, form: ModelForm, info: ResolveInfo):
        '''
        Save the ModelForm, which will have already been populated with
        an instance of our model.
        '''

        form.save()
        return cls.mutation_success()

    @classmethod
    def resolve(cls, parent, info: ResolveInfo):
        '''
        This can be used as a GraphQL resolver to get the
        related model instance for the current user.
        '''

        return get_model_for_user(cls._meta.form_class._meta.model, info.context.user)
