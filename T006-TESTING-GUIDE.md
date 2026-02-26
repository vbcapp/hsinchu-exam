# 🚀 T006 API 測試指南

## 📋 測試步驟

### 1. 啟動本地伺服器

```bash
# 使用 Python（推薦）
python3 -m http.server 8000

# 或使用 Node.js
npx http-server -p 8000
```

### 2. 開啟測試頁面
瀏覽器訪問：
```
http://localhost:8000/test-retry-accuracy.html
```

### 3. 執行測試

#### 測試當前用戶
1. 點擊「測試當前用戶」按鈕
2. 確保已登入系統
3. 查看回傳結果

#### 測試新用戶（無數據）
1. 點擊「測試新用戶（無數據）」按鈕
2. 驗證是否正確回傳空數據

#### 測試自訂用戶
1. 在輸入框輸入用戶 ID
2. 點擊「測試自訂用戶」按鈕
3. 查看該用戶的錯題二刷統計

### 4. 檢查結果

測試頁面會顯示：
- ✅ 原始 JSON 回傳資料
- ✅ 錯題二刷統計（6 個關鍵數字）
- ✅ 二刷正確率進度條
- ✅ 動態訊息提示
- ✅ 詳細分析（答對、仍錯、未重做）
- ✅ 仍需加強的題目列表

### 5. 驗證測試案例

勾選以下測試項目：
- [ ] 上週有錯題，本週全部重做
- [ ] 上週有錯題，本週部分重做
- [ ] 上週無錯題
- [ ] 本週無重做
- [ ] 正確計算二刷正確率
- [ ] 訊息提示正確顯示

---

## 🔍 API 使用範例

### JavaScript 呼叫
```javascript
// 初始化 API Service
await apiService.initialize();

// 取得當前用戶的錯題二刷正確率
const result = await apiService.getRetryAccuracy(userId);

if (result.success) {
    console.log('上週錯題數:', result.data.lastWeekWrongQuestions);
    console.log('本週重做數:', result.data.retriedThisWeek);
    console.log('二刷正確率:', result.data.retryAccuracy + '%');
    console.log('訊息:', result.data.message);
}
```

### 回傳資料結構
```javascript
{
  success: true,
  data: {
    lastWeekWrongQuestions: 12,    // 上週錯題總數
    retriedThisWeek: 8,             // 本週重做題數
    retriedCorrect: 5,              // 重做答對數
    retryAccuracy: 63,              // 二刷正確率 (%)
    stillWrong: 3,                  // 仍需加強
    notRetried: 4,                  // 尚未重做
    wrongQuestionIds: [...],        // 仍錯誤的題目 ID 陣列
    message: '不錯！二刷正確率 63%，繼續保持！'
  }
}
```

---

## 📊 時間區間說明

**上週**: 7 天前 00:00 ~ 今日 00:00（不含今日）

**本週**: 今日 00:00 ~ 現在

**範例**:
- 今日: 2026-02-24 15:30
- 上週區間: 2026-02-17 00:00 ~ 2026-02-24 00:00
- 本週區間: 2026-02-24 00:00 ~ 2026-02-24 15:30

---

## 🐛 除錯技巧

### 1. 檢查資料庫記錄
```sql
-- 查詢上週錯題
SELECT * FROM answer_records
WHERE user_id = 'YOUR_USER_ID'
AND is_correct = false
AND created_at >= '2026-02-17 00:00:00'
AND created_at < '2026-02-24 00:00:00';

-- 查詢本週重做記錄
SELECT * FROM answer_records
WHERE user_id = 'YOUR_USER_ID'
AND created_at >= '2026-02-24 00:00:00'
ORDER BY created_at DESC;
```

### 2. 使用瀏覽器開發者工具
- 按 F12 開啟開發者工具
- 查看 Console 中的 log 訊息
- 檢查 Network 面板的 API 請求

### 3. 驗證時間計算
```javascript
const now = new Date();
const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const lastWeekStart = new Date(todayStart);
lastWeekStart.setDate(lastWeekStart.getDate() - 7);

console.log('現在時間:', now.toISOString());
console.log('今日開始:', todayStart.toISOString());
console.log('上週開始:', lastWeekStart.toISOString());
```

---

## 📝 相關文件

- [T006-TEST-REPORT.md](docs/T006-TEST-REPORT.md) - 測試報告
- [TICKETS.md](docs/TICKETS.md) - 開發任務清單
- [api-service.js](js/api-service.js) - API 實作程式碼

---

**建立日期**: 2026-02-24
**最後更新**: 2026-02-24
