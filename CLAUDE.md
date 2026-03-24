# LaunchPad — Project Brain

This file contains everything needed to understand, continue, and build this project.
Any AI assistant or developer should read this before touching any code.

---

## What This Product Is

**LaunchPad** is a "Done It For You" (DIFY) digital presence platform for small business owners.

The core insight: other website builders (Wix, Squarespace, etc.) are DIY — they give you tools and make you do all the work. LaunchPad does everything FOR the business owner:
- Builds their website
- Writes their blog posts every week
- Manages their social media (Facebook, Instagram, LinkedIn)
- Schedules and publishes everything automatically

The target customer is a plumber, dentist, restaurant owner, landscaper — someone who is great at their job and has zero interest in learning to build websites or write blog posts. They pay a monthly fee and never think about their online presence again.

**Positioning:** Not DIY. DIFY — Done It For You.

**This is NOT competing with Wix/Squarespace.** Those serve people who want to build their own site. LaunchPad serves the 33 million US small businesses that either have no online presence or have something outdated and neglected.

---

## Business Model

| Plan | Price | What's included |
|---|---|---|
| Starter | $299/mo | 5-page website, 2 blog posts/month, FB + IG, 8 social posts/month |
| Growth | $599/mo | 10-page website, 4 blog posts/month, FB + IG + LinkedIn, 20 posts/month, SEO strategy |
| Premium | $999/mo | Unlimited pages, weekly blogs, all platforms, daily posts, Google/Meta ads, dedicated manager |

---

## Current Status

**What's live right now:**
- Marketing website at: `launchpad-olive-omega.vercel.app`
- GitHub repo: `github.com/Amplify1-acct/launchpad`
- Vercel project: `launchpad` under `AmplifyForLawyers` team

**What's built:**
- Full Next.js marketing site (homepage, all sections)
- Interactive live demo with AI industry detection
- 3 design themes (minimal, bold, warm)
- Full mock homepage generator per business/industry
- Real blog post pages at `/blog/[slug]`
- DIFY positioning throughout all copy
- Clean white/modern redesign (Inter + Fraunces fonts)
- GitHub auto-deploy via push script

