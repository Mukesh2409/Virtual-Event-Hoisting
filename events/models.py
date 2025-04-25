from django.db import models
from django.conf import settings
from django.urls import reverse
from django.utils import timezone

class Event(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    organizer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='organized_events')
    max_attendees = models.PositiveIntegerField(null=True, blank=True)
    banner_image = models.URLField(blank=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
    def get_absolute_url(self):
        return reverse('event_detail', kwargs={'pk': self.pk})
    
    def get_session_count(self):
        return self.sessions.count()
    
    def get_attendee_count(self):
        return self.registrations.filter(status='confirmed').count()
    
    def is_full(self):
        if self.max_attendees is None:
            return False
        return self.get_attendee_count() >= self.max_attendees
    
    def is_ongoing(self):
        now = timezone.now()
        return self.start_date <= now <= self.end_date
    
    def has_ended(self):
        return timezone.now() > self.end_date

class Session(models.Model):
    """Model for event sessions"""
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='sessions')
    title = models.CharField(max_length=255)
    description = models.TextField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    speaker = models.CharField(max_length=255, blank=True)
    room_name = models.CharField(max_length=100, unique=True)
    is_streaming = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['start_time']
    
    def __str__(self):
        return f"{self.title} ({self.event.title})"
    
    def get_absolute_url(self):
        return reverse('session_detail', kwargs={'pk': self.pk})
    
    def is_upcoming(self):
        return timezone.now() < self.start_time
    
    def is_ongoing(self):
        now = timezone.now()
        return self.start_time <= now <= self.end_time
    
    def has_ended(self):
        return timezone.now() > self.end_time

class Registration(models.Model):
    """Model for event registrations"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='registrations')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    registration_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'event']
    
    def __str__(self):
        return f"{self.user.username} - {self.event.title}"

class ChatMessage(models.Model):
    """Model for chat messages within a session"""
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.user.username}: {self.content[:50]}"
