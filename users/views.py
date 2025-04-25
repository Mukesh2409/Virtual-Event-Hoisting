from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.urls import reverse_lazy
from django.utils.decorators import method_decorator
from django.views.generic import UpdateView, CreateView
from django.contrib.auth.mixins import LoginRequiredMixin
from .forms import CustomUserCreationForm, CustomUserChangeForm
from .models import CustomUser
from events.models import Event, Registration

def register(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('home')
    else:
        form = CustomUserCreationForm()
    return render(request, 'users/register.html', {'form': form})

@method_decorator(login_required, name='dispatch')
class ProfileUpdateView(UpdateView):
    model = CustomUser
    form_class = CustomUserChangeForm
    template_name = 'users/profile.html'
    success_url = reverse_lazy('profile')
    
    def get_object(self):
        return self.request.user

@login_required
def dashboard(request):
    user = request.user
    context = {'user': user}
    
    # Get all registrations for the user
    user_registrations = Registration.objects.filter(user=user)
    
    if user.is_admin() or user.is_organizer():
        # For organizers, show managed events with detailed statistics
        managed_events = Event.objects.filter(organizer=user)
        
        # Enhance each event with statistics
        for event in managed_events:
            event.attendee_count = event.registrations.filter(status='confirmed').count()
            event.pending_count = event.registrations.filter(status='pending').count()
            event.session_count = event.sessions.count()
            
        context['managed_events'] = managed_events
        context['total_events'] = managed_events.count()
        context['total_attendees'] = sum(event.attendee_count for event in managed_events)
    
    # For all users, show their event registrations with status
    context['registered_events'] = Event.objects.filter(
        registrations__user=user,
        registrations__status='confirmed'
    ).distinct()
    
    # Add registration statistics
    context['pending_registrations'] = user_registrations.filter(status='pending').count()
    context['confirmed_registrations'] = user_registrations.filter(status='confirmed').count()
    
    # Get upcoming sessions for registered events
    from django.utils import timezone
    context['upcoming_sessions'] = Event.objects.filter(
        registrations__user=user,
        registrations__status='confirmed',
        sessions__start_time__gt=timezone.now()
    ).order_by('sessions__start_time')[:5]
    
    return render(request, 'users/dashboard.html', context)
