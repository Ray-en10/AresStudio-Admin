# Deploy Ares 3D Studio

## What lives where

- `Ares3D-app` is the GitHub repository `Ray-en10/AresStudio-Admin`.
- The Spring Boot source is now included in this repository under `backend/`.
- PostgreSQL itself is not stored in GitHub. Put the database on a hosted PostgreSQL provider such as Neon or Supabase. The JPA entities in `backend/src/main/java` define the schema; `spring.jpa.hibernate.ddl-auto=update` creates/updates tables at backend startup.
- Vercel hosts the Angular frontend. Render hosts the Spring Boot API. The Vercel function in `api/[...path].js` proxies `/api/*` to the backend so browser session and CSRF cookies remain same-origin.

## 1. Create hosted PostgreSQL

Create a PostgreSQL database on Neon, Supabase, or another provider. Keep its host, port, database name, username, and password private. The JDBC URL format is:

```text
jdbc:postgresql://HOST:PORT/DATABASE?sslmode=require
```

Do not commit database passwords or database dumps. GitHub stores the application source, not the database contents. New tables are created on startup, but existing local order and inventory records are not copied automatically. Import existing records directly into the hosted database if they need to appear online; keep any export file outside the repository and delete it after import.

## 2. Deploy the Spring API to Render

1. In Render, create a Blueprint from the GitHub repository `Ray-en10/AresStudio-Admin`. Render reads `render.yaml` and uses `backend/Dockerfile`.
2. Create a web-service environment variable for each database setting:
   - `DB_URL`: the JDBC URL from the hosted PostgreSQL provider
   - `DB_USER`: database username
   - `DB_PASSWORD`: database password
   - `APP_ADMIN_USERNAME`: your chosen login name
   - `APP_ADMIN_PASSWORD`: a long, unique password
3. Keep `SESSION_COOKIE_SECURE=true` for HTTPS. Render supplies `PORT`; the Spring app binds to it.
4. Wait for Render's health check at `/api/auth/csrf` to pass. Copy the service's public base URL, for example `https://ares3dstudio-api.onrender.com`. Do not add `/api` to this value.

The API uses a server-side session, an HTTP-only session cookie, and CSRF protection. The `APP_ADMIN_*` values are secrets/settings in Render, not source-code values. A new database only receives an admin account when these variables are present. If you import an old database containing the temporary `admin/admin` account, the seeder replaces that legacy password when configured with `APP_ADMIN_USERNAME=admin` and a new `APP_ADMIN_PASSWORD`.

## 3. Deploy the frontend to Vercel

1. In the Vercel account at `https://vercel.com/rayen25`, import `Ray-en10/AresStudio-Admin` from GitHub.
2. Set the project root to the repository root. `vercel.json` configures the Angular build output at `dist/Ares3D-app/browser`.
3. Add this Vercel project environment variable:

   ```text
   BACKEND_URL=https://ares3dstudio-api.onrender.com
   ```

   Replace the example with the Render base URL from step 2; do not include `/api` or a trailing slash.
4. Deploy or redeploy the project.

In production, Angular calls `/api`, and the Vercel function forwards the request, cookies, and CSRF header to Render. Locally, Angular continues to call `http://localhost:8080/api`.

## 4. First online check

- Open the Vercel deployment URL and sign in with the `APP_ADMIN_USERNAME` and `APP_ADMIN_PASSWORD` configured in Render.
- Create an order and an equipment item, reload the page, and confirm both are still present. Persistence comes from hosted PostgreSQL, not Vercel's filesystem.
- In Render, use logs if login fails; in Vercel, confirm `BACKEND_URL` is set for the Production environment and redeploy after changing it.

## Local verification

From the frontend repository root:

```bash
npm install
npm run build
npm test -- --watch=false
```

For the Spring service:

```bash
cd backend
mvn test
```
