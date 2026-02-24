// T004 API 測試腳本
// 使用 Node.js 環境測試

const userId = '68b72a80-57d8-40ee-811e-be58bea1e69f';
const limit = 5;

console.log('🔍 開始測試 T004 - 錯誤選項分析 API');
console.log('用戶 ID:', userId);
console.log('顯示題數:', limit);
console.log('\n⏳ 請開啟 test-t004.html 進行測試...\n');

console.log('測試步驟：');
console.log('1. 開啟瀏覽器');
console.log('2. 開啟檔案: test-t004.html');
console.log('3. 用戶 ID 欄位會自動填入當前登入用戶');
console.log('4. 或手動貼上: ' + userId);
console.log('5. 點擊「執行測試」按鈕');
console.log('\n✨ API 將會顯示該用戶最常答錯的題目與錯誤選項分析！');
