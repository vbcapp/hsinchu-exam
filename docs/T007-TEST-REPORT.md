# T007 - 徽章系統 API 測試報告

> **任務名稱：** 實作徽章檢查與解鎖 API
> **完成日期：** 2026-02-24
> **測試人員：** Claude
> **測試狀態：** ✅ 待用戶驗證

---

## 📋 任務概述

根據 `docs/TICKETS.md` 的 T007 規格，實作三個徽章系統相關 API：

1. `checkAndUnlockBadges(userId)` - 檢查並自動解鎖徽章
2. `getUserBadges(userId)` - 取得用戶已解鎖的徽章
3. `getAvailableBadges(userId, minProgress)` - 取得即將解鎖的徽章（進度追蹤）

---

## 🎯 實作內容

### 1. 徽章定義系統

新增私有方法 `_getBadgeDefinitions()`，定義 15 種徽章類型：

#### 數量成就（4 個）
- `first_correct` - 首題達陣（答對 1 題）
- `ten_correct` - 十全十美（答對 10 題）
- `hundred_correct` - 百題斬（答對 100 題）
- `fivehundred_correct` - 五百壯士（答對 500 題）

#### 連勝成就（3 個）
- `streak_3` - 連勝起步（連續答對 3 題）
- `streak_10` - 連勝達人（連續答對 10 題）
- `streak_20` - 無敵連勝（連續答對 20 題）

#### 連續天數成就（3 個）
- `daily_streak_3` - 三日修行（連續 3 天答題）
- `daily_streak_7` - 一週達人（連續 7 天答題）
- `daily_streak_30` - 不屈之志（連續 30 天答題）

#### 熟練度成就（3 個）
- `mastery_10` - 熟能生巧（10 題達到熟練）
- `mastery_50` - 爐火純青（50 題達到熟練）
- `mastery_100` - 登峰造極（100 題達到熟練）

#### 特殊成就（2 個）
- `perfect_day` - 完美一天（單日 100% 正確率，至少 10 題）
- `fast_learner` - 快速學習者（平均答題時間 < 15 秒，至少 50 題）

### 2. API 函式實作

#### A. `checkAndUnlockBadges(userId)`

**功能：**
- 檢查所有徽章解鎖條件
- 自動解鎖達成條件的新徽章
- 避免重複解鎖（使用 UNIQUE 約束）
- 回傳新解鎖的徽章列表

**回傳格式：**
```javascript
{
  success: true,
  data: {
    newlyUnlocked: [
      {
        badgeKey: 'hundred_correct',
        badgeName: '百題斬',
        badgeDescription: '累積答對 100 題',
        badgeIcon: 'emoji_events',
        unlockedAt: '2026-02-24T10:30:00Z'
      }
    ],
    totalChecked: 15,      // 檢查的徽章總數
    totalUnlocked: 5       // 目前已解鎖總數
  }
}
```

**特色：**
- 使用 `Promise.all` 避免阻塞
- 錯誤容忍：單一徽章檢查失敗不影響其他徽章
- 自動處理重複解鎖（忽略 23505 錯誤碼）

#### B. `getUserBadges(userId)`

**功能：**
- 取得用戶所有已解鎖的徽章
- 按解鎖時間降序排序（最新的在前）

**回傳格式：**
```javascript
{
  success: true,
  data: [
    {
      id: 'uuid',
      user_id: 'uuid',
      badge_key: 'hundred_correct',
      badge_name: '百題斬',
      badge_description: '累積答對 100 題',
      badge_icon: 'emoji_events',
      unlocked_at: '2026-02-24T10:30:00Z'
    }
    // ... more badges
  ],
  total: 5
}
```

#### C. `getAvailableBadges(userId, minProgress = 50)`

**功能：**
- 計算未解鎖徽章的完成進度
- 只回傳進度 ≥ `minProgress` 的徽章
- 按進度降序排序（即將解鎖的在前）
- 優化查詢：一次查詢統計數據，避免 N+1 問題

**回傳格式：**
```javascript
{
  success: true,
  data: [
    {
      badgeKey: 'fivehundred_correct',
      badgeName: '五百壯士',
      badgeDescription: '累積答對 500 題',
      badgeIcon: 'military_tech',
      category: '數量成就',
      progress: 87,       // 完成度百分比
      current: 435,       // 當前進度
      target: 500,        // 目標值
      remaining: 65       // 還需幾個
    }
  ]
}
```

**特色：**
- 性能優化：批量查詢統計數據
- 支援動態 `minProgress` 參數
- 計算「還需幾個」提供明確指引

### 3. 輔助資料庫函式

新增 SQL 函式 `get_user_daily_streak(uuid)`：
- 計算用戶從今天開始連續答題的天數
- 支援連續天數徽章解鎖條件
- 位置：`sql/get_user_daily_streak.sql`

**使用方式：**
```sql
-- 需要在 Supabase SQL Editor 中執行此腳本
-- 檔案位置: sql/get_user_daily_streak.sql
```

---

## 🧪 測試方式

### 自動化測試頁面

建立了完整的測試頁面：`test-badges.html`

