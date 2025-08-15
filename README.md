# VendorHub (Next.js + Prisma + Postgres)

## Local Dev (optional)
```bash
npm i
cp .env.example .env # set DATABASE_URL, AUTH_SECRET, APP_SECRET, RP_NAME, RP_ID, APP_URL, ADMIN_EMAILS
npx prisma migrate dev
npm run dev
```
## Environment

- `DATABASE_URL` – connection string for Postgres
- `AUTH_SECRET` – secret used to sign authentication tokens
- `APP_SECRET` – secret used by the application (e.g., for invite tokens)
- `RP_NAME` – WebAuthn relying party name
- `RP_ID` – WebAuthn relying party ID
- `APP_URL` – base URL of the application (used in invitation links)
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
