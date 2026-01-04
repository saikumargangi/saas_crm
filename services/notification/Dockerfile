FROM python:3.11-slim

WORKDIR /app

# Copy shared dependencies
COPY shared/ /app/shared/

# Copy service files
COPY services/notification/ /app/services/notification/

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Set Python path
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8008

# Run the service
CMD ["python", "-m", "services.notification.main"]
