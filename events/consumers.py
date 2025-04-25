import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Session, ChatMessage
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for chat functionality
    """
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        self.user = self.scope['user']
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        if self.user.is_authenticated:
            # Notify others about new user
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_join',
                    'username': self.user.username,
                    'user_id': self.user.id
                }
            )

    async def disconnect(self, close_code):
        if hasattr(self, 'user') and self.user.is_authenticated:
            # Notify others about user leaving
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user_leave',
                    'username': self.user.username,
                    'user_id': self.user.id
                }
            )
        
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        message_id = text_data_json.get('message_id', None)
        
        # Get user from scope
        user = self.scope['user']
        
        if user.is_authenticated:
            # Save message to database
            saved_message = await self.save_message(message)
            
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'username': user.username,
                    'user_id': user.id,
                    'message_id': message_id or str(saved_message.id)
                }
            )
    
    async def chat_message(self, event):
        message = event['message']
        username = event['username']
        message_id = event['message_id']
        
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message,
            'username': username,
            'message_id': message_id
        }))
    
    async def user_join(self, event):
        # Send user join notification to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'user_join',
            'username': event['username'],
            'user_id': event['user_id']
        }))
    
    async def user_leave(self, event):
        # Send user leave notification to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'user_leave',
            'username': event['username'],
            'user_id': event['user_id']
        }))
    
    @database_sync_to_async
    def save_message(self, message):
        user = self.scope['user']
        try:
            session = Session.objects.get(room_name=self.room_name)
            return ChatMessage.objects.create(
                session=session,
                user=user,
                content=message
            )
        except Session.DoesNotExist:
            return None

class WebRTCSignalingConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for WebRTC signaling
    """
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'webrtc_{self.room_name}'
        self.user = self.scope['user']
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        print(f"WebRTC: {self.user.username} connected to {self.room_name}")

    async def disconnect(self, close_code):
        print(f"WebRTC: User disconnected from {self.room_name} with code {close_code}")
        
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            user = self.scope['user']
            
            # Add username to the data
            data['username'] = user.username
            
            print(f"WebRTC signal from {user.username}: {data['type']}")
            
            # Send message to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'signal_message',
                    'data': data
                }
            )
        except Exception as e:
            print(f"Error in WebRTC receive: {str(e)}")
    
    async def signal_message(self, event):
        try:
            data = event['data']
            
            # Send message to WebSocket
            await self.send(text_data=json.dumps(data))
            print(f"WebRTC signal sent to client: {data['type']}")
        except Exception as e:
            print(f"Error in WebRTC signal_message: {str(e)}")
