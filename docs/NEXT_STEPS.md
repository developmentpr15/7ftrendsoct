# Integration Checkpoint and Next Steps

- Branch: integration/gemini-r2-cleanup (pushed)
- PR: https://github.com/developmentpr15/7ftrendsoct/pull/new/integration/gemini-r2-cleanup

## Completed
- Archived legacy docs/scripts into docs/archive
- Cloned Gemini repo to external/7ftrends_gemini for side-by-side comparison
- Added Cloudflare R2 presigned upload service and handler to Go API
- Extended Go API storage config and env overrides for R2
- .gitignore updates (external/**/node_modules, NUL, supabase/.temp)

## Pending
- Install Go (winget with accept flags), then build & run API
- Configure R2 env (endpoint, keys, bucket, public URL) and test presigned uploads
- Align Expo SDK 54 deps and fix version mismatch; start bundler with clean cache
- Implement RN upload flow (request presign → PUT to R2 → store/display public URL)
- Port Gemini components/services into admin-portal (Next.js)
- Supabase cleanup: audit/remove unused Edge Functions/migrations & code references
- E2E tests: login, feed, image uploads (R2), admin flows

## Commands

### Install & run API (Windows)
```
winget install -e --id GoLang.Go --accept-package-agreements --accept-source-agreements
```
Run in 7ftrends-api folder:
```
go version
go mod tidy
go build ./...
go run .\cmd\api\main.go
```

### Expo alignment & start
```
npx expo install --fix
npx expo install expo@54.0.20
npx expo doctor --fix-dependencies
npx expo start -c
```

## Environment variables

### Cloudflare R2 (Go API)
- R2_REGION=auto
- R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
- R2_ACCESS_KEY_ID=...
- R2_SECRET_ACCESS_KEY=...
- R2_BUCKET_NAME=...
- R2_PUBLIC_BASE_URL=https://cdn.yourdomain.com
- R2_USE_PATH_STYLE=true

### Supabase
- RN (.env.local at project root)
  - EXPO_PUBLIC_SUPABASE_URL=...
  - EXPO_PUBLIC_SUPABASE_ANON_KEY=...
- Admin (admin-portal/.env.local)
  - NEXT_PUBLIC_SUPABASE_URL=...
  - NEXT_PUBLIC_SUPABASE_ANON_KEY=...
- API (server env or config)
  - SUPABASE_URL=...
  - SUPABASE_KEY=...
  - SUPABASE_SERVICE_KEY=...

## Tech stack
- Mobile: Expo (React Native), Zustand, React Navigation, Supabase client, Go API for business logic, R2 for media
- Admin: Next.js, Supabase client, Go API, R2 for media
- Backend: Go (Gin), Supabase (auth/DB), Cloudflare R2 (S3-compatible)

## Admin integration path
- Port Gemini features into admin-portal (Next.js) incrementally.
