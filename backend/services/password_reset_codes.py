import hashlib
import os
import secrets
import sqlite3
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BASE_DIR / "password_reset.sqlite3"
TTL_SECONDS = int(os.getenv("PASSWORD_RESET_CODE_TTL_SECONDS", "900"))
MAX_ATTEMPTS = int(os.getenv("PASSWORD_RESET_MAX_ATTEMPTS", "8"))


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_password_reset_store() -> None:
    with _get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS password_reset_codes (
                email TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                code_hash TEXT NOT NULL,
                expires_at REAL NOT NULL,
                attempts INTEGER NOT NULL DEFAULT 0,
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_codes(expires_at)")
        conn.commit()


def _normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def _hash_code(email: str, code: str) -> str:
    secret = os.getenv("PASSWORD_RESET_CODE_SECRET", os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""))
    payload = f"{_normalize_email(email)}:{code}:{secret}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def _cleanup_expired(conn: sqlite3.Connection) -> None:
    conn.execute("DELETE FROM password_reset_codes WHERE expires_at < ?", (time.time(),))


def generate_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def store_code(email: str, user_id: str, code: str) -> None:
    init_password_reset_store()
    normalized_email = _normalize_email(email)
    now = time.time()
    expires_at = now + TTL_SECONDS
    code_hash = _hash_code(normalized_email, code)

    with _get_conn() as conn:
        _cleanup_expired(conn)
        conn.execute(
            """
            INSERT INTO password_reset_codes (email, user_id, code_hash, expires_at, attempts, created_at, updated_at)
            VALUES (?, ?, ?, ?, 0, ?, ?)
            ON CONFLICT(email) DO UPDATE SET
                user_id=excluded.user_id,
                code_hash=excluded.code_hash,
                expires_at=excluded.expires_at,
                attempts=0,
                updated_at=excluded.updated_at
            """,
            (normalized_email, user_id, code_hash, expires_at, now, now),
        )
        conn.commit()


def verify_code(email: str, code: str) -> bool:
    init_password_reset_store()
    normalized_email = _normalize_email(email)
    candidate_hash = _hash_code(normalized_email, code)

    with _get_conn() as conn:
        _cleanup_expired(conn)
        row = conn.execute(
            "SELECT email, code_hash, attempts FROM password_reset_codes WHERE email = ?",
            (normalized_email,),
        ).fetchone()
        if not row:
            return False

        attempts = int(row["attempts"] or 0)
        if attempts >= MAX_ATTEMPTS:
            conn.execute("DELETE FROM password_reset_codes WHERE email = ?", (normalized_email,))
            conn.commit()
            return False

        if candidate_hash != row["code_hash"]:
            conn.execute(
                "UPDATE password_reset_codes SET attempts = attempts + 1, updated_at = ? WHERE email = ?",
                (time.time(), normalized_email),
            )
            conn.commit()
            return False

        return True


def consume_code(email: str, code: str) -> str | None:
    if not verify_code(email, code):
        return None

    normalized_email = _normalize_email(email)
    with _get_conn() as conn:
        row = conn.execute(
            "SELECT user_id FROM password_reset_codes WHERE email = ?",
            (normalized_email,),
        ).fetchone()
        if not row:
            return None

        user_id = row["user_id"]
        conn.execute("DELETE FROM password_reset_codes WHERE email = ?", (normalized_email,))
        conn.commit()
        return user_id
