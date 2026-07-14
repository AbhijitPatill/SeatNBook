# SeatNBook

A full-stack ticket booking platform for movies and concerts — customers book seats from a live visual map, held seats auto-release on abandonment, sold-out shows have a waitlist with automatic seat reassignment on cancellation, and every confirmed booking emails a QR-code ticket.

**Live demo:** https://seat-n-book.vercel.app
**Backend API:** https://seatnbook-backend.onrender.com

---

## Tech Stack

**Backend:** Node.js, Express, PostgreSQL, Redis, Socket.io
**Frontend:** React (Vite), Tailwind CSS v4, react-router-dom, axios, socket.io-client
**Auth:** JWT + bcrypt
**Email:** Nodemailer via Gmail SMTP (App Password)
**QR codes:** `qrcode` (server-side generation), `qrcode.react` (client-side live preview)

---

## Local Setup

### Prerequisites
- Node.js 20 LTS
- Docker Desktop (for local Postgres + Redis)
- A Gmail account with a generated [App Password](https://myaccount.google.com/apppasswords) (requires 2-Step Verification enabled)

### 1. Clone and install

```bash
git clone https://github.com/AbhijitPatill/SeatNBook.git
cd SeatNBook

cd backend
npm install

cd ../frontend
npm install
```

### 2. Start Postgres + Redis locally

From the project root:

```bash
docker compose up -d
```

This starts two containers:
- `tbs_postgres` — PostgreSQL 16 on port 5432
- `tbs_redis` — Redis 7 on port 6379, with `--notify-keyspace-events Ex` enabled (required for the seat-hold auto-release mechanism — see [Seat Hold & TTL Logic](#seat-hold--ttl-logic) below)

### 3. Configure environment variables

Copy `.env.example` to `backend/.env` and fill in your own values:

```bash
cp .env.example backend/.env
```

See `.env.example` for what each variable does. At minimum you'll need to set `EMAIL_USER` and `EMAIL_APP_PASSWORD` for ticket emails to send.

### 4. Load the database schema

```bash
docker cp backend/db/schema.sql tbs_postgres:/schema.sql
docker exec -it tbs_postgres psql -U tbs_user -d ticket_booking -f /schema.sql
```

Then add the performance indexes:

```bash
docker exec -it tbs_postgres psql -U tbs_user -d ticket_booking -c "CREATE INDEX idx_seat_status_show ON seat_status(show_id); CREATE INDEX idx_waitlist_lookup ON waitlist_entries(show_id, category, status); CREATE UNIQUE INDEX idx_waitlist_unique_waiting ON waitlist_entries(show_id, category, customer_id) WHERE status = 'waiting';"
```

### 5. Run the app

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

Backend runs on `http://localhost:5000`, frontend on `http://localhost:5173`.

### 6. Create an admin account

Admin self-registration is intentionally blocked (only `customer` and `organiser` roles can self-register). To create an admin, register normally, then promote the account directly in the database:

```bash
docker exec -it tbs_postgres psql -U tbs_user -d ticket_booking -c "UPDATE users SET role='admin' WHERE email='your@email.com';"
```

You'll need to log out and back in afterward, since the JWT bakes the role in at login time.

---

## Database Schema

11 tables:

| Table | Purpose |
|---|---|
| `users` | Auth + role (`customer` / `organiser` / `admin`) |
| `venues` | Physical venues, created by admin |
| `seats` | Physical seat layout per venue (row, number, category) |
| `events` | Movie/concert listings, created by organisers, tied to a venue, with `category` (movie/concert) and optional `image_url` |
| `shows` | A specific date/time instance of an event |
| `show_pricing` | Per-category price for a specific show |
| `seat_status` | **The live seat map** — one row per seat per show, tracking `available` / `held` / `booked`, `held_by`, and `hold_expires_at` |
| `bookings` | Confirmed bookings, with a unique `booking_reference` (QR-encoded) |
| `booking_seats` | Seats attached to a booking, with price locked in at time of booking (so later price changes don't retroactively affect past revenue reports) |
| `waitlist_entries` | Per (show, category) waitlist queue, with `status` (`waiting` / `offered` / `expired` / `converted`) |

`seat_status` is populated in one batch insert the moment a show is created — every seat belonging to that show's venue gets a row, defaulting to `available`, scoped to that specific show.

---

## Seat Hold & TTL Logic

When a customer selects a seat, two things happen:

1. **Redis lock:** `SET hold:{showId}:{seatId} {userId} NX EX {ttl}` — atomic, single-threaded, so if two customers hit the same seat simultaneously, only one `SET` can succeed. This is the actual concurrency guarantee, not a database transaction.
2. **Postgres mirror:** only after the Redis lock succeeds does `seat_status` get updated to `held`, guarded by `WHERE status = 'available'` as a second layer of defense.

**Auto-release on abandonment:** Redis is configured with keyspace notifications (`notify-keyspace-events Ex`). When a `hold:*` key's TTL expires, Redis fires an `expired` event. A backend listener (`services/expiryListener.js`) subscribes to this event, flips the corresponding seat back to `available` in Postgres, and broadcasts the change over Socket.io — so every connected customer sees the seat open up in real time, with zero polling.

**On successful checkout**, the Redis hold key is deleted immediately rather than left to expire naturally.

> **Known limitation:** this mechanism relies on the Redis server allowing `CONFIG SET notify-keyspace-events` at runtime (the backend sets this itself on startup, rather than requiring it as a host-level flag, for portability). Some managed Redis providers restrict the `CONFIG` command for security reasons, which would prevent keyspace notifications from being enabled in that environment — in which case held seats would still expire correctly in Redis, but the auto-release-to-`available` step in Postgres would not fire automatically until the next action touches that seat.

---

## Waitlist & Cancellation Logic

- Waitlists are scoped to (show, category) — not individual seats — since specific seats aren't guaranteed to open up.
- A join adds an entry to a Redis sorted set (scored by join timestamp, giving FIFO order) plus a `waitlist_entries` row.
- **On cancellation:** the freed seat's category is checked against the waitlist. If someone's waiting, the earliest entry is popped, a new Redis hold is created scoped specifically to them (shorter TTL, e.g. 15 minutes), a signed HMAC-SHA256 token is generated encoding the show/seat/entry IDs, and an email is sent with a claim link containing that token.
- **Claiming:** the link lands on a page that reads the token from the URL and calls a checkout endpoint that verifies the HMAC signature, confirms the offer is still valid and belongs to the claiming customer, and converts it into a real booking.
- **If unclaimed in time:** the offer's Redis key expires like a normal hold, but the expiry listener checks whether the expiring key was a waitlist offer specifically — if so, it marks that entry `expired` and immediately re-runs the waitlist-pop logic for the same seat, offering it to the next person in line. This recursive loop needs no separate scheduler; it's the same event handler firing again.

---

## API Overview

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Register (customer/organiser only) |
| POST | `/auth/login` | Public | Login, returns JWT |
| GET | `/venues` | Any | List venues |
| POST | `/venues` | Admin | Create venue |
| POST | `/venues/:id/seats` | Admin | Bulk-add seats to a venue |
| GET | `/events` | Any | List all events |
| POST | `/events` | Organiser/Admin | Create event |
| POST | `/events/:id/shows` | Organiser/Admin | Create a show (auto-populates seat map) |
| POST | `/events/shows/:id/pricing` | Organiser/Admin | Set per-category pricing |
| GET | `/shows/events` | Any | Browse events (filters: `title`, `date`, `category`) |
| GET | `/shows/events/:id/shows` | Any | List showtimes for an event |
| GET | `/shows/:id/seatmap` | Any | Get live seat map for a show |
| POST | `/shows/:showId/seats/:seatId/hold` | Customer | Hold a seat |
| DELETE | `/shows/:showId/seats/:seatId/hold` | Customer | Release a held seat |
| POST | `/bookings/checkout` | Customer | Convert held seats into a confirmed booking |
| DELETE | `/bookings/:id` | Customer | Cancel a booking (triggers waitlist offer if applicable) |
| POST | `/bookings/waitlist-checkout` | Customer | Claim a waitlist offer |
| GET | `/bookings/my-bookings` | Customer | Booking history |
| GET | `/reports/events/:id/summary` | Organiser/Admin | Revenue + seat summary per show |

---

## Known Limitations / Not Yet Built

- Admin venue/seat creation has a dedicated UI now, but was originally Postman-only during early development
- Re-offer-on-expiry (waitlist offer going unclaimed → auto re-offer to next person) uses the same code path as the proven cancellation flow, but hasn't been explicitly exercised as a live test
- Redis `CONFIG SET` for keyspace notifications may be restricted on some hosted providers (see Seat Hold & TTL Logic above)
- StatStrip numbers on the landing page are illustrative, not live-calculated

---

## Deployment

- **Frontend:** Vercel (static build from `frontend/`)
- **Backend:** Render (Node web service, root directory `backend/`)
- **Database:** Neon (managed Postgres)
- **Redis:** Render Key Value (managed Redis)

Environment variables for production mirror `.env.example`, with `DATABASE_URL` and `REDIS_URL` pointed at the hosted instances, `FRONTEND_URL` set to the live Vercel URL, and `NODE_ENV=production` (enables SSL on the Postgres connection).
