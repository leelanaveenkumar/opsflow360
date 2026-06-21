# Deployment Guide – GitHub and Online Access

## Option A – Easiest: GitHub Pages from branch

Use this if you want the fastest online link.

1. Go to GitHub.
2. Click **New repository**.
3. Repository name: `opsflow360`.
4. Visibility: Public.
5. Upload these files:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `.nojekyll`
   - `README.md`
   - `DEPLOYMENT.md`
   - `data/sample_operations_upload.csv`
6. Commit to the `main` branch.
7. Go to **Settings → Pages**.
8. Select **Deploy from a branch**.
9. Select branch: `main`.
10. Select folder: `/root`.
11. Save.
12. Open the generated website link.

Expected URL format:

```text
https://YOUR-GITHUB-USERNAME.github.io/opsflow360/
```

For your account, it may be:

```text
https://guduruleelanaveen-lang.github.io/opsflow360/
```

## Option B – GitHub Actions deployment

The project also includes this workflow:

```text
.github/workflows/pages.yml
```

To use it:

1. Upload the full folder to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions**.
4. Push changes to `main`.
5. Open the **Actions** tab.
6. Wait for the Pages deployment to complete.
7. Open the generated website URL.

## Important notes

- This project is static, so it does not need Node.js, npm, Python backend, FastAPI, SQLite or a paid server.
- CSV upload works in the browser using localStorage.
- User management is demo-only and is not secure production authentication.
- Use this as a portfolio/interview project, not as a real operational system.

