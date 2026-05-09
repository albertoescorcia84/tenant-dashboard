# Tenant Dashboard

Multi-tenant restaurant dashboard built with Next.js 14 + Tailwind + PostgreSQL.

## Features
- Grid of tenants with pagination
- Per-tenant customer list with search
- Chat modal — simulates a customer calling any restaurant's AI

## Local development

```bash
cp .env.example .env.local
# Fill in DATABASE_URL and CHAT_API_URL

npm install
npm run dev
# → http://localhost:3000
```

## Deploy to Railway

1. Push this folder to a GitHub repo
2. In Railway → New Project → Deploy from GitHub repo
3. Select the repo
4. Add environment variables:
   - `DATABASE_URL` → your existing Railway Postgres connection string
   - `CHAT_API_URL` → https://api.albertoescorcia.ca
5. Railway auto-detects Next.js and runs `npm run build && npm start`

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `CHAT_API_URL` | Base URL of the chat API (no trailing slash) |
