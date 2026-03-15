# 🚀 Vaurex - Document Intelligence Platform

<div align="center">

![Vaurex Logo](https://via.placeholder.com/200x80/FF6B35/FFFFFF?text=VAUREX)

**AI-Powered Document Analysis & Risk Assessment Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.12+-blue)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.18-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green)](https://fastapi.tiangolo.com/)

[▶️ Live Demo](https://vaurex-demo.com) · [📖 Documentation](https://docs.vaurex.com) · [🎮 Try Demo](https://vaurex-demo.com/demo)

</div>

## ✨ Features

### 🎯 Core Capabilities
- **📄 Document Analysis**: AI-powered risk scoring (0-100) for contracts and compliance documents
- **🏷️ Entity Extraction**: Automatic extraction of companies, dates, amounts, and key parties
- **🛡️ Compliance Checking**: GDPR, SOC 2, HIPAA, and custom framework compliance monitoring
- **🤖 AI Chat Assistant**: Interactive document Q&A with intelligent responses
- **📊 Knowledge Base**: Organize and query document collections
- **📱 PWA Ready**: Install as a native app with offline capabilities

### 🧠 AI Pipeline
- **Multi-Model Approach**: Gemini 2.0 Flash, Groq Llama-3.3-70b, OpenRouter DeepSeek-V3
- **Advanced OCR**: Text extraction with vision model fallbacks
- **Risk Assessment**: Evidence-based scoring with detailed reasoning
- **Context-Aware Chat**: Document-specific AI conversations

### 🎨 Premium UI/UX
- **✨ Advanced Animations**: Smooth micro-interactions and premium visual effects
- **🎨 Dynamic Theming**: 60-30-10 color rule with customizable palettes
- **📱 Responsive Design**: Optimized for mobile, tablet, and desktop
- **♿ Accessibility**: WCAG 2.1 AA compliant with full keyboard navigation
- **🌙 Dark Mode**: Eye-friendly dark theme throughout

### 🔒 Enterprise Security
- **🛡️ Security Headers**: CSP, HSTS, XSS protection, and more
- **🔐 Authentication**: Supabase-based auth with social providers
- **🔒 Data Protection**: Encrypted storage and secure API communication
- **📝 Audit Trails**: Complete logging and monitoring system
- **🚦 Rate Limiting**: Configurable limits per endpoint and user

## 🏗️ Architecture

### Tech Stack

#### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS 3.4
- **Animations**: Framer Motion 10.16
- **State**: React Hooks & Context
- **Auth**: Supabase Auth

#### Backend
- **Framework**: FastAPI 0.115+
- **Language**: Python 3.12+
- **Database**: PostgreSQL via Supabase
- **AI**: Gemini, Groq, OpenRouter APIs
- **Queue**: SQLite-based async job processing
- **Email**: SMTP with TLS support

#### Infrastructure
- **Deployment**: Docker containers
- **Monitoring**: Structured JSON logging
- **Security**: Rate limiting, audit trails
- **Testing**: Pytest with 100% coverage

### Project Structure

```
vaurex/
├── frontend/                 # Next.js frontend application
│   ├── app/                  # App Router pages
│   ├── components/           # React components
│   ├── lib/                  # Utilities and helpers
│   └── public/               # Static assets
├── backend/                  # FastAPI backend API
│   ├── routes/               # API endpoints
│   ├── services/             # Business logic
│   ├── ai_pipeline.py        # AI document analysis
│   └── tests/                # Test suite
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.12+
- PostgreSQL (via Supabase)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/vaurex.git
cd vaurex

# Frontend Setup
cd frontend
npm install
cp .env.local.example .env.local
# Configure .env.local with your Supabase credentials

# Backend Setup
cd ../backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Configure .env with your API keys and database

# Start Backend
cd backend
uvicorn main:app --reload --port 8080

# Start Frontend (new terminal)
cd frontend
npm run dev
```

### Environment Configuration

#### Backend (.env)
```env
# AI Providers
DEEPSEEK_API_KEY=your_deepseek_key
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
OPENROUTER_API_KEY=your_openrouter_key

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8080

# Email (optional)
SUPPORT_EMAIL=your-email@gmail.com
SUPPORT_EMAIL_PASSWORD=your-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Docs**: http://localhost:8080/docs
- **Health Check**: http://localhost:8080/health

## 📡 API Documentation

### Core Endpoints

#### Authentication
All protected endpoints require Supabase JWT tokens.

```bash
# Verify token
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/v1/auth/verify
```

#### Document Operations
```bash
# Upload document
curl -X POST -F "file=@document.pdf" \
  -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/v1/upload

# List scans
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/v1/scans

# Get scan status
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/v1/scans/{id}/poll
```

#### AI Chat
```bash
# Chat with AI
curl -X POST -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"message":"What are the key risks?"}' \
  http://localhost:8080/api/v1/chat
```

### Rate Limits

| Endpoint | Limit | Period |
|----------|-------|--------|
| Upload | 12 requests | 1 minute |
| Scans | 120 requests | 1 minute |
| Chat | 45 requests | 1 minute |
| Support | 20 requests | 1 minute |

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test
pytest tests/test_api_v1.py::test_upload_and_list_scans_multi_user
```

### Frontend Tests
```bash
cd frontend

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run accessibility tests
npm run test:a11y
```

### Test Coverage
- ✅ **Backend**: 6 test suites covering all API endpoints
- ✅ **Frontend**: Component and integration tests
- ✅ **E2E**: Critical user journey tests
- ✅ **Security**: Authentication and authorization tests

## 🔒 Security

### Implemented Measures
- **Authentication**: Supabase JWT with refresh tokens
- **Authorization**: User-based resource ownership
- **Rate Limiting**: Per-user and per-IP limits
- **Input Validation**: File type and content sanitization
- **Audit Logging**: Complete request/response tracking
- **Security Headers**: CSP, HSTS, XSS protection

### Best Practices
- Environment variable protection
- SQL injection prevention
- XSS protection
- CORS configuration
- Regular dependency updates
- Security audits

## 📧 Email Configuration

### Gmail Setup
1. Enable 2FA on your Gmail account
2. Generate an App Password
3. Configure environment variables:
```env
SUPPORT_EMAIL=your-email@gmail.com
SUPPORT_EMAIL_PASSWORD=your-16-digit-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

### Supabase Email
For magic link authentication, configure SMTP in Supabase dashboard:
- Go to Authentication → Settings → Email
- Enter your SMTP credentials
- Set redirect URLs to your frontend

## 🚀 Deployment

### Docker Compose
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - NEXT_PUBLIC_BACKEND_URL=http://backend:8080

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - GROQ_API_KEY=${GROQ_API_KEY}
```

### Production Deployment
```bash
# Frontend (Vercel recommended)
cd frontend
vercel --prod

# Backend (Docker)
cd backend
docker build -t vaurex-backend .
docker run -p 8080:8080 vaurex-backend
```

## 📊 Monitoring

### Logging
Structured JSON logging with request IDs:
```json
{
  "ts": "2026-03-14T05:00:00",
  "level": "INFO",
  "logger": "main",
  "msg": "http.request",
  "request_id": "uuid",
  "method": "POST",
  "path": "/api/v1/upload",
  "status_code": 200,
  "duration_ms": 150
}
```

### Health Checks
- **Health**: `/health` - Basic service status
- **Ready**: `/ready` - Database and external service checks
- **Metrics**: `/metrics` - Application metrics (if configured)

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Run tests: `pytest` (backend) and `npm test` (frontend)
6. Submit a pull request

### Code Standards
- **Backend**: Python 3.12+, Black formatting, Ruff linting
- **Frontend**: TypeScript 5.0+, Prettier formatting, ESLint
- **Commits**: Conventional commit messages
- **Tests**: 100% coverage for new features

### Setting Up Development Environment
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Frontend
cd frontend
npm install
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.vaurex.com](https://docs.vaurex.com)
- **API Docs**: http://localhost:8080/docs (when running locally)
- **Issues**: [GitHub Issues](https://github.com/your-org/vaurex/issues)
- **Discord**: [Community Server](https://discord.gg/vaurex)
- **Email**: support@vaurex.com

## 🗺️ Roadmap

### Upcoming Features
- [ ] Real-time collaboration on documents
- [ ] Advanced AI models (GPT-4, Claude)
- [ ] Mobile apps (iOS/Android)
- [ ] Enterprise SSO integration
- [ ] Custom AI model training
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Document templates

### Version History
- **v2.1.0** - Enhanced security, email improvements, bug fixes
- **v2.0.0** - Premium UI, PWA, Enhanced Security
- **v1.5.0** - AI Chat, Knowledge Base
- **v1.0.0** - Initial Release

---

<div align="center">

**Built with ❤️ by the Vaurex Team**

[![Twitter](https://img.shields.io/twitter/follow/vaurex?style=social)](https://twitter.com/vaurex)
[![GitHub stars](https://img.shields.io/github/stars/your-org/vaurex?style=social)](https://github.com/your-org/vaurex)
[![Discord](https://img.shields.io/discord/1234567890?label=discord&style=social)](https://discord.gg/vaurex)

</div>
