from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    USER_TYPE_CHOICES = (
        # ('admin', 'Admin'),
        ('organizer', 'Organizer'),
        ('attendee', 'Attendee'),
    )
    
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='attendee')
    bio = models.TextField(blank=True)
    profile_image = models.URLField(blank=True)
    
    def __str__(self):
        return self.username
    
    def is_admin(self):
        return self.user_type == 'admin' or self.is_superuser
    
    def is_organizer(self):
        return self.user_type == 'organizer'
    
    def is_attendee(self):
        return self.user_type == 'attendee'
