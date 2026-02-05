# Scout Mailer

Plain HTML, CSS, and JavaScript site. Mobile-first, then desktop. Styled with Tailwind (Play CDN).

## Local setup

- **Static only:** `npx serve .` then open the URL (login/register will 404; no API).
- **With API + auth:** Use Vercel for the API:
  ```bash
  npm install && vercel dev
  ```
  Then open the URL Vercel gives you. Add the **Upstash Redis** integration (see below) so user data is stored securely.

## GitHub + deploy

- **Remote:** `https://github.com/the-zedman/scout-mailer.git` (already added).
- **Push to prod:** Push to `main`. Vercel deploys automatically when the repo is connected.

### First push (do this once)

```bash
git push -u origin main
```

If Git asks for credentials, use a **Personal Access Token** as the password, or switch to SSH:

```bash
git remote set-url origin git@github.com:the-zedman/scout-mailer.git
git push -u origin main
```

### Vercel one-time setup

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New Project** → Import `the-zedman/scout-mailer`.
3. Leave defaults (root directory, no build command) → **Deploy**.

After that, every `git push` to `main` triggers a new deployment.

### Auth and users

- **Login** (header) opens a modal: sign in with email + password, or use **Create new account** (first name, last name, email, password). New users get role **Author**; roles are **Admin**, **Manager**, **Author**.
- **User data:** Stored as a CSV string in **Upstash Redis** (one key, server-only). No public URLs, no data in the repo. Add the [Upstash Redis](https://vercel.com/integrations/upstash) integration to your Vercel project; Vercel sets `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` automatically. If Redis is not configured, the API falls back to `data/users.seed.csv` for reads only (edits cannot be saved).
- **Initial admin:** Defined in `data/users.seed.csv`. On first use with Redis, that seed is copied into Redis; after that all reads/writes use Redis.
- **Session:** Login uses a signed cookie. Set `SESSION_SECRET` in Vercel env for production; otherwise a default is used.

## Test that it works

1. **Local:** Run `npx serve .` and open the URL; confirm the page loads and “Features” / “About” smooth-scroll.
2. **After first push:** Confirm the repo shows the latest commit on GitHub.
3. **After Vercel connect:** Confirm the project’s production URL shows the same content; make a small change, push to `main`, and confirm the live site updates.
