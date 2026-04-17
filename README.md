# SCTT App

A Next.js (App Router) application for building, managing, and running SCTT assets and tests.

> **Tech stack:** Next.js 15, React 19, MUI, Auth0, Monaco Editor

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick start (development)](#quick-start-development)
- [Configuration (environment variables)](#configuration-environment-variables)
- [Authentication (Auth0)](#authentication-auth0)
- [Using the app](#using-the-app)
  - [Assets](#assets)
  - [Tests](#tests)
  - [Theme / editor](#theme--editor)
- [Scripts](#scripts)
- [Build & production](#build--production)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Overview

**SCTT App** is a web UI built with **Next.js** that provides:

- An authenticated experience (Auth0)
- A modern MUI-based layout (top bar + sidebar navigation)
- Monaco-editor powered editing for scripts
- CRUD-style workflows for *assets* and *tests*

The app uses the **Next.js App Router** (`src/app`) and client-side components for interactive pages.

---

## Features

- **Auth0 login** via `@auth0/nextjs-auth0`
- **Sidebar navigation** with collapsed/expanded behavior
- **Assets page**: create, edit, delete, and list assets
- **Tests page**: create, edit, delete, bulk operations, export
- **Light/Dark theme** and a matching **Monaco editor theme** (`sctt-dark` / `sctt-light`)

---

## Project structure

Commonly used paths in this repository:

- `src/app/`
  - Route-based pages (Next.js App Router)
  - Example: `src/app/page.js` (home)
  - Example: `src/app/tests/page.js` (tests)
- `src/components/layout/`
  - Layout UI components (e.g. `Topbar.js`, `Sidebar.js`)
- `src/services/`
  - Client-side service modules used by pages (e.g. `assetService`, `testService`)
- `src/config/`
  - Navigation and other configuration (e.g. `navconfig`)
- `public/assets/`
  - Static images like the SCTT logo

If you are new to Next.js App Router projects, start with `src/app` and follow imports into `components` and `services`.

---

## Prerequisites

- **Node.js** (LTS recommended)
- **npm** (or yarn / pnpm / bun)

> The repository currently includes an `npm` lockfile (`package-lock.json`), so `npm` is the most reproducible option.

---

## Quick start (development)

1. **Clone**

   ```bash
   git clone https://github.com/jsclosures/sctt_app.git
   cd sctt_app
   ```

2. **Install dependencies**

   ```bash
   npm ci
   # or: npm install
   ```

3. **Create a local environment file**

   Create a `.env.local` at the repo root (see [Configuration](#configuration-environment-variables)).

4. **Run the dev server**

   ```bash
   npm run dev
   ```

5. **Open the app**

   Visit:

   - `http://localhost:3000`

---

## Configuration (environment variables)

This app uses **Auth0**. In Next.js, environment variables are typically set in:

- `.env.local` (local development)
- Environment variables configured in your hosting provider (production)

Create a `.env.local` file in the repository root with values appropriate for your Auth0 tenant/app.

### Suggested `.env.local` template

```bash
# Auth0 (Next.js SDK)
AUTH0_SECRET="<a-long-random-value>"
AUTH0_BASE_URL="http://localhost:3000"
AUTH0_ISSUER_BASE_URL="https://<your-tenant>.us.auth0.com"
AUTH0_CLIENT_ID="<your-client-id>"
AUTH0_CLIENT_SECRET="<your-client-secret>"

# Optional (recommended)
# If you use custom callbacks, ensure these match your Auth0 app settings
# AUTH0_AUDIENCE="<api-identifier>"
# AUTH0_SCOPE="openid profile email"
```

> Notes:
> - **Do not commit** `.env.local`.
> - If you change `AUTH0_BASE_URL`, you must also update the Allowed Callback/Logout URLs in Auth0.

---

## Authentication (Auth0)

The UI reads the logged-in user in the top bar via `useUser()` from `@auth0/nextjs-auth0/client` (see `src/components/layout/Topbar.js`).

Typical Auth0 setup steps:

1. Create an Auth0 **Application** (Regular Web App).
2. Configure:
   - Allowed Callback URLs: `http://localhost:3000/api/auth/callback`
   - Allowed Logout URLs: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`
3. Put the matching credentials in `.env.local`.

---

## Using the app

### Navigation

- Use the **sidebar** to navigate between sections.
- Use the collapse/expand button at the top of the sidebar to toggle compact mode.

### Assets

The home page (`src/app/page.js`) uses an asset workflow powered by `@/services/assetService` (imported as `getAssets`, `saveAsset`, `deleteAsset`).

Typical workflow:

1. Open the **Assets** section (home page).
2. Create a new asset or select an existing one.
3. Edit fields such as:
   - name
   - type
   - notes
   - script (via Monaco editor)
4. Save changes, or delete the asset.

If you are extending the app, start by inspecting `src/services/assetService` to see where asset data is stored/fetched.

### Tests

The tests page (`src/app/tests/page.js`) uses `@/services/testService` and supports more operations (including bulk deletion and export):

- `getTests`
- `saveTest`
- `deleteTest`
- `deleteAllTestData`
- `exportAllTests`
- `createEmptyTest`

Typical workflow:

1. Navigate to **Tests**.
2. Create a test (or select one).
3. Edit the script using the Monaco editor tabs (`SCRIPT_TABS`).
4. Save, delete, export, or run bulk operations as supported by the UI.

### Theme / editor

The app supports **light/dark mode** via `useThemeConfig()`.

The Monaco editor theme automatically switches between:

- `sctt-dark`
- `sctt-light`

based on the current UI mode (see `src/app/page.js` and `src/app/tests/page.js`).

---

## Scripts

From `package.json`:

- `npm run dev` — start dev server
- `npm run build` — build for production
- `npm run start` — run the production build
- `npm run lint` — lint the project

---

## Build & production

1. Build:

```bash
npm run build
```

2. Run locally in production mode:

```bash
npm run start
```

Make sure your production environment variables are set (especially Auth0 values) before starting.

---

## Troubleshooting

### Auth0 login errors / redirect URI mismatch

- Confirm `.env.local` values are set correctly.
- Ensure Auth0 Application settings include:
  - `http://localhost:3000/api/auth/callback` in **Allowed Callback URLs**
  - `http://localhost:3000` in **Allowed Logout URLs**
  - `http://localhost:3000` in **Allowed Web Origins**

### Blank page or runtime errors

- Stop and restart the dev server after changing env vars:

  ```bash
  ctrl+c
  npm run dev
  ```

- Delete Next.js cache and restart:

  ```bash
  rm -rf .next
  npm run dev
  ```

### Dependency issues

- Prefer `npm ci` (uses `package-lock.json`).
- If upgrading Node, re-run `npm ci`.

---

## Contributing

- Create a branch from the default branch
- Keep changes focused and small
- Run `npm run lint` before opening a PR

If you want, describe your intended README sections (e.g., API docs, deployment target, data storage), and we can expand this documentation further.