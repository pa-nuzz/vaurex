from postgrest.exceptions import APIError

from services.supabase_client import supabase


def safe_update_scan(scan_id: str, payload: dict) -> None:
    """Retry update after dropping unknown columns from payload if needed."""
    data = dict(payload)
    for _ in range(6):
        try:
            supabase.table("scans").update(data).eq("id", scan_id).execute()
            return
        except APIError as e:
            message = str(e)
            if "column scans." in message and "does not exist" in message:
                missing = message.split("column scans.", 1)[1].split(" ", 1)[0]
                missing = missing.strip('"')
                if missing in data:
                    data.pop(missing)
                    continue
            raise


def safe_set_error_status(scan_id: str, error_message: str) -> None:
    """Set an error-like terminal status compatible with DB constraint."""
    for status in ["error", "failed", "failure"]:
        try:
            safe_update_scan(
                scan_id,
                {
                    "status": status,
                    "error_message": error_message[:500],
                },
            )
            return
        except APIError as e:
            if "scans_status_check" in str(e):
                continue
            raise
