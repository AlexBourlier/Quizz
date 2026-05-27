#!/bin/bash
# Deployment script — run on o2switch server after git pull
# Usage: bash deploy.sh

set -e

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$HOME/api.quizz.alexandrebourlier.fr"
FRONTEND_DIR="$HOME/quizz.alexandrebourlier.fr"

echo "=== Déploiement QuizzTest ==="
echo ""

# ── Backend ───────────────────────────────────────────────────────────────────
echo "[1/4] Copie des fichiers backend..."
rsync -av --delete \
  --exclude 'node_modules' \
  --exclude 'src' \
  --exclude '.env' \
  --exclude 'dataset' \
  "$REPO_DIR/backend/" "$BACKEND_DIR/"

echo "[2/4] Installation des dépendances backend..."
cd "$BACKEND_DIR"
npm install --omit=dev

echo "[3/4] Application des migrations..."
npx prisma migrate deploy

# ── Frontend ──────────────────────────────────────────────────────────────────
echo "[4/4] Copie des fichiers frontend..."
rsync -av --delete "$REPO_DIR/frontend/dist/" "$FRONTEND_DIR/"

# ── Restart Passenger ─────────────────────────────────────────────────────────
mkdir -p "$BACKEND_DIR/tmp"
touch "$BACKEND_DIR/tmp/restart.txt"

echo ""
echo "=== Déploiement terminé ==="
echo "Backend  : https://api.quizz.alexandrebourlier.fr"
echo "Frontend : https://quizz.alexandrebourlier.fr"
