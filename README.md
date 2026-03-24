# Exsisto

Your complete digital presence platform for small businesses — built with Next.js 14.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Deploy to Vercel

### Option 1 — Vercel CLI (fastest)
```bash
npm i -g vercel
vercel
```

### Option 2 — GitHub + Vercel dashboard
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Click Deploy — that's it

Every `git push` to `main` auto-deploys.

## Project structure

```
launchpad/
├── app/
│   ├── layout.tsx       # Root layout, fonts, metadata
│   ├── page.tsx         # Home page (assembles all sections)
│   └── globals.css      # Design tokens + resets
├── components/
│   ├── Navbar.tsx / .module.css
│   ├── Hero.tsx / .module.css
│   ├── HowItWorks.tsx / .module.css
│   ├── Services.tsx / .module.css
│   ├── Pricing.tsx / .module.css
│   ├── Contact.tsx / .module.css
│   └── Footer.tsx / .module.css
└── public/              # Static assets (favicon, og image, etc.)
```

## Customization

| What to change | Where |
|---|---|
| Brand name | `Navbar.tsx`, `Footer.tsx`, `app/layout.tsx` |
| Pricing | `components/Pricing.tsx` |
| Services | `components/Services.tsx` |
| Colors | `app/globals.css` (CSS variables) |
| Meta / SEO | `app/layout.tsx` → `metadata` |

## Connect the contact form

The form currently simulates a submission. To wire it up for real, replace the `handleSubmit` function in `components/Contact.tsx` with one of:

- **Resend** (email) — `npm install resend` + add a Next.js API route
- **Airtable** — POST to Airtable REST API
- **Formspree** — Replace `handleSubmit` with a fetch to your Formspree endpoint
- **Make / Zapier webhook** — POST `form` state to your webhook URL

## Next steps

- [ ] Add favicon to `/public/favicon.ico`
- [ ] Add OG image to `/public/og.png`
- [ ] Wire up contact form to email/CRM
- [ ] Add testimonials section
- [ ] Build client dashboard (post-signup)
