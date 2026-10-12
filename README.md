# MAXIFIED — waitlist & research landing page

A mobile-first Nuxt 4 landing page for an upcoming fitness guide. It has two independent
conversions: joining the early-access waitlist (primary) and completing an 8-question research
survey (secondary). Neither one requires the other, and there are no accounts or logins.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Nuxt 4 (Vue 3, Nitro) |
| Styling | Tailwind CSS 4 + Nuxt UI |
| Fonts | Barlow Condensed (headlines) + Inter (body) via `@nuxt/fonts` |
| Database | Postgres via Drizzle ORM |
| Rendering | `/` and `/privacy` are prerendered at build time; `/survey` is server-rendered |

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

1. Create a database (Neon, Supabase, Render, or local Postgres).
2. Put the connection string in `.env` as `DATABASE_URL`.
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
| `gallery[]` | Story section carousel of your current physique | 4:5 | One entry per slide, in order; add or remove entries freely. Neutral backdrop, warm side light, white tank or open shirt, black trousers. Tune `position` if a crop cuts your face. |

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

Answers are drafted to `localStorage` as people progress, so refreshing mid-survey doesn't lose
their place.

## Connecting an email service

[`server/utils/email.ts`](server/utils/email.ts) defines an `EmailProvider` contract and a no-op
default, so nothing is sent until you wire a provider up. To add one:

1. Implement `EmailProvider` for your service (Resend, Loops, Mailchimp, ConvertKit).
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

Nitro builds for most platforms with no extra configuration:

```bash
pnpm build
pnpm preview
```

Set `DATABASE_URL` and the `NUXT_PUBLIC_*` variables in your host's environment, and run
`pnpm db:migrate` against the production database once before the first deploy.

## Scripts

| Script | Does |
| --- | --- |
| `pnpm dev` | Dev server on http://localhost:3000 |
| `pnpm build` / `pnpm preview` | Production build and local preview |
| `pnpm lint` | ESLint (`--fix` to autofix) |
| `pnpm typecheck` | `vue-tsc` over the whole project |
| `pnpm db:*` | Drizzle Kit migrate / generate / push / studio |
