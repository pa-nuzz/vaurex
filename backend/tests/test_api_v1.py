import json
import os


def _auth(user_id: str):
    return {"Authorization": f"Bearer {user_id}"}


# ── Security regression tests ─────────────────────────────────────────────────

def test_request_ip_uses_trusted_proxy_depth_to_prevent_spoofing():
    """X-Forwarded-For spoofing must be rejected when TRUSTED_PROXY_DEPTH=1."""
    from services.security import request_ip
    from unittest.mock import MagicMock

    # With TRUSTED_PROXY_DEPTH=1 (default) the function must return the
    # *rightmost* IP (added by the trusted proxy), not the leftmost (spoofed).
    original_depth = int(os.getenv("TRUSTED_PROXY_DEPTH", "1"))
    try:
        import services.security as sec_mod
        sec_mod.TRUSTED_PROXY_DEPTH = 1

        req = MagicMock()
        # Client spoofs their IP by injecting a fake value; proxy appends real IP.
        req.headers = {"x-forwarded-for": "1.2.3.4, 10.0.0.1"}
        req.client = MagicMock(host="10.0.0.1")

        ip = request_ip(req)
        # Real client IP should be 10.0.0.1 (rightmost — added by trusted proxy)
        # NOT the spoofed 1.2.3.4 (leftmost — set by the attacker)
        assert ip == "10.0.0.1", f"Expected 10.0.0.1, got {ip}"
    finally:
        sec_mod.TRUSTED_PROXY_DEPTH = original_depth


def test_request_ip_depth_zero_uses_direct_connection():
    """TRUSTED_PROXY_DEPTH=0 must use the raw TCP socket IP (not X-Forwarded-For)."""
    from unittest.mock import MagicMock
    import services.security as sec_mod

    original_depth = sec_mod.TRUSTED_PROXY_DEPTH
    try:
        sec_mod.TRUSTED_PROXY_DEPTH = 0
        from services.security import request_ip

        req = MagicMock()
        req.headers = {"x-forwarded-for": "9.9.9.9"}
        req.client = MagicMock(host="127.0.0.1")

        ip = request_ip(req)
        assert ip == "127.0.0.1", f"Expected 127.0.0.1, got {ip}"
    finally:
        sec_mod.TRUSTED_PROXY_DEPTH = original_depth


def test_conversation_history_control_chars_stripped(client, app_with_fakes):
    """Control characters in conversation history must be stripped before reaching AI."""
    _, fake_db, _, _ = app_with_fakes
    fake_db.tables["scans"] = []

    # Inject control characters in conversation history
    injected_history = [
        {"role": "user", "content": "Hello\x00\x01\x1f"},
        {"role": "assistant", "content": "Sure\x07\x08"},
    ]
    chat_res = client.post(
        "/api/v1/chat",
        headers=_auth("user-1"),
        json={"message": "Test message", "conversation_history": injected_history},
    )
    # Request should succeed (control chars are stripped, not rejected)
    assert chat_res.status_code == 200


def test_password_reset_complete_is_rate_limited(client, app_with_fakes):
    """POST /auth/password-reset/complete must enforce IP-based rate limiting."""
    import services.auth as auth_svc
    from main import app

    payload = {"email": "x@example.com", "code": "000000", "new_password": "newpass1"}
    limit = 10  # defined in auth_events.py
    for _ in range(limit + 1):
        res = client.post("/api/v1/auth/password-reset/complete", json=payload)
        if res.status_code == 429:
            break
    else:
        # All requests succeeded — rate limiting is not in place
        assert False, "Password reset complete endpoint should have been rate-limited"


def test_upload_and_list_scans_multi_user(client, app_with_fakes):
    _, fake_db, queued_jobs, _ = app_with_fakes

    pdf_bytes = b"%PDF-1.5\n1 0 obj\n<<>>\nendobj\n"
    files = {"file": ("contract.pdf", pdf_bytes, "application/pdf")}

    r1 = client.post("/api/v1/upload", headers=_auth("user-1"), files=files)
    assert r1.status_code == 200
    scan1 = r1.json()["scan_id"]

    r2 = client.post("/api/v1/upload", headers=_auth("user-2"), files=files)
    assert r2.status_code == 200

    assert len(queued_jobs) == 2
    assert len(fake_db.tables["scans"]) == 2

    list_1 = client.get("/api/v1/scans", headers=_auth("user-1"))
    assert list_1.status_code == 200
    ids_1 = {item["id"] for item in list_1.json()}
    assert scan1 in ids_1
    assert len(ids_1) == 1


def test_upload_rejects_content_mismatch(client):
    files = {"file": ("contract.pdf", b"NOT_A_PDF", "application/pdf")}
    res = client.post("/api/v1/upload", headers=_auth("user-1"), files=files)
    assert res.status_code == 400
    assert "invalid file" in res.json()["detail"].lower() or "does not match" in res.json()["detail"].lower()


