# Google OAuth (Daily Corner)

This document describes how Google sign-in works in Daily Corner: why the `User` table looks the way it does, how the NestJS backend was built, how the web and admin apps attach to it, how long a session lasts, how only one email can use admin, and why the signing key never reaches the browser.

There is **no NextAuth**. Authentication lives on the Nest API (`apps/server`). The Next.js apps only start Google login (a link) and call `/auth/me` / `/auth/logout` with cookies.

---

## What you get at a glance

| Piece | Choice |
| --- | --- |
| Identity provider | Google OAuth 2.0 (Passport `google`) |
| Session | One **JWT access token**, **7 days** |
| Storage | `httpOnly` cookie `daily_corner_access_token` |
| Refresh tokens | None (Google tokens are not stored either) |
| User model | One `User` row per person; `role` is `USER` \| `REPORTER` \| `ADMIN` |
| Admin access | Email must equal `ADMIN_EMAIL` (default `info@dailycorner.in`) |

After **7 days** the JWT expires (`expiresIn: '7d'`). The cookie is given the same lifetime (`maxAge` of 7 days). The next `/auth/me` request fails and the user is treated as logged out. Logging out earlier clears the cookie.

---

## 1. Why this architecture

The product has two frontends (`apps/web` on port 3000, `apps/admin` on 3001) and one API (`apps/server` on 4000). Putting OAuth on Nest means:

- Google client **secret** and JWT **signing key** stay in `apps/server/.env`.
- Both apps share the same cookie and the same `User` table.
- Admin is not a second identity system; it is the same user with `role = ADMIN`.

Passport is used **without** server sessions (`PassportModule.register({ session: false })`). Google’s redirect only identifies the person. Nest then issues its own JWT.

---

## 2. Database schema and what each column is for

Source of truth: `packages/database/prisma/schema.prisma`.

```prisma
enum UserRole {
  USER
  REPORTER
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
}

model User {
  id          String     @id @default(cuid())
  email       String     @unique
  googleId    String?    @unique
  name        String?
  image       String?
  role        UserRole   @default(USER)
  status      UserStatus @default(ACTIVE)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  lastLoginAt DateTime?
}
```

### Why one table (not separate “admin users”)

Everyone who signs in with Google is a row in `User`. Privilege is `role`, not a second table. A later reporter onboarding flow can promote an existing `USER` to `REPORTER` without creating another account. Admin is the same: the allowed Google email is upserted like anyone else, then `role` is set to `ADMIN`.

### Column-by-column

| Column | Type | Why it exists |
| --- | --- | --- |
| `id` | `TEXT`, Prisma `cuid()` | Stable primary key. CUIDs are URL-safe, unique, and not sequential (so IDs are not guessable like `1, 2, 3`). JWT `sub` is this id. |
| `email` | unique | Login identity we actually care about (Google always supplies it). Normalized to lowercase. Used to match `ADMIN_EMAIL` and to link a Google account if `googleId` was empty. |
| `googleId` | unique, nullable | Google’s subject id (`profile.id`). Lookup on every sign-in. Nullable so a user could theoretically be created before Google is linked; after first Google login it is set. Unique so two people cannot share one Google account. |
| `name` | optional | Display name from Google (`displayName`). Refreshed on each login. |
| `image` | optional | Profile photo URL from Google. Refreshed on each login. |
| `role` | enum, default `USER` | Authorization. `USER` = member, `REPORTER` = preserved if already set, `ADMIN` = only the configured admin email. Not a separate users table. |
| `status` | enum, default `ACTIVE` | Kill switch. `SUSPENDED` users fail Google upsert and JWT `validate` (`getUserById`). |
| `createdAt` | timestamp | When the row was first created. |
| `updatedAt` | timestamp | Last Prisma update (profile, role, login, etc.). |
| `lastLoginAt` | optional timestamp | Last successful Google sign-in. Useful for support and inactivity later; not used to expire the JWT. |

Session JSON sent to the browser (`SessionUser` in `packages/types`) is a **subset**: `id`, `email`, `name`, `image`, `role`. Status and timestamps stay on the server.

