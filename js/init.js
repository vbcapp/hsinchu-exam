/**
 * 應用初始化腳本
 * 在頁面載入時自動初始化 Supabase 並檢查認證狀態
 */

let currentUser = null;

/**
 * 初始化應用
 */
async function initializeApp() {
    try {
        console.log('正在初始化應用...');

        await apiService.initialize();

        if (apiService.currentUser) {
            currentUser = apiService.currentUser;
            console.log('使用者已登入:', currentUser.email);
            await loadUserData();
        } else {
            console.log('使用者未登入');
        }

        return { success: true };
    } catch (error) {
        console.error('初始化失敗:', error);
        showError('應用初始化失敗，請重新整理頁面');
    }
}

/**
 * 載入使用者資料
 */
async function loadUserData() {
    if (!currentUser) return;

    try {
        const result = await apiService.getUserProfile(currentUser.id);

        if (result.success) {
            updateUserUI(result.data);
        } else {
            console.error('載入使用者資料失敗:', result.error);
        }
    } catch (error) {
        console.error('載入使用者資料錯誤:', error);
    }
}

/**
 * 更新 UI 顯示使用者資料
 */
function updateUserUI(userData) {
    const levelElements = document.querySelectorAll('[data-user-level]');
    levelElements.forEach(el => {
        el.textContent = `Lv. ${userData.current_level}`;
    });

    const xpElements = document.querySelectorAll('[data-user-xp]');
    xpElements.forEach(el => {
        el.textContent = `${userData.current_xp}/${userData.next_level_xp}`;
    });

    const progressBars = document.querySelectorAll('[data-xp-progress]');
    progressBars.forEach(bar => {
        bar.style.width = `${userData.levelProgressPercentage}%`;
    });

    const cardCountElements = document.querySelectorAll('[data-card-count]');
    cardCountElements.forEach(el => {
        el.textContent = userData.total_cards_created;
    });

    console.log('UI 已更新:', userData);
}

/**
 * 顯示錯誤訊息
 */
function showError(message) {
    console.error(message);
    alert(message);
}

/**
 * 顯示成功訊息
 */
function showSuccess(message) {
    console.log(message);
}

/**
 * 顯示升級動畫
 */
function showLevelUpAnimation(newLevel) {
    alert(`🎉 恭喜！升級到 Lv.${newLevel}！`);
    console.log('🎉 Level Up!', newLevel);
}

// 頁面載入時自動初始化
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
});
