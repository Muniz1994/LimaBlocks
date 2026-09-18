# ---- builder: compile anything without a manylinux wheel (mathutils) ----
FROM python:3.12-slim AS builder

ENV PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /wheels

COPY requirements.txt .
RUN pip wheel --wheel-dir /wheels -r requirements.txt


# ---- runtime ----
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Shared libraries ifcopenshell (OpenCASCADE) and trimesh dlopen at import time.
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgl1 \
        libglib2.0-0 \
        libgomp1 \
        libsm6 \
        libxext6 \
        libxrender1 \
        unixodbc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /wheels /wheels
COPY requirements.txt .
RUN pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.txt \
    && rm -rf /wheels

COPY . .

EXPOSE 8000

# settings.py does `from constants import *`, so /app must stay the working
# directory for the project to import.
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
