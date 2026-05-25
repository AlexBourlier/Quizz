# Déploiement sur o2switch

## Architecture cible

```
https://www.votre-domaine.com      → Frontend (fichiers statiques dans public_html)
https://api.votre-domaine.com      → Backend Node.js (Phusion Passenger via cPanel)
```

---

## Étape 1 — Préparer la base de données MySQL

1. cPanel → **Bases de données MySQL**
2. Créer une base : `user_quizztest`
3. Créer un utilisateur MySQL avec un mot de passe fort
4. Assigner l'utilisateur à la base avec **tous les privilèges**
5. Noter les informations :
   - Host : `localhost`
   - Port : `3306`
   - User : `user_quizztest` (préfixe cPanel inclus)
   - Password : (le mot de passe créé)
   - Database : `user_quizztest`

---

## Étape 2 — Déployer le backend

### 2.1 Créer l'application Node.js dans cPanel

1. cPanel → **Setup Node.js App**
2. Cliquer **Create Application**
3. Remplir :
   - **Node.js version** : 18.x ou supérieur
   - **Application mode** : Production
   - **Application root** : `quizztest-backend`
   - **Application URL** : `api.votre-domaine.com`
   - **Application startup file** : `dist/server.js`
4. Cliquer **Create** — noter le port attribué automatiquement

### 2.2 Uploader les fichiers backend

Via SSH (recommandé) ou le Gestionnaire de fichiers cPanel :

```bash
# En local — compiler le TypeScript
cd backend
npm run build

# Uploader sur le serveur (adapter le chemin et l'utilisateur SSH)
rsync -avz --exclude='node_modules' --exclude='.env' --exclude='src' \
  dist/ package.json package-lock.json prisma/ \
  user@votre-domaine.com:~/quizztest-backend/
```

### 2.3 Configurer les variables d'environnement

Dans cPanel → Setup Node.js App → l'application → **Environment Variables**, ajouter :

| Variable | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `mysql://user:pass@localhost:3306/user_db` |
| `JWT_ACCESS_SECRET` | *(64 chars aléatoires — voir ci-dessous)* |
| `JWT_REFRESH_SECRET` | *(64 chars aléatoires)* |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | `https://www.votre-domaine.com` |
| `QUIZ_HINT_INTERVAL_MS` | `30000` |
| `QUIZ_QUESTION_TIMEOUT_MS` | `120000` |
| `QUIZ_ANSWER_COOLDOWN_MS` | `1000` |
| `MESSAGE_ENCRYPTION_KEY` | *(64 chars hex — voir ci-dessous)* |

Générer les secrets via SSH :
```bash
openssl rand -hex 32   # JWT_ACCESS_SECRET
openssl rand -hex 32   # JWT_REFRESH_SECRET
openssl rand -hex 32   # MESSAGE_ENCRYPTION_KEY
```

### 2.4 Activer l'environnement Node.js et installer les dépendances

> **Important o2switch** : le shell SSH utilise Node.js 10 par défaut. Il faut activer
> l'environnement virtuel de l'app cPanel **avant chaque session npm/node**.

```bash
# Trouver le numéro de version Node.js configuré dans cPanel
ls ~/nodevenv/api.votre-domaine.com/
# affiche : 18/  ou  20/  etc.

# Activer l'environnement (adapter le nom de dossier et la version)
source ~/nodevenv/api.votre-domaine.com/18/bin/activate

# Vérifier
node --version   # doit afficher v18.x ou v20.x

# Installer les dépendances de production
cd ~/api.votre-domaine.com
npm install --omit=dev

# Générer le client Prisma pour Linux
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy

# Seed : rôles + compte admin initial
node -e "import('./dist/prisma/seed.js').then(m => m.default())"
```

### 2.5 Démarrer l'application

cPanel → Setup Node.js App → **Start** (ou **Restart** si déjà lancée)

Vérifier : `https://api.votre-domaine.com/api/health` doit répondre `{"status":"ok"}`

---

## Étape 3 — Déployer le frontend

### 3.1 Construire le frontend en local

Créer `frontend/.env.production` (à partir de `.env.production.example`) :
```env
VITE_API_URL=https://api.votre-domaine.com/api
VITE_SOCKET_URL=https://api.votre-domaine.com
```

Puis builder :
```bash
cd frontend
npm run build
# Résultat dans frontend/dist/
```

### 3.2 Uploader les fichiers statiques

Uploader le contenu de `frontend/dist/` dans `public_html/` (ou le dossier du sous-domaine frontend) :

```bash
rsync -avz frontend/dist/ user@votre-domaine.com:~/public_html/
```

Le `.htaccess` inclus dans `public/` sera copié dans `dist/` automatiquement par Vite et assurera le routage SPA.

---

## Étape 4 — Configurer les sous-domaines SSL

1. cPanel → **Sous-domaines** → créer `api.votre-domaine.com`
   - Pointer vers le dossier Node.js (géré par Passenger automatiquement)
2. cPanel → **SSL/TLS** → **Let's Encrypt** → activer pour les deux domaines

---

## Étape 5 — Importer les questions du quiz

Via SSH, depuis le dossier backend :
```bash
cd ~/quizztest-backend
# Le fichier dataset doit être uploadé séparément
node -e "import('./dist/prisma/import-questions.js').then(m => m.importQuestions())"
```

Ou plus simplement, uploader le dataset et lancer :
```bash
npx tsx prisma/import-questions.ts   # si tsx disponible sur le serveur
```

---

## Résolution des problèmes courants

### Node.js version trop ancienne (npm install échoue)
o2switch fournit Node.js 10 dans le shell par défaut. Il faut activer l'environnement de l'app :
```bash
source ~/nodevenv/NOM_APP/VERSION/bin/activate
node --version   # doit afficher >= 18
```
Si l'app n'existe pas encore dans cPanel, la créer d'abord via *Setup Node.js App*.

### WebSocket ne se connecte pas
- Vérifier que `FRONTEND_URL` dans le backend correspond **exactement** à l'URL du frontend (avec `https://`)
- Socket.IO tombera automatiquement sur le polling HTTP si le WebSocket est bloqué

### Erreur Prisma "binary not found"
```bash
npx prisma generate   # re-générer les binaires Linux
```

### Port déjà utilisé
Le port est attribué automatiquement par Passenger — ne pas définir `PORT` manuellement dans les variables d'environnement cPanel.

### Erreur CORS
Vérifier que `FRONTEND_URL` dans le backend ne contient pas de slash final et correspond exactement au domaine du frontend.
