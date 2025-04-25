from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.contrib import messages
from django.utils import timezone
from django.http import JsonResponse
from django.db.models import Q
from .models import Event, Session, Registration, ChatMessage
from .forms import EventForm, SessionForm, RegistrationForm
from django.views.decorators.http import require_POST

class EventListView(ListView):
    model = Event
    template_name = 'events/event_list.html'
    context_object_name = 'events'
    paginate_by = 10
    
    def get_queryset(self):
        queryset = Event.objects.filter(is_published=True).order_by('start_date')
        
        # Filter by search query if provided
        query = self.request.GET.get('q')
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query) | 
                Q(description__icontains=query)
            )
        return queryset

class EventDetailView(DetailView):
    model = Event
    template_name = 'events/event_detail.html'
    context_object_name = 'event'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        event = self.object
        user = self.request.user
        
        # Check if user is registered
        context['is_registered'] = False
        context['registration'] = None
        if user.is_authenticated:
            try:
                registration = Registration.objects.get(user=user, event=event)
                context['is_registered'] = registration.status == 'confirmed'
                context['registration'] = registration
            except Registration.DoesNotExist:
                pass
                
        # Get all sessions for this event
        context['sessions'] = event.sessions.all().order_by('start_time')
        
        # Registration form
        context['registration_form'] = RegistrationForm()
        
        return context

class OrganizerRequiredMixin(UserPassesTestMixin):
    def test_func(self):
        return self.request.user.is_authenticated and (
            self.request.user.is_organizer() or 
            self.request.user.is_admin()
        )

class EventCreateView(LoginRequiredMixin, OrganizerRequiredMixin, CreateView):
    model = Event
    form_class = EventForm
    template_name = 'events/event_form.html'
    
    def form_valid(self, form):
        form.instance.organizer = self.request.user
        messages.success(self.request, 'Event created successfully!')
        return super().form_valid(form)

class EventUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Event
    form_class = EventForm
    template_name = 'events/event_form.html'
    
    def test_func(self):
        event = self.get_object()
        return (self.request.user == event.organizer or 
                self.request.user.is_admin())
    
    def form_valid(self, form):
        messages.success(self.request, 'Event updated successfully!')
        return super().form_valid(form)

class EventDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    model = Event
    success_url = reverse_lazy('event_list')
    
    def test_func(self):
        event = self.get_object()
        return (self.request.user == event.organizer or 
                self.request.user.is_admin())
    
    def delete(self, request, *args, **kwargs):
        messages.success(self.request, 'Event deleted successfully!')
        return super().delete(request, *args, **kwargs)

class SessionListView(ListView):
    model = Session
    template_name = 'events/session_list.html'
    context_object_name = 'sessions'
    paginate_by = 10
    
    def get_queryset(self):
        event_id = self.kwargs.get('event_id')
        return Session.objects.filter(event_id=event_id).order_by('start_time')
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['event'] = get_object_or_404(Event, pk=self.kwargs.get('event_id'))
        return context

class SessionDetailView(DetailView):
    model = Session
    template_name = 'events/session_detail.html'
    context_object_name = 'session'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['event'] = self.object.event
        
        # Add registration status to context
        if self.request.user.is_authenticated:
            context['registration'] = Registration.objects.filter(
                user=self.request.user,
                event=self.object.event
            ).first()
        else:
            context['registration'] = None
            
        return context

class SessionCreateView(LoginRequiredMixin, UserPassesTestMixin, CreateView):
    model = Session
    form_class = SessionForm
    template_name = 'events/session_form.html'
    
    def test_func(self):
        event = get_object_or_404(Event, pk=self.kwargs.get('event_id'))
        return (self.request.user == event.organizer or 
                self.request.user.is_admin())
    
    def form_valid(self, form):
        event = get_object_or_404(Event, pk=self.kwargs.get('event_id'))
        form.instance.event = event
        messages.success(self.request, 'Session created successfully!')
        return super().form_valid(form)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['event'] = get_object_or_404(Event, pk=self.kwargs.get('event_id'))
        return context

class SessionUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Session
    form_class = SessionForm
    template_name = 'events/session_form.html'
    
    def test_func(self):
        session = self.get_object()
        return (self.request.user == session.event.organizer or 
                self.request.user.is_admin())
    
    def form_valid(self, form):
        messages.success(self.request, 'Session updated successfully!')
        return super().form_valid(form)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['event'] = self.object.event
        return context

class SessionDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    model = Session
    
    def test_func(self):
        session = self.get_object()
        return (self.request.user == session.event.organizer or 
                self.request.user.is_admin())
    
    def get_success_url(self):
        return reverse_lazy('session_list', kwargs={'event_id': self.object.event.id})
    
    def delete(self, request, *args, **kwargs):
        messages.success(self.request, 'Session deleted successfully!')
        return super().delete(request, *args, **kwargs)
  
@login_required
def join_session(request, pk):
    session = get_object_or_404(Session, pk=pk)
    event = session.event
    
    # Check if user is registered for the event
    try:
        registration = Registration.objects.get(user=request.user, event=event, status='confirmed')
    except Registration.DoesNotExist:
        messages.error(request, 'You must be registered for this event to join the session.')
        return redirect('event_detail', pk=event.pk)
    
    # Check if session has started
    if not session.is_ongoing() and not request.user.is_admin() and not request.user == event.organizer:
        if session.is_upcoming():
            messages.error(request, 'This session has not started yet.')
        else:
            messages.error(request, 'This session has already ended.')
        return redirect('session_detail', pk=session.pk)
    
    return render(request, 'events/session_stream.html', {
        'session': session,
        'event': event,
    })

@login_required
def register_for_event(request, pk):
    event = get_object_or_404(Event, pk=pk)
    
    # Check if already registered
    existing_registration = Registration.objects.filter(user=request.user, event=event).first()
    if existing_registration:
        if existing_registration.status == 'confirmed':
            messages.info(request, 'You are already registered for this event.')
        elif existing_registration.status == 'pending':
            messages.info(request, 'Your registration is pending approval.')
        else:
            # Reactivate cancelled registration
            existing_registration.status = 'pending'
            existing_registration.save()
            messages.success(request, 'Your registration has been resubmitted.')
        return redirect('event_detail', pk=event.pk)
    
    # Check if event is full
    if event.is_full():
        messages.error(request, 'Sorry, this event is already at capacity.')
        return redirect('event_detail', pk=event.pk)
    
    # Create new registration
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            registration = form.save(commit=False)
            registration.user = request.user
            registration.event = event
            registration.status = 'confirmed'  # Auto-confirm for now
            registration.save()
            messages.success(request, 'You have successfully registered for this event.')
            return redirect('event_detail', pk=event.pk)
    else:
        form = RegistrationForm()
    
    return render(request, 'events/registration_form.html', {
        'form': form,
        'event': event
    })

@login_required
@require_POST
def cancel_registration(request, pk):
    registration = get_object_or_404(Registration, pk=pk, user=request.user)
    registration.status = 'cancelled'
    registration.save()
    messages.success(request, 'Your registration has been cancelled.')
    return redirect('event_detail', pk=registration.event.pk)

@login_required
def get_chat_messages(request, session_id):
    session = get_object_or_404(Session, id=session_id)
    messages = ChatMessage.objects.filter(session=session).order_by('timestamp')
    messages_data = [{
        'user': msg.user.username,
        'content': msg.content,
        'timestamp': msg.timestamp.strftime('%Y-%m-%d %H:%M:%S')
    } for msg in messages]
    return JsonResponse({'messages': messages_data})



@login_required
def get_messages_by_room(request, room_name):
    try:
        session = get_object_or_404(Session, room_name=room_name)
        messages = ChatMessage.objects.filter(session=session).order_by('timestamp')
        messages_data = [{
            'user': msg.user.username,
            'content': msg.content,
            'timestamp': msg.timestamp.strftime('%Y-%m-%d %H:%M:%S')
        } for msg in messages]
        return JsonResponse({'messages': messages_data})
    except Exception as e:
        # Log the error but don't expose details in response
        print(f"Error fetching messages by room: {str(e)}")
        return JsonResponse({'error': 'Unable to fetch messages'}, status=500)
