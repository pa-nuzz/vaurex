"""
Production monitoring and metrics collection service.
"""
import time
import logging
from typing import Dict, Any, Optional
from contextlib import asynccontextmanager
from fastapi import Request, Response
from collections import defaultdict, deque
import threading

# Optional psutil import for system metrics
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

logger = logging.getLogger(__name__)

class MetricsCollector:
    """Collects and stores application metrics."""
    
    def __init__(self):
        self.request_counts = defaultdict(int)
        self.request_durations = deque(maxlen=1000)
        self.error_counts = defaultdict(int)
        self.start_time = time.time()
        self._lock = threading.Lock()
    
    def record_request(self, method: str, path: str, status_code: int, duration: float):
        """Record a request metric."""
        with self._lock:
            key = f"{method} {path}"
            self.request_counts[key] += 1
            self.request_durations.append(duration)
            
            if status_code >= 400:
                self.error_counts[key] += 1
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current metrics."""
        with self._lock:
            total_requests = sum(self.request_counts.values())
            total_errors = sum(self.error_counts.values())
            
            # Calculate percentiles for request duration
            durations = list(self.request_durations)
            if durations:
                durations.sort()
                n = len(durations)
                p50 = durations[n // 2] if n > 0 else 0
                p95 = durations[int(n * 0.95)] if n > 0 else 0
                p99 = durations[int(n * 0.99)] if n > 0 else 0
                avg_duration = sum(durations) / n
            else:
                p50 = p95 = p99 = avg_duration = 0
            
            # System metrics
            if PSUTIL_AVAILABLE:
                cpu_percent = psutil.cpu_percent()
                memory = psutil.virtual_memory()
                disk = psutil.disk_usage('/')
                
                system_metrics = {
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_available_gb": memory.available / (1024**3),
                    "disk_percent": disk.percent,
                    "disk_free_gb": disk.free / (1024**3)
                }
            else:
                system_metrics = {
                    "cpu_percent": 0,
                    "memory_percent": 0,
                    "memory_available_gb": 0,
                    "disk_percent": 0,
                    "disk_free_gb": 0,
                    "note": "psutil not available"
                }
            
            uptime = time.time() - self.start_time
            
            return {
                "uptime_seconds": uptime,
                "requests": {
                    "total": total_requests,
                    "errors": total_errors,
                    "error_rate": total_errors / total_requests if total_requests > 0 else 0,
                    "by_endpoint": dict(self.request_counts)
                },
                "duration": {
                    "avg": avg_duration,
                    "p50": p50,
                    "p95": p95,
                    "p99": p99
                },
                "system": system_metrics
            }

# Global metrics collector
metrics = MetricsCollector()

@asynccontextmanager
async def request_timing(request: Request):
    """Context manager to time request duration."""
    start_time = time.time()
    try:
        yield
    finally:
        duration = time.time() - start_time
        method = request.method
        path = request.url.path
        # Get status code from response if available
        status_code = getattr(request.state, 'status_code', 200)
        metrics.record_request(method, path, status_code, duration)

def setup_monitoring_middleware(app):
    """Add monitoring middleware to FastAPI app."""
    
    @app.middleware("http")
    async def monitoring_middleware(request: Request, call_next):
        async with request_timing(request):
            response = await call_next(request)
            # Store status code for metrics collection
            request.state.status_code = response.status_code
            return response
    
    @app.get("/metrics")
    async def get_metrics():
        """Endpoint to expose metrics for monitoring systems."""
        return metrics.get_metrics()
    
    @app.get("/health/detailed")
    async def detailed_health():
        """Detailed health check with metrics."""
        metrics_data = metrics.get_metrics()
        
        # Determine health status
        status = "healthy"
        issues = []
        
        if PSUTIL_AVAILABLE:
            if metrics_data["system"]["cpu_percent"] > 90:
                status = "degraded"
                issues.append("High CPU usage")
            
            if metrics_data["system"]["memory_percent"] > 90:
                status = "degraded"
                issues.append("High memory usage")
        else:
            issues.append("System monitoring not available (psutil missing)")
        
        if metrics_data["requests"]["error_rate"] > 0.1:
            status = "unhealthy"
            issues.append("High error rate")
        
        return {
            "status": status,
            "issues": issues,
            "metrics": metrics_data,
            "timestamp": time.time()
        }

def log_error_with_context(request: Request, error: Exception, context: Dict[str, Any] = None):
    """Log error with request context and metrics."""
    error_data = {
        "error_type": type(error).__name__,
        "error_message": str(error),
        "method": request.method,
        "path": request.url.path,
        "client_ip": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown"),
        "context": context or {}
    }
    
    logger.error(
        "request.error",
        extra=error_data,
        exc_info=True
    )
