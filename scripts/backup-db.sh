#!/bin/bash
# Litigation OS — Database Backup Script
# Usage: ./scripts/backup-db.sh
# Cron: 0 2 * * * /opt/litigation-os/scripts/backup-db.sh

set -e

BACKUP_DIR=${BACKUP_DIR:-./backups}
DB_NAME=${DB_NAME:-litigation_os}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${POSTGRES_PASSWORD:-litigation_os_secret}
DB_HOST=${DB_HOST:-localhost}
RETENTION_DAYS=${RETENTION_DAYS:-30}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "🔄 Starting backup of ${DB_NAME}..."

PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h "${DB_HOST}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --no-password \
  --verbose \
  | gzip > "${BACKUP_FILE}"

echo "✅ Backup saved: ${BACKUP_FILE} ($(du -sh ${BACKUP_FILE} | cut -f1))"

# Delete old backups
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "🧹 Cleaned backups older than ${RETENTION_DAYS} days"

echo "🎉 Backup complete!"