### Sign-in upsert rules (`AuthService.upsertGoogleUser`)

1. Require an email from Google; otherwise 401.
2. Find by `googleId`. If found and `ACTIVE`, update email/name/image/role/`lastLoginAt`.
3. Else find by `email` (same person, first time linking Google). Set `googleId` and the same fields.
4. Else **create** a new user (role from email; default `USER`).
5. Suspended accounts throw 401 in all cases.

`roleForEmail`:

- If email equals `ADMIN_EMAIL` → `ADMIN`.
- Else if the existing role is `REPORTER` → stay `REPORTER`.
- Else → `USER`.

So changing `ADMIN_EMAIL` takes effect on the **next Google login** of those accounts.

---

## 3. Backend: how it was built (step by step)

### Step A — Environment (server only)

Copy `apps/server/example.env` to `apps/server/.env`. Relevant variables:

| Variable | Role |
| --- | --- |
| `GOOGLE_CLIENT_ID` | OAuth client from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth secret; **never** sent to Next.js |
| `GOOGLE_CALLBACK_URL` | Must match the Authorized redirect URI exactly, e.g. `http://localhost:4000/auth/google/callback` |
| `JWT_SECRET` | HMAC key used to **sign and verify** JWTs; **never** sent to the frontend |
| `ADMIN_EMAIL` | Only this Google email becomes `ADMIN` / may finish admin OAuth |
| `WEB_ORIGIN` / `ADMIN_ORIGIN` | CORS allowlist and post-login redirects (`http://localhost:3000` / `3001`) |
| `PORT` | API listen port (4000) |

Google Cloud Console: create an OAuth 2.0 **Web application** client. Authorized JavaScript origins can include the API origin. **Authorized redirect URI** must be `GOOGLE_CALLBACK_URL` (the Nest callback, not a Next.js route).

Env is loaded via `apps/server/src/load-env.ts` so Nest (and webpack) see `apps/server/.env` even when the process cwd is the repo root.

### Step B — Prisma

Migration `20260822193000_google_oauth_users` created `User` with `USER` / `REPORTER`. Migration `20260823113000_add_admin_role` added `ADMIN` to the enum.

### Step C — Nest auth module

`AuthModule` (`apps/server/src/auth/auth.module.ts`):

1. `PassportModule` with **no** Express session.
2. `JwtModule` with `secret: JWT_SECRET` and `signOptions: { expiresIn: '7d' }`.
3. Providers: `AuthService`, `GoogleStrategy`, `JwtStrategy`.
4. `AuthController` exposes the HTTP routes.

`main.ts` installs `cookie-parser` and CORS with `credentials: true` for the two frontend origins. Without that, the browser would not attach the cookie on `/auth/me`.

### Step D — Start Google (`GET /auth/google`)

The login button is a normal link:

`http://localhost:4000/auth/google?from=web` or `?from=admin`

`GoogleAuthGuard` reads `from`, and passes Passport `state` as `"web"` or `"admin"` (OAuth `state` survives the round-trip to Google). Scopes: `email`, `profile`.

Passport redirects the browser to Google’s consent screen.

### Step E — Google strategy

`GoogleStrategy` (`passport-google-oauth20`) is constructed with `clientID`, `clientSecret`, and `callbackURL` from env. If any is missing, the server refuses to start.

`validate(accessToken, refreshToken, profile)` **ignores** Google’s access and refresh tokens (prefixed `_`). Daily Corner does not call Google APIs later and does not persist those tokens. It only uses `profile` to upsert the user, then returns a `SessionUser` that Passport hangs on `req.user`.

### Step F — Callback (`GET /auth/google/callback`)

Google redirects to Nest with an authorization code. Passport exchanges the code (using the **client secret on the server**) and runs `validate`.

Then `AuthController.googleCallback`:

