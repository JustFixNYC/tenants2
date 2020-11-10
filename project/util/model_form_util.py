from graphql import ResolveInfo
from django.db.models import OneToOneField
from django.forms import ModelForm, inlineformset_factory

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


def singletonformset_factory(parent_model, model, form):
    '''
    Returns an inline form set where exactly one form must
    be in the formset.

    This is a bit weird since formsets are traditionally intended
    to contain any number of forms; however, for now it's the
    easiest way to shoehorn "sub-forms" into our form
    infrastructure without having to overhaul it.
    '''

    return inlineformset_factory(
        parent_model,
        model,
        form,
        can_delete=False,
        min_num=1,
        max_num=1,
        validate_min=True,
        validate_max=True,
    )


class SingletonFormsetFormMutation(ManyToOneUserModelFormMutation):
    '''
    A base class that can contain formsets which map to
    one-to-one models on the user.  They automatically associate
    such forms with their instances as needed, to ensure that the
    client doesn't need to know what the `id` of their models are.
    '''

    class Meta:
        abstract = True

    @classmethod
    def get_formset_kwargs(cls, root, info: ResolveInfo, formset_name, input, all_input):
        # This automatically associates any existing OneToOneField instances with
        # formset forms, relieving clients of needing to know what their ID is.

        formset = cls._meta.formset_classes[formset_name]
        if input and not input[0].get('id') and isinstance(formset.fk, OneToOneField):
            instance = formset.fk.model.objects\
                .filter(**{formset.fk.name: info.context.user})\
                .first()
            if instance:
                input[0]['id'] = instance.pk

        return super().get_formset_kwargs(root, info, formset_name, input, all_input)


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
