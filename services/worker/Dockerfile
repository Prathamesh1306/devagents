FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY shared /app/shared
COPY services /app/services
COPY alembic.ini /app/alembic.ini

ENV PYTHONPATH=/app

CMD ["celery", "-A", "services.worker.celery_app", "worker", "--loglevel=info"]
