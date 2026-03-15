# 🚀 Vaurex Backend - Document Intelligence API

<div align="center">

![Vaurex Logo](https://via.placeholder.com/200x80/FF6B35/FFFFFF?text=VAUREX)

**AI-Powered Document Analysis Backend API**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.12+-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.0+-green)](https://supabase.com/)

[📖 API Documentation](http://localhost:8000/docs) · [🧪 Test Coverage](#testing) · [🔧 Configuration](#configuration)

</div>

## ✨ Features

### 🎯 Core Capabilities
- **📄 Document Analysis**: Multi-model AI pipeline for risk scoring and entity extraction
- **🤖 AI Processing**: Gemini 2.0 Flash, Groq Llama-3.3-70b, OpenRouter DeepSeek-V3
- **🔍 OCR Pipeline**: Advanced text extraction with fallback support
- **🛡️ Security**: Rate limiting, audit logging, request fingerprinting
- **📧 Email System**: SMTP support for magic links and support requests
- **🔄 Job Queue**: Asynchronous document processing with SQLite backend

### 🔒 Enterprise Security
- **🛡️ Rate Limiting**: Configurable limits per endpoint
- **📝 Audit Logging**: Complete request/response tracking
- **🔐 Authentication**: Supabase JWT validation
- **🚦 CORS**: Secure cross-origin resource sharing
- **🔍 Input Validation**: Comprehensive request sanitization

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- PostgreSQL (via Supabase)
- SMTP server (for email)

### Installation

```bash
# Clone the repository
git clone https://github.com/pa-nuzz/vaurex.git
cd vaurex/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Copy environment variables
cp .env.example .env

# Configure your environment
nano .env
```

### Environment Setup

Create `.env` with the following variables:

```env
# --- AI PROVIDERS ---
DEEPSEEK_API_KEY=your_deepseek_key
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
OPENROUTER_API_KEY=your_openrouter_key

# --- SUPABASE ---
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# --- APP URLS ---
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# --- SECURITY / RATE LIMITS ---
UPLOAD_RATE_LIMIT_PER_MIN=12
SCANS_RATE_LIMIT_PER_MIN=120
SCANS_DELETE_RATE_LIMIT_PER_MIN=60
AUTH_RATE_LIMIT_PER_MIN=180
CHAT_RATE_LIMIT_PER_MIN=45
SUPPORT_RATE_LIMIT_PER_MIN=20

# --- SUPPORT EMAIL (SMTP) ---
SUPPORT_EMAIL=your-email@gmail.com
SUPPORT_EMAIL_PASSWORD=your-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

### Development

```bash
# Start development server
uvicorn main:app --reload --port 8000

# Open API docs at http://localhost:8000/docs
```

### Production

```bash
# Start production server
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Or using Docker
docker build -t vaurex-backend .
docker run -p 8000:8000 vaurex-backend
```

## 🏗️ Architecture

### Tech Stack
- **Backend**: FastAPI, Python 3.12+
- **Database**: PostgreSQL via Supabase
- **AI Models**: Gemini, Groq, OpenRouter
- **Job Queue**: SQLite-based async processing
- **Authentication**: Supabase JWT
- **Email**: SMTP with TLS support

### Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── ai_pipeline.py          # AI document analysis pipeline
├── routes/                 # API route handlers
│   ├── upload.py          # Document upload and processing
│   ├── scans.py           # Scan management
│   ├── chat.py            # AI chat functionality
│   ├── support.py         # Support system
│   ├── knowledge_base.py  # Knowledge base operations
│   └── compliance.py      # Compliance reporting
├── services/              # Business logic services
│   ├── auth.py           # Authentication helpers
│   ├── config.py         # Configuration management
│   ├── job_queue.py      # Async job processing
│   ├── security.py       # Security utilities
│   ├── audit.py          # Audit logging
│   ├── rate_limiter.py   # Rate limiting
│   └── support_mailer.py # Email services
├── migrations/            # Database migrations
├── tests/                # Test suite
└── scripts/              # Utility scripts
```

### AI Pipeline

The document analysis pipeline uses a multi-model approach:

1. **Text Extraction**:
   - Primary: `pypdf` for text-based PDFs
   - Fallback 1: Gemini 2.0 Flash Vision for OCR
   - Fallback 2: Groq Vision for image processing

2. **NLP Analysis**:
   - Primary: Groq Llama-3.3-70b for analysis
   - Fallback: OpenRouter DeepSeek-V3 for processing

3. **Output Sanitization**:
   - Security-focused output cleaning
   - JSON structure validation
   - Content filtering

## 📡 API Documentation

### Core Endpoints

#### Authentication
- **POST** `/api/v1/auth/verify` - Verify JWT token
- Protected by Supabase JWT validation

#### Document Upload
- **POST** `/api/v1/upload` - Upload document for analysis
- **GET** `/api/v1/scans` - List user's scans
- **GET** `/api/v1/scans/{id}/poll` - Poll scan status
- **GET** `/api/v1/scans/{id}/download/report` - Download JSON report
- **GET** `/api/v1/scans/{id}/download/text` - Download text report
- **DELETE** `/api/v1/scans/{id}` - Delete scan

#### AI Chat
- **POST** `/api/v1/chat` - Chat with AI about documents
- **POST** `/api/v1/chat/stream` - Streaming chat responses

#### Support
- **POST** `/api/v1/support` - Submit support request
- **POST** `/api/v1/support/report-analysis` - Report incorrect analysis

#### Knowledge Base
- **GET** `/api/v1/knowledge-base` - List knowledge base items
- **POST** `/api/v1/knowledge-base` - Add to knowledge base

### Rate Limiting

All endpoints are rate-limited per user/IP:

| Endpoint | Limit | Period |
|----------|-------|--------|
| Upload | 12 requests | 1 minute |
| Scans (list/poll) | 120 requests | 1 minute |
| Delete | 60 requests | 1 minute |
| Auth | 180 requests | 1 minute |
| Chat | 45 requests | 1 minute |
| Support | 20 requests | 1 minute |

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run with detailed traceback
pytest -v --tb=long

# Run specific test file
pytest tests/test_api_v1.py

# Run with coverage (if pytest-cov installed)
pytest --cov=. --cov-report=html
```

### Test Coverage

The test suite covers:

- ✅ **Upload & Multi-user Scans**: Document upload and user isolation
- ✅ **Content Validation**: File type and content verification
- ✅ **Polling & Downloads**: Status checking and report generation
- ✅ **Support System**: Contact forms and analysis reporting
- ✅ **AI Chat**: Document context chat functionality
- ✅ **Legacy Routes**: Backward compatibility

### Test Data

Tests use mock data and don't require real AI API keys. All external dependencies are mocked using `pytest` fixtures.

## 🔒 Security Features

### Authentication
- Supabase JWT token validation
- User session management
- Automatic token refresh

### Rate Limiting
- Per-user and per-IP limits
- Configurable time windows
- Redis-like in-memory storage

### Audit Logging
- Structured JSON logging
- Request/response tracking
- Security event monitoring
- User activity trails

### Input Validation
- File type validation
- Content sanitization
- SQL injection prevention
- XSS protection

### Security Headers
```python
{
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-XSS-Protection": "1; mode=block"
}
```

## 📧 Email Configuration

### SMTP Setup

The backend supports SMTP for:
- Magic link authentication (via Supabase)
- Support request notifications
- User confirmation emails

### Gmail Configuration

1. Enable 2FA on your Gmail account
2. Generate an App Password
3. Configure environment variables:

```env
SUPPORT_EMAIL=your-email@gmail.com
SUPPORT_EMAIL_PASSWORD=your-16-digit-app-password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
```

### Alternative SMTP Providers

```env
# Outlook/Hotmail
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587

# SendGrid
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
```

## 🚀 Deployment

### Docker

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables

Production requires all environment variables from the `.env.example` file.

### Health Check

```bash
# Health check endpoint
curl http://localhost:8000/health

# Ready check
curl http://localhost:8000/ready
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

### Metrics

- Request duration tracking
- Error rate monitoring
- Rate limiting statistics
- AI pipeline performance

## 🔄 Job Queue

### Async Processing

Document analysis runs asynchronously:

1. **Upload**: Document is queued for processing
2. **Processing**: AI pipeline analyzes the document
3. **Completion**: Results are stored and available via API
4. **Cleanup**: Temporary files are removed

### Queue Management

```python
# Start job worker
from services.job_queue import start_job_worker
await start_job_worker()

# Stop job worker
from services.job_queue import stop_job_worker
await stop_job_worker()
```

## 🤝 Contributing

### Development Setup

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run pre-commit hooks
pre-commit run --all-files

# Run tests with coverage
pytest --cov=.
```

### Code Standards

- Python 3.12+ type hints
- Black code formatting
- Ruff linting
- 100% test coverage for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.vaurex.com](https://docs.vaurex.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/vaurex/issues)
- **Email**: support@vaurex.com

---

<div align="center">

**Built with ❤️ by the Vaurex Team**

[![Python](https://img.shields.io/badge/Python-3.12+-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green)](https://fastapi.tiangolo.com/)

</div>
