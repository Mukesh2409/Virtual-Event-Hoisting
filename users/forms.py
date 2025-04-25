from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import CustomUser

class CustomUserCreationForm(UserCreationForm):
    """Form for creating new users"""
    
    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'user_type')
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['email'].required = True
        
        # Add Bootstrap classes
        for field in self.fields:
            self.fields[field].widget.attrs.update({
                'class': 'form-control'
            })

class CustomUserChangeForm(UserChangeForm):
    """Form for updating users"""
    password = None  # Remove password field from form
    
    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'first_name', 'last_name', 'bio', 'profile_image')
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['email'].required = True
        
        # Add Bootstrap classes
        for field in self.fields:
            self.fields[field].widget.attrs.update({
                'class': 'form-control'
            })
