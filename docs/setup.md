# Setup

## Local dev

Install dependencies:

```bash
bun install
```

Create or connect a Convex cloud project:

```bash
bunx convex dev
```

For a new project choose:

1. `create a new project`
2. your team
3. a project name
4. `cloud deployment`

`bunx convex dev` writes these values to `.env.local`:

- `CONVEX_DEPLOYMENT`
- `VITE_CONVEX_URL`
- `VITE_CONVEX_SITE_URL`

Run web + Convex:

```bash
bun run dev
```

Run only the web app:

```bash
bun run dev:web
```

## Quality checks

```bash
bun run typecheck
bun run lint
bun run typecheck:convex
```

## What goes where

### `.env.local`

These are local frontend/dev values:

```env
CONVEX_DEPLOYMENT=...
VITE_CONVEX_URL=...
VITE_CONVEX_SITE_URL=...
```

You normally do not set these by hand. `bunx convex dev` creates them.

### Convex Dashboard

For your cloud dev deployment, for example `third-dogfish-120`, set these in:

`Convex Dashboard -> Deployment -> Settings -> Environment Variables`

#### Auth

- `SITE_URL`
  Your browser app URL in dev, usually `http://localhost:5296`
- `BETTER_AUTH_URL`
  Your Convex site URL, usually exactly the same host as `VITE_CONVEX_SITE_URL`
  Example: `https://third-dogfish-120.eu-west-1.convex.site`
- `BETTER_AUTH_SECRET`
  Random long secret for Better Auth
- `ALLOW_SIGNUPS`
  `true` or `false`
  If `false`, free signup is blocked, but signup through a valid `/invite/:token` still works

#### Mux

- `MUX_TOKEN_ID`
- `MUX_TOKEN_SECRET`
- `MUX_WEBHOOK_SECRET`
- `MUX_SIGNING_KEY_ID`
- `MUX_SIGNING_PRIVATE_KEY`

#### S3-compatible storage

- `RAILWAY_ACCESS_KEY_ID`
- `RAILWAY_SECRET_ACCESS_KEY`
- `RAILWAY_ENDPOINT`
- `RAILWAY_PUBLIC_URL`
- `RAILWAY_REGION`
- `RAILWAY_BUCKET_NAME`

### Vercel

For production builds on Vercel set:

- `CONVEX_DEPLOY_KEY`

If you also want production auth/storage/video to work there, mirror the needed runtime vars there too:

- `SITE_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `ALLOW_SIGNUPS`
- all `MUX_*`
- all `RAILWAY_*`

## Minimal local + cloud setup

1. Run `bunx convex dev`
2. Confirm `.env.local` was created
3. In Convex Dashboard set:
   `SITE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `ALLOW_SIGNUPS`
4. Add the storage vars
5. Add the Mux vars
6. Run `bun run dev`

## Railway / S3-compatible storage

This project stores original uploads in an S3-compatible bucket.

Use these values from your provider:

- `RAILWAY_ENDPOINT`
  S3 API endpoint, for example `https://t3.storageapi.dev`
- `RAILWAY_PUBLIC_URL`
  Public base URL for files, often the same as the endpoint
- `RAILWAY_REGION`
  Provider region, often `auto` for non-AWS providers
- `RAILWAY_BUCKET_NAME`
  Bucket/container name
- `RAILWAY_ACCESS_KEY_ID`
- `RAILWAY_SECRET_ACCESS_KEY`

The variable names still say `RAILWAY_*` because the code expects those names, even if the provider is not actually Railway.

## Mux

This project uses Mux for:

- video ingest/transcoding
- playback streaming
- signed playback and thumbnail tokens
- webhook updates when assets become ready

You need:

- `MUX_TOKEN_ID`
- `MUX_TOKEN_SECRET`
  API credentials from Mux
- `MUX_WEBHOOK_SECRET`
  Secret from the webhook configured in Mux
- `MUX_SIGNING_KEY_ID`
- `MUX_SIGNING_PRIVATE_KEY`
  Playback signing key pair from Mux

Webhook URL in Mux:

```text
<VITE_CONVEX_SITE_URL>/webhooks/mux
```

Example:

```text
https://third-dogfish-120.eu-west-1.convex.site/webhooks/mux
```

## Build / run

```bash
bun run build
bun run start
```
