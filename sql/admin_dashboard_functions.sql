-- =============================================
-- 管理員儀表板 - 統計分析 RPC 函式
-- 用於 profile.html 管理員儀表板圖表
-- =============================================

-- =============================================
-- 1. 每日答題數 (折線圖)
-- 回傳: { date, count }[]
-- =============================================
CREATE OR REPLACE FUNCTION get_admin_daily_answers(days_limit integer DEFAULT 30)
RETURNS TABLE(date date, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            CURRENT_DATE - (days_limit - 1) * INTERVAL '1 day',
            CURRENT_DATE,
            INTERVAL '1 day'
        )::date AS d
    )
    SELECT
        ds.d AS date,
        COALESCE(COUNT(ar.id), 0) AS count
    FROM date_series ds
    LEFT JOIN answer_records ar ON DATE(ar.created_at) = ds.d
    GROUP BY ds.d
    ORDER BY ds.d;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_daily_answers(integer) TO authenticated;
COMMENT ON FUNCTION get_admin_daily_answers IS '取得指定天數內每日答題數量（管理員儀表板用）';

-- =============================================
-- 2. 每日活躍用戶數 (長條圖)
-- 回傳: { date, count }[]
-- =============================================
CREATE OR REPLACE FUNCTION get_admin_daily_active_users(days_limit integer DEFAULT 30)
RETURNS TABLE(date date, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            CURRENT_DATE - (days_limit - 1) * INTERVAL '1 day',
            CURRENT_DATE,
            INTERVAL '1 day'
        )::date AS d
    )
    SELECT
        ds.d AS date,
        COALESCE(active.cnt, 0) AS count
    FROM date_series ds
    LEFT JOIN (
        SELECT DATE(ar.created_at) AS answer_date, COUNT(DISTINCT ar.user_id) AS cnt
        FROM answer_records ar
        WHERE ar.created_at >= CURRENT_DATE - days_limit * INTERVAL '1 day'
        GROUP BY DATE(ar.created_at)
    ) active ON active.answer_date = ds.d
    ORDER BY ds.d;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_daily_active_users(integer) TO authenticated;
COMMENT ON FUNCTION get_admin_daily_active_users IS '取得指定天數內每日活躍用戶數（管理員儀表板用）';

