# Ares 3D Studio — Backend

API Spring Boot pour les commandes et l'inventaire de Ares 3D Studio.

## Prerequisites

- Java 17+
- Maven
- PostgreSQL

## Lancer en local

1. Crée la base PostgreSQL :

   ```sql
   CREATE DATABASE ares3dstudio;
   ```

2. Configure les variables d'environnement avant le premier démarrage :

   ```text
   DB_URL=jdbc:postgresql://localhost:5432/ares3dstudio
   DB_USER=postgres
   DB_PASSWORD=<mot_de_passe_postgres>
   APP_ADMIN_USERNAME=admin
   APP_ADMIN_PASSWORD=<mot_de_passe_unique_et_long>
   ```

   Le mot de passe administrateur n'a pas de valeur par défaut. Le seeder crée le compte avec BCrypt. Si l'ancienne base contient encore le compte provisoire `admin/admin`, le premier démarrage avec `APP_ADMIN_USERNAME=admin` remplace ce mot de passe par celui configuré ci-dessus.

3. Lance l'application :

   ```bash
   mvn spring-boot:run
   ```

4. L'API est disponible sur `http://localhost:8080`.

## Authentification

L'authentification utilise une session HTTP côté serveur, un cookie de session `HttpOnly` et une protection CSRF. Les écritures vers les commandes et l'inventaire sont refusées sans session authentifiée.

Le frontend doit d'abord appeler `GET /api/auth/csrf`, puis `POST /api/auth/login`. Il envoie automatiquement le cookie de session et l'en-tête CSRF. Après connexion, `GET /api/auth/session` vérifie la session et `POST /api/auth/logout` la ferme. Il n'y a pas de jeton d'accès stocké dans le navigateur.

Les sessions expirent après 30 minutes d'inactivité. En production, utilise HTTPS, des secrets gérés hors du dépôt et configure l'origine exacte du frontend dans `CorsConfig.java`.

## Endpoints

| Méthode | URL | Accès | Description |
|---|---|---|---|
| GET | `/api/auth/csrf` | Public | Initialise le jeton CSRF |
| POST | `/api/auth/login` | Public + CSRF | Vérifie les identifiants et ouvre une session |
| GET | `/api/auth/session` | Authentifié | Vérifie la session courante |
| POST | `/api/auth/logout` | Authentifié + CSRF | Ferme la session |
| GET | `/api/orders` | Authentifié | Liste les commandes |
| GET | `/api/orders/{id}` | Authentifié | Récupère une commande |
| GET | `/api/orders/status/{status}` | Authentifié | Filtre par statut |
| GET | `/api/orders/next-order-id` | Authentifié | Fournit le prochain identifiant lisible |
| POST | `/api/orders` | Authentifié + CSRF | Crée une commande |
| PUT | `/api/orders/{id}` | Authentifié + CSRF | Met à jour une commande |
| DELETE | `/api/orders/{id}` | Authentifié + CSRF | Supprime une commande |
| GET | `/api/orders/stats/monthly-revenue` | Authentifié | Total du mois courant |
| GET | `/api/inventory` | Authentifié | Liste les fournitures |
| POST | `/api/inventory` | Authentifié + CSRF | Ajoute une fourniture |
| PUT | `/api/inventory/{id}` | Authentifié + CSRF | Met à jour une fourniture |
| DELETE | `/api/inventory/{id}` | Authentifié + CSRF | Supprime une fourniture |

Les statuts de commande disponibles sont `PENDING`, `READY`, `PICKED_UP` et `COMPLETED`.

## CORS

En local, le backend autorise les ports dynamiques sur `localhost` et `127.0.0.1` (par exemple Angular sur `4200` ou un aperçu VS Code sur `52569`), avec les cookies de session et l'en-tête CSRF. Pour la production, définis `APP_CORS_ALLOWED_ORIGIN_PATTERNS` avec l'origine HTTPS exacte du frontend. N'utilise pas un joker général `*` avec les credentials CORS.
