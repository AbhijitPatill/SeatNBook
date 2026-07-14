-- USERS (customer / organiser / admin)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'organiser', 'admin')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- VENUES (created by admin)
CREATE TABLE venues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    address TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- SEATS (physical layout per venue)
CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    venue_id INTEGER REFERENCES venues(id) ON DELETE CASCADE,
    row_label VARCHAR(10) NOT NULL,
    seat_number INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL,  -- e.g. Premium, Standard
    UNIQUE (venue_id, row_label, seat_number)
);

-- EVENTS (movie/concert listing, created by organiser)
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    organiser_id INTEGER REFERENCES users(id),
    venue_id INTEGER REFERENCES venues(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- SHOWS (a specific date/time instance of an event at the venue)
CREATE TABLE shows (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- PRICING (per-category price per show)
CREATE TABLE show_pricing (
    id SERIAL PRIMARY KEY,
    show_id INTEGER REFERENCES shows(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    UNIQUE (show_id, category)
);

-- SEAT STATUS (per-show seat state: available / held / booked)
CREATE TABLE seat_status (
    id SERIAL PRIMARY KEY,
    show_id INTEGER REFERENCES shows(id) ON DELETE CASCADE,
    seat_id INTEGER REFERENCES seats(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'available'
        CHECK (status IN ('available', 'held', 'booked')),
    held_by INTEGER REFERENCES users(id),
    hold_expires_at TIMESTAMP,
    UNIQUE (show_id, seat_id)
);

-- BOOKINGS (confirmed booking, one row per booking; seats linked via booking_seats)
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES users(id),
    show_id INTEGER REFERENCES shows(id),
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed'
        CHECK (status IN ('confirmed', 'cancelled')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- BOOKING_SEATS (which seats belong to which booking)
CREATE TABLE booking_seats (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id INTEGER REFERENCES seats(id),
    price NUMERIC(10, 2) NOT NULL
);

-- WAITLIST (per show + category queue)
CREATE TABLE waitlist_entries (
    id SERIAL PRIMARY KEY,
    show_id INTEGER REFERENCES shows(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    customer_id INTEGER REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'waiting'
        CHECK (status IN ('waiting', 'offered', 'expired', 'converted')),
    offered_seat_id INTEGER REFERENCES seats(id),
    offer_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);