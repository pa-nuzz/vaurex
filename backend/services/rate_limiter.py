import time
import threading
from collections import defaultdict, deque


class SlidingWindowRateLimiter:
    """Thread-safe sliding-window in-memory rate limiter."""

    def __init__(self):
        self._events = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key: str, limit: int, window_seconds: int) -> tuple[bool, int]:
        now = time.time()
        cutoff = now - window_seconds

        with self._lock:
            bucket = self._events[key]
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()

            if len(bucket) >= limit:
                retry_after = int(max(1, bucket[0] + window_seconds - now))
                return False, retry_after

            bucket.append(now)
            return True, 0


GLOBAL_RATE_LIMITER = SlidingWindowRateLimiter()
