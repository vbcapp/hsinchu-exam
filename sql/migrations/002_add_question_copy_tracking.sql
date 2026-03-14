-- =============================================
-- Migration 002: questions 加入複製題追蹤欄位
-- 說明：支援題目複製功能，保留原始分類用於弱點分析追溯
-- =============================================

-- 題目最初建立時的大分類（複製題時保留原始值）
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS original_subject VARCHAR;

COMMENT ON COLUMN public.questions.original_subject IS '題目最初建立時的大分類。複製題目時保留原始值，用於弱點分析追溯。NULL 表示自身即為原始題目。';

-- 題目最初建立時的章節（複製題時保留原始值）
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS original_chapter VARCHAR;

COMMENT ON COLUMN public.questions.original_chapter IS '題目最初建立時的章節。複製題目時保留原始值，用於弱點分析追溯。NULL 表示自身即為原始題目。';

-- 複製題的原始題目 ID
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS source_question_id UUID REFERENCES public.questions(id);

COMMENT ON COLUMN public.questions.source_question_id IS '複製題的原始題目 ID。NULL 表示自身即為原始題目。答複製題時同步回寫原始題的 progress。';

-- 記錄此 migration 已執行
INSERT INTO public.schema_migrations (version, name)
VALUES ('002', 'add_question_copy_tracking')
ON CONFLICT (version) DO NOTHING;
