# Deployment Guide

This Django application uses a hybrid deployment approach:
- Backend: Heroku (Django application)
- Frontend Static Files: Netlify

## Backend Deployment (Heroku)

1. Create a new Heroku app:
```bash
heroku create your-app-name
```

2. Add PostgreSQL addon:
```bash
heroku addons:create heroku-postgresql:mini
```

3. Configure environment variables in Heroku dashboard:
- SECRET_KEY
- DEBUG=False
- ALLOWED_HOSTS=your-app-name.herokuapp.com
- DATABASE_URL (automatically set by PostgreSQL addon)

4. Deploy to Heroku:
```bash
git push heroku main
```

5. Run migrations:
```bash
heroku run python manage.py migrate
```

## Frontend Deployment (Netlify)

1. Collect static files:
```bash
python manage.py collectstatic
```

2. Create a new Netlify site:
- Go to Netlify dashboard
- Click "New site from Git"
- Choose your repository

3. Configure build settings:
- Build command: leave empty (we're only serving static files)
- Publish directory: `staticfiles/`

4. Configure environment variables in Netlify:
- DJANGO_API_URL=https://your-heroku-app.herokuapp.com

5. Update Django settings:
- Set CORS_ALLOWED_ORIGINS to include your Netlify domain
- Configure CSRF_TRUSTED_ORIGINS

## Post-Deployment

1. Update your frontend code to point to the Heroku backend URL
2. Test all functionality, especially:
   - User authentication
   - WebSocket connections
   - Static file serving
   - API endpoints

## Important Notes

- Ensure all sensitive data is stored in environment variables
- Configure proper CORS settings
- Set up proper SSL certificates
- Monitor application logs and performance
- Set up proper backup strategies for the database