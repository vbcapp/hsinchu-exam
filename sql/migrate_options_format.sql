-- 轉換現有資料表 questions 的 options 欄位
-- 將 JSONB array 轉換為 JSONB object

UPDATE questions
SET options = (
    SELECT jsonb_object_agg(
        chr(ascii('A') + (ordinality - 1)::integer),
        val
    )
    FROM jsonb_array_elements_text(options) WITH ORDINALITY AS arr(val, ordinality)
)
WHERE jsonb_typeof(options) = 'array';
