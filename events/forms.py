from django import forms
from .models import Event, Session, Registration
from django.utils import timezone
from django.utils.timezone import localtime
import uuid

class EventForm(forms.ModelForm):
    """Form for creating and updating events"""
    class Meta:
        model = Event
        fields = [
            'title', 'description', 'start_date', 'end_date',
            'max_attendees', 'banner_image', 'is_published'
        ]
        widgets = {
            'start_date': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'end_date': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'description': forms.Textarea(attrs={'rows': 5}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add Bootstrap classes
        for field in self.fields:
            if field != 'is_published':
                 self.fields[field].widget.attrs.update({
                         'class': 'form-control'
                         })
            else:
                self.fields[field].widget.attrs.update({
                    'class': 'form-check-input'
                     })

        # Convert UTC to local time for datetime-local input
        if self.instance.pk:
            if self.instance.start_date:
                local_start = localtime(self.instance.start_date)
                self.initial['start_date'] = local_start.strftime('%Y-%m-%dT%H:%M')
            if self.instance.end_date:
                local_end = localtime(self.instance.end_date)
                self.initial['end_date'] = local_end.strftime('%Y-%m-%dT%H:%M')

    def clean(self):
        cleaned_data = super().clean()
        start_date = cleaned_data.get('start_date')
        end_date = cleaned_data.get('end_date')

        if start_date and end_date:
            if start_date >= end_date:
                raise forms.ValidationError("End date must be after start date")

            if not self.instance.pk and start_date < timezone.now():
                raise forms.ValidationError("Start date cannot be in the past")

        return cleaned_data


class SessionForm(forms.ModelForm):
    """Form for creating and updating sessions"""
    class Meta:
        model = Session
        fields = ['title', 'description', 'start_time', 'end_time', 'speaker', 'is_streaming']
        widgets = {
            'start_time': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'end_time': forms.DateTimeInput(attrs={'type': 'datetime-local'}),
            'description': forms.Textarea(attrs={'rows': 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Add Bootstrap classes
        for field in self.fields:
            if field != 'is_streaming':
                 self.fields[field].widget.attrs.update({
                    'class': 'form-control'
                })
            else:
                self.fields[field].widget.attrs.update({
                    'class': 'form-check-input'
                 })

        # Convert UTC to local time for datetime-local input
        if self.instance.pk:
            if self.instance.start_time:
                local_start = localtime(self.instance.start_time)
                self.initial['start_time'] = local_start.strftime('%Y-%m-%dT%H:%M')
            if self.instance.end_time:
                local_end = localtime(self.instance.end_time)
                self.initial['end_time'] = local_end.strftime('%Y-%m-%dT%H:%M')

    def clean(self):
        cleaned_data = super().clean()
        start_time = cleaned_data.get('start_time')
        end_time = cleaned_data.get('end_time')

        if start_time and end_time:
            if start_time >= end_time:
                raise forms.ValidationError("End time must be after start time")

    # Generate unique room name if it's a new session
        if not self.instance.pk:
            room_name = f"room_{uuid.uuid4().hex[:10]}"
            self.instance.room_name = room_name  # ✅ assign directly here

        return cleaned_data


class RegistrationForm(forms.ModelForm):
    """Form for event registration"""
    class Meta:
        model = Registration
        fields = []  # No fields needed, just CSRF protection
