-- =============================================
-- Migration 003: 角色安全相關函式與觸發器
-- 說明：加入管理員判斷函式、防止用戶自我提權、預設標籤
-- =============================================

-- 1. is_admin() - 判斷當前用戶是否為任何管理員
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('master_admin', 'super_admin', 'sub_admin')
  );
$$;

-- 2. is_super_admin() - 判斷當前用戶是否為高級管理員
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('master_admin', 'super_admin')
  );
$$;

-- 3. prevent_role_self_promotion() - 防止用戶自我提權觸發器函式
CREATE OR REPLACE FUNCTION public.prevent_role_self_promotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- role 沒變就跳過
  IF OLD.role = NEW.role THEN
    RETURN NEW;
  END IF;

  -- service_role (Supabase Dashboard / MCP) 直接放行
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- 只有 master_admin 可以修改 role
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'master_admin'
  ) THEN
    RAISE EXCEPTION 'Only master admin can change user roles';
  END IF;

  RETURN NEW;
END;
$$;

-- 4. 建立防自我提權觸發器（先移除再建，避免重複）
DROP TRIGGER IF EXISTS check_role_change ON public.users;
CREATE TRIGGER check_role_change
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_self_promotion();

-- 5. set_default_user_tags() - 新用戶預設標籤
CREATE OR REPLACE FUNCTION public.set_default_user_tags()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tags IS NULL OR NEW.tags = '[]'::jsonb THEN
    NEW.tags := '["預設"]'::jsonb;
  END IF;
  RETURN NEW;
END;
$$;

-- 6. 建立預設標籤觸發器（先移除再建，避免重複）
DROP TRIGGER IF EXISTS trg_set_default_user_tags ON public.users;
CREATE TRIGGER trg_set_default_user_tags
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION set_default_user_tags();

-- 記錄此 migration 已執行
INSERT INTO public.schema_migrations (version, name)
VALUES ('003', 'add_role_security_functions')
ON CONFLICT (version) DO NOTHING;
