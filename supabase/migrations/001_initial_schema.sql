-- =============================================
-- Expert Lens Pipeline™ — ActivaQR.com
-- Migration: 001_initial_schema.sql
-- =============================================

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────

CREATE TYPE pipeline_status AS ENUM (
  'draft',          -- Borrador inicial generado
  'in_pipeline',    -- Corriendo los 6 lentes
  'pending_review', -- Esperando revisión humana
  'in_checklist',   -- Corriendo checklist buyer persona
  'approved',       -- Aprobado, listo para producción
  'rejected'        -- Rechazado por checklist
);

CREATE TYPE lens_type AS ENUM (
  'draft_initial',
  'lens_clarity',
  'lens_neuro',
  'lens_copy',
  'lens_music',
  'lens_seo',
  'lens_visual',
  'checklist_buyer_persona',
  'production_video',
  'production_voice',
  'production_music'
);

CREATE TYPE lens_verdict AS ENUM (
  'green',
  'yellow',
  'red',
  'approved',
  'rejected'
);

-- ─────────────────────────────────────────────
-- TABLAS
-- ─────────────────────────────────────────────

-- Guiones (tabla principal)
CREATE TABLE scripts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  original_idea TEXT NOT NULL,
  current_body  TEXT NOT NULL DEFAULT '',
  version       INTEGER NOT NULL DEFAULT 0,
  status        pipeline_status NOT NULL DEFAULT 'draft',
  input_type    TEXT NOT NULL DEFAULT 'text' CHECK (input_type IN ('text', 'audio')),
  audio_url     TEXT,
  transcript    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_scripts_user_id   ON scripts(user_id);
CREATE INDEX idx_scripts_status    ON scripts(status);
CREATE INDEX idx_scripts_created   ON scripts(created_at DESC);

-- Historial de versiones del guion
CREATE TABLE script_versions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id    UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  version      INTEGER NOT NULL,
  body         TEXT NOT NULL,
  triggered_by lens_type,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_script_versions_script_id ON script_versions(script_id);
CREATE UNIQUE INDEX idx_script_versions_unique ON script_versions(script_id, version);

-- Resultado de cada lente
CREATE TABLE lens_results (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id   UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  version     INTEGER NOT NULL,
  lens        lens_type NOT NULL,
  verdict     lens_verdict,
  feedback    TEXT NOT NULL,
  tokens_used INTEGER,
  run_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lens_results_script_id ON lens_results(script_id);

-- Checklist buyer persona (4 perfiles dinámicos)
CREATE TABLE checklist_results (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id    UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  version      INTEGER NOT NULL,
  -- Cada perfil: { name, description, q1: bool, q2: bool, q3: bool, passed: bool }
  profile_1    JSONB NOT NULL,
  profile_2    JSONB NOT NULL,
  profile_3    JSONB NOT NULL,
  profile_4    JSONB NOT NULL,
  overall_pass BOOLEAN NOT NULL,
  raw_output   TEXT,
  run_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_checklist_results_script_id ON checklist_results(script_id);

-- Prompts de producción (output final)
CREATE TABLE production_outputs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id     UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  -- Array de { scene_number, visual_description, cinematographic_style, mood_color, duration_seconds, sync_notes, prompt }
  video_prompts JSONB NOT NULL DEFAULT '[]',
  voice_prompt  TEXT NOT NULL DEFAULT '',
  music_prompt  TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_production_outputs_script_id ON production_outputs(script_id);

-- ─────────────────────────────────────────────
-- TRIGGER: updated_at automático
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scripts_updated_at
  BEFORE UPDATE ON scripts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

ALTER TABLE scripts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_versions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lens_results       ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_results  ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_outputs ENABLE ROW LEVEL SECURITY;

-- scripts: el usuario solo ve los suyos
CREATE POLICY "users_own_scripts" ON scripts
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- script_versions
CREATE POLICY "users_own_script_versions" ON script_versions
  FOR ALL USING (
    script_id IN (SELECT id FROM scripts WHERE user_id = auth.uid())
  );

-- lens_results
CREATE POLICY "users_own_lens_results" ON lens_results
  FOR ALL USING (
    script_id IN (SELECT id FROM scripts WHERE user_id = auth.uid())
  );

-- checklist_results
CREATE POLICY "users_own_checklist_results" ON checklist_results
  FOR ALL USING (
    script_id IN (SELECT id FROM scripts WHERE user_id = auth.uid())
  );

-- production_outputs
CREATE POLICY "users_own_production_outputs" ON production_outputs
  FOR ALL USING (
    script_id IN (SELECT id FROM scripts WHERE user_id = auth.uid())
  );

-- ─────────────────────────────────────────────
-- STORAGE: bucket para audios
-- ─────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-uploads', 'audio-uploads', false)
ON CONFLICT DO NOTHING;

CREATE POLICY "users_upload_audio" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'audio-uploads' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "users_read_own_audio" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'audio-uploads' AND auth.uid()::text = (storage.foldername(name))[1]
  );
