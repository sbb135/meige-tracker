-- =====================================================
-- MEIGE TRACKER DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

-- DROP existing table and recreate with all fields
DROP TABLE IF EXISTS daily_entries;

CREATE TABLE daily_entries (
  id SERIAL PRIMARY KEY,
  entry_date DATE UNIQUE NOT NULL,
  
  -- Sleep
  bed_time TEXT,
  wake_time TEXT,
  sleep_quality TEXT,
  sleep_interruptions TEXT,
  felt_rested TEXT,
  
  -- Emotional state at wake
  emotional_dysregulation TEXT,
  wake_crying BOOLEAN DEFAULT FALSE,
  wake_stabilize_time INTEGER DEFAULT 0,
  
  -- Wake symptoms (first 30 min)
  wake_eyes INTEGER DEFAULT 0,
  wake_face INTEGER DEFAULT 0,
  wake_neck INTEGER DEFAULT 0,
  wake_eyes_freq INTEGER DEFAULT 0,
  wake_speech INTEGER DEFAULT 0,
  wake_eating INTEGER DEFAULT 0,
  
  -- Morning symptoms
  morning_eyes INTEGER DEFAULT 0,
  morning_face INTEGER DEFAULT 0,
  morning_neck INTEGER DEFAULT 0,
  morning_eyes_freq INTEGER DEFAULT 0,
  morning_speech INTEGER DEFAULT 0,
  morning_eating INTEGER DEFAULT 0,
  
  -- Afternoon symptoms
  afternoon_eyes INTEGER DEFAULT 0,
  afternoon_face INTEGER DEFAULT 0,
  afternoon_neck INTEGER DEFAULT 0,
  afternoon_eyes_freq INTEGER DEFAULT 0,
  afternoon_speech INTEGER DEFAULT 0,
  afternoon_eating INTEGER DEFAULT 0,
  
  -- Evening symptoms
  evening_eyes INTEGER DEFAULT 0,
  evening_face INTEGER DEFAULT 0,
  evening_neck INTEGER DEFAULT 0,
  evening_eyes_freq INTEGER DEFAULT 0,
  evening_speech INTEGER DEFAULT 0,
  evening_eating INTEGER DEFAULT 0,
  
  -- Good period
  had_good_period BOOLEAN DEFAULT FALSE,
  good_period_when TEXT,
  good_period_duration TEXT,
  
  -- Medications
  medications_taken JSONB DEFAULT '{}',
  medication_notes TEXT,
  
  -- Triggers and side effects
  triggers JSONB DEFAULT '{}',
  side_effects JSONB DEFAULT '{}',
  
  -- Botox effect
  botox_effect TEXT,
  
  -- Daily assessment
  daily_limitation INTEGER DEFAULT 0,
  normal_tasks TEXT,
  crying_episodes INTEGER DEFAULT 0,
  mood TEXT,
  notes TEXT,
  
  -- NEW: Spasm onset timing and energy tracking
  spasm_onset_minutes INTEGER,
  energy_level INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster date lookups
CREATE INDEX idx_daily_entries_date ON daily_entries(entry_date);

-- Enable Row Level Security (RLS)
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (anon role)
CREATE POLICY "Public access" ON daily_entries FOR ALL TO anon USING (true) WITH CHECK (true);

-- =====================================================
-- OTHER TABLES (if not already created)
-- =====================================================

-- 2. Botox Injection Records Table
CREATE TABLE IF NOT EXISTS botox_injections (
  id bigint primary key generated always as identity,
  injection_date date not null,
  total_dose text,
  sites jsonb default '{}',
  doctor text,
  clinic text,
  notes text,
  created_at timestamp with time zone default now()
);

-- 3. Medication Configuration Table
CREATE TABLE IF NOT EXISTS medications (
  id bigint primary key generated always as identity,
  data jsonb default '[]',
  created_at timestamp with time zone default now()
);

-- 4. Medical Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id bigint primary key generated always as identity,
  appointment_date date not null,
  appointment_time text,
  doctor text,
  specialty text,
  clinic text,
  notes text,
  next_appointment_date date,
  created_at timestamp with time zone default now()
);

-- 5. Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
  id bigint primary key generated always as identity,
  data jsonb default '[]',
  created_at timestamp with time zone default now()
);

-- Enable RLS for other tables
ALTER TABLE botox_injections ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Create policies for other tables (if not exist)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'botox_injections' AND policyname = 'Public access') THEN
    CREATE POLICY "Public access" ON botox_injections FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medications' AND policyname = 'Public access') THEN
    CREATE POLICY "Public access" ON medications FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Public access') THEN
    CREATE POLICY "Public access" ON appointments FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'doctors' AND policyname = 'Public access') THEN
    CREATE POLICY "Public access" ON doctors FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Create indexes for other tables
CREATE INDEX IF NOT EXISTS idx_botox_injections_date ON botox_injections(injection_date);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
