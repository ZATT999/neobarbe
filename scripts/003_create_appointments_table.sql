-- Create appointments table for booking system

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  service_id uuid references public.services(id) on delete restrict,
  client_name text not null,
  client_phone text,
  appointment_date date not null,
  appointment_time time not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed', 'no_show')),
  payment_method text check (payment_method in ('efectivo', 'tarjeta', 'transferencia')),
  payment_amount decimal(10,2),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure no double booking for the same time slot
  unique(appointment_date, appointment_time)
);

-- Enable Row Level Security
alter table public.appointments enable row level security;

-- Create policies for appointments table
create policy "Users can view their own appointments"
  on public.appointments for select
  using (auth.uid() = user_id);

create policy "Users can create appointments"
  on public.appointments for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own appointments"
  on public.appointments for update
  using (auth.uid() = user_id);

-- Admin policy to view and manage all appointments
create policy "Admins can manage all appointments"
  on public.appointments for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and is_admin = true
    )
  );

-- Create trigger for updated_at
create trigger appointments_updated_at
  before update on public.appointments
  for each row
  execute function public.handle_updated_at();

-- Create index for better query performance
create index if not exists idx_appointments_date_time on public.appointments(appointment_date, appointment_time);
create index if not exists idx_appointments_user_id on public.appointments(user_id);
create index if not exists idx_appointments_status on public.appointments(status);