-- =============================================
-- 3. 學習趨勢 (長條圖, 按週或月)
-- 回傳: { period_start, count }[]
-- =============================================
CREATE OR REPLACE FUNCTION get_admin_learning_trends(period_type text DEFAULT 'week')
RETURNS TABLE(period_start date, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF period_type = 'month' THEN
        RETURN QUERY
        SELECT
            DATE_TRUNC('month', ar.created_at)::date AS period_start,
            COUNT(ar.id) AS count
        FROM answer_records ar
        WHERE ar.created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', ar.created_at)
        ORDER BY period_start;
    ELSE
        -- 預設: week
        RETURN QUERY
        SELECT
            DATE_TRUNC('week', ar.created_at)::date AS period_start,
            COUNT(ar.id) AS count
        FROM answer_records ar
        WHERE ar.created_at >= CURRENT_DATE - INTERVAL '12 weeks'
        GROUP BY DATE_TRUNC('week', ar.created_at)
        ORDER BY period_start;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_learning_trends(text) TO authenticated;
COMMENT ON FUNCTION get_admin_learning_trends IS '取得按週或月的答題趨勢（管理員儀表板用）';

-- =============================================
-- 4. 答題時段分佈 (熱力長條圖, 0-23時)
-- 回傳: { hour, count }[]
-- =============================================
CREATE OR REPLACE FUNCTION get_admin_answer_time_distribution(days_limit integer DEFAULT 30)
RETURNS TABLE(hour integer, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH hour_series AS (
        SELECT generate_series(0, 23) AS h
    )
    SELECT
        hs.h AS hour,
        COALESCE(ans.cnt, 0) AS count
    FROM hour_series hs
    LEFT JOIN (
        SELECT
            EXTRACT(HOUR FROM ar.created_at)::integer AS answer_hour,
            COUNT(ar.id) AS cnt
        FROM answer_records ar
        WHERE ar.created_at >= CURRENT_DATE - days_limit * INTERVAL '1 day'
        GROUP BY EXTRACT(HOUR FROM ar.created_at)
    ) ans ON ans.answer_hour = hs.h
    ORDER BY hs.h;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_answer_time_distribution(integer) TO authenticated;
COMMENT ON FUNCTION get_admin_answer_time_distribution IS '取得指定天數內各時段答題分佈（管理員儀表板用）';

-- =============================================
-- 5. 整體正確率趨勢 (折線圖)
-- 回傳: { date, accuracy }[]
-- =============================================
CREATE OR REPLACE FUNCTION get_admin_overall_accuracy_trend(period_type text DEFAULT 'week')
RETURNS TABLE(date text, accuracy numeric)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF period_type = 'month' THEN
        RETURN QUERY
        SELECT
            TO_CHAR(DATE_TRUNC('month', ar.created_at), 'YYYY/MM') AS date,
            ROUND(
                COUNT(CASE WHEN ar.is_correct THEN 1 END)::numeric * 100.0
                / NULLIF(COUNT(ar.id), 0),
                1
            ) AS accuracy
        FROM answer_records ar
        WHERE ar.created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', ar.created_at)
        ORDER BY DATE_TRUNC('month', ar.created_at);
    ELSE
        -- 預設: week
        RETURN QUERY
        SELECT
            TO_CHAR(DATE_TRUNC('week', ar.created_at), 'MM/DD') || ' 當週' AS date,
            ROUND(
                COUNT(CASE WHEN ar.is_correct THEN 1 END)::numeric * 100.0
                / NULLIF(COUNT(ar.id), 0),
                1
            ) AS accuracy
        FROM answer_records ar
        WHERE ar.created_at >= CURRENT_DATE - INTERVAL '12 weeks'
        GROUP BY DATE_TRUNC('week', ar.created_at)
        ORDER BY DATE_TRUNC('week', ar.created_at);
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_overall_accuracy_trend(text) TO authenticated;
COMMENT ON FUNCTION get_admin_overall_accuracy_trend IS '取得按週或月的整體正確率趨勢（管理員儀表板用）';

-- =============================================
-- 5.1 章節正確率趨勢 (折線圖)
-- 回傳: { date, accuracy }[]
-- =============================================
CREATE OR REPLACE FUNCTION get_admin_chapter_accuracy_trend(p_chapter text, period_type text DEFAULT 'week')
RETURNS TABLE(date text, accuracy numeric)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF period_type = 'month' THEN
        RETURN QUERY
        SELECT
            TO_CHAR(DATE_TRUNC('month', ar.created_at), 'YYYY/MM') AS date,
            ROUND(
                COUNT(CASE WHEN ar.is_correct THEN 1 END)::numeric * 100.0
                / NULLIF(COUNT(ar.id), 0),
                1
            ) AS accuracy
        FROM answer_records ar
        INNER JOIN questions q ON ar.question_id = q.id
        WHERE ar.created_at >= CURRENT_DATE - INTERVAL '12 months'
          AND q.chapter = p_chapter
        GROUP BY DATE_TRUNC('month', ar.created_at)
        ORDER BY DATE_TRUNC('month', ar.created_at);
    ELSE
        -- 預設: week
        RETURN QUERY
        SELECT
            TO_CHAR(DATE_TRUNC('week', ar.created_at), 'MM/DD') || ' 當週' AS date,
            ROUND(
                COUNT(CASE WHEN ar.is_correct THEN 1 END)::numeric * 100.0
                / NULLIF(COUNT(ar.id), 0),
                1
            ) AS accuracy
        FROM answer_records ar
        INNER JOIN questions q ON ar.question_id = q.id
        WHERE ar.created_at >= CURRENT_DATE - INTERVAL '12 weeks'
          AND q.chapter = p_chapter
        GROUP BY DATE_TRUNC('week', ar.created_at)
        ORDER BY DATE_TRUNC('week', ar.created_at);
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_chapter_accuracy_trend(text, text) TO authenticated;
COMMENT ON FUNCTION get_admin_chapter_accuracy_trend IS '取得按週或月的特定章節正確率趨勢（管理員儀表板用）';

-- =============================================
-- 6. 首次 vs 複習正確率 (長條圖)
-- 回傳: { category, accuracy }[]
-- 首次 = times_reviewed = 1 時的作答
-- 複習 = times_reviewed > 1 時的作答
-- =============================================
CREATE OR REPLACE FUNCTION get_admin_first_vs_review_accuracy()
RETURNS TABLE(category text, accuracy numeric)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH answer_with_progress AS (
        SELECT
            ar.is_correct,
            COALESCE(uqp.times_reviewed, 1) AS times_reviewed
        FROM answer_records ar
        LEFT JOIN user_question_progress uqp
            ON ar.user_id = uqp.user_id AND ar.question_id = uqp.question_id
    )
    SELECT
        cat.category,
        COALESCE(
            ROUND(
                COUNT(CASE WHEN awp.is_correct THEN 1 END)::numeric * 100.0
                / NULLIF(COUNT(*), 0),
                1
            ),
            0
        ) AS accuracy
    FROM (VALUES ('首次作答'), ('複習作答')) AS cat(category)
    LEFT JOIN answer_with_progress awp ON
        (cat.category = '首次作答' AND awp.times_reviewed <= 1)
        OR (cat.category = '複習作答' AND awp.times_reviewed > 1)
    GROUP BY cat.category
    ORDER BY cat.category DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_first_vs_review_accuracy() TO authenticated;
COMMENT ON FUNCTION get_admin_first_vs_review_accuracy IS '取得首次作答 vs 複習作答的正確率比較（管理員儀表板用）';

-- =============================================
-- 7. 全站魔王題 Top N (錯誤率最高的題目)
-- 回傳: { question_id, question_text, subject, chapter, question_no, total_reviewed, total_incorrect, error_rate }[]
-- =============================================
CREATE OR REPLACE FUNCTION get_admin_top_incorrect_cards(top_n integer DEFAULT 10)
RETURNS TABLE(
    question_id uuid,
    question_text text,
    subject text,
    chapter text,
    question_no integer,
    total_reviewed bigint,
    total_incorrect bigint,
    error_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.id AS question_id,
        q.question AS question_text,
        q.subject,
        q.chapter,
        q.question_no,
        SUM(uqp.times_reviewed)::bigint AS total_reviewed,
        SUM(uqp.times_incorrect)::bigint AS total_incorrect,
        ROUND(
            SUM(uqp.times_incorrect)::numeric / NULLIF(SUM(uqp.times_reviewed), 0),
            4
        ) AS error_rate
    FROM user_question_progress uqp
    INNER JOIN questions q ON q.id = uqp.question_id
    GROUP BY q.id, q.question, q.subject, q.chapter, q.question_no
    HAVING SUM(uqp.times_reviewed) > 1
    ORDER BY error_rate DESC, SUM(uqp.times_incorrect) DESC
    LIMIT top_n;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_top_incorrect_cards(integer) TO authenticated;
COMMENT ON FUNCTION get_admin_top_incorrect_cards IS '取得全站錯誤率最高的 Top N 魔王題（管理員儀表板用）';

-- =============================================
-- 8. 答題次數排行榜 (排行榜頁面用)
-- 回傳: { user_id, answer_count }[]
-- 依 answer_count 降序排列
-- =============================================
CREATE OR REPLACE FUNCTION get_leaderboard_answer_counts(start_date timestamptz)
RETURNS TABLE(user_id uuid, answer_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ar.user_id,
        COUNT(ar.id) AS answer_count
    FROM answer_records ar
    WHERE ar.created_at >= start_date
    GROUP BY ar.user_id
    ORDER BY answer_count DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_leaderboard_answer_counts(timestamptz) TO authenticated;
COMMENT ON FUNCTION get_leaderboard_answer_counts IS '取得指定時間之後各用戶的答題次數排行（排行榜頁面用）';