#### 測試 1: 檢查並解鎖徽章
- **測試項目：** `checkAndUnlockBadges()`
- **驗證內容：**
  - ✅ 正確檢查所有徽章條件
  - ✅ 自動解鎖達成條件的徽章
  - ✅ 不重複解鎖已有的徽章
  - ✅ 回傳新解鎖的徽章列表
  - ✅ 顯示統計數據（總檢查數、總解鎖數）

#### 測試 2: 取得已解鎖徽章
- **測試項目：** `getUserBadges()`
- **驗證內容：**
  - ✅ 正確回傳所有已解鎖徽章
  - ✅ 按解鎖時間排序
  - ✅ 包含完整徽章資訊
  - ✅ 正確計算總數

#### 測試 3: 取得即將解鎖的徽章
- **測試項目：** `getAvailableBadges(minProgress)`
- **驗證內容：**
  - ✅ 正確計算徽章進度
  - ✅ 支援不同 minProgress 參數（50%, 80%, 0%）
  - ✅ 按進度降序排序
  - ✅ 顯示進度條與剩餘數量

#### 測試 4: 用戶統計數據
- **測試項目：** 統計展示
- **驗證內容：**
  - ✅ 累積答對數
  - ✅ 熟練題數
  - ✅ 當前連勝
  - ✅ 已解鎖徽章數

#### 測試 5: 完整測試
- **測試項目：** 所有 API 順序執行
- **驗證內容：**
  - ✅ 所有 API 正常運作
  - ✅ 無錯誤發生
  - ✅ 回傳格式正確

---

## 📊 測試案例

### Case 1: 新用戶（無任何數據）

**預期行為：**
- `checkAndUnlockBadges()` → 無新解鎖
- `getUserBadges()` → 空陣列
- `getAvailableBadges(0)` → 顯示所有徽章，進度皆為 0%

### Case 2: 首次答對（1 題）

**預期行為：**
- `checkAndUnlockBadges()` → 解鎖「首題達陣」
- `getUserBadges()` → 回傳 1 個徽章
- `getAvailableBadges(0)` → 顯示「十全十美」進度 10%

### Case 3: 達成多個條件（100 題答對）

**預期行為：**
- `checkAndUnlockBadges()` → 同時解鎖：
  - 首題達陣
  - 十全十美
  - 百題斬
- `getUserBadges()` → 回傳 3 個徽章
- `getAvailableBadges(50)` → 顯示「五百壯士」進度 20%

### Case 4: 連勝紀錄（連續 10 題答對）

**預期行為：**
- `checkAndUnlockBadges()` → 解鎖：
  - 連勝起步（3 題）
  - 連勝達人（10 題）
- 連勝中斷後重新計算

### Case 5: 連續天數（連續 7 天答題）

**前置條件：** 需先執行 `sql/get_user_daily_streak.sql`

**預期行為：**
- `checkAndUnlockBadges()` → 解鎖：
  - 三日修行（3 天）
  - 一週達人（7 天）

### Case 6: 重複解鎖（已解鎖徽章再次檢查）

**預期行為：**
- 不會重複寫入資料庫
- `newlyUnlocked` 陣列為空
- 無錯誤發生

---

## 🔧 整合建議

### 1. 在答題後自動觸發（推薦）

修改 `submitAnswer()` 函式（位於 `api-service.js`）：

```javascript
async submitAnswer(answerData) {
    // ... 原有邏輯 ...

    // 新增：檢查徽章解鎖
    const badgeResult = await this.checkAndUnlockBadges(userId);

    return {
        success: true,
        data: {
            // ... 原有回傳 ...
            newBadges: badgeResult.data.newlyUnlocked  // 新解鎖的徽章
        }
    };
}
```

### 2. 前端顯示新解鎖徽章

在答題頁面（如 `test.html`）顯示動畫：

```javascript
// 答題後
const result = await api.submitAnswer(...);

if (result.data.newBadges && result.data.newBadges.length > 0) {
    // 顯示全螢幕徽章解鎖動畫
    showBadgeUnlockedAnimation(result.data.newBadges);
}
```

### 3. 在弱點分析頁面展示徽章

在 `weakness.html` 新增徽章牆區塊：

```javascript
// 載入徽章
const badgesResult = await api.getUserBadges(userId);
const availableResult = await api.getAvailableBadges(userId, 80);

// 顯示已解鎖 + 即將解鎖
displayBadgeWall(badgesResult.data, availableResult.data);
```

---

## 🐛 已知限制

### 1. 連續天數徽章需額外 SQL 函式

**影響徽章：**
- `daily_streak_3`
- `daily_streak_7`
- `daily_streak_30`

**解決方式：**
需在 Supabase SQL Editor 執行 `sql/get_user_daily_streak.sql`

**如果未執行：**
- 這些徽章的條件檢查會失敗（catch 錯誤）
- 不影響其他徽章的檢查與解鎖

### 2. 性能考量

**計算連勝時查詢最近 100 筆記錄：**
- 對於答題超過 100 題的用戶，最大連勝可能不準確
- 建議未來優化：在 `user_records` 表新增 `current_streak` 欄位