1. Reads OAuth `state`. `admin` means the login started on the admin app.
2. **Admin gate:** if `fromAdmin` and `user.role !== 'ADMIN'`, redirect to `ADMIN_ORIGIN/login?error=forbidden` **without setting a cookie**.
3. Otherwise `signAccessToken`: JWT payload `{ sub: user.id, email, role }`, signed with `JWT_SECRET`, expiry **7d**.
4. `Set-Cookie` (see §6).
5. Redirect to `ADMIN_ORIGIN` or `WEB_ORIGIN`.

### Step G — Authenticated API (`GET /auth/me`)

`JwtAuthGuard` → `JwtStrategy`:

- Token is read from cookie `daily_corner_access_token`, or (fallback) `Authorization: Bearer`.
- `ignoreExpiration: false` so an expired JWT is rejected.
- Signature checked with `JWT_SECRET`.
- `validate` loads the user by `sub` and rejects missing / `SUSPENDED` users.

`CurrentUser` decorator returns that user. The handler returns the public `SessionUser`.

### Step H — Logout (`POST /auth/logout`)

Clears the cookie (`path: '/'`). No server-side session store to destroy. The JWT is still theoretically valid until expiry if someone had copied it, which is why **httpOnly** and not exposing it to JS matters.

---

## 4. Session length (automatic logout)

Two clocks are aligned on purpose:

1. **JWT** `expiresIn: '7d'` in `AuthModule`.
2. **Cookie** `maxAge: 7 * 24 * 60 * 60 * 1000` (7 days in milliseconds) on `Set-Cookie`.

The person stays logged in for **7 days** from the moment they complete Google login, unless they log out. There is no sliding refresh: using the app does **not** extend the JWT. After expiry, `/auth/me` returns 401 and the UIs treat the user as logged out. They must sign in with Google again.

`lastLoginAt` does not log anyone out.

---

## 5. How only one email is allowed for admin

This is **not** configured in Google Cloud as “only this user.” Google may still complete OAuth for any account that can use the OAuth client. Daily Corner enforces admin in **application code**.

1. **Role assignment** (`AuthService.roleForEmail`): compare the Google email (lowercased) to `ADMIN_EMAIL` from env (default `info@dailycorner.in`). Match → `role = ADMIN`. Anyone else is `USER` (or stays `REPORTER`).

2. **Admin callback** (`googleCallback`): if the login was started with `from=admin` and the resulting user is not `ADMIN`, redirect to `/login?error=forbidden` and **do not** set the access cookie for that attempt.

3. **Admin UI**: homepage redirects to `/login` unless `useGetMeQuery()` returns `role === "ADMIN"`. A member cookie from the web app is not enough to see the dashboard.

To change the admin account, set `ADMIN_EMAIL` in `apps/server/.env` and restart the server. The new address becomes `ADMIN` on next Google login; the old address is demoted to `USER` on its next login (unless it is `REPORTER`).

---

## 6. HTTP-only cookie and why the key is not exposed

### What is stored

Cookie name: `daily_corner_access_token` (`packages/auth/src/index.ts`).

Value: the JWT string (three Base64url parts: header, payload, signature).

Flags set on callback:

| Flag | Meaning |
| --- | --- |
| `httpOnly: true` | **JavaScript cannot read this cookie** (`document.cookie` will not include it). XSS in the Next app cannot easily steal the token. |
| `sameSite: 'lax'` | Cookie is sent on top-level navigations and same-site requests; reduces CSRF from random third-party sites. |
| `secure: true` in production | Cookie only sent over HTTPS. |
| `path: '/'` | Sent on all API paths. |
| `maxAge` 7 days | Browser drops the cookie when this elapses. |

The cookie is issued by the **API host** (e.g. `localhost:4000`). Frontends call the API with `credentials: "include"` so the browser attaches it. CORS `origin` + `credentials: true` is required for that cross-port request.

### What “the key” is

**`JWT_SECRET` is the signing key.** It lives only in `apps/server/.env`. Nest uses it to sign tokens and to verify them. It is **not** in `NEXT_PUBLIC_*` env, not in the JWT payload, and not in any cookie the browser needs to “know.” The browser only stores the **already-signed token**.

