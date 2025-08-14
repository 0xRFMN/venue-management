# 🏢 Venue & Events Management System

A full-stack web application for managing venues and events with user authentication, bulk operations, and comprehensive API documentation.

## ✨ Features

### 🔐 Authentication System
- User registration with email validation
- Secure login/logout with session management
- Password hashing with PBKDF2 + salt
- Protected routes and auto-logout

### 🏟️ Venue Management
- Create, view, edit, and delete venues
- Bulk venue creation from text input
- Auto-detection of base URLs from event patterns
- Search venues by name

### 🎫 Event Management  
- Add events to venues with automatic URL parsing
- Bulk event creation with event ID extraction
- Select all/individual events with checkboxes
- Bulk delete selected events
- Search events by ID or name

### 📚 API Documentation
- Built-in API reference with all endpoints
- Interactive documentation with examples
- Data model specifications
- Usage examples with curl commands

## 🚀 Quick Start

### Backend (FastAPI)
```bash
cd app/
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (React + Vite)
```bash
cd frontend/
npm install
npm run dev
```

Visit `http://localhost:3000` and register your first user account!

## 🌐 Deployment

### Backend Options:
- **Railway** (Recommended): Upload `/app` folder
- **Heroku**: Use provided `Procfile` 
- **DigitalOcean**: Auto-detects Python

### Frontend:
- **Netlify**: Upload `/frontend/dist` folder
- **Vercel**: Connect GitHub repo

See `DEPLOY_INSTRUCTIONS.md` for detailed steps.

## 🏗️ Project Structure

```
├── app/                    # Backend (FastAPI)
│   ├── main.py            # Main application
│   ├── models.py          # Venue/Event models
│   ├── user_models.py     # User authentication models
│   ├── auth_endpoints.py  # Registration/login endpoints
│   ├── auth.py            # API key authentication
│   ├── database.py        # Database configuration
│   ├── url_parser.py      # URL/ID extraction utilities
│   └── requirements.txt   # Python dependencies
├── frontend/              # Frontend (React)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── api/          # API client
│   │   └── main.jsx      # Entry point
│   ├── dist/             # Production build
│   └── package.json      # Node dependencies
└── *.md                  # Documentation
```

## 🔧 Environment Variables

### Backend
- `ENVIRONMENT=production` (for CORS settings)
- `ALLOWED_ORIGINS=https://your-frontend-url.com`

### Frontend  
- `VITE_API_BASE_URL=https://your-backend-url.com`

## 🛡️ Security Features

- ✅ Password hashing with salt
- ✅ Session-based authentication
- ✅ CORS protection
- ✅ API key protection for data endpoints
- ✅ SQL injection prevention (SQLAlchemy ORM)
- ✅ Input validation and sanitization

## 📝 API Endpoints

### Authentication
- `POST /auth/register` - Create new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/verify-session` - Verify session

### Venues
- `GET /venues/` - List all venues
- `POST /venues/` - Create venue
- `POST /venues/bulk` - Bulk create venues
- `PUT /venues/{id}` - Update venue
- `DELETE /venues/{id}` - Delete venue

### Events
- `GET /events/` - List all events
- `POST /events/` - Create event
- `POST /events/bulk` - Bulk create events
- `GET /venues/{id}/events/` - Get venue events
- `PUT /events/{id}` - Update event
- `DELETE /events/{id}` - Delete event

### Search
- `GET /search?q={query}` - Search venues and events

## 🧪 Testing

Test user registration:
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "password123"}'
```

## 📄 License

MIT License - Built for internal company use

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

---

**🎉 Ready to deploy!** Follow the deployment instructions to get your venue management system live!