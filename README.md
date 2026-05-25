# QuizzTest - Realtime Chat + QuizBot

Plateforme realtime inspirée de Discord avec salons publics/privés/restrictifs, permissions par role, messagerie Socket.IO et QuizBot automatisé avec indices progressifs et leaderboard persistant.

## Stack

### Frontend

- React
- TypeScript
- Vite
- TailwindCSS
- Zustand
- React Router
- Axios
- Socket.IO Client

### Backend

- Node.js
- Express
- TypeScript
- Socket.IO
- Prisma ORM
- PostgreSQL
- JWT
- bcrypt

### Securite

- Zod
- Helmet
- CORS
- express-rate-limit
- sanitation XSS (xss)

### DevOps

- Docker
- Docker Compose
- GitHub Actions CI
- GitHub CLI scripts (labels/issues)

## Monorepo Structure

```
.
|- backend/
|  |- prisma/
|  |- src/
|     |- modules/
|     |- services/
|     |- controllers/
|     |- routes/
|     |- middlewares/
|     |- socket/
|     |- config/
|     |- utils/
|     |- types/
|- frontend/
|  |- src/
|     |- components/
|     |- pages/
|     |- layouts/
|     |- hooks/
|     |- store/
|     |- services/
|     |- sockets/
|     |- types/
|     |- utils/
|- .github/
|  |- workflows/
|  |- issue-bodies/
|  |- ISSUE_TEMPLATE/
```

## Prisma Modeles

Modeles principaux:

- User
- Role
- Room
- RoomMember
- Message
- MessageReaction
- QuizQuestion
- QuizGame
- QuizRoundHistory
- QuizScore

Le schema inclut:

- relations explicites
- indexes de perf
- timestamps (`createdAt`, `updatedAt`)
- contraintes uniques/foreign keys

Fichier: `backend/prisma/schema.prisma`

## Fonctionnalites

### Auth

- inscription
- connexion
- refresh token rotation
- deconnexion
- hash bcrypt
- roles: admin, moderator, user

### Salons

- public
- private
- restricted (role requis)
- invisible pour non autorises
- join/leave
- historique

### Realtime (Socket.IO)

- messages instantanes
- typing indicators
- edition et suppression de messages
- reactions
- anti spam websocket
- reconnexion automatique client
- controle d'acces par salle cote socket

### QuizBot

- parties simultanees par salon
- questions automatiques
- verification reponse (ignore casse/accents)
- detection reponses proches (distance Levenshtein)
- indices progressifs
- timeout automatique
- scoring persistant
- leaderboard global

## Systeme d'indices progressifs

Exemple answer: `reponse`

- depart: `********`
- +30s: `r*******`
- +60s: `re******`
- +90s: `rep*****`
- +120s: `repon***`

Regles:

- reveal automatique
- intervalle configurable via env
- espaces conserves
- comparaison sans accent et sans casse
- cooldown reponses utilisateur

## Installation locale

### 1) Prerequis

- Node.js 20+
- npm
- PostgreSQL 16+

### 2) Installer dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3) Variables environnement

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 4) Base de donnees

Configurer `DATABASE_URL` dans `backend/.env`, puis:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 5) Lancer le projet

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

## Docker

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

Services:

- frontend: http://localhost:5173
- backend: http://localhost:4000
- postgres: localhost:5432

## Scripts npm

### Racine

- `npm run dev`
- `npm run build`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run github:labels`
- `npm run github:issues`

### Backend

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:seed`

### Frontend

- `npm run dev`
- `npm run build`
- `npm run preview`

## API HTTP (resume)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/rooms`
- `POST /api/rooms`
- `POST /api/rooms/:roomId/join`
- `POST /api/rooms/:roomId/leave`
- `GET /api/messages/rooms/:roomId`
- `POST /api/messages`
- `PATCH /api/messages/:messageId`
- `DELETE /api/messages/:messageId`
- `POST /api/messages/:messageId/reactions`
- `GET /api/quiz/leaderboard`
- `POST /api/quiz/questions`

## Events Socket.IO (resume)

Entrants:

- `room:join`
- `room:leave`
- `typing:start`
- `typing:stop`
- `message:send`
- `message:edit`
- `message:delete`
- `message:react`
- `quiz:start`
- `quiz:answer`
- `quiz:leaderboard`

Sortants:

- `message:new`
- `message:updated`
- `message:deleted`
- `typing:update`
- `quiz:question`
- `quiz:hint`
- `quiz:winner`
- `quiz:timeout`
- `quiz:leaderboard`
- `quiz:ended`

## Securite appliquee

- validation des payloads avec Zod
- JWT court + refresh rotate
- bcrypt 12 rounds
- Helmet
- CORS strict par origine
- rate limit global + auth
- sanitation input
- guard role-based HTTP + websocket

## Git Workflow recommande

Branches:

- `main`
- `develop`
- `feature/*`
- `fix/*`

Conventional commits:

- `feat:`
- `fix:`
- `refactor:`
- `docs:`
- `test:`
- `chore:`
- `perf:`
- `build:`

## GitHub Labels & Issues

Le repo contient:

- `.github/labels.json`
- `.github/issues.json`
- `.github/issue-bodies/*.md`
- scripts `scripts/create-labels.mjs` et `scripts/create-issues.mjs`

Commande (avec `gh auth login` deja fait):

```bash
npm run github:labels
npm run github:issues
```

## Production Notes

- utiliser secrets robustes pour JWT
- stocker DB et logs sur volumes persistants
- activer reverse proxy (Nginx/Traefik) + TLS
- ajouter Redis adapter Socket.IO pour scaling horizontal
- ajouter observabilite (metrics, tracing, alerting)
