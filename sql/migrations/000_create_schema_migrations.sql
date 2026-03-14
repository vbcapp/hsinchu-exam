-- =============================================
-- Migration 版本追蹤表
-- 這張表記錄資料庫已經執行到哪個版本
-- 每個 Supabase 專案都要先執行這個 SQL
-- =============================================

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version VARCHAR(10) PRIMARY KEY,        -- 版本號，如 '001', '002'
    name VARCHAR(255) NOT NULL,             -- migration 名稱
    executed_at TIMESTAMPTZ DEFAULT now()    -- 執行時間
);

-- 允許所有人讀取（方便前端或 Claude 檢查版本）
ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON public.schema_migrations FOR SELECT USING (true);
-- 只有 service_role 可以寫入（透過 Supabase MCP 或 Dashboard）
CREATE POLICY "Service role can insert" ON public.schema_migrations FOR INSERT WITH CHECK (true);
