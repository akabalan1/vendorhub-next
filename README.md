# VendorHub (Next.js + Prisma + Postgres)

## Local Dev (optional)
```bash
npm i
cp .env.example .env # set DATABASE_URL
npx prisma migrate dev
npm run dev
```

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
