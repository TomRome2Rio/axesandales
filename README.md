# Axes & Ales

Club booking system — React + TypeScript frontend on GitHub Pages, Firebase backend.

## Getting Started

```bash
npm install          # frontend deps
cd functions && npm install  # Cloud Functions deps
```

Create a `.env.local` with your Firebase project values (see **Secrets Management** below), then:

```bash
npm run dev          # local dev server
```

## Secrets Management

This project uses **two** mechanisms for secrets, depending on where the secret is consumed.

### 1. GitHub Actions Secrets (build-time / CI)

Used for values needed during the **Vite build** or **Firebase deploy** steps in CI.  
Manage them at: **Settings → Secrets and variables → Actions**.

| Secret | Purpose |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase client SDK |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase client SDK |
| `VITE_FIREBASE_PROJECT_ID` | Firebase client SDK / deploy target |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase client SDK |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase client SDK |
| `VITE_FIREBASE_APP_ID` | Firebase client SDK |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase client SDK |
| `VITE_GOOGLE_MAPS_EMBED_KEY` | Google Maps embed on Location page |
| `FIREBASE_SERVICE_ACCOUNT` | Service-account JSON, used as `GCP_SA_KEY` for deploys |

These are injected in `.github/workflows/deploy.yml` — the build step writes `VITE_*` vars to a `.env` file, and the Firebase deploy steps pass the service account via `GCP_SA_KEY`.

**Local development:** copy the `VITE_*` values into a `.env.local` file (gitignored).

### 2. Firebase Extension Runtime Config (server-side)

Used for secrets consumed by **Firebase Extensions at runtime** (e.g., the `firestore-send-email` extension's SMTP credentials).

Non-secret extension config (mail collection, from address, region, etc.) is committed in `extensions/firestore-send-email.env`. Secrets are kept in a **local-only** file that is gitignored.

#### Setup after cloning

Create `extensions/firestore-send-email.env.local` with the full SMTP connection URI including your Resend API key:

```env
SMTP_CONNECTION_URI=smtps://resend:<your Resend API key>@smtp.resend.com:465
```

This overrides the placeholder value in the committed `.env` file. Then deploy the extension:

```bash
firebase deploy --only extensions --project=<PROJECT_ID>
```

To reconfigure interactively instead:

```bash
firebase ext:configure firestore-send-email --project=<PROJECT_ID>
```

### What NOT to do

- **Never** commit API keys, tokens, or passwords to the repo.
- **Never** remove `extensions/*.env.local`, `.env.local`, or `*.key.json` from `.gitignore`.
- The `extensions/firestore-send-email.env` file **is** committed and must **not** contain secrets. Secrets go in `extensions/firestore-send-email.env.local` (gitignored).

### Secret Scanning

This repo has multiple layers of protection against accidental secret commits:

1. **Pre-commit hook (local):** [Husky](https://typicode.github.io/husky/) runs [gitleaks](https://github.com/gitleaks/gitleaks) on every commit. If a secret is detected in staged files, the commit is blocked. This is set up automatically when you run `npm install` (via the `prepare` script). Requires `gitleaks` to be installed on your machine (`winget install Gitleaks.Gitleaks` on Windows, `brew install gitleaks` on macOS).

2. **CI scan:** The `secret-scan` job in `.github/workflows/ci.yml` runs gitleaks on every pull request, scanning the full git history.

3. **GitHub secret scanning:** Enabled at the repo level (Settings → Code security). Detects known secret patterns in pushed commits and can block pushes via push protection.

To bypass the pre-commit hook in an emergency (e.g., false positive), use `git commit --no-verify` — but verify the flagged file is genuinely safe first.

## Architecture

- **Frontend:** React + TypeScript, Vite, deployed to GitHub Pages
- **Backend:** Firebase (Firestore, Cloud Functions v2, Auth, Cloud Storage)
- **Email:** Firestore `mail` collection → `firestore-send-email` extension → Resend SMTP
- **CI/CD:** GitHub Actions (`.github/workflows/deploy.yml`)

## Deployment

Pushes to `main` trigger the deploy workflow, which:

1. Deploys Firestore rules (if changed)
2. Deploys Cloud Functions (if changed)
3. Builds the frontend and deploys to GitHub Pages

