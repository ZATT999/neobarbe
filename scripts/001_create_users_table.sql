-- Create users table for barbershop booking system
-- This extends the auth.users with additional profile information

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.users enable row level security;

-- Create policies for users table
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- Admin policy to view all users
create policy "Admins can view all users"
  on public.users for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and is_admin = true
    )
  );

-- Create trigger to auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row
  execute function public.handle_updated_at();
