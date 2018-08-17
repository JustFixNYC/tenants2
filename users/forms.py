from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import JustfixUser


class JustfixUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = JustfixUser
        fields = ('username', 'phone_number')


class JustfixUserChangeForm(UserChangeForm):
    class Meta:
        model = JustfixUser
        fields = ('username', 'phone_number')
