-- =============================================
-- Expert Lens Pipeline™ — ActivaQR.com
-- Script de Creación de Tablas (Ejecutar en Supabase SQL Editor)
-- =============================================

-- 1. ENUMS (Si ya existen, puedes ignorar errores de 'already exists')
DO $$ BEGIN
    CREATE TYPE pipeline_status AS ENUM ('draft', 'in_pipeline', 'pending_review', 'in_checklist', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE lens_type AS ENUM (
        'draft_initial', 'lens_clarity', 'lens_neuro', 'lens_copy', 
        'lens_music', 'lens_seo', 'lens_visual', 'checklist_buyer_persona',
        'production_video', 'production_voice', 'production_music'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE lens_verdict AS ENUM ('green', 'yellow', 'red', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. TABLAS

-- Guiones (tabla principal)
CREATE TABLE IF NOT EXISTS scripts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  original_idea TEXT NOT NULL,
  current_body  TEXT NOT NULL DEFAULT '',
  version       INTEGER NOT NULL DEFAULT 0,
  status        pipeline_status NOT NULL DEFAULT 'draft',
  input_type    TEXT NOT NULL DEFAULT 'text',
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Resultado de cada lente (Observaciones)
CREATE TABLE IF NOT EXISTS lens_results (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id   UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  version     INTEGER NOT NULL,
  lens        lens_type NOT NULL,
  verdict     lens_verdict,
  feedback    TEXT NOT NULL,
  tokens_used INTEGER,
  run_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Checklist buyer persona (Evaluaciones de Buyer Persona)
CREATE TABLE IF NOT EXISTS checklist_results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id    UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  version      INTEGER NOT NULL,
  profile_1    JSONB NOT NULL,
  profile_2    JSONB NOT NULL,
  profile_3    JSONB NOT NULL,
  profile_4    JSONB NOT NULL,
  overall_pass BOOLEAN NOT NULL,
  raw_output   TEXT,
  run_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prompts de producción (Video, Voz, Música)
CREATE TABLE IF NOT EXISTS production_outputs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id     UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  video_prompts JSONB NOT NULL DEFAULT '[]',
  voice_prompt  TEXT NOT NULL DEFAULT '',
  music_prompt  TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SEGURIDAD (RLS)
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lens_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_outputs ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (Solo puedes ver lo tuyo si el user_id está seteado)
CREATE POLICY "users_own_scripts" ON scripts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_lens_results" ON lens_results FOR ALL USING (script_id IN (SELECT id FROM scripts WHERE user_id = auth.uid()));
CREATE POLICY "users_own_checklist_results" ON checklist_results FOR ALL USING (script_id IN (SELECT id FROM scripts WHERE user_id = auth.uid()));
CREATE POLICY "users_own_production_outputs" ON production_outputs FOR ALL USING (script_id IN (SELECT id FROM scripts WHERE user_id = auth.uid()));

-- 4. ÍNDICES para velocidad
CREATE INDEX IF NOT EXISTS idx_scripts_user_id ON scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_lens_results_script_id ON lens_results(script_id);
CREATE INDEX IF NOT EXISTS idx_checklist_results_script_id ON checklist_results(script_id);
CREATE INDEX IF NOT EXISTS idx_production_results_script_id ON production_outputs(script_id);
