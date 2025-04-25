from django.contrib import admin
from .models import Event, Session, Registration, ChatMessage

class SessionInline(admin.TabularInline):
    model = Session
    extra = 0

class RegistrationInline(admin.TabularInline):
    model = Registration
    extra = 0

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'organizer', 'start_date', 'end_date', 'is_published', 'get_attendee_count')
    list_filter = ('is_published', 'start_date')
    search_fields = ('title', 'description', 'organizer__username')
    date_hierarchy = 'start_date'
    inlines = [SessionInline, RegistrationInline]
    
    def get_attendee_count(self, obj):
        return obj.get_attendee_count()
    get_attendee_count.short_description = 'Attendees'

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('title', 'event', 'start_time', 'end_time', 'is_streaming')
    list_filter = ('is_streaming', 'start_time')
    search_fields = ('title', 'description', 'event__title')
    date_hierarchy = 'start_time'

@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ('user', 'event', 'status', 'registration_date')
    list_filter = ('status',)
    search_fields = ('user__username', 'event__title')
    date_hierarchy = 'registration_date'

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('user', 'session', 'content', 'timestamp')
    list_filter = ('timestamp',)
    search_fields = ('content', 'user__username', 'session__title')
    date_hierarchy = 'timestamp'
