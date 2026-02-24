-- =============================================
-- T007 - 徽章系統支援函式
-- 計算用戶連續答題天數
-- =============================================

CREATE OR REPLACE FUNCTION get_user_daily_streak(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_streak integer := 0;
    v_check_date date := CURRENT_DATE;
    v_has_answer boolean;
BEGIN
    -- 從今天開始往回檢查，直到發現沒有答題的日期
    LOOP
        -- 檢查該日期是否有答題記錄
        SELECT EXISTS (
            SELECT 1
            FROM answer_records
            WHERE user_id = p_user_id
            AND DATE(created_at) = v_check_date
        ) INTO v_has_answer;

        -- 如果該日期沒有答題，結束迴圈
        IF NOT v_has_answer THEN
            EXIT;
        END IF;

        -- 累加連續天數
        v_streak := v_streak + 1;

        -- 檢查前一天
        v_check_date := v_check_date - INTERVAL '1 day';

        -- 防止無限迴圈（最多檢查 365 天）
        IF v_streak >= 365 THEN
            EXIT;
        END IF;
    END LOOP;

    RETURN v_streak;
END;
$$;

-- 測試函式
-- SELECT get_user_daily_streak('your-user-id-here');

-- 授予執行權限
GRANT EXECUTE ON FUNCTION get_user_daily_streak(uuid) TO authenticated;

COMMENT ON FUNCTION get_user_daily_streak IS '計算用戶從今天開始連續答題的天數（用於徽章系統）';
