-- Global Stay production foundation for Supabase/PostgreSQL.
-- Run this in the Supabase SQL editor before enabling production mode.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text not null,
  role text not null default 'traveler' check (role in ('traveler', 'provider', 'admin')),
  country_code text,
  preferred_currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  category text not null check (category in ('Hôtels', 'Villas', 'Voitures', 'Restaurants', 'Taxis', 'Services', 'Expériences', 'Maisons', 'Terrains')),
  title text not null,
  description text not null,
  location text not null,
  country_code text not null,
  currency text not null default 'EUR',
  price numeric(14, 2) not null check (price >= 0),
  unit text not null,
  status text not null default 'pending_review' check (status in ('pending_review', 'published', 'paused', 'rejected')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null,
  media_type text not null check (media_type in ('image', 'video')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete restrict,
  traveler_id uuid not null references public.profiles(id) on delete restrict,
  provider_id uuid not null references public.profiles(id) on delete restrict,
  request_type text not null check (request_type in ('séjour', 'visite', 'restaurant', 'taxi', 'service', 'experience')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  quantity integer not null default 1 check (quantity > 0),
  total numeric(14, 2) not null check (total >= 0),
  currency text not null,
  pickup_location text,
  dropoff_location text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'cancelled', 'completed')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'requires_action', 'paid', 'refunded', 'failed')),
  payment_provider text,
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  rating integer not null check (rating between 1 and 5),
  comment text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists listings_location_idx on public.listings(country_code, location);
create index if not exists listings_status_idx on public.listings(status);
create index if not exists bookings_provider_status_idx on public.bookings(provider_id, status);
create index if not exists bookings_traveler_idx on public.bookings(traveler_id, created_at desc);
create index if not exists notifications_recipient_idx on public.notifications(recipient_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_media enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.notifications enable row level security;

create policy "published listings are public" on public.listings for select using (status = 'published' or owner_id = auth.uid());
create policy "providers create their own listings" on public.listings for insert with check (owner_id = auth.uid());
create policy "providers update their own listings" on public.listings for update using (owner_id = auth.uid());
create policy "users read their own profile" on public.profiles for select using (id = auth.uid());
create policy "users update their own profile" on public.profiles for update using (id = auth.uid());
create policy "users create their own profile" on public.profiles for insert with check (id = auth.uid());
create policy "users read their bookings" on public.bookings for select using (traveler_id = auth.uid() or provider_id = auth.uid());
create policy "travelers create bookings" on public.bookings for insert with check (traveler_id = auth.uid());
create policy "participants update bookings" on public.bookings for update using (traveler_id = auth.uid() or provider_id = auth.uid());
create policy "published listing media is public" on public.listing_media for select using (exists (select 1 from public.listings where listings.id = listing_id and (listings.status = 'published' or listings.owner_id = auth.uid())));
create policy "owners manage listing media" on public.listing_media for all using (exists (select 1 from public.listings where listings.id = listing_id and listings.owner_id = auth.uid()));
create policy "published reviews are public" on public.reviews for select using (exists (select 1 from public.listings where listings.id = listing_id and listings.status = 'published'));
create policy "traveler reviews completed booking" on public.reviews for insert with check (author_id = auth.uid() and exists (select 1 from public.bookings where bookings.id = booking_id and bookings.traveler_id = auth.uid() and bookings.status = 'completed'));
create policy "users read own notifications" on public.notifications for select using (recipient_id = auth.uid());
create policy "users mark own notifications read" on public.notifications for update using (recipient_id = auth.uid());

-- In production, add a trigger to create profiles from auth.users and server-side
-- functions for booking availability, payment webhooks, and provider notifications.
