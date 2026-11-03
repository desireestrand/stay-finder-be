# StayFinder API (backend)

REST API for **StayFinder**, an Airbnb-like service where users can list places to stay and book them.
Built with Hono and TypeScript on top of Supabase (Auth and Postgres with Row Level Security).

- Frontend repository: [Link](https://github.com/desireestrand/stay-finder-fe)
- Backend repository: [Link](https://github.com/desireestrand/stay-finder-be)

## Tech stack

- [Hono](https://hono.dev) on Node.js (`@hono/node-server`)
- TypeScript (`strict`)
- [Supabase](https://supabase.com): Auth and Postgres (RLS, constraints, triggers)
- [zod](https://zod.dev) for request validation

## Getting started

### 1. Prerequisites

- Node.js 20 or newer
- A Supabase project (the free tier is enough)

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Go to **Authentication > Providers > Email** and turn **off** "Confirm email". Otherwise a new user is not signed in right after registering.
3. Open the **SQL Editor** and run [`stayfinder_setup.sql`](./stayfinder_setup.sql). It drops and recreates the tables, the Row Level Security policies, the availability view, the triggers and the seed data.
   **Warning:** this deletes all existing data in `properties` and `bookings`.
4. Go to **Project Settings > API Keys** and copy the project URL and the **publishable** (anon) key.

**About the seed data:** the seed rows are tied to five fixed user ids (for example the owner `5db14e43-c106-46c3-aaae-d0aed5bcc056`). The SQL only inserts rows for users that exist in `auth.users`, so in a new Supabase project the seed is empty until those users exist.
To get demo data: register a few users (**Authentication > Users** shows their ids), then replace the user ids in section 2 of `stayfinder_setup.sql` with your own and run the script again.

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill it in:

| Variable | Description | Default |
|---|---|---|
| `SUPABASE_URL` | Your Supabase project URL | required |
| `SUPABASE_PUBLISHABLE_KEY` | The **publishable / anon** key. Never use a `service_role` or `sb_secret_` key | required |
| `HONO_PORT` | Port the API listens on | `3000` |
| `FRONTEND_URL` | Origin of the frontend, used for CORS | `http://localhost:3001` |
| `NODE_ENV` | `development` or `production` (`production` makes the session cookie `secure`) | `development` |

The API refuses to start if the key is a secret or `service_role` key. Those keys bypass Row Level Security, which would turn off the database protection.

### 4. Install and run

```bash
npm install
npm run dev
```

The API is now running on <http://localhost:3000>. `GET /` should return `{"name":"StayFinder API"}`.

| Script | What it does |
|---|---|
| `npm run dev` | Start with automatic reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |

`npm run dev` does not type-check. Run `npx tsc --noEmit` to check the types.

## Testing

All requests are in [`requests.http`](./requests.http). Open it in VS Code with the
[REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension and run the requests from top to bottom. Every request states the **expected** result.

Before the first run:

1. Run `stayfinder_setup.sql` to reset the data.
2. Set the variables at the top of the file. `@ownerEmail` must be the account that owns the seed properties.
3. Start the API.

The file covers every criterion, both successful requests and denied ones:

| Section | Covers |
|---|---|
| 1 | The database directly, without the API (anonymous Row Level Security) |
| 2 | Sign up, log in, session, log out |
| 3 | Listing, filtering, sorting |
| 4 | Creating, changing and deleting properties, ownership |
| 5 | Creating bookings: validation, capacity, price, overlaps |
| 6 | Search by available dates |
| 7 | Ownership of bookings (guest, owner, other user) |
| 8 | Booking status flow and roles |
| 9 | Viewing and deleting bookings |
| 10 | The price is frozen when a booking is made |
| 11 | Bookings in the past |
| 12 | The same rules when the API is bypassed (requests sent straight to Supabase) |

Run `stayfinder_setup.sql` again before running the whole file a second time, because the requests create accounts and bookings.

## API overview

Authentication uses an `httpOnly` session cookie, so clients must send credentials (`credentials: "include"` in `fetch`).

| Method and path | Auth | Description |
|---|---|---|
| `POST /auth/register`, `POST /auth/login` | no | Create an account, log in |
| `GET /auth/me`, `POST /auth/logout` | yes | Current user, log out |
| `GET /properties` | no | List properties. Query: `q`, `city`, `min_price`, `max_price`, `max_guests`, `start_date` + `end_date` (available dates), `sort_by`, `sort_order`, `limit`, `offset` |
| `GET /properties/kind/:kind` | no | List by kind (`apartment`, `villa`, `cabin`) |
| `GET /properties/:propertyId` | no | One property |
| `GET /properties/me` | yes | My properties |
| `POST /properties`, `PATCH`/`PUT`/`DELETE /properties/:propertyId` | yes | Create, change, delete (owner only) |
| `GET /bookings/me` | yes | My bookings |
| `GET /bookings/properties/:propertyId` | yes | Bookings for a property (owners see all, others see their own) |
| `GET /bookings/:bookingId` | yes | One booking |
| `POST /bookings/properties/:propertyId` | yes | Create a booking |
| `PATCH`/`PUT`/`DELETE /bookings/properties/:propertyId/:bookingId` | yes | Change, confirm, cancel or delete a booking |

### Error responses

Every error has the same shape and a matching status code:

```json
{ "error": "The property is already booked for the selected dates", "code": "BOOKING_OVERLAP" }
```

Validation errors (400) list the fields: `{ "errors": [["guests", "Guests must be greater than 0"]] }`.

| Status | Meaning |
|---|---|
| 200 / 201 | Success / something was created |
| 400 | Invalid data |
| 401 | Not logged in, or wrong credentials |
| 403 | Not allowed (for example a guest confirming a booking) |
| 404 | Not found (also returned when Row Level Security hides the row) |
| 409 | Conflict with the current state (overlap, invalid status change, booking in the past) |
| 500 | Unexpected error (the details are only written to the server log) |

## Where the rules live

The rules that must always hold are in the **database**, so they apply even when someone calls Supabase directly. The API identifies the user, validates the input and translates database errors into status codes.

| Criterion | Database | API |
|---|---|---|
| Only logged-in users write, and only owners change their own data (G6, G15, VG1) | RLS policies on `properties` and `bookings`. A trigger blocks changing `user_id` and `property_id` | `requireAuth`. `user_id` is taken from the session, never from the client |
| No double bookings (VG2) | Exclusion constraint `bookings_no_overlap` (`btree_gist`, half-open date range, ignores cancelled bookings) | `23P01` is mapped to 409 `BOOKING_OVERLAP` |
| Capacity (VG3) | Trigger reads `max_guests` from the property | Maps `CAPACITY_EXCEEDED` to 400 |
| Status flow with roles (VG4) | Trigger with a transition table. Only the owner can confirm (`auth.uid()`). A cancelled booking is locked | Maps `FORBIDDEN` to 403 and `INVALID_STATUS_TRANSITION` to 409 |
| Time rules (VG5) | Triggers for insert, update and delete, using Swedish time | Maps to 409 `PAST_BOOKING_NOT_ALLOWED` |
| Price on the server (VG6) | Trigger sets `total_price` and stores `price_per_night` on the booking, so later price changes do not affect it | Zod strips any price sent by the client |
| Available dates (VG7) | View `booking_availability` (only property id and dates) | Excludes booked properties and combines the search with the filters and sorting |

Why not only in the API? The publishable key is meant to be public, so anyone can call Supabase directly. Row Level Security also hides other users' bookings from a guest, so the API could not even see an overlap. A constraint is also safe against two bookings arriving at the same moment.

## Project structure

```
src/
  index.ts          App setup: CORS, auth middleware, routes, error handler
  env.ts            Reads and checks environment variables
  routes/           auth, properties, bookings
  database/         Queries to Supabase, one file per table
  validators/       zod schemas for body, params and query
  middleware/       auth.ts: per-request Supabase client from the session cookie
  utils/            error.ts (AppError, mapDbError), handleRouteError.ts, validation.ts
  types/            Generated database types and derived types
stayfinder_setup.sql  Tables, RLS, view, triggers and seed data
requests.http         Test requests with expected results
```

## Regenerating database types

After changing the database, regenerate the types:

```bash
npx supabase gen types typescript --project-id <your-project-id> --schema public > src/types/database.types.d.ts
```

On older Windows PowerShell `>` writes UTF-16. Use Git Bash or cmd, or add `| Out-File -Encoding utf8`.

## Security notes

- The API only uses the publishable key together with the user's own session, so Row Level Security applies to every query.
- The session cookie is `httpOnly` and `sameSite: lax`, and `secure` in production.
- `requests.http` contains the project URL and publishable key. That key is public by design.
- Do not commit `.env`.