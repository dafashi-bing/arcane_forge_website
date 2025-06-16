# 1. Project Overview

**Purpose**
&#x20;Build a public-facing website (games.arcaneforge.ai) to host AI-generated games. Users can browse a library of games, click into any to play the embedded Flutter build, leave threaded comments/feedback, see play‑counts/likes/dislikes, and optionally supply an email for future notifications when a new version (based on their feedback) is ready.

**Goals for v0**

* Display a banner: “N games have been generated”

* Show a grid of game cards (icon, title, screenshot, short description)

* Detail page for each game with:

  * Embedded Flutter build (served from `/public/games/[slug]`)

  * Play count + like/dislike buttons

  * Threaded comments (anonymous nickname + reply support)

  * Feedback form (free text + optional email + “notify me” flag)

* No forced authentication for public features

* Manual Supabase migrations triggered by devs

* Admin UI page to add new games easily

* Backend: Supabase (Postgres)

* Frontend: Next.js + Tailwind CSS

* Deployment: Vercel (static + API routes)

# 2. Technical Architecture

```plain&#x20;text
[Browser] → Next.js App (pages + Tailwind) → Vercel
                   ↳ /public/games/[slug]/* → Flutter builds (CDN)

Next.js API Routes → Supabase Postgres
  • /api/games
  • /api/games/[slug]
  • /api/games/[slug]/play
  • /api/games/[slug]/like
  • /api/games/[slug]/dislike
  • /api/games/[slug]/comments (GET + POST)
  • /api/games/[slug]/feedback (POST)
  • /api/admin/games (GET + POST for admin UI)
```

* **Supabase Auth**: reserved for v1; v0 uses anonymous flows

* **No Formspree**: feedback emails recorded to DB; manual sendout

# 3. Data Model

All tables use `uuid` PK, timestamps default `now()`.

## 3.1. `games`

## 3.2. `stats`

> Alternatively, collapse `stats` into `games` if preferred.

## 3.3. `comments` (threaded)

* Indexed on `(game_slug, parent_id, created_at)` for fetching threads.

## 3.4. `feedback_requests`

# 4. API Specification

### Public Endpoints

#### `GET /api/games`

* **Response**: `{ games: Game[] }`

#### `GET /api/games/[slug]`

* **Response**: `{ game: Game, stats: Stats }`

#### `POST /api/games/[slug]/play`

* **Effect**: upsert `plays += 1`

* **Response**: `{ stats: Stats }`

#### `POST /api/games/[slug]/like` / `/dislike`

* **Effect**: upsert likes/dislikes

* **Response**: `{ stats: Stats }`

#### `GET /api/games/[slug]/comments?limit=&offset=`

* **Response**: `{ comments: Comment[] }` (flat list; build tree in client)

#### `POST /api/games/[slug]/comments`

* **Body**: `{ parent_id?, name, text }`

* **Response**: `{ comment: Comment }`

#### `POST /api/games/[slug]/feedback`

* **Body**: `{ message, email?, want_notify? }`

* **Effect**: INSERT into `feedback_requests`

* **Response**: `{ feedback: FeedbackRequest }`

### Admin Endpoints (protected via env TOKEN)

#### `GET /api/admin/games`

* **Response**: `{ games: Game[] }`

#### `POST /api/admin/games`

* **Body**: `{ slug, title, description, icon_url, screenshot_url }`

* **Response**: `{ game: Game }`

# 5. UI/UX & Component Library (Generic)

*All UI built with Next.js + Tailwind CSS. Sketch in Figma or code sandbox with any component kit.*

## 5.1. Pages & Routes

* **`/games`**: Library page

  * Banner showing total count

  * Responsive grid of `GameCard`

  * **(future)** filter on game

* **`/games/[slug]`**: Detail page

  * `GameEmbed` (iframe)

  * `StatsBar` (plays, like/dislike)

  * `CommentsThread` (nested view)

  * `CommentForm`

  * `FeedbackForm`

* **`/admin/games`**: Admin page

  * Simple form + preview for adding new games

  * List of existing entries

* **(future)** `/games/trending`

## 5.2. Key Components

### 5.3. Threaded Comments

* Use an existing React tree component (e.g. [`react-comment-tree`](https://github.com/%3Cexample%3E), or build simple recursion)

* UI: indent replies, show “Reply” link under each comment

* Client builds tree by grouping comments by `parent_id`

# 6. Authentication & Authorization

* **Public**: no login required for browsing, playing, feedback, comments

* **Admin**: protect `/admin/games` via a simple env-based token check in API and client

# 7. Email & Notification Workflow

* **v0**: store feedback in DB only; no automated emails

* **Manual**: devs review `feedback_requests` table and send emails by hand

* **Future**: integrate SendGrid/Mailgun for “new game ready” notifications

# 8. Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Admin token for API
ADMIN_API_TOKEN=

# App URL
NEXT_PUBLIC_APP_URL=https://games.arcaneforge.ai
```

# 9. Directory Structure

```plain&#x20;text
/ project-root
├─ /app or /pages
│   ├─ /games
│   │   ├─ index.tsx       # GET /games
│   │   └─ [slug].tsx      # GET /games/[slug]
│   ├─ /admin
│   │   └─ games.tsx       # Admin create/list
│   └─ /components
│       ├─ Banner.tsx
│       ├─ GameCard.tsx
│       ├─ GameEmbed.tsx
│       ├─ StatsBar.tsx
│       ├─ CommentsThread.tsx
│       ├─ CommentForm.tsx
│       ├─ FeedbackForm.tsx
│       └─ AdminGameForm.tsx
├─ /pages/api
│   ├─ games
│   │   ├─ index.ts
│   │   └─ [slug]
│   │       ├─ index.ts
│   │       ├─ play.ts
│   │       ├─ like.ts
│   │       ├─ dislike.ts
│   │       ├─ comments.ts
│   │       └─ feedback.ts
│   └─ admin
│       └─ games.ts
├─ /public
│   └─ /games/[slug]/*    # Flutter builds + assets
├─ /styles
│   ├─ globals.css
│   └─ tailwind.config.js
├─ /migrations            # Supabase migrations (manual trigger)
├─ jest.config.js
├─ playwright.config.ts
├─ package.json
└─ README.md
```

# 10. Deployment & CI/CD

* **Supabase migrations**: manually run `supabase db push` before deploy

* **Vercel**: connect repo → set env vars → automatic deploy on push to `main`

* **Admin API token**: set in Vercel secrets

# 11. Testing Strategy

* **Unit tests** (Jest) for utilities + API routes

* **E2E tests** (Playwright) for public flows (browse, play, comment, feedback)

# 12. Coding Standards & Conventions

* **TypeScript** + **Next.js**

* **Tailwind CSS** for styling

* **ESLint** + **Prettier** with standard configs

* **Conventional commits** + branch naming: `feat/`, `fix/`, `chore/`

# 13. Onboarding Checklist

* Clone repo & install deps (`npm ci`)

* Copy `.env.local` from `.env.example` & fill keys

* Run `supabase db push` to set up schema

* `npm run dev` → visit `http://localhost:3000/games`

* Explore pages, components, API routes

* Create a feature branch and start coding!

# 14. Next Steps

1. Build core UI for `/games` and `/games/[slug]`

2. Implement Supabase schema + API routes

3. Implement threaded comments UI

4. Add admin page for game CRUD

5. Write tests & deploy to staging
