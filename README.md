# VendorHub (Next.js + Prisma + Postgres)

## Local Dev (optional)
```bash
npm i
cp .env.example .env # set DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_GOOGLE_CLIENT_ID, ADMIN_EMAILS
npx prisma migrate dev
npm run dev
```

## Authentication

This project uses [Google Identity Services](https://developers.google.com/identity) for authentication.

1. Create a Google Cloud project and enable Google Identity Services.
2. Configure an OAuth 2.0 Client ID for a web application.
3. Add `http://localhost:3000` to the authorized JavaScript origins for local development.
4. Set the client ID as `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (or `GOOGLE_CLIENT_ID`) in your environment.

## Environment

- `DATABASE_URL` – connection string for Postgres
- `AUTH_SECRET` – secret used to sign authentication tokens
- `GOOGLE_CLIENT_ID` or `NEXT_PUBLIC_GOOGLE_CLIENT_ID` – client ID from Google Identity Services
- `ADMIN_EMAILS` – comma‑separated emails with admin access. During sign‑in, if the user's email (case‑insensitive) matches one of these, the JWT will include `isAdmin: true`.

## Deploy (Vercel + Neon, recommended)

1. Create a Neon project → copy the connection string.
2. Import this repo into Vercel → set `DATABASE_URL` env var.
3. "Build & Output Settings": default.
4. Run once in Vercel: `npx prisma migrate deploy && node scripts/seed.js`.
5. Open the app → Explore vendors → click into a vendor → view feedback.

## API
- `GET /api/vendors?query=&cap=&maxCost=`
- `POST /api/vendors` body: `{ name, overview, platforms[], industries[], costTiers[], capabilities[{slug,name}] }`
- `GET /api/vendors/:id`
- `PATCH /api/vendors/:id`
- `POST /api/feedback` body: `{ vendorId, author, ratingQuality, ratingSpeed, ratingComm, text, tags[] }`
