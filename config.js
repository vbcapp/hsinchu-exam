// ==================== Supabase 配置 ====================
// ✅ 已自動配置為你的 Supabase 專案
const SUPABASE_CONFIG = {
    url: 'https://izkduljyuscydklvagxm.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6a2R1bGp5dXNjeWRrbHZhZ3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNzM0NzYsImV4cCI6MjA4NDY0OTQ3Nn0.LsFTCFriM6Ro4HhQ0bwfPT472RP3Ml5eiQx5IUmdrrg'
};

// ==================== XP 系統常數 ====================
const XP_REWARDS = {
    CREATE_CARD: 5,
    CORRECT_FIRST: 10,
    CORRECT_REVIEW: 5,
    INCORRECT: 0,
    STREAK_BONUS: 50,
    MASTERY_MAX_BONUS: 25
};

// ==================== 錯誤代碼 ====================
const ERROR_CODES = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    CARD_NOT_FOUND: 'CARD_NOT_FOUND',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    DUPLICATE_CARD: 'DUPLICATE_CARD',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
};

// ==================== 管理員配置 ====================
// 管理員 UUID 配置
const MASTER_ADMIN_ID = '17da7d22-17ad-4d40-a5d2-9c2ce9216cf0'; // 原始管理員 (母版卡片來源)
const ADMIN_UUIDS = [
    '17da7d22-17ad-4d40-a5d2-9c2ce9216cf0', // Original Admin
    '3a5bb55c-4ffc-4373-a9b5-f211b4b4d63b'  // New Admin
];

// ==================== 學員白名單 ====================
// 只有在名單內的 Email 才能註冊或登入
// 請將所有學員 Email 加入此陣列 (記得保留管理員 Email)
// [Security] 學員白名單 (目前暫時關閉: 改名為 STUDENT_EMAILS_OFF 即可)
// 若要開啟白名單功能，請將變數名稱改回: const STUDENT_EMAILS = [ ... ];
const STUDENT_EMAILS_OFF = [
    'ceceloveye@gmail.com',         // Admin 1
    'b1230463@ulive.pccu.edu.tw',   // Admin 2
    'boonling2003212@gmail.com',
    // 在此新增學員 Email，例如: 'student1@example.com',
];

// ==================== 等級計算公式 ====================
// 計算下一等級所需 XP
function calculateNextLevelXp(currentLevel) {
    return Math.floor(100 * currentLevel * 1.5);
}
