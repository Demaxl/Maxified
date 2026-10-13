# MAXIFIED — waitlist & research landing page

A mobile-first Nuxt 4 landing page for an upcoming fitness guide. It has two independent
conversions: joining the early-access waitlist (primary) and completing a 15-question research
survey (secondary). Neither one requires the other, and there are no accounts or logins.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Nuxt 4 (Vue 3, Nitro) |
| Styling | Tailwind CSS 4 + Nuxt UI |
| Fonts | Barlow Condensed (headlines) + Inter (body) via `@nuxt/fonts` |
| Database | Neon Postgres via Drizzle ORM (Neon's HTTP driver) |
| Rendering | `/`, `/survey` and `/privacy` are prerendered at build time; only `/api/*` runs on the server |
| Hosting | Cloudflare Pages (any Nitro target works for the pages; the database driver needs Neon) |

## Getting started

```bash
pnpm install
cp .env.example .env
pnpm dev
```

The site runs without a database. When `DATABASE_URL` is empty, waitlist signups and survey
responses are written to Nitro's on-disk storage under `.data/kv/maxi-fitness/` so you can test
the full flow locally. A warning is logged so this is never silently relied on in production.

### Connecting Postgres

1. Create a [Neon](https://neon.com) database. The app uses Neon's HTTP driver, which Cloudflare
   needs (Workers can't keep a database connection open between requests), so other Postgres
   hosts would need a different driver in `server/utils/db.ts`.
2. Put the connection string in `.env` as `DATABASE_URL`. Use a separate Neon branch for
   development so test signups never mix with real ones.
3. Apply the schema:

```bash
pnpm db:migrate
```

Other database scripts: `pnpm db:generate` (create a migration after editing the schema),
`pnpm db:push` (push the schema without a migration file), `pnpm db:studio` (browse the data).

## Adding the real photos

Every photograph is a slot in `photos` inside [`app/app.config.ts`](app/app.config.ts). A slot
with an empty `src` renders as a plate labelled "Photo to come" with its shoot brief — the site
never shows a stand-in image as if it were Maxi. To fill a slot, add the file to
`public/images/`, set `src` (e.g. `/images/portrait.jpg`), and check the `alt` text.

| Slot | Used for | Frame | Notes |
| --- | --- | --- | --- |
| `then` | Hero, left of the before/after pair — the first thing visitors see | 2:3 portrait | Your earliest real photo. Set `taken` to the real date, e.g. `March 2021`. |
| `now` | Hero, right of the pair | 2:3 portrait | Same pose, distance and light as `then` so the comparison is honest. Set `taken`. |
| `gallery.then[]` | Story section, "Where I started" carousel | 4:5 | Genuine photos from when you started, unedited. Mirror selfies and casual snaps are fine. One entry per slide, in order; add or remove entries freely. |
| `gallery.now[]` | Story section, "Where I am now" carousel | 4:5 | One entry per slide, in order; add or remove entries freely. Neutral backdrop, warm side light, white tank or open shirt, black trousers. Tune `position` if a crop cuts your face. |

Once both `then` and `now` have real photos, a short "My own progress photos. Individual results
vary." caption appears under the pair.

`public/images/og.jpg` (1200 × 630) is the social share card and should also be replaced with a
real photo. The other files still in `public/images/` (`hero.jpg`, `before.jpg`, `now.jpg`,
`closing.jpg`) are earlier stand-ins and are no longer referenced; delete them once the real
photos are in.

Images are served as plain `<img>` tags with explicit dimensions, so export them at about 1600px
on the long edge and compress them before committing (around 250–400 KB each is plenty). There is
no image-resizing service in the build, which keeps the landing page fully prerendered and the
deployment small.

## Configuration

Brand naming lives in [`app/app.config.ts`](app/app.config.ts):

```ts
brand: {
  name: 'MAXIFIED',
  logo: {
    svg: '/images/maxified-final.svg',
    png: '/images/maxified-final-transparent.png',
    width: 1715,
    height: 260
  },
  tagline: 'Built from experience.'
}
```

The logo SVG is used in the header and footer; the PNG is the logo in the homepage's
structured data. The logo is a dark mark, so it is only placed on cream surfaces.

The favicon set (`favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `icon-512.png`) uses the
logo's own `M`, lifted from `maxified-final.svg` and set in lime on a near-black tile — the full
wordmark is too wide to read at tab size. If the logo artwork changes, regenerate these too.

Design tokens — the cream/near-black/acid-lime palette and the type scale — live in
[`app/assets/css/main.css`](app/assets/css/main.css). Note that the on-disk storage namespace is
still `maxi-fitness`; renaming it would orphan existing local records.

Everything environment-specific is in `.env` (see `.env.example`): site URL, social links, contact
address, and the analytics domain.

## Data model

Two tables, defined in [`server/database/schema.ts`](server/database/schema.ts):

- `waitlist_subscribers` — `first_name`, `email` (unique), `source`, `synced_at`, `created_at`.
  Duplicate emails resolve to a friendly "you're already on the list" response rather than an
  error.
- `survey_responses` — `answers` (JSONB keyed by question id), optional `email` and `waitlist_id`
  so a response can be linked to a subscriber, plus timestamps.

## API

| Route | Purpose |
| --- | --- |
| `POST /api/waitlist` | `{ firstName, email, source }` → `{ ok, status: 'created' \| 'already_subscribed' }` |
| `POST /api/survey` | `{ answers, joinWaitlist, firstName?, email? }` → `{ ok, waitlist }` |

Both validate with Zod schemas shared between client and server ([`shared/schemas/`](shared/schemas/)),
so the browser shows the same messages the server would return. Validation failures respond `422`
with `{ data: { message, fields } }`; storage failures respond `503`.

## Editing the survey

All 15 questions live in [`shared/survey.ts`](shared/survey.ts) as a single typed array. Adding,
reordering or rewording a question there updates the wizard, the progress indicator and the
server-side validation at once — no other file needs touching. Supported question types are
`single`, `multi` (with an optional `maxSelections` cap) and `text`, plus `allowOther` for a
free-text "Other" option and `followUp` for a conditional follow-up question.

Question ids are the keys answers are stored under. When a question's meaning or options change,
give it a new id instead of reusing the old one, so earlier responses keep their own keys and
never mix with the new answers. No database migration is needed either way.

Answers are drafted to `localStorage` as people progress, so refreshing mid-survey doesn't lose
their place.

## Connecting an email service

[`server/utils/email.ts`](server/utils/email.ts) defines an `EmailProvider` contract and a no-op
default, so nothing is sent until a provider is configured. New waitlist signups (from the
waitlist form or the survey's opt-in) are added to the provider's list; the app itself sends no
email.

### Resend

1. In Resend, create a segment for the waitlist (and a separate one for testing) and copy its
   segment ID from Audience → Segments → ⋯ → Copy Segment ID.
2. Create an API key with **Full access** — a sending-only key can't create contacts.
3. Set:

   ```bash
   NUXT_EMAIL_PROVIDER=resend
   NUXT_EMAIL_API_KEY=re_...
   NUXT_EMAIL_AUDIENCE_ID=<segment id>
   ```

Each signup becomes a contact (email and first name) in that segment. Someone who is already a
contact is added to the segment instead. Use the test segment and your own address locally.

#### Welcome email

New subscribers also get a welcome email, built in
[`server/utils/welcome-email.ts`](server/utils/welcome-email.ts) — edit the copy there. It is
sent only when both of these are set as well:

```bash
NUXT_EMAIL_FROM="MAXIFIED <hello@your-domain.com>"  # on a domain verified in Resend
NUXT_PUBLIC_CONTACT_EMAIL=you@your-domain.com        # replies go here
```

Replying is the email's way off the list ("reply and I'll remove you"), so the contact address
must be an inbox you read. Repeat signups don't get a second email. The privacy policy's
"Emails" section reads the same settings from `/api/email-setup` and describes whichever setup
is live. To try it without emailing a real person, sign up as `delivered@resend.dev`, one of
Resend's test addresses.

### Other services

1. Implement `EmailProvider` for your service (Loops, Mailchimp, Kit).
2. Return it from `resolveProvider()` for the matching `NUXT_EMAIL_PROVIDER` value.
3. Set `NUXT_EMAIL_PROVIDER`, `NUXT_EMAIL_API_KEY` and `NUXT_EMAIL_AUDIENCE_ID` in your
   environment.

Successful syncs stamp `waitlist_subscribers.synced_at`. Sync failures are logged and swallowed —
a signup that is already stored in Postgres is never rolled back because a third party was down.

## Analytics

`useAnalytics().track()` pushes named events (`waitlist_submit`, `waitlist_success`,
`survey_start`, `survey_step`, `survey_success`, and more) to `window.dataLayer` and forwards them
to Plausible when it is loaded. Set `NUXT_PUBLIC_ANALYTICS_ID` to your Plausible domain to load the
script; leave it empty and no analytics script is added at all.

## Deploying

The site is set up for **Cloudflare Pages**, connected to this GitHub repo:

- Framework preset **Nuxt.js**, build command `pnpm build`, output directory `dist`. Cloudflare's
  build sets `CF_PAGES`, which Nitro detects to build for Pages.
- Add every variable from `.env.example` under Settings → Variables and Secrets, for
  Production. They're read both at build time (the prerendered pages) and per request (the API),
  so redeploy after changing one.
- Run `pnpm db:migrate` against the production database once before the first deploy.

Server code must read configuration per request, with `useRuntimeConfig(event)` or
`process.env` inside a handler: on Cloudflare, environment variables don't exist until a
request arrives, so `useRuntimeConfig()` without the event returns the empty defaults.

To try a Cloudflare build locally:

```bash
NITRO_PRESET=cloudflare_pages pnpm build
npx wrangler pages dev dist
```

Delete any old `.output/` folder first: the prerenderer serves stale pages from it.

## Scripts

| Script | Does |
| --- | --- |
| `pnpm dev` | Dev server on http://localhost:3000 |
| `pnpm build` / `pnpm preview` | Production build and local preview |
| `pnpm lint` | ESLint (`--fix` to autofix) |
| `pnpm typecheck` | `vue-tsc` over the whole project |
| `pnpm db:*` | Drizzle Kit migrate / generate / push / studio |
