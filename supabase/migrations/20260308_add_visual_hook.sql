-- =============================================
-- Expert Lens Pipeline™ — ActivaQR.com
-- Migración: Agregar soporte para Hooks Visuales
-- =============================================

ALTER TABLE production_outputs 
ADD COLUMN IF NOT EXISTS visual_hook JSONB DEFAULT NULL;
