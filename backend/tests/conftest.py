import os
from dataclasses import dataclass
from typing import Any

import os
import sys

import pytest
from fastapi import Request
from fastapi.testclient import TestClient

# NOTE: These are NON-SECRET test placeholder values only.
# They match the format expected by Supabase but are not real credentials.
# Real keys must ONLY exist in backend/.env and must NEVER be committed to git.
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-placeholder-not-a-real-key")


@dataclass
class _Result:
    data: Any


class _Query:
    def __init__(self, db: "FakeSupabase", table: str, op: str):
        self.db = db
        self.table_name = table
        self.op = op
        self._filters: list[tuple[str, Any]] = []
        self._order: tuple[str, bool] | None = None
        self._limit: int | None = None
        self._single = False
        self._payload: Any = None

    def select(self, _: str):
        self.op = "select"
        return self

    def eq(self, key: str, value: Any):
        self._filters.append((key, value))
        return self

    def order(self, key: str, desc: bool = False):
        self._order = (key, desc)
        return self

    def limit(self, n: int):
        self._limit = n
        return self

    def single(self):
        self._single = True
        return self

    def insert(self, payload: dict):
        self.op = "insert"
        self._payload = payload
        return self

    def update(self, payload: dict):
        self.op = "update"
        self._payload = payload
        return self

    def delete(self):
        self.op = "delete"
        return self

    def _rows(self):
        rows = list(self.db.tables[self.table_name])
        for key, value in self._filters:
            rows = [row for row in rows if row.get(key) == value]
        if self._order:
            key, desc = self._order
            rows = sorted(rows, key=lambda r: r.get(key), reverse=desc)
        if self._limit is not None:
            rows = rows[: self._limit]
        return rows

    def execute(self):
        if self.op == "insert":
            self.db.tables[self.table_name].append(dict(self._payload))
            return _Result([self._payload])

        if self.op == "select":
            rows = self._rows()
            if self._single:
                return _Result(rows[0] if rows else None)
            return _Result(rows)

        if self.op == "update":
            rows = self._rows()
            for row in rows:
                row.update(self._payload)
            return _Result(rows)

        if self.op == "delete":
            rows = self._rows()
            ids = {id(r) for r in rows}
            self.db.tables[self.table_name] = [r for r in self.db.tables[self.table_name] if id(r) not in ids]
            return _Result(rows)

        return _Result([])


class FakeSupabase:
    def __init__(self):
        self.tables = {"scans": []}

    def table(self, name: str):
        return _Query(self, name, "select")


@pytest.fixture
def app_with_fakes(monkeypatch):
    # Ensure backend root is on sys.path so `import main` resolves reliably
    backend_root = os.path.dirname(os.path.dirname(__file__))
    if backend_root not in sys.path:
        sys.path.insert(0, backend_root)

    import main
    import routes.scans as scans_route
    import routes.upload as upload_route
    import routes.support as support_route
    import routes.chat as chat_route
    import services.auth as auth_service

    fake_db = FakeSupabase()

    monkeypatch.setattr(scans_route, "supabase", fake_db)
    monkeypatch.setattr(upload_route, "supabase", fake_db)
    monkeypatch.setattr(support_route, "supabase", fake_db)
    monkeypatch.setattr(chat_route, "supabase", fake_db)

    queued_jobs: list[dict[str, Any]] = []

    def _enqueue(**kwargs):
        queued_jobs.append(kwargs)

    monkeypatch.setattr(upload_route, "enqueue_scan_job", _enqueue)

    sent_support: list[dict[str, Any]] = []

    def _send_support_email(subject: str, body: str, reply_to: str | None = None):
        sent_support.append({"subject": subject, "body": body, "reply_to": reply_to})

    def _send_confirmation(recipient: str, request_id: str):
        sent_support.append({"confirmation": recipient, "request_id": request_id})

    monkeypatch.setattr(support_route, "is_support_email_enabled", lambda: True)
    monkeypatch.setattr(support_route, "send_support_email", _send_support_email)
    monkeypatch.setattr(support_route, "send_user_confirmation_email", _send_confirmation)

    async def _fake_resolve(user_id: str, payload):
        return (f"assistant:{user_id}:{payload.scan_id or 'general'}:{payload.message}", "test-model")

    monkeypatch.setattr(chat_route, "_resolve_chat_answer", _fake_resolve)

    async def _fake_current_user(request: Request):
        token = request.headers.get("Authorization", "Bearer user-1").replace("Bearer ", "").strip()
        return {"id": token, "email": f"{token}@example.com", "request": request}

    app = main.app
    app.dependency_overrides[auth_service.get_current_user] = _fake_current_user

    yield app, fake_db, queued_jobs, sent_support

    app.dependency_overrides.clear()


@pytest.fixture
def client(app_with_fakes):
    app, *_ = app_with_fakes
    with TestClient(app) as c:
        yield c