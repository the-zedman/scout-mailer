# Scout Mailer

Plain HTML, CSS, and JavaScript site. Mobile-first, then desktop. Styled with Tailwind (Play CDN).

## Local setup

- No build step. Open `index.html` in a browser or use a static server:
  ```bash
  npx serve .
  ```
- Then open http://localhost:3000 (or the URL shown).

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

## Test that it works

1. **Local:** Run `npx serve .` and open the URL; confirm the page loads and “Features” / “About” smooth-scroll.
2. **After first push:** Confirm the repo shows the latest commit on GitHub.
3. **After Vercel connect:** Confirm the project’s production URL shows the same content; make a small change, push to `main`, and confirm the live site updates.
