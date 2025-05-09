# Virtual Events Platform

A Django-based platform for hosting and managing virtual events with real-time streaming capabilities and interactive features.

## Features

- Real-time WebRTC video streaming
- Live chat functionality
- Event management system
- User authentication and profiles
- Session scheduling and management
- Responsive design

## Tech Stack

- Django 5.2
- Channels 4.2.2 for WebSocket support
- Redis for real-time features
- WebRTC for video streaming
- PostgreSQL database (production)
- SQLite (development)

## Prerequisites

- Python 3.x
- Redis server
- Virtual environment (recommended)

## Installation

1. Clone the repository

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a .env file in the project root and configure your environment variables:
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=your-database-url
REDIS_URL=redis://localhost:6379
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Create a superuser:
```bash
python manage.py createsuperuser
```

7. Start the development server:
```bash
python manage.py runserver
```

## Project Structure

- `events/`: Event management application
- `users/`: User authentication and profile management
- `templates/`: HTML templates
- `static/`: Static files (CSS, JavaScript)
- `virtualevents/`: Project configuration

## Development

- Use `requirements.txt` for production dependencies
- Follow PEP 8 style guide
- Write tests for new features

## Deployment

Refer to `DEPLOYMENT.md` for detailed deployment instructions.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

Organiser Home Page
![image](https://github.com/user-attachments/assets/a6c5bda8-39fd-40cc-adc1-c32ad77e8754)

Organiser Dashboard
![image](https://github.com/user-attachments/assets/29939e92-a79e-4fc1-8601-e3639f1b3f06)

Creating Event
![image](https://github.com/user-attachments/assets/16f52e02-c9f7-4fd8-8ee6-561544329c3d)

upcomming Events
![image](https://github.com/user-attachments/assets/8b545650-a116-45a6-b2f5-e2d8ddad0aec)








