from rest_framework import serializers
from .models import Event, Session, Registration, ChatMessage
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'user_type']

class EventSerializer(serializers.ModelSerializer):
    organizer = UserSerializer(read_only=True)
    attendee_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'start_date', 'end_date',
            'organizer', 'max_attendees', 'banner_image', 'is_published',
            'created_at', 'updated_at', 'attendee_count'
        ]
    
    def get_attendee_count(self, obj):
        return obj.get_attendee_count()

class SessionSerializer(serializers.ModelSerializer):
    event = EventSerializer(read_only=True)
    
    class Meta:
        model = Session
        fields = [
            'id', 'event', 'title', 'description', 'start_time', 'end_time',
            'speaker', 'room_name', 'is_streaming', 'created_at', 'updated_at'
        ]

class RegistrationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    event = EventSerializer(read_only=True)
    
    class Meta:
        model = Registration
        fields = ['id', 'user', 'event', 'status', 'registration_date']

class ChatMessageSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'session', 'user', 'content', 'timestamp']