**What's NOT built yet (the actual product):**
- User authentication (signup/login)
- Customer dashboard
- AI generation pipeline (website + blog + social on signup)
- Per-customer website generator (Vercel API)
- Blog scheduling + approval workflow
- Social media post queue and calendar
- Weekly cron engine
- Stripe billing
- Email system
- Admin dashboard (owner's view of all customers)

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full stack, static generation for blogs, API routes for backend |
| Language | TypeScript | Type safety, better DX |
| Styling | CSS Modules | Scoped styles, no conflicts, no Tailwind needed |
| Fonts | Inter (sans) + Fraunces (serif) | Modern, clean, editorial |
| Database | Supabase (planned) | Postgres + auth + storage + realtime |
| Billing | Stripe (planned) | Subscriptions, webhooks |
| Email | Resend (planned) | Transactional + preview emails |
| Cron jobs | Inngest (planned) | Weekly content generation engine |
| Hosting | Vercel | Marketing site + customer sites via API |
| AI | Anthropic Claude API | All content generation |
| Social scheduling | Buffer or Make.com (planned) | FB, IG, LinkedIn publishing |
| Version control | GitHub | `Amplify1-acct/launchpad` |

---

## Project Structure

```
launchpad/
├── app/
│   ├── layout.tsx          # Root layout — fonts (Inter, Fraunces), metadata
│   ├── page.tsx            # Homepage — assembles all sections
│   ├── globals.css         # Design tokens (CSS variables), global resets
│   └── blog/
│       ├── posts.ts        # Blog post data — 3 sample posts (Plumbing, Photography, Real Estate)
│       └── [slug]/
│           ├── page.tsx    # Full blog post page with sidebar, CTA
│           └── page.module.css
├── components/
│   ├── Navbar.tsx/.module.css         # Sticky nav, frosted glass, black CTA
│   ├── Hero.tsx/.module.css           # DIFY hero, white bg, Fraunces headline
│   ├── Demo.tsx/.module.css           # Interactive demo — the centerpiece
│   ├── HowItWorks.tsx/.module.css     # 4 steps
│   ├── Services.tsx/.module.css       # 3 service cards
│   ├── Pricing.tsx/.module.css        # 3 pricing tiers
│   ├── Contact.tsx/.module.css        # Intake form with success state
│   ├── BlogPreview.tsx/.module.css    # Blog cards section
│   └── Footer.tsx/.module.css        # Black footer, DIFY tagline
├── public/                 # Static assets (favicon etc — not yet added)
├── next.config.js          # Images domain: images.unsplash.com
├── package.json
├── tsconfig.json
├── .gitignore
└── CLAUDE.md               # This file
```

---

## Design System

**Philosophy:** Clean, modern, white. Think Linear, Stripe, Vercel. Not SaaS-purple, not dark-navy.

**Colors (CSS variables in globals.css):**
```css
--black: #0a0a0a
--accent: #0066ff        /* Blue — used sparingly */
--accent-hover: #0052cc
--accent-subtle: #f0f4ff
--text: #0a0a0a
--text-mid: #4a4a4a
--text-light: #9a9a9a
--border: #e8e8e8
--bg: #ffffff
--bg-soft: #fafafa
--bg-subtle: #f4f4f4
--green: #16a34a
--red: #dc2626
```

**Fonts:**
- `--font-sans`: Inter (400, 500, 600)
- `--font-serif`: Fraunces (400, 600, 700) — used for all headlines

**Spacing:** 7rem padding for major sections, 1140px max-width

**Buttons:** Black primary (`background: var(--black)`), outlined secondary

**Cards:** White bg, 1px `var(--border)` border, `var(--shadow-sm)`, `var(--radius-lg)`

---

## The Demo Component

`components/Demo.tsx` is the most complex and important component. It's the live interactive demo on the homepage.

**How it works:**
1. User fills 3-step setup: business name + industry (grouped dropdown with 40+ options + "Other") + design style
2. "Other" option triggers a text field + Claude API call to AI-detect the business type
3. User hits "Build my presence"
4. Animated sequence runs:
   - Website builds section by section inside a browser mockup
   - Blog posts appear one by one
   - Facebook, Instagram, LinkedIn cards pop in with real photos and real post content
5. Done state shows: celebration card + sample blog posts for that industry
6. Style toggle lets user switch between 3 themes live

**Industry data:** 10 industries hardcoded with real content (tagline, services, stats, testimonial, 3 blog titles, 3 social posts, pages, hero image from Unsplash)

**3 design themes:**
- `minimal`: white bg, blue accent, clean
- `bold`: dark #0d1117, blue accent, dramatic
- `warm`: cream #fffbf5, amber accent, friendly

**MockHomepage component** (inside Demo.tsx): Renders a complete scrollable fake website inside the browser mockup. Has: nav, hero with stock photo + overlay, stats bar, services grid, testimonial, blog posts, CTA banner, footer. All themed by the selected design style.

**Key bug that was fixed:** Progress bar loops (`i += 3`) never hit exactly 100, so `=== 100` conditions never fired. Fix: explicitly set `setProgress(100)` after each loop.

---

## Blog System

**Sample posts** (in `app/blog/posts.ts`):
1. `5-signs-you-need-a-new-water-heater` — Plumbing
2. `how-to-prepare-for-your-family-photo-session` — Photography
3. `home-staging-tips-that-actually-work` — Real Estate

**Blog post page features:**
- Hero image with dark overlay
- Breadcrumb navigation
- Author bar with "Written by LaunchPad AI" badge
- Full article with h2, p, ul, tip boxes, CTA boxes
- Sticky sidebar with conversion CTA + related posts
- Bottom CTA banner
- Their own Navbar + Footer (not the main site's)

**How production blogs will work:**
- Claude generates post → stored in Supabase as draft
- Owner reviews in dashboard → approves
- On publish date → Vercel rebuild triggered → post baked as static HTML
- Lives at `businessname.com/blog/slug`

---

## GitHub Push System

**Push script:** `/home/claude/push_to_github.py`

Uses the GitHub Git Tree API to push ALL files as ONE atomic commit (so Vercel only triggers one deploy, not 24 separate ones — that was a bug we fixed).

```python
# How to run in any Claude session:
python3 /home/claude/push_to_github.py
```

**Token:** Stored in the script. Rotate at `github.com/settings/tokens` if compromised.

**Important:** The token in the script is a classic PAT with `repo` scope for `Amplify1-acct/launchpad`.

---

## The Full Product Roadmap (What's Left to Build)

### Phase 1 — Foundation (Week 1)
- [ ] Supabase setup: database schema, auth
- [ ] Signup flow → triggers AI generation
- [ ] Basic customer dashboard shell (Next.js app, 4 tabs)
- [ ] Stripe integration (plans, webhooks)

### Phase 2 — Content Engine (Week 2)
- [ ] Website generator per customer (Vercel API)
- [ ] AI generates full website on signup
- [ ] Blog post generation + draft storage
- [ ] Blog approval workflow (dashboard tab)

### Phase 3 — Social + Scheduling (Week 3)
- [ ] Social post generation (3 posts per platform)
- [ ] Social calendar view (dashboard tab)
- [ ] Buffer/Make.com integration for scheduling
- [ ] Weekly Inngest cron job (new blog + social every Monday)

### Phase 4 — Polish + Launch (Week 4)
- [ ] Email system (Resend): welcome, preview emails
- [ ] Analytics dashboard tab
- [ ] Admin dashboard (your view of all customers)
- [ ] Custom domain connection flow
- [ ] Industry-specific website templates (6 industries)
- [ ] Meta Business API approval (start this process NOW — takes 2-4 weeks)

---

## Database Schema (Planned — Supabase)

```sql
-- Core tables needed

users
  id, email, created_at, stripe_customer_id, plan

businesses
  id, user_id, name, industry, custom_industry, design_style,
  domain, subdomain, status, created_at

websites
  id, business_id, pages (jsonb), theme, deployed_url, last_deployed

blog_posts
  id, business_id, title, content, slug, status (draft/approved/published),
  scheduled_for, published_at, seo_meta (jsonb)

social_posts
  id, business_id, platform (fb/ig/li), caption, image_url,
  status (draft/approved/scheduled/published), scheduled_for

social_accounts
  id, business_id, platform, access_token, account_id, connected_at
```

---

## Key Decisions Made

**Why Next.js over WordPress:** Static generation = 80ms page loads vs 2-4 seconds. Better SEO. No security vulnerabilities. Blogs don't need WordPress.

**Why Vercel for customer sites:** Each customer gets their own Vercel project via API. ~$0.01 per deploy. SSL automatic. Custom domains trivial.

**Why not tap into Wix/Squarespace APIs:** We're not white-labeling them. We build better, faster sites ourselves. Full control over quality.

**Why Supabase over Firebase:** Postgres is better for structured relational data. Row-level security built in. Better DX.

**Why Inngest over raw cron:** Handles retries, observability, failure recovery. Weekly content generation is mission-critical.

**DIFY positioning:** Do not mention competitor names on the site. Say "other website builders" instead.

**Demo progress bar bug:** Never use `i += 3` loops with `=== 100` conditions. Always set to 100 explicitly after the loop.

---

## Accounts Needed (One-Time Setup)

| Service | What for | Status |
|---|---|---|
| GitHub | Code repo | ✅ Done — `Amplify1-acct` |
| Vercel | Hosting | ✅ Done — connected to GitHub |
| Supabase | Database + auth | ⏳ Not yet |
| Stripe | Billing | ⏳ Not yet |
| Resend | Email | ⏳ Not yet |
| Inngest | Cron jobs | ⏳ Not yet |
| Anthropic API | Content generation | ⏳ Need API key |
| Buffer or Make.com | Social scheduling | ⏳ Not yet |
| Meta Business API | FB/IG posting | ⏳ Not yet — START THIS EARLY, takes 2-4 weeks for approval |
| LinkedIn API | LinkedIn posting | ⏳ Not yet |

---

## Development Workflow

### Branching strategy
- `dev` branch → preview deploys (test here first)
- `main` branch → production at launchpad-olive-omega.vercel.app

### Push commands
```bash
python3 /home/claude/push_to_github.py        # push to dev (default, safe)
python3 /home/claude/push_to_github.py main   # push to production
```

### What happens on every push
1. GitHub Actions runs Playwright tests automatically
2. Tests open a real browser and check every key feature
3. If tests pass → Vercel deploys
4. If tests fail → deploy is blocked, owner is notified
5. Sentry catches any runtime errors that slip through

### Quality checks before pushing to main
- [ ] Pushed to dev first
- [ ] Checked Vercel preview URL
- [ ] GitHub Actions tests passed (green checkmark on GitHub)
- [ ] No new Sentry errors

### How to Continue This Project in a New Session

1. Read this file top to bottom
2. Check what's live: `launchpad-olive-omega.vercel.app`
3. Check the repo: `github.com/Amplify1-acct/launchpad`
4. Push script: `python3 /home/claude/push_to_github.py` (defaults to dev branch)
5. Pick the next item from the roadmap and build it

### Test files
- `tests/homepage.spec.ts` — 15 Playwright tests covering all key flows

**The owner of this project** is working with Claude as their sole developer. They are non-technical — explain decisions clearly, handle all code, push all changes. They review via the live site, not by reading code.

---

## Contact / Business Info

- **Product name:** LaunchPad
- **GitHub:** `Amplify1-acct`
- **Vercel team:** AmplifyForLawyers
- **Live URL:** `launchpad-olive-omega.vercel.app`
- **Stack:** Next.js 14, TypeScript, CSS Modules, Supabase (planned), Vercel

