-- =============================================
-- Migration 001: organization_settings 加入計分欄位
-- 說明：讓每個企業可以自訂答對/答錯分數、登入獎勵、爆擊倍數
-- =============================================

ALTER TABLE public.organization_settings
ADD COLUMN IF NOT EXISTS base_score INTEGER DEFAULT 100;

ALTER TABLE public.organization_settings
ADD COLUMN IF NOT EXISTS incorrect_score INTEGER DEFAULT 0;

ALTER TABLE public.organization_settings
ADD COLUMN IF NOT EXISTS daily_login_score INTEGER DEFAULT 50;

ALTER TABLE public.organization_settings
ADD COLUMN IF NOT EXISTS critical_hit_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.organization_settings
ADD COLUMN IF NOT EXISTS critical_hit_multipliers JSONB DEFAULT '[2, 3, 4, 5, 10]'::jsonb;

ALTER TABLE public.organization_settings
ADD COLUMN IF NOT EXISTS level_requirements JSONB DEFAULT NULL;

-- 記錄此 migration 已執行
INSERT INTO public.schema_migrations (version, name)
VALUES ('001', 'add_scoring_to_org_settings')
ON CONFLICT (version) DO NOTHING;