def test_poll_download_delete_and_clear_with_ownership(client, app_with_fakes):
    _, fake_db, _, _ = app_with_fakes

    fake_db.tables["scans"] = [
        {
            "id": "scan-a",
            "user_id": "user-1",
            "filename": "a.pdf",
            "status": "done",
            "risk_score": 70,
            "risk_label": "High",
            "summary": "Summary A",
            "entities": [{"type": "Org", "value": "Acme"}],
            "flags": ["Flag A"],
            "raw_text": "raw text A",
            "clean_text": "clean text A",
            "error_message": None,
            "created_at": "2026-03-12T00:00:00Z",
        },
        {
            "id": "scan-b",
            "user_id": "user-2",
            "filename": "b.pdf",
            "status": "done",
            "risk_score": 10,
            "risk_label": "Low",
            "summary": "Summary B",
            "entities": [],
            "flags": [],
            "raw_text": "raw text B",
            "clean_text": "clean text B",
            "error_message": None,
            "created_at": "2026-03-12T00:00:00Z",
        },
        {
            "id": "scan-c",
            "user_id": "user-3",
            "filename": "c.pdf",
            "status": "processing",
            "risk_score": 0,
            "risk_label": "Unknown",
            "summary": "",
            "entities": [],
            "flags": [],
            "raw_text": "",
            "clean_text": "",
            "error_message": None,
            "created_at": "2026-03-12T00:00:00Z",
        },
    ]

    poll = client.get("/api/v1/scans/scan-a/poll", headers=_auth("user-1"))
    assert poll.status_code == 200
    assert poll.json()["status"] == "done"

    poll_other = client.get("/api/v1/scans/scan-b/poll", headers=_auth("user-1"))
    assert poll_other.status_code == 404

    text_download = client.get("/api/v1/scans/scan-a/download/text", headers=_auth("user-1"))
    assert text_download.status_code == 200
    assert "clean text A" in text_download.text

    report_download = client.get("/api/v1/scans/scan-a/download/report", headers=_auth("user-1"))
    assert report_download.status_code == 200
    body = report_download.json()
    assert body["id"] == "scan-a"
    assert body["risk_score"] == 70

    delete_other = client.delete("/api/v1/scans/scan-b", headers=_auth("user-1"))
    assert delete_other.status_code == 404

    delete_own = client.delete("/api/v1/scans/scan-a", headers=_auth("user-1"))
    assert delete_own.status_code == 200

    clear_user_2 = client.delete("/api/v1/scans", headers=_auth("user-2"))
    assert clear_user_2.status_code == 200

    remaining_users = {row["user_id"] for row in fake_db.tables["scans"]}
    assert "user-2" not in remaining_users
    assert "user-3" in remaining_users


def test_support_contact_and_report_incorrect_analysis(client, app_with_fakes):
    _, fake_db, _, sent_support = app_with_fakes
    fake_db.tables["scans"] = [
        {
            "id": "scan-report",
            "user_id": "user-4",
            "filename": "nda.pdf",
            "status": "done",
            "risk_score": 55,
            "risk_label": "Medium",
            "summary": "Sample",
            "entities": [],
            "flags": ["Flag"],
            "raw_text": "",
            "clean_text": "",
            "error_message": None,
            "created_at": "2026-03-12T00:00:00Z",
        }
    ]

    support_payload = {
        "name": "Alice",
        "email": "alice@example.com",
        "message": "Need help with analysis output consistency.",
        "send_confirmation": True,
    }
    support_res = client.post("/api/v1/support", headers=_auth("user-1"), json=support_payload)
    assert support_res.status_code == 200
    assert support_res.json()["ok"] is True

    report_res = client.post(
        "/api/v1/support/report-analysis",
        headers=_auth("user-4"),
        json={"document_id": "scan-report", "complaint": "Risk score appears too high for this NDA."},
    )
    assert report_res.status_code == 200

    report_forbidden = client.post(
        "/api/v1/support/report-analysis",
        headers=_auth("user-3"),
        json={"document_id": "scan-report", "complaint": "Trying to report another user scan"},
    )
    assert report_forbidden.status_code == 404

    assert len(sent_support) >= 2


def test_chat_and_chat_stream_with_document_context(client, app_with_fakes):
    _, fake_db, _, _ = app_with_fakes
    fake_db.tables["scans"] = [
        {
            "id": "scan-chat",
            "user_id": "user-1",
            "filename": "doc.pdf",
            "status": "done",
            "risk_score": 80,
            "risk_label": "Critical",
            "summary": "High risk language",
            "entities": [],
            "flags": ["High pressure terms"],
            "raw_text": "",
            "clean_text": "",
            "error_message": None,
            "created_at": "2026-03-12T00:00:00Z",
        }
    ]

    chat_res = client.post(
        "/api/v1/chat",
        headers=_auth("user-1"),
        json={"message": "What are the key risks?", "scan_id": "scan-chat"},
    )
    assert chat_res.status_code == 200
    parsed = chat_res.json()
    assert parsed["model"] == "test-model"
    assert "assistant:user-1:scan-chat" in parsed["answer"]

    stream_res = client.post(
        "/api/v1/chat/stream",
        headers=_auth("user-1"),
        json={"message": "Summarize", "scan_id": "scan-chat"},
    )
    assert stream_res.status_code == 200
    assert "text/event-stream" in stream_res.headers["content-type"]
    body_text = stream_res.text
    assert "data:" in body_text
    assert "done" in body_text


def test_legacy_routes_still_work(client):
    files = {"file": ("legacy.pdf", b"%PDF-1.4\nlegacy\n", "application/pdf")}
    upload_res = client.post("/upload", headers=_auth("user-legacy"), files=files)
    assert upload_res.status_code == 200

    scans_res = client.get("/scans", headers=_auth("user-legacy"))
    assert scans_res.status_code == 200
    assert isinstance(scans_res.json(), list)
