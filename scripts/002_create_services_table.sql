-- Create services table for barbershop services

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price decimal(10,2) not null,
  duration_minutes integer not null default 30,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.services enable row level security;

-- Create policies for services table
create policy "Anyone can view active services"
  on public.services for select
  using (is_active = true);

-- Admin policy to manage services
create policy "Admins can manage services"
  on public.services for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and is_admin = true
    )
  );

-- Create trigger for updated_at
create trigger services_updated_at
  before update on public.services
  for each row
  execute function public.handle_updated_at();

-- Insert default services
insert into public.services (name, description, price, duration_minutes) values
  ('Corte Clásico', 'Corte de cabello tradicional con tijeras y máquina', 15.00, 30),
  ('Corte + Barba', 'Corte de cabello completo con arreglo de barba', 25.00, 45),
  ('Solo Barba', 'Arreglo y perfilado de barba', 12.00, 20),
  ('Corte Niño', 'Corte especial para niños menores de 12 años', 10.00, 25),
  ('Afeitado Clásico', 'Afeitado tradicional con navaja', 18.00, 30)
on conflict do nothing;
