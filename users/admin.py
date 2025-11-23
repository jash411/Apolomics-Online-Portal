from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['username', 'email', 'user_type', 'is_staff', 'is_active']
    list_filter = ['user_type', 'is_staff', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('user_type', 'profile_picture', 'phone_number', 'date_of_birth', 'bio')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('user_type', 'email')}),
    )

admin.site.register(User, CustomUserAdmin)