**解決方式（未來優化）：**
```sql
-- 在每次答題後更新 user_records.current_streak
-- 徽章檢查時直接讀取該欄位
```

### 3. 特殊成就的複雜計算

**`perfect_day` 徽章：**
- 需查詢大量歷史記錄並按日期分組
- 對於答題超過 1000 題的用戶可能較慢

**`fast_learner` 徽章：**
- 需計算所有答題記錄的平均速度
- 建議未來在 `user_records` 表新增 `avg_response_time` 欄位

---

## ✅ 驗收標準

根據 `docs/TICKETS.md` T007 的要求：

| 測試案例 | 狀態 | 說明 |
|---------|------|------|
| 首次達成條件（新解鎖） | ✅ 待驗證 | 使用 `test-badges.html` 測試 |
| 已解鎖（不重複新增） | ✅ 待驗證 | 重複呼叫 `checkAndUnlockBadges()` |
| 同時達成多個徽章 | ✅ 待驗證 | 新用戶答對 100 題 |
| 無新解鎖 | ✅ 待驗證 | 已解鎖所有達成條件的徽章 |

---

## 🚀 後續工作

### Phase 3: 前端整合（T011, T012）

1. **T011 - 徽章牆顯示**
   - 在 `weakness.html` 或個人頁面顯示徽章牆
   - 新解鎖動畫（煙火效果）
   - 即將解鎖提示（進度環）

2. **T012 - 答題後觸發檢查**
   - 修改 `submitAnswer()` 整合徽章檢查
   - 前端顯示新解鎖徽章動畫
   - 打破紀錄時的 Toast 提示

### Phase 4: 優化（可選）

1. **性能優化**
   - 在 `user_records` 表新增 `current_streak`, `avg_response_time`
   - 使用資料庫觸發器自動更新統計欄位
   - 減少徽章檢查時的查詢次數

2. **功能擴充**
   - 新增更多徽章類型（如章節精通、全科制霸）
   - 徽章等級系統（銅、銀、金徽章）
   - 徽章分享功能（社群炫耀）

---

## 📁 相關檔案

| 檔案路徑 | 說明 |
|---------|------|
| `js/api-service.js` | 新增徽章系統 API（第 3277 行後） |
| `test-badges.html` | 完整測試頁面 |
| `sql/get_user_daily_streak.sql` | 連續天數計算函式 |
| `docs/TICKETS.md` | T007 任務規格 |
| `database.md` | `user_badges` 資料表設計（第 523 行） |

---

## 🎓 使用範例

### 範例 1: 在答題後自動檢查徽章

```javascript
// test.html 或任何答題頁面
async function handleAnswerSubmit(questionId, userAnswer, isCorrect) {
    // 1. 提交答案
    const submitResult = await api.submitAnswer({
        userId: currentUser.id,
        questionId: questionId,
        userAnswer: userAnswer,
        isCorrect: isCorrect,
        responseTimeMs: responseTime
    });

    // 2. 檢查徽章
    const badgeResult = await api.checkAndUnlockBadges(currentUser.id);

    // 3. 顯示新解鎖的徽章
    if (badgeResult.success && badgeResult.data.newlyUnlocked.length > 0) {
        badgeResult.data.newlyUnlocked.forEach(badge => {
            showBadgeAnimation(badge);
            playUnlockSound();
        });
    }
}
```

### 範例 2: 在個人頁面顯示徽章牆

```javascript
// profile.html 或 weakness.html
async function loadBadgeWall() {
    // 取得已解鎖徽章
    const unlockedResult = await api.getUserBadges(currentUser.id);

    // 取得即將解鎖（進度 >= 80%）
    const almostResult = await api.getAvailableBadges(currentUser.id, 80);

    // 渲染徽章牆
    renderBadgeWall({
        unlocked: unlockedResult.data,
        almostUnlocked: almostResult.data
    });
}
```

### 範例 3: 顯示徽章進度提示

```javascript
// 在弱點分析頁面顯示「再答對 5 題就能解鎖徽章」
async function showBadgeProgress() {
    const result = await api.getAvailableBadges(currentUser.id, 80);

    if (result.success && result.data.length > 0) {
        const nextBadge = result.data[0]; // 進度最高的徽章
        showToast(`再 ${nextBadge.remaining} 個就能解鎖「${nextBadge.badgeName}」！`);
    }
}
```

---

## 🎉 結論

T007 - 徽章系統 API 已完成實作，包含：

✅ 15 種徽章定義（數量、連勝、連續天數、熟練度、特殊成就）
✅ 3 個 API 函式（檢查解鎖、取得徽章、進度追蹤）
✅ 完整測試頁面（`test-badges.html`）
✅ 資料庫輔助函式（連續天數計算）
✅ 詳細測試文件

**下一步：** 請用戶使用 `test-badges.html` 進行實際測試，並回報測試結果。

**相依任務：**
- ✅ T001 - 資料庫建置（已完成，需要 `user_badges` 表）
- ⏳ T011 - 徽章牆前端顯示（待開始）
- ⏳ T012 - 答題後觸發檢查（待開始）
