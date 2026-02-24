# T007 - 徽章系統實作指南

> **快速開始指南** - 如何在你的系統中使用徽章 API

---

## 🚀 快速開始（5 分鐘）

### 步驟 1: 執行 SQL 函式（必須）

在 Supabase SQL Editor 中執行：

```bash
# 檔案位置
sql/get_user_daily_streak.sql
```

這個函式用於計算連續答題天數，支援連續天數徽章解鎖。

### 步驟 2: 開啟測試頁面

```
test-badges.html
```

測試所有徽章 API 功能。

### 步驟 3: 在答題頁面整合

在 `test.html` 或任何答題頁面的答題後邏輯中：

```javascript
// 答題後檢查徽章
const badgeResult = await api.checkAndUnlockBadges(currentUser.id);

// 如果有新解鎖的徽章，顯示動畫
if (badgeResult.success && badgeResult.data.newlyUnlocked.length > 0) {
    badgeResult.data.newlyUnlocked.forEach(badge => {
        console.log(`🎉 解鎖新徽章: ${badge.badgeName}`);
        // TODO: 顯示全螢幕動畫
    });
}
```

---

## 📖 API 使用範例

### 1. 檢查並自動解鎖徽章

```javascript
const result = await api.checkAndUnlockBadges(userId);

console.log(result);
// {
//   success: true,
//   data: {
//     newlyUnlocked: [
//       {
//         badgeKey: 'hundred_correct',
//         badgeName: '百題斬',
//         badgeDescription: '累積答對 100 題',
//         badgeIcon: 'emoji_events',
//         unlockedAt: '2026-02-24T10:30:00Z'
//       }
//     ],
//     totalChecked: 15,
//     totalUnlocked: 5
//   }
// }
```

**使用時機：**
- 每次答題後
- 用戶進入徽章牆頁面時
- 每日登入時（檢查連續天數）

### 2. 取得用戶已解鎖的徽章

```javascript
const result = await api.getUserBadges(userId);

console.log(result);
// {
//   success: true,
//   data: [
//     {
//       id: 'uuid',
//       user_id: 'uuid',
//       badge_key: 'hundred_correct',
//       badge_name: '百題斬',
//       badge_description: '累積答對 100 題',
//       badge_icon: 'emoji_events',
//       unlocked_at: '2026-02-24T10:30:00Z'
//     }
//   ],
//   total: 5
// }
```

**使用時機：**
- 顯示徽章牆
- 個人資料頁面
- 排行榜（顯示徽章數量）

### 3. 取得即將解鎖的徽章（進度追蹤）

```javascript
// 取得進度 >= 80% 的徽章
const result = await api.getAvailableBadges(userId, 80);

console.log(result);
// {
//   success: true,
//   data: [
//     {
//       badgeKey: 'fivehundred_correct',
//       badgeName: '五百壯士',
//       badgeDescription: '累積答對 500 題',
//       badgeIcon: 'military_tech',
//       category: '數量成就',
//       progress: 87,     // 完成 87%
//       current: 435,     // 目前 435 題
//       target: 500,      // 目標 500 題
//       remaining: 65     // 還需 65 題
//     }
//   ]
// }
```

**使用時機：**
- 弱點分析頁面（激勵提示）
- 徽章牆（顯示進度條）
- 每日目標頁面

---

## 🎨 前端顯示建議

### 方案 1: 答題後彈窗（推薦）

```javascript
async function handleAnswerSubmit(questionId, userAnswer, isCorrect) {
    // 提交答案
    await api.submitAnswer({ ... });

    // 檢查徽章
    const badgeResult = await api.checkAndUnlockBadges(currentUser.id);

    // 有新解鎖 → 顯示動畫
    if (badgeResult.data.newlyUnlocked.length > 0) {
        showBadgeModal(badgeResult.data.newlyUnlocked);
    }
}

function showBadgeModal(badges) {
    const modal = document.createElement('div');
    modal.className = 'badge-unlock-modal';
    modal.innerHTML = `
        <div class="badge-unlock-content">
            <h2>🎉 解鎖新徽章！</h2>
            ${badges.map(b => `
                <div class="badge-item">
                    <span class="badge-icon">${b.badgeIcon}</span>
                    <h3>${b.badgeName}</h3>
                    <p>${b.badgeDescription}</p>
                </div>
            `).join('')}
        </div>
    `;
    document.body.appendChild(modal);

    // 3 秒後自動關閉
    setTimeout(() => modal.remove(), 3000);
}
```

### 方案 2: 徽章牆頁面

```javascript
async function loadBadgeWall() {
    const container = document.getElementById('badge-wall');

    // 載入已解鎖徽章
    const unlocked = await api.getUserBadges(currentUser.id);

    // 載入即將解鎖（進度 >= 50%）
    const available = await api.getAvailableBadges(currentUser.id, 50);

    // 渲染徽章牆
    container.innerHTML = `
        <h2>已解鎖徽章 (${unlocked.total})</h2>
        <div class="badge-grid">
            ${unlocked.data.map(badge => `
                <div class="badge-card unlocked">
                    <span class="badge-icon">${badge.badge_icon}</span>
                    <h3>${badge.badge_name}</h3>
                    <p>${badge.badge_description}</p>
                    <small>${new Date(badge.unlocked_at).toLocaleDateString('zh-TW')}</small>
                </div>
            `).join('')}
        </div>

        <h2>即將解鎖</h2>
        <div class="badge-grid">
            ${available.data.map(badge => `
                <div class="badge-card locked">
                    <span class="badge-icon">${badge.badgeIcon}</span>
                    <h3>${badge.badgeName}</h3>
                    <p>${badge.badgeDescription}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${badge.progress}%"></div>
                    </div>
                    <small>${badge.current} / ${badge.target} (還需 ${badge.remaining})</small>
                </div>
            `).join('')}
        </div>
    `;
}
```

