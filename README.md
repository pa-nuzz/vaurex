![alt text](<Vaurex preview.png>)

# «Vaurex - Document Intelligence Platform»

**AI-Powered Document Analysis & Risk Assessment Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.12+-blue)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.18-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green)](https://fastapi.tiangolo.com/)


</div>

## Features

### Core Capabilities
- **Document Analysis**: AI-powered risk scoring (0-100) for contracts and compliance documents
- **Entity Extraction**: Automatic extraction of companies, dates, amounts, and key parties
- **Compliance Checking**: GDPR, SOC 2, HIPAA, and custom framework compliance monitoring
- **AI Chat Assistant**: Interactive document Q&A with intelligent responses
- **Knowledge Base**: Organize and query document collections
- **PWA Ready**: Install as a native app with offline capabilities

### Pipeline
- **Multi-Model Approach**: Gemini 2.0 Flash, Groq Llama-3.3-70b, OpenRouter DeepSeek-V3
- **Advanced OCR**: Text extraction with vision model fallbacks
- **Risk Assessment**: Evidence-based scoring with detailed reasoning
- **Context-Aware Chat**: Document-specific AI conversations

### Security 

- **Security Headers**: CSP, HSTS, XSS protection, and more
- **Authentication**: Supabase-based auth with social providers
- **Data Protection**: Encrypted storage and secure API communication
- **Audit Trails**: Complete logging and monitoring system
- **Rate Limiting**: Configurable limits per endpoint and user

## Architecture

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

#### Infra
- **Monitoring**: Structured JSON logging
- **Security**: Rate limiting, audit trails
- **Testing**: Pytest with 100% coverage


## Quick Start

### Requires:
- Node.js 18+
- Python 3.12+
- PostgreSQL (via Supabase)
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/pa-nuzz/vaurex.git
cd vaurex

# Frontend Setup
cd frontend npm install
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
cd backend uvicorn main:app --reload --port 8080(port)

# Start Frontend (new/split yo terminal)
cd frontend
npm run dev
```

### Environment Configuration

#### Backend (.env)
```env
# AI Providers
DEEPSEEK_API_KEY=your_deepseek_key(optional)
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

# Optional server/runtime values used by Next middleware
# (recommended to set in production; do not expose service-role keys here)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
BACKEND_URL=http://localhost:8080
```

### Rate Limits

| Endpoint | Limit | Period |
|----------|-------|--------|
| Upload | 12 requests | 1 minute |
| Scans | 120 requests | 1 minute |
| Chat | 45 requests | 1 minute |
| Support | 20 requests | 1 minute |

## Testing

### Backend Tests
```bash
cd backend pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test
pytest tests/test_api_v1.py::test_upload_and_list_scans_multi_user
```

### Frontend Tests
```bash
cd frontend npm test
```

## Security

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


## Email Configuration

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


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.



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

**Built with 🗿 by the Vaurex Team**(ONLY ME DWAG😔)

</div>