A JWT is **signed, not encrypted**. Anyone who *could* read the cookie could decode the payload (`sub`, `email`, `role`) but **cannot forge a valid token** without `JWT_SECRET`. `httpOnly` is how we keep the token out of page JavaScript.

**`GOOGLE_CLIENT_SECRET`** is used only on the server when Passport exchanges Google’s code. The Next apps never see it. They do not even need `GOOGLE_CLIENT_ID`; they only open `/auth/google` on the API.

### Frontend does not hold the token

Web: `fetch(..., { credentials: "include" })` in `useSession`.

Admin: RTK Query `fetchBaseQuery({ credentials: "include" })`.

Neither reads the cookie. The browser sends it automatically to `NEXT_PUBLIC_API_URL`.

Logout clears the cookie; the client never needed to delete a token from `localStorage`.

---

## 7. Frontend integration

Shared helper `googleAuthUrl(apiBaseUrl, client)` builds `/auth/google?from=web|admin`.

Both apps use the same button component pattern: an `<a href={...}>` (“Continue with Google”), not a NextAuth signIn call.

### Web (`apps/web`)

- Env: `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:4000`). No Google secrets.
- `GoogleSignInButton` with `client="web"`.
- After Google, Nest redirects to `WEB_ORIGIN` (`http://localhost:3000`).
- `useSession()` calls `GET /auth/me` with cookies. 401 → `user = null`.
- Logout: `POST /auth/logout` with credentials, then reload.

Unauthenticated members can still view public pages; login is opt-in.

### Admin (`apps/admin`)

- Same API URL and cookie.
- `GoogleSignInButton` with `client="admin"` so `state=admin`.
- RTK Query `getMe` / `logout` against `/auth/me` and `/auth/logout`.
- **If there is no admin session, `/` redirects to `/login`.**
- If already `ADMIN`, `/login` redirects to `/`.
- Forbidden Google account: `/login?error=forbidden`.
- Logout invalidates the `User` cache and navigates to `/login`.

### Sequence (happy path)

```text
Browser (web or admin)
  → GET /auth/google?from=web|admin     (Nest)
  → Google consent
  → GET /auth/google/callback?code&state (Nest + client secret)
  → upsert User, sign JWT, Set-Cookie httpOnly
  → 302 to :3000 or :3001
  → GET /auth/me with cookie             (Nest verifies JWT_SECRET)
  → JSON SessionUser
```

---

## 8. File map

| Area | Path |
| --- | --- |
| Prisma `User` | `packages/database/prisma/schema.prisma` |
| Cookie name + Google URL helper | `packages/auth/src/index.ts` |
| Public session type | `packages/types/src/index.ts` |
| Nest module / JWT 7d | `apps/server/src/auth/auth.module.ts` |
| Routes, cookie, admin redirect | `apps/server/src/auth/auth.controller.ts` |
| Upsert, admin email, sign JWT | `apps/server/src/auth/auth.service.ts` |
| Google Passport strategy | `apps/server/src/auth/google.strategy.ts` |
| Cookie JWT strategy | `apps/server/src/auth/jwt.strategy.ts` |
| CORS + cookie parser | `apps/server/src/main.ts` |
| Server env template | `apps/server/example.env` |
| Web session | `apps/web/lib/use-session.ts` |
| Admin session + gate | `apps/admin/lib/services/api/auth.ts`, `apps/admin/app/page.tsx` |

---

## 9. Local checklist

1. Postgres up; Prisma migrations applied.
2. `apps/server/.env` filled: Google client, callback URL, `JWT_SECRET`, `ADMIN_EMAIL`.
3. Google Cloud redirect URI matches `GOOGLE_CALLBACK_URL`.
4. `pnpm dev` — API :4000, web :3000, admin :3001.
5. Sign in on web with any Google account → member session for 7 days.
6. Sign in on admin with a **non-admin** Google account → `/login?error=forbidden`.
7. Sign in on admin with `ADMIN_EMAIL` → dashboard.
8. Wait 7 days or clear the cookie / click Log out → logged out.