### 方案 3: 弱點分析頁面激勵提示

```javascript
async function showMotivationHint() {
    const result = await api.getAvailableBadges(currentUser.id, 70);

    if (result.data.length > 0) {
        const nextBadge = result.data[0]; // 進度最高的徽章

        const hint = document.createElement('div');
        hint.className = 'motivation-hint';
        hint.innerHTML = `
            <span class="icon">${nextBadge.badgeIcon}</span>
            <p>
                再答對 <strong>${nextBadge.remaining}</strong> 題
                就能解鎖「<strong>${nextBadge.badgeName}</strong>」！
            </p>
            <div class="mini-progress">
                <div style="width: ${nextBadge.progress}%"></div>
            </div>
        `;

        document.querySelector('.weakness-page').prepend(hint);
    }
}
```

---

## 🏆 徽章列表

### 數量成就
| 徽章 | Key | 條件 | 圖示 |
|------|-----|------|------|
| 首題達陣 | `first_correct` | 答對 1 題 | 🚩 |
| 十全十美 | `ten_correct` | 答對 10 題 | ⭐ |
| 百題斬 | `hundred_correct` | 答對 100 題 | 🏆 |
| 五百壯士 | `fivehundred_correct` | 答對 500 題 | 🎖️ |

### 連勝成就
| 徽章 | Key | 條件 | 圖示 |
|------|-----|------|------|
| 連勝起步 | `streak_3` | 連續答對 3 題 | 🔥 |
| 連勝達人 | `streak_10` | 連續答對 10 題 | 💥 |
| 無敵連勝 | `streak_20` | 連續答對 20 題 | ⚡ |

### 連續天數
| 徽章 | Key | 條件 | 圖示 |
|------|-----|------|------|
| 三日修行 | `daily_streak_3` | 連續 3 天答題 | 📅 |
| 一週達人 | `daily_streak_7` | 連續 7 天答題 | ✅ |
| 不屈之志 | `daily_streak_30` | 連續 30 天答題 | ✔️ |

### 熟練度成就
| 徽章 | Key | 條件 | 圖示 |
|------|-----|------|------|
| 熟能生巧 | `mastery_10` | 10 題熟練 | 🎓 |
| 爐火純青 | `mastery_50` | 50 題熟練 | 👑 |
| 登峰造極 | `mastery_100` | 100 題熟練 | 🏆 |

### 特殊成就
| 徽章 | Key | 條件 | 圖示 |
|------|-----|------|------|
| 完美一天 | `perfect_day` | 單日 100% 正確率（≥10 題） | ⭐ |
| 快速學習者 | `fast_learner` | 平均答題時間 < 15 秒（≥50 題） | ⚡ |

---

## 🔧 進階使用

### 自訂徽章

在 `api-service.js` 的 `_getBadgeDefinitions()` 中新增徽章：

```javascript
{
    badgeKey: 'custom_achievement',
    badgeName: '自訂成就',
    badgeDescription: '達成特殊條件',
    badgeIcon: 'star',
    category: '自訂',
    condition: async (userId) => {
        // 你的自訂條件
        const { count } = await this.supabase
            .from('answer_records')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('some_field', 'some_value');

        return count >= 10;
    }
}
```

### 批量檢查徽章（性能優化）

如果要在答題後立即檢查，建議只檢查「可能新解鎖」的徽章：

```javascript
// 答對一題後，只檢查數量相關徽章
async function checkRelevantBadges(userId, isCorrect) {
    if (!isCorrect) return;

    // 只檢查特定徽章（避免全部檢查）
    const relevantBadges = [
        'first_correct',
        'ten_correct',
        'hundred_correct',
        'streak_3',
        'streak_10'
    ];

    // ... 自訂檢查邏輯
}
```

---

## 🐛 常見問題

### Q1: 連續天數徽章無法解鎖？

**A:** 請確認已執行 `sql/get_user_daily_streak.sql` 腳本。

### Q2: 徽章重複解鎖？

**A:** 資料庫有 UNIQUE 約束，不會重複寫入。如果發生錯誤，請檢查 `user_badges` 表的 UNIQUE 約束是否正確。

### Q3: 檢查徽章太慢？

**A:** 如果用戶數據量很大，建議：
1. 只在特定時機檢查（答題後、每日登入）
2. 使用快取（前端儲存已檢查的結果）
3. 優化條件檢查邏輯（使用 `count` 而非 `select *`）

### Q4: 如何新增更多徽章？

**A:** 在 `_getBadgeDefinitions()` 中新增即可，無需修改資料庫結構。

---

## 📚 相關文件

- [T007 測試報告](docs/T007-TEST-REPORT.md) - 完整測試文件
- [任務清單](docs/TICKETS.md) - T007 任務規格
- [資料庫設計](database.md) - `user_badges` 表結構
- [測試頁面](test-badges.html) - 徽章系統測試

---

## 🎯 下一步

1. ✅ 完成 T007 - 徽章 API（已完成）
2. ⏳ T011 - 徽章牆前端顯示（待開始）
3. ⏳ T012 - 答題後觸發檢查（待開始）

---

**需要協助？** 請查看 `test-badges.html` 中的完整範例，或參考 `docs/T007-TEST-REPORT.md`。
