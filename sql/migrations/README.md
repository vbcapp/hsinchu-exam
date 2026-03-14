# 資料庫 Migration 管理

## 大白話說明

每次你叫 Claude 改資料庫結構（加欄位、加表、改函式），Claude 會：
1. 在 `sql/migrations/` 產出一個新的編號 SQL 檔案
2. 在主庫執行並記錄版本號

之後你要升級其他客戶的資料庫，只要跟 Claude 說：

> 「幫我把所有新的 migration 套用到美青的資料庫」

Claude 會自動：
1. 檢查美青資料庫目前到哪個版本
2. 只執行還沒跑過的 migration
3. 不會重複執行已經跑過的

---

## 檔案結構

```
sql/migrations/
  000_create_schema_migrations.sql   ← 版本追蹤表（每個新資料庫都要先跑這個）
  001_add_scoring_to_org_settings.sql
  002_add_question_copy_tracking.sql
  003_add_role_security_functions.sql
  ...（未來的更新會繼續往後編號）
```

---

## 你可以對 Claude 說的指令

### 升級特定客戶
> 「幫我把所有新的 migration 套用到 Supabase 專案 `vryyyyivmbbqahlaafdn`」

### 升級所有客戶
> 「幫我把所有客戶的資料庫都升級到最新版」

### 檢查版本
> 「幫我檢查所有客戶資料庫的 migration 版本」

### 新增 migration
> 「我要在 users 表加一個 phone 欄位，幫我建 migration」

Claude 會自動產出新的 migration 檔案並執行。

---

## 安全設計

- **schema_migrations 表有 RLS**：只能讀取，不能被前端竄改
- **所有 SQL 使用 IF NOT EXISTS / IF EXISTS**：重複執行不會壞掉
- **migration 只能新增不能修改**：已經跑過的 migration 絕對不改
- **不影響用戶資料**：migration 只改結構，不動用戶的題目和答題記錄
- **migration 檔案放在 GitHub 但不影響網站運行**：`.sql` 檔案不會被瀏覽器載入

---

## 現有客戶版本追蹤

| 企業名稱 | Supabase 專案 | 目前版本 |
|----------|--------------|---------|
| 新竹職訓中心 | `mwwvrapnjekxwxpyolcm` | 003 |
| 美青勞資事務師 | `vryyyyivmbbqahlaafdn` | 003 |
