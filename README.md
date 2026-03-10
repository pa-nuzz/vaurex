# Vaurex — Document Intelligence Platform

Drop any document. Get an instant AI intelligence report — risk scoring, entity extraction, executive summary.

## Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: FastAPI, Python
- **AI Pipeline**: Gemini 2.0 Flash (OCR) → Groq Llama-3.3-70b (NLP) → OpenRouter DeepSeek-V3 (fallback)
- **Database**: Supabase (PostgreSQL + Auth)

## Features

- Authenticated upload and private scan history
- Multi-strategy OCR and extraction
- AI fallback chain across providers
- Structured backend JSON logs with request IDs
- Request throttling for upload, scans, and auth checks
- Durable local job queue with retry/backoff
- Structured audit events for auth and scan access
- Supabase RLS and hardened scans schema

## Setup

### 1) Environment files

Backend:
- Copy [backend/.env.example](backend/.env.example) to [backend/.env](backend/.env)
- Fill in: `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL`
- Optional controls: `ENV`, `UPLOAD_RATE_LIMIT_PER_MIN`, `SCANS_RATE_LIMIT_PER_MIN`, `AUTH_RATE_LIMIT_PER_MIN`, `JOB_QUEUE_MAX_ATTEMPTS`, `JOB_QUEUE_POLL_SECONDS`

Frontend:
- Copy [frontend/.env.local.example](frontend/.env.local.example) to [frontend/.env.local](frontend/.env.local)
- Fill in: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BACKEND_URL`, `NEXT_PUBLIC_SITE_URL`

### 2) Database migration (Supabase)

Run the hardening migration in Supabase SQL Editor:
- [backend/migrations/20260311_scans_hardening.sql](backend/migrations/20260311_scans_hardening.sql)

For fresh installs, the canonical schema is:
- [backend/supabase_schema.sql](backend/supabase_schema.sql)

### 3) Backend

```bash
cd backend
python -m venv nagin
source nagin/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### 4) Frontend

```bash
cd frontend
npm install
npm run dev
```

## Observability

- Backend emits structured JSON logs
- Every response includes `X-Request-ID`
- Use request IDs to trace failures across logs and user reports
- Security/audit events are emitted with event, outcome, user_id, ip, and request_id

## Queue Model

- Upload requests enqueue jobs in a durable local SQLite queue
- Worker retries failed jobs with exponential backoff
- Queue artifacts are local runtime files and ignored by git

## Security Notes

- Never commit real secrets in `.env` or `.env.local`
- `.gitignore` is configured to keep local secrets and build artifacts out of git
- If any API key was pasted in chat/tools, rotate it immediately
