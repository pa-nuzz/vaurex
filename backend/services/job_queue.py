import os
import json
import time
import sqlite3
import asyncio
import logging
from pathlib import Path
from typing import Optional

from ai_pipeline import analyze_document
from services.scan_store import safe_set_error_status, safe_update_scan

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parents[1]
QUEUE_DB_PATH = BASE_DIR / "job_queue.sqlite3"
PAYLOAD_DIR = BASE_DIR / "job_payloads"
MAX_ATTEMPTS = int(os.getenv("JOB_QUEUE_MAX_ATTEMPTS", "3"))
WORKER_POLL_SECONDS = float(os.getenv("JOB_QUEUE_POLL_SECONDS", "1.0"))

_worker_task: Optional[asyncio.Task] = None
_stop_event: Optional[asyncio.Event] = None


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(QUEUE_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_job_queue() -> None:
    PAYLOAD_DIR.mkdir(parents=True, exist_ok=True)
    with _get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS jobs (
                scan_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                filename TEXT NOT NULL,
                content_type TEXT NOT NULL,
                payload_path TEXT NOT NULL,
                attempts INTEGER NOT NULL DEFAULT 0,
                next_run_at REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                last_error TEXT,
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL
            )
            """
        )
        conn.commit()


def enqueue_scan_job(
    scan_id: str,
    user_id: str,
    filename: str,
    content_type: str,
    content: bytes,
) -> None:
    payload_path = PAYLOAD_DIR / f"{scan_id}.bin"
    payload_path.write_bytes(content)

    now = time.time()
    with _get_conn() as conn:
        conn.execute(
            """
            INSERT INTO jobs (scan_id, user_id, filename, content_type, payload_path, next_run_at, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
            ON CONFLICT(scan_id) DO UPDATE SET
              user_id=excluded.user_id,
              filename=excluded.filename,
              content_type=excluded.content_type,
              payload_path=excluded.payload_path,
              next_run_at=excluded.next_run_at,
              status='pending',
              updated_at=excluded.updated_at
            """,
            (scan_id, user_id, filename, content_type, str(payload_path), now, now, now),
        )
        conn.commit()


def _fetch_next_job() -> Optional[sqlite3.Row]:
    now = time.time()
    with _get_conn() as conn:
        row = conn.execute(
            """
            SELECT * FROM jobs
            WHERE status = 'pending' AND next_run_at <= ?
            ORDER BY created_at ASC
            LIMIT 1
            """,
            (now,),
        ).fetchone()
        if not row:
            return None

        conn.execute(
            """
            UPDATE jobs
            SET status = 'processing', attempts = attempts + 1, updated_at = ?
            WHERE scan_id = ?
            """,
            (now, row["scan_id"]),
        )
        conn.commit()
        return row


def _mark_done(scan_id: str) -> None:
    with _get_conn() as conn:
        conn.execute("DELETE FROM jobs WHERE scan_id = ?", (scan_id,))
        conn.commit()


def _mark_retry(scan_id: str, attempts: int, error: str) -> None:
    delay = min(300, (2 ** max(0, attempts - 1)) * 10)
    next_run_at = time.time() + delay
    with _get_conn() as conn:
        conn.execute(
            """
            UPDATE jobs
            SET status = 'pending', next_run_at = ?, last_error = ?, updated_at = ?
            WHERE scan_id = ?
            """,
            (next_run_at, error[:500], time.time(), scan_id),
        )
        conn.commit()


def _mark_failed(scan_id: str, error: str) -> None:
    with _get_conn() as conn:
        conn.execute(
            """
            UPDATE jobs
            SET status = 'failed', last_error = ?, updated_at = ?
            WHERE scan_id = ?
            """,
            (error[:500], time.time(), scan_id),
        )
        conn.commit()


async def _process_job(row: sqlite3.Row) -> None:
    scan_id = row["scan_id"]
    user_id = row["user_id"]
    attempts = int(row["attempts"]) + 1
    payload_path = Path(row["payload_path"])

    logger.info(
        "queue.job.started",
        extra={"scan_id": scan_id, "user_id": user_id, "attempt": attempts},
    )

    try:
        if not payload_path.exists():
            raise FileNotFoundError(f"Missing payload file: {payload_path}")

        content = payload_path.read_bytes()
        result = await analyze_document(
            content,
            row["filename"],
            row["content_type"],
            scan_id=scan_id,
        )

        safe_update_scan(
            scan_id,
            {
                "status": "done",
                "risk_score": result.get("risk_score"),
                "risk_label": result.get("risk_label"),
                "summary": result.get("summary"),
                "entities": result.get("entities"),
                "flags": result.get("flags"),
                "raw_text": result.get("raw_text"),
                "clean_text": result.get("clean_text"),
            },
        )

        _mark_done(scan_id)
        try:
            payload_path.unlink(missing_ok=True)
        except Exception:
            pass

        logger.info(
            "queue.job.completed",
            extra={"scan_id": scan_id, "user_id": user_id, "attempt": attempts},
        )
    except Exception as exc:
        err = str(exc)
        logger.error(
            "queue.job.failed",
            extra={"scan_id": scan_id, "user_id": user_id, "attempt": attempts, "error": err},
            exc_info=True,
        )
        if attempts >= MAX_ATTEMPTS:
            _mark_failed(scan_id, err)
            safe_set_error_status(scan_id, err)
        else:
            _mark_retry(scan_id, attempts, err)


async def _worker_loop() -> None:
    assert _stop_event is not None
    while not _stop_event.is_set():
        row = await asyncio.to_thread(_fetch_next_job)
        if row is None:
            await asyncio.sleep(WORKER_POLL_SECONDS)
            continue
        await _process_job(row)


async def start_job_worker() -> None:
    global _worker_task, _stop_event
    if _worker_task and not _worker_task.done():
        return
    init_job_queue()
    _stop_event = asyncio.Event()
    _worker_task = asyncio.create_task(_worker_loop(), name="job-queue-worker")
    logger.info("queue.worker.started", extra={"db": str(QUEUE_DB_PATH)})


async def stop_job_worker() -> None:
    global _worker_task, _stop_event
    if not _worker_task:
        return
    assert _stop_event is not None
    _stop_event.set()
    _worker_task.cancel()
    try:
        await _worker_task
    except asyncio.CancelledError:
        pass
    _worker_task = None
    _stop_event = None
    logger.info("queue.worker.stopped")
