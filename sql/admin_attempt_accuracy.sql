-- =============================================
-- 全體用戶第1~5次作答正確率 (長條圖)
-- 回傳: { round, accuracy, total }[]
-- 用於 profile.html 管理員儀表板
-- =============================================
CREATE OR REPLACE FUNCTION get_admin_attempt_accuracy_by_round()
RETURNS TABLE(round integer, accuracy numeric, total integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH numbered_attempts AS (
        SELECT 
            ar.question_id,
            ar.is_correct,
            ROW_NUMBER() OVER(PARTITION BY ar.user_id, ar.question_id ORDER BY ar.created_at ASC) as attempt_num
        FROM answer_records ar
    )
    SELECT 
        na.attempt_num::integer as round,
        ROUND(
            COUNT(CASE WHEN na.is_correct THEN 1 END)::numeric * 100.0 / NULLIF(COUNT(*), 0),
            1
        ) as accuracy,
        COUNT(*)::integer as total
    FROM numbered_attempts na
    WHERE na.attempt_num <= 5
    GROUP BY na.attempt_num
    ORDER BY na.attempt_num ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_attempt_accuracy_by_round() TO authenticated;
COMMENT ON FUNCTION get_admin_attempt_accuracy_by_round IS '取得全體用戶的第1~5次作答正確率（管理員儀表板用）';
