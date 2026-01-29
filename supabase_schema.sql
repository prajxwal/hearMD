-- Create a table for doctors
create table doctors (
  user_id uuid references auth.users not null primary key,
  full_name text not null,
  specialization text not null,
  clinic_name text not null,
  registration_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table doctors enable row level security;

-- Create Policy: Doctors can view their own profile
create policy "Doctors can view own profile"
  on doctors for select
  using ( auth.uid() = user_id );

-- Create Policy: Doctors can insert their own profile
create policy "Doctors can insert own profile"
  on doctors for insert
  with check ( auth.uid() = user_id );

-- Create Policy: Doctors can update their own profile
create policy "Doctors can update own profile"
  on doctors for update
  using ( auth.uid() = user_id );
