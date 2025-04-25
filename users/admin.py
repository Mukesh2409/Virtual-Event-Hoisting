from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser
from .forms import CustomUserCreationForm, CustomUserChangeForm

class CustomUserAdmin(UserAdmin):
    """Custom admin interface for CustomUser model"""
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = CustomUser
    list_display = ['username', 'email', 'user_type', 'is_staff']
    list_filter = UserAdmin.list_filter + ('user_type',)
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Information', {'fields': ('user_type', 'bio', 'profile_image')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Information', {'fields': ('user_type', 'bio', 'profile_image')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)
