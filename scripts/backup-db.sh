#!/usr/bin/env bash
# Sauvegarde horodatée de la base SQLite des commandes VIVRE BIO.
#
# Usage :
#   ./scripts/backup-db.sh
#
# Pour l'automatiser sur le VPS (une fois par jour à 3h du matin par
# exemple), ajouter cette ligne via `crontab -e` (en remplaçant le chemin
# par celui du projet sur le serveur) :
#
#   0 3 * * * cd /chemin/vers/vivre_bio && ./scripts/backup-db.sh >> /var/log/vivrebio-backup.log 2>&1
#
# Pour une vraie résilience, copier aussi ce dossier `backups/` (ou
# directement le fichier généré) vers un stockage hors du VPS (S3, un
# autre serveur via rsync/scp, etc.) — une sauvegarde qui reste sur le même
# disque que l'original ne protège pas contre une panne disque.

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="$PROJECT_DIR/data/vivrebio.db"
BACKUP_DIR="$PROJECT_DIR/backups"
RETENTION_DAYS=30

if [ ! -f "$DB_PATH" ]; then
  echo "Aucune base trouvée à $DB_PATH — rien à sauvegarder."
  exit 0
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
DEST="$BACKUP_DIR/vivrebio-$TIMESTAMP.db"

cp "$DB_PATH" "$DEST"
echo "Sauvegarde créée : $DEST"

find "$BACKUP_DIR" -name "vivrebio-*.db" -mtime "+$RETENTION_DAYS" -delete
echo "Sauvegardes de plus de $RETENTION_DAYS jours purgées."
