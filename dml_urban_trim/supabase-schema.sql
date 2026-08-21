create table if not exists public.appointments (
  reference text primary key,
  user_id uuid references auth.users(id) on delete restrict,
  service text not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  address text not null,
  latitude double precision,
  longitude double precision,
  appointment_date date not null,
  appointment_time text not null,
  note text not null default '',
  amount integer not null,
  status text not null check (status in ('pending', 'confirmed', 'payment_failed', 'quote_pending', 'quoted')),
  tint_color text,
  quoted_amount integer,
  quote_set_at timestamptz,
  pending_expires_at timestamptz,
  paid_at timestamptz,
  paystack_transaction_id text,
  created_at timestamptz not null default now()
);

create unique index if not exists appointments_active_slot_unique
  on public.appointments (appointment_date, appointment_time)
  where status in ('pending', 'confirmed');

alter table public.appointments enable row level security;

alter table public.appointments
  add column if not exists user_id uuid references auth.users(id) on delete restrict;

alter table public.appointments
  alter column latitude drop not null,
  alter column longitude drop not null;

alter table public.appointments
  add column if not exists tint_color text,
  add column if not exists quoted_amount integer,
  add column if not exists quote_set_at timestamptz;

alter table public.appointments
  drop constraint if exists appointments_status_check;

alter table public.appointments
  add constraint appointments_status_check
  check (status in ('pending', 'confirmed', 'payment_failed', 'quote_pending', 'quoted'));
