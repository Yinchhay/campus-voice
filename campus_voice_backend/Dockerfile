FROM python:3.12-slim AS base

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# --- dev ---
FROM base AS dev
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# --- prod ---
FROM base AS prod
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--max-requests", "1000", \
     "--max-requests-jitter", "50", \
     "--timeout", "120"]