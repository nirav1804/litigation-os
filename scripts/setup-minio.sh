#!/bin/sh
# Run this after docker compose up to create the MinIO bucket
# Usage: ./scripts/setup-minio.sh

set -e

MINIO_USER=${MINIO_ROOT_USER:-minioadmin}
MINIO_PASS=${MINIO_ROOT_PASSWORD:-minioadmin123}
BUCKET=${S3_BUCKET:-litigation-os}
ENDPOINT=http://localhost:9000

echo "⏳ Waiting for MinIO to be ready..."
until curl -sf ${ENDPOINT}/minio/health/live > /dev/null 2>&1; do
  sleep 2
done
echo "✅ MinIO is ready"

# Install mc if not present
if ! command -v mc &> /dev/null; then
  echo "📦 Installing MinIO client..."
  curl -sf https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc
  chmod +x /usr/local/bin/mc
fi

mc alias set local ${ENDPOINT} ${MINIO_USER} ${MINIO_PASS} --api S3v4 2>/dev/null

# Create bucket if it doesn't exist
if mc ls local/${BUCKET} > /dev/null 2>&1; then
  echo "✅ Bucket '${BUCKET}' already exists"
else
  mc mb local/${BUCKET}
  echo "✅ Created bucket '${BUCKET}'"
fi

# Set bucket policy to private (no public access)
mc anonymous set none local/${BUCKET}
echo "✅ Bucket policy set to private"
echo ""
echo "🎉 MinIO setup complete!"
