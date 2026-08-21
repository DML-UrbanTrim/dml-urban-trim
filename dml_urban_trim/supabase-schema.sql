create table if not exists public.appointments (
  reference text primary key,
  user_id uuid references auth.users(id) on delete restrict,
  service text not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  appointment_date date not null,
  appointment_time text not null,
  note text not null default '',
  amount integer not null,
  status text not null check (status in ('pending', 'confirmed', 'payment_failed')),
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
