# Chat Application + QuizBot

## Description

Application moderne de chat temps réel avec :

- salons publics
- salons privés
- permissions avancées
- websocket temps réel
- QuizBot interactif
- classement joueurs
- architecture scalable

---

# Stack Technique

## Frontend

- React
- TypeScript
- Vite
- TailwindCSS
- Zustand
- Socket.IO Client

## Backend

- Node.js
- Express
- TypeScript
- Socket.IO
- Prisma
- PostgreSQL

## Sécurité

- JWT
- bcrypt
- Zod
- Helmet
- rate limiting

## DevOps

- Docker
- Docker Compose
- Git
- GitHub

---

# Fonctionnalités

## Authentification

- inscription
- connexion
- refresh token
- JWT
- rôles utilisateurs

## Rôles

- admin
- moderator
- user

---

# Salons

## Types

- public
- privé
- restreint

## Fonctionnalités

- rejoindre
- quitter
- historique
- utilisateurs connectés
- permissions dynamiques

---

# Temps Réel

Utiliser Socket.IO pour :

- messages instantanés
- typing indicator
- réactions
- notifications
- présence utilisateurs

---

# QuizBot

## Fonctionnement

Le bot :

1. poste une question
2. attend réponses
3. révèle indices
4. valide gagnant
5. attribue points
6. affiche classement

---

# Système d'indices

## Exemple

Réponse :
reponse

Initial :

---

30 sec :
r*******

60 sec :
re******

90 sec :
rep*****

120 sec :
repon***

## Contraintes

- automatique
- progressif
- configurable
- ignore accents
- ignore casse

---

# Base de données

## User

- id
- username
- email
- password
- roleId
- avatar
- createdAt

## Role

- id
- name

## Room

- id
- name
- type

## Message

- id
- content
- userId
- roomId

## QuizQuestion

- id
- question
- answer
- category
- difficulty

## QuizGame

- id
- roomId
- status

## QuizScore

- id
- userId
- score

---

# Architecture Backend

src/
  modules/
  services/
  controllers/
  routes/
  middlewares/
  socket/
  config/
  prisma/
  utils/

---

# Architecture Frontend

src/
  components/
  pages/
  layouts/
  hooks/
  services/
  sockets/
  store/
  utils/

---

# Sécurité

Implémenter :

- validation Zod
- JWT sécurisé
- Helmet
- anti spam
- sanitation
- validation websocket
- rate limiting

---

# Docker

Services :

- frontend
- backend
- postgres

---

# Git Workflow

## Branches

- main
- develop
- feature/*
- fix/*

## Commits

Convention :

- feat:
- fix:
- docs:
- refactor:
- test:
- chore:
- perf:

## Règles

- commits fréquents
- push réguliers
- PR descriptives
- changelog maintenu

---

# GitHub Labels

## Types

- bug
- feature
- enhancement
- refactor
- documentation
- security
- performance

## Priorités

- priority:low
- priority:medium
- priority:high
- priority:critical

## Modules

- frontend
- backend
- websocket
- database
- auth
- quiz-bot
- docker
- ui-ux

---

# GitHub Issues

Créer automatiquement :

- auth
- websocket
- quiz bot
- permissions
- leaderboard
- docker
- sécurité
- UI responsive

---

# UI/UX

Style :

- moderne
- sombre
- Discord-like
- responsive
- animations légères

---

# Contraintes Qualité

Le code doit être :

- scalable
- maintenable
- sécurisé
- modulaire
- production-ready

Éviter :

- duplication
- fichiers énormes
- logique métier mal placée

---

# Priorités

1. websocket stable
2. auth sécurisée
3. permissions salons
4. QuizBot robuste
5. UI moderne
6. Docker
7. Git workflow propre
