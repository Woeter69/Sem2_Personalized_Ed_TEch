# Use Python 3.11 slim image
FROM python:3.11-slim

# Set work directory
WORKDIR /app

# Install system dependencies (if any)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from the root (since it's common)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code
COPY backend/ ./backend/

# Expose port and run uvicorn
EXPOSE 8000

# Run uvicorn pointing to the main app
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
