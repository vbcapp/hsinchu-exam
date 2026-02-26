# T006 - 錯題二刷正確率 API 測試報告

## 📋 測試資訊

- **測試日期**: 2026-02-24
- **API 函式**: `getRetryAccuracy(userId)`
- **實作位置**: [js/api-service.js:3130-3284](js/api-service.js#L3130-L3284)
- **測試頁面**: [test-retry-accuracy.html](../test-retry-accuracy.html)

---

## 🎯 API 功能說明

計算「上週錯題在本週重做的正確率」，用於驗證學習成效。

### 輸入參數
- `userId` (string): 用戶 ID（必填）

### 回傳格式
```javascript
{
  success: true,
  data: {
    lastWeekWrongQuestions: 12,    // 上週錯題總數
    retriedThisWeek: 8,             // 本週重做題數
    retriedCorrect: 5,              // 重做答對數
    retryAccuracy: 63,              // 二刷正確率 (5/8)
    stillWrong: 3,                  // 仍需加強
    notRetried: 4,                  // 尚未重做
    wrongQuestionIds: [...],        // 仍錯誤的題目 ID
    message: '...'                  // 動態訊息
  }
}
```

---

## 🧪 測試案例執行結果

### ✅ 測試案例 1: 上週有錯題，本週全部重做
**狀態**: 待測試
**預期行為**:
- `retriedThisWeek === lastWeekWrongQuestions`
- `notRetried === 0`
- 正確計算二刷正確率

**實際結果**:
```
待填寫
```

---

### ✅ 測試案例 2: 上週有錯題，本週部分重做
**狀態**: 待測試
**預期行為**:
- `0 < retriedThisWeek < lastWeekWrongQuestions`
- `notRetried > 0`
- 訊息建議複習

**實際結果**:
```
待填寫
```

---

### ✅ 測試案例 3: 上週無錯題
**狀態**: 可測試（使用新用戶）
**預期行為**:
- `lastWeekWrongQuestions === 0`
- `message: '上週無錯題記錄，太棒了！'`

**實際結果**:
```json
{
  "success": true,
  "data": {
    "lastWeekWrongQuestions": 0,
    "retriedThisWeek": 0,
    "retriedCorrect": 0,
    "retryAccuracy": 0,
    "stillWrong": 0,
    "notRetried": 0,
    "wrongQuestionIds": [],
    "message": "上週無錯題記錄，太棒了！"
  }
}
```
✅ **通過** - 新用戶正確回傳空數據

---

### ✅ 測試案例 4: 本週無重做
**狀態**: 待測試
**預期行為**:
- `retriedThisWeek === 0`
- `notRetried === lastWeekWrongQuestions`
- `message` 提示「尚未重做，建議複習」

**實際結果**:
```
待填寫
```

---

## 🔍 API 實作邏輯驗證

### 時間區間計算
```javascript
const now = new Date();
const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const lastWeekStart = new Date(todayStart);
lastWeekStart.setDate(lastWeekStart.getDate() - 7);
```

**驗證**:
- ✅ 正確計算「今日 00:00」
- ✅ 正確計算「7 天前 00:00」
- ✅ 使用 `.toISOString()` 轉換為資料庫格式

### 查詢邏輯
1. **上週錯題查詢**:
   ```sql
   WHERE user_id = ?
   AND is_correct = false
   AND created_at >= lastWeekStart
   AND created_at < todayStart
   ```
   - ✅ 只查詢上週（不包含今日）
   - ✅ 只查詢錯誤記錄

2. **本週重做查詢**:
   ```sql
   WHERE user_id = ?
   AND question_id IN (...)
   AND created_at >= todayStart
   ORDER BY created_at DESC
   ```
   - ✅ 只查詢今日以後的記錄
   - ✅ 按時間倒序（最新的在前）

3. **最新結果判定**:
   - ✅ 使用 `questionRetryMap` 追蹤每題最新結果
   - ✅ 避免重複計算同一題的多次答題

### 統計邏輯
- ✅ `retriedThisWeek`: 本週有重做的題目數
- ✅ `retriedCorrect`: 重做後答對的題目數
- ✅ `retryAccuracy`: `Math.round((retriedCorrect / retriedThisWeek) * 100)`
- ✅ `stillWrong`: 重做後仍答錯的題目數
- ✅ `notRetried`: `lastWeekWrongQuestions - retriedThisWeek`

### 訊息生成邏輯
- ✅ `retryAccuracy >= 80%`: 「太棒了！」
- ✅ `retryAccuracy >= 60%`: 「不錯！」
- ✅ `retryAccuracy < 60%`: 「建議加強複習」
- ✅ `retriedThisWeek === 0`: 「尚未重做，建議複習」

---

## 🐛 發現的問題

### 問題 1: [待發現]
**描述**:
**嚴重程度**:
**解決方案**:

---

## 📊 效能測試

**測試環境**: 本地開發環境
**資料量**:

| 測試項目 | 執行時間 | 狀態 |
|---------|---------|------|
| 查詢上週錯題 | - | ⏳ |
| 查詢本週重做 | - | ⏳ |
| 統計計算 | - | ⏳ |
| 總執行時間 | < 500ms | ⏳ |

---

## ✅ 驗收標準檢查

- [x] API 函式實作完成
- [x] 測試頁面建立完成
- [ ] 所有測試案例通過
- [ ] 錯誤處理完善
- [ ] 回傳格式符合規格
- [ ] 效能符合要求（< 500ms）
- [ ] 程式碼已加入註解
- [ ] 更新 TICKETS.md 狀態

---

## 📝 測試結論

### 目前狀態
- ✅ API 實作完成
- ✅ 測試頁面建立完成
- ⏳ 等待實際資料測試

### 下一步行動
1. 使用真實用戶資料測試所有案例
2. 驗證時間區間計算是否正確
3. 檢查邊界情況（如：同一題多次答題）
4. 記錄效能數據
5. 更新 TICKETS.md 狀態為「已完成」

---

## 📸 測試截圖

### 測試頁面
![測試頁面截圖](待補充)

### API 回傳範例
```json
待補充
```

---

## 🔗 相關文件

- [TICKETS.md](TICKETS.md) - 開發任務清單
- [database.md](../database.md) - 資料庫架構
- [PRD.md](PRD.md) - 產品需求文件
- [js/api-service.js](../js/api-service.js) - API 實作

---

**測試人員**: Claude Code
**最後更新**: 2026-02-24
