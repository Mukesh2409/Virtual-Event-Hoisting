# from django.urls import path
# from . import views

# urlpatterns = [
#     # Event URLs
#     path('', views.EventListView.as_view(), name='event_list'),
#     path('<int:pk>/', views.EventDetailView.as_view(), name='event_detail'),
#     path('create/', views.EventCreateView.as_view(), name='event_create'),
#     path('<int:pk>/update/', views.EventUpdateView.as_view(), name='event_update'),
#     path('<int:pk>/delete/', views.EventDeleteView.as_view(), name='event_delete'),
    
#     # Session URLs
#     path('<int:event_id>/sessions/', views.SessionListView.as_view(), name='session_list'),
#     path('sessions/<int:pk>/', views.SessionDetailView.as_view(), name='session_detail'),
#     path('<int:event_id>/sessions/create/', views.SessionCreateView.as_view(), name='session_create'),
#     path('sessions/<int:pk>/update/', views.SessionUpdateView.as_view(), name='session_update'),
#     path('sessions/<int:pk>/delete/', views.SessionDeleteView.as_view(), name='session_delete'),
#     path('sessions/<int:pk>/join/', views.join_session, name='join_session'),
    
#     # Registration URLs
#     path('<int:pk>/register/', views.register_for_event, name='register_for_event'),
#     path('registration/<int:pk>/cancel/', views.cancel_registration, name='cancel_registration'),
    
#     # Chat APIs
#     path('api/sessions/<int:session_id>/messages/', views.get_chat_messages, name='get_chat_messages'),
# ]


from django.urls import path
from . import views

urlpatterns = [
    # Event URLs
    path('', views.EventListView.as_view(), name='event_list'),
    path('<int:pk>/', views.EventDetailView.as_view(), name='event_detail'),
    path('create/', views.EventCreateView.as_view(), name='event_create'),
    path('<int:pk>/update/', views.EventUpdateView.as_view(), name='event_update'),
    path('<int:pk>/delete/', views.EventDeleteView.as_view(), name='event_delete'),
    
    # Session URLs
    path('<int:event_id>/sessions/', views.SessionListView.as_view(), name='session_list'),
    path('sessions/<int:pk>/', views.SessionDetailView.as_view(), name='session_detail'),
    path('<int:event_id>/sessions/create/', views.SessionCreateView.as_view(), name='session_create'),
    path('sessions/<int:pk>/update/', views.SessionUpdateView.as_view(), name='session_update'),
    path('sessions/<int:pk>/delete/', views.SessionDeleteView.as_view(), name='session_delete'),
    path('sessions/<int:pk>/join/', views.join_session, name='join_session'),
    
    # Registration URLs
    path('<int:pk>/register/', views.register_for_event, name='register_for_event'),
    path('registration/<int:pk>/cancel/', views.cancel_registration, name='cancel_registration'),
    
    # Chat APIs
    path('api/sessions/<int:session_id>/messages/', views.get_chat_messages, name='get_chat_messages'),
    path('api/sessions/<int:session_id>/messages', views.get_chat_messages, name='get_chat_messages_no_slash'),
    path('api/room-messages/<str:room_name>/', views.get_messages_by_room, name='get_messages_by_room'),
]