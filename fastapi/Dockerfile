# ========================================
# Stage 1: Builder - Cài đặt dependencies
# ========================================
FROM python:3.11-slim AS builder

WORKDIR /app

# Copy requirements trước (để cache layer pip install)
COPY requirements.txt .

# Cài đặt pip packages vào /root/.local
RUN pip install --user --no-cache-dir -r requirements.txt && \
    pip install --user --no-cache-dir gunicorn uvicorn

# ========================================
# Stage 2: Runtime - Image cuối cùng
# ========================================
FROM python:3.11-slim

LABEL maintainer="raptor-search"
LABEL description="RAPTOR Transit Route Planner API for Hanoi"

WORKDIR /app

# Cài đặt các packages cần thiết cho runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy pip packages từ builder stage
COPY --from=builder /root/.local /root/.local

# Thiết lập PATH để dùng pip packages
ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PYTHONDONTWRITEBYTECODE=1

# Copy source code
COPY app/ ./app/

# Kiểm tra file OSM tồn tại
RUN if [ ! -f "/app/app/gtfs_hanoi/hanoi_extended_v2.osm.pbf" ]; then \
    echo "❌ ERROR: OSM file not found!" && \
    ls -la /app/app/gtfs_hanoi/ && \
    exit 1; \
    fi && \
    echo "✓ OSM file verified successfully"

# Đảm bảo quyền read/execute
RUN chmod -R 755 /app/app && \
    chmod 644 /app/app/gtfs_hanoi/*

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/docs || exit 1

# Run FastAPI with Uvicorn
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1", \
     "--log-level", "info", \
     "--access-log"]