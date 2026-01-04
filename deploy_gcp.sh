#!/bin/bash
set -e

# Configuration
PROJECT_ID="your-project-id"
REGION="us-central1"
DB_INSTANCE="crm-db-instance"
DB_NAME="crm_db"
DB_USER="crm_user"
REDIS_IP="10.0.0.3" # Replace with actual Redis Instance IP from gcloud output

echo "--- Deploying CRM System to GCP ---"

# Check Gcloud Authentication
echo "Checking gcloud authentication..."
gcloud auth print-access-token > /dev/null 2>&1 || (echo "Please run 'gcloud auth login'" && exit 1)

# Backend Build & Deploy
echo "Building Backend..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/crm-backend . -f docker/backend.Dockerfile

echo "Deploying Backend to Cloud Run..."
gcloud run deploy crm-backend \
  --image gcr.io/$PROJECT_ID/crm-backend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --add-cloudsql-instances $PROJECT_ID:$REGION:$DB_INSTANCE \
  --set-env-vars DATABASE_URL="postgresql+asyncpg://$DB_USER:password@/$DB_NAME?host=/cloudsql/$PROJECT_ID:$REGION:$DB_INSTANCE" \
  --set-env-vars REDIS_URL="redis://$REDIS_IP:6379"

# Get Backend URL
BACKEND_URL=$(gcloud run services describe crm-backend --platform managed --region $REGION --format 'value(status.url)')
echo "Backend URL: $BACKEND_URL"

# Frontend Build & Deploy
echo "Building Frontend..."
# Note: In production build, we might need to inject env vars differently or use runtime config
# For this guide, assuming basic ENV injection at build or runtime
cd web
gcloud builds submit --tag gcr.io/$PROJECT_ID/crm-frontend . --build-arg NEXT_PUBLIC_API_URL=$BACKEND_URL/api/v1
cd ..

echo "Deploying Frontend to Cloud Run..."
gcloud run deploy crm-frontend \
  --image gcr.io/$PROJECT_ID/crm-frontend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_API_URL="$BACKEND_URL/api/v1"

echo "--- Deployment Complete ---"
echo "Backend URL: $BACKEND_URL"
FRONTEND_URL=$(gcloud run services describe crm-frontend --platform managed --region $REGION --format 'value(status.url)')
echo "Frontend URL: $FRONTEND_URL"
