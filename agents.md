# AI Agent Guidelines — Axes & Ales

## Security Rules

### Never commit secrets or credentials
- **Never** add API keys, tokens, passwords, or connection strings directly in source files.
- Secrets must go in GitHub Actions secrets (Settings → Secrets and variables → Actions) and be injected at deploy time via workflow env vars.
- Files that hold local secret values (`.env.local`, `extensions/*.env`, `*.key.json`) are gitignored — **do not remove those gitignore entries**.
- If you create a new config file that contains secrets, add it to `.gitignore` **before** staging any commit.
- When suggesting SMTP, database, or third-party service configuration, always use environment variables or a secrets manager — never inline the value.

### Known secret locations
| Secret | Where it lives | How it's deployed |
|---|---|---|
| Firebase client config (`VITE_FIREBASE_*`) | GitHub Actions secrets | Written to `.env` in the `deploy.yml` build step |
| Firebase service account | GitHub Actions secret `FIREBASE_SERVICE_ACCOUNT` | Passed as `GCP_SA_KEY` to `firebase-action` |
| Google Maps embed key | GitHub Actions secret `VITE_GOOGLE_MAPS_EMBED_KEY` | Written to `.env` in the build step |
| Resend SMTP credentials | Firebase extension runtime config | Configured via `firebase ext:configure` — **not** stored in the repo |

### Firestore security rules
- The `mail` collection must remain **server-only** (`allow read, write: if false`).
- Any new collection should default to **deny-all** and only open the minimum necessary access.
- Prefer owner-scoped writes (`request.auth.uid == resource.data.ownerId`) over blanket authenticated access.

## Architecture Notes

- **Frontend**: React + TypeScript, built with Vite, deployed to GitHub Pages.  
- **Backend**: Firebase (Firestore, Cloud Functions v2, Firebase Auth, Cloud Storage).  
- **Email**: Firestore `mail` collection → `firestore-send-email` extension → Resend SMTP.  
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`). Deploys frontend, Firestore rules, and Cloud Functions on push to `main`.

## Code Style
- Follow existing patterns in the codebase.
- Use TypeScript strict mode.
- Prefer `const` over `let`.
- Use named exports from service modules.
