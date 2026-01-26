-- =====================================================
-- MEIGE TRACKER DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Daily Symptom Entries Table
create table if not exists daily_entries (
  id bigint primary key generated always as identity,
  entry_date date not null unique,
  
  -- Sono (Sleep)
  bed_time text,
  wake_time text,
  sleep_quality text,
  
  -- Sintomas ao acordar
  wake_eyes integer default 0,
  wake_face integer default 0,
  
  -- Sintomas manhã
  morning_eyes integer default 0,
  morning_face integer default 0,
  morning_speech integer default 0,
  morning_eating integer default 0,
  
  -- Sintomas tarde
  afternoon_eyes integer default 0,
  afternoon_face integer default 0,
  afternoon_speech integer default 0,
  afternoon_eating integer default 0,
  
  -- Sintomas noite
  evening_eyes integer default 0,
  evening_face integer default 0,
  evening_speech integer default 0,
  evening_eating integer default 0,
  
  -- Triggers
  triggers jsonb default '{}',
  
  -- Funcionalidade
  normal_tasks text,
  crying_episodes integer default 0,
  
  -- Medicação tomada
  medications_taken jsonb default '{}',
  
  -- Notas
  notes text,
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Botox Injection Records Table
create table if not exists botox_injections (
  id bigint primary key generated always as identity,
  injection_date date not null,
  total_dose text,
  sites jsonb default '{}',  -- { "masseter_esq": 10, "masseter_dir": 10, ... }
  doctor text,
  clinic text,
  notes text,
  created_at timestamp with time zone default now()
);

-- 3. Medication Configuration Table
create table if not exists medications (
  id bigint primary key generated always as identity,
  name text not null,
  dose_per_pill text,
  times_per_day jsonb default '[]',  -- ["08:00", "14:00", "20:00"]
  notes text,
  active boolean default true,
  created_at timestamp with time zone default now()
);

-- 4. Medical Appointments Table
create table if not exists appointments (
  id bigint primary key generated always as identity,
  appointment_date date not null,
  appointment_time text,
  doctor text,
  specialty text,
  clinic text,
  notes text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table daily_entries enable row level security;
alter table botox_injections enable row level security;
alter table medications enable row level security;
alter table appointments enable row level security;

-- Create policies for public read/write access (for now - no auth)
create policy "Public can read daily_entries" on daily_entries for select to anon using (true);
create policy "Public can insert daily_entries" on daily_entries for insert to anon with check (true);
create policy "Public can update daily_entries" on daily_entries for update to anon using (true);
create policy "Public can delete daily_entries" on daily_entries for delete to anon using (true);

create policy "Public can read botox_injections" on botox_injections for select to anon using (true);
create policy "Public can insert botox_injections" on botox_injections for insert to anon with check (true);
create policy "Public can update botox_injections" on botox_injections for update to anon using (true);
create policy "Public can delete botox_injections" on botox_injections for delete to anon using (true);

create policy "Public can read medications" on medications for select to anon using (true);
create policy "Public can insert medications" on medications for insert to anon with check (true);
create policy "Public can update medications" on medications for update to anon using (true);
create policy "Public can delete medications" on medications for delete to anon using (true);

create policy "Public can read appointments" on appointments for select to anon using (true);
create policy "Public can insert appointments" on appointments for insert to anon with check (true);
create policy "Public can update appointments" on appointments for update to anon using (true);
create policy "Public can delete appointments" on appointments for delete to anon using (true);

-- Create indexes for better performance
create index if not exists idx_daily_entries_date on daily_entries(entry_date);
create index if not exists idx_botox_injections_date on botox_injections(injection_date);
create index if not exists idx_appointments_date on appointments(appointment_date);
