-- Enable UUID generation (gen_random_uuid is provided by pgcrypto on Supabase)
create extension if not exists pgcrypto;

create table users (
  id uuid primary key default gen_random_uuid(),
  email text,
  name text,
  created_at timestamp with time zone default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references users (id),
  name text,
  reveal_at timestamp with time zone,
  max_guests int,
  status text default 'active',
  created_at timestamp with time zone default now()
);

create table guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events (id),
  display_name text,
  joined_at timestamp with time zone default now()
);

create table photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events (id),
  guest_id uuid references guests (id),
  storage_key text,
  is_hidden boolean default true,
  taken_at timestamp with time zone default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events (id),
  amount int,
  stripe_id text,
  status text,
  paid_at timestamp with time zone
);
