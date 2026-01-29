# Fonctionnement Détaillé du Jeu Pong (Transcendence)

Ce document explique en détail l'architecture, le fonctionnement technique et la logique du jeu Pong au sein de la plateforme.

## 1. Architecture Globale

Le jeu repose sur une architecture **Client-Serveur** avec une synchronisation en temps réel via **Socket.IO**.

*   **Frontend (Client)** : Construit avec TypeScript et HTML5 Canvas. Il gère l'affichage (rendu), la capture des entrées utilisateur (clavier) et la communication avec le serveur.
*   **Backend (Game Service)** : Un microservice Node.js (Fastify) qui agit comme "l'autorité". Pour les matchs en ligne, c'est lui qui calcule la physique de la balle, gère les scores et synchronise les positions pour tous les joueurs.
*   **API Gateway** : Nginx redirige les requêtes API et les connexions WebSocket vers le service de jeu approprié.

---

## 2. Les Modes de Jeu

Le jeu propose trois modes principaux :

### A. Match en Ligne (Remote Multiplayer)
C'est le mode le plus complexe techniquement.
1.  **Création du match** : Un joueur crée une partie via une requête POST `/api/game/create`. Un `gameId` unique est généré.
2.  **Connexion WebSocket** : Le joueur se connecte à l'espace de noms `/game` via Socket.IO.
3.  **Attente d'adversaire** : Le serveur attend qu'un second joueur rejoigne le même `gameId`.
4.  **Autorité du Serveur** : Une fois le match lancé, le serveur fait tourner une boucle à **~60 FPS** (16ms). Il calcule la position de la balle et vérifie les collisions. Les clients envoient uniquement la position de leur raquette (`paddle_move`).

### B. Versus AI (Entraînement)
Le jeu tourne exclusivement sur le navigateur du client.
*   Le client gère lui-même la physique.
*   Une logique simple d'IA contrôle la raquette de droite : elle tente de s'aligner verticalement avec le centre de la balle.

### C. Multijoueur Local
Deux joueurs jouent sur le même clavier.
*   **Joueur Gauche** : Touches `W` / `S`.
*   **Joueur Droite** : Touches `Flèche Haut` / `Flèche Bas`.
*   Le calcul de la physique est effectué localement par le navigateur.

---

## 3. Déroulement technique d'une partie (Online)

### 1. Initialisation (`main.ts`)
Lorsque vous lancez le jeu, la fonction `initializeGame()` :
*   Prépare le **Canvas HTML5**.
*   Configure les écouteurs d'événements (touches du clavier).
*   établit la connexion Socket si nécessaire.
*   Affiche l'interface de "Lobby" pour choisir le mode.

### 2. Le Compte à Rebours (`CountDown.ts`)
Avant chaque début de match ou service, un compte à rebours de 6 secondes (approx.) synchronise les joueurs pour s'assurer que tout le monde est prêt.

### 3. La Boucle de Physique (`server.js`)
Sur le serveur, la fonction `updateGamePhysics()` gère :
*   **Mouvement** : `ball.x += ball.dx; ball.y += ball.dy;`
*   **Rebonds sur les murs** : Si la balle touche le haut ou le bas, sa direction verticale (`dy`) est inversée.
*   **Collisions avec les raquettes** :
    *   Le serveur vérifie si la balle est dans la zone X et Y d'une raquette.
    *   **Accélération** : À chaque impact, la vitesse de la balle augmente de 5% (`1.05`).
    *   **Effet (Spin)** : Selon l'endroit où la balle touche la raquette (haut, milieu ou bas), l'angle de rebond change pour donner plus de contrôle aux joueurs.

### 4. La Synchronisation (`ball_update`)
Le serveur envoie en permanence un événement `ball_update` à tous les joueurs de la salle avec :
*   La position exacte de la balle.
*   Le score actuel.
Les clients mettent à jour leur rendu visuel instantanément.

### 5. Marquage d'un Point
*   Lorsqu'un joueur marque, le serveur émet `goal_scored`.
*   La balle est remise au centre.
*   Le score est mis à jour en base de données via le service `user-management`.
*   Le match s'arrête lorsqu'un joueur atteint **5 points**.

---

## 4. Gestion des Déconnexions

*   Si un joueur se déconnecte pendant un match en ligne, le serveur le détecte immédiatement via l'événement `disconnect` de Socket.IO.
*   Le joueur restant gagne automatiquement par forfait (**3-0**).
*   La boucle de jeu est arrêtée et le match est marqué comme "terminé".

---

## 5. Aspects Visuels et Esthétiques

Le jeu utilise un système de rendu "Premium" :
*   **Canvas Context 2D** : Utilisation d'ombres (`shadowBlur`), de dégradés et de lignes pointillées.
*   **HUD (Heads-Up Display)** : Les scores et les avatars sont gérés par des éléments HTML/CSS superposés au Canvas pour une meilleure qualité visuelle et des animations fluides.
*   **Responsive** : Le canvas a une taille fixe de 800x400 pour garantir que la physique soit identique pour tous les joueurs, peu importe la taille de leur écran.

## 6. Récapitulatif technique des Sockets

| Événement | Source | Description |
| :--- | :--- | :--- |
| `join_game` | Client | Demande à rejoindre une salle de jeu |
| `game_start` | Serveur | Notifie que les deux joueurs sont prêts |
| `paddle_move` | Client | Envoie la nouvelle position Y de la raquette |
| `opponent_move`| Serveur | Informe l'autre joueur du mouvement de la raquette adverse |
| `ball_update` | Serveur | Synchronisation complète de la balle et du score |
| `game_over` | Serveur | Fin du match avec désignation du vainqueur |
| `request_rematch` | Client | Demande à rejouer une partie |
