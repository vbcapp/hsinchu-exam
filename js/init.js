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
            await loadUserCards();
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
 * 載入使用者的卡片
 */
async function loadUserCards() {
    if (!currentUser) return;

    const container = document.getElementById('cards-container');
    if (!container) {
        console.log('卡片容器不存在，跳過載入');
        return;
    }

    try {
        const result = await apiService.getCards({ userId: currentUser.id });

        if (result.success) {
            renderCards(result.data.cards, container);
        } else {
            console.error('載入卡片失敗:', result.error);
        }
    } catch (error) {
        console.error('載入卡片錯誤:', error);
    }
}

/**
 * 渲染卡片列表
 */
function renderCards(cards, container) {
    if (!cards || cards.length === 0) {
        container.innerHTML = `
            <div class="col-span-2 text-center py-8 text-gray-500">
                <p class="text-sm">尚無卡片</p>
                <p class="text-xs mt-2">從每日一卡收藏，或自己建立新卡片吧！</p>
            </div>
        `;
        return;
    }

    container.innerHTML = cards.map(card => renderCardItem(card)).join('');

    // 重新綁定編輯和刪除按鈕事件
    bindCardActions();
}

/**
 * 渲染單張卡片
 */
function renderCardItem(card) {
    const description = card.description
        ? card.description.substring(0, 40) + (card.description.length > 40 ? '...' : '')
        : '';

    return `
        <a href="card.html?id=${card.id}"
            class="bg-white dark:bg-zinc-900 neo-border-thick neo-shadow p-3 flex flex-col min-h-[140px] relative transition-transform active:scale-[0.98]">
            <div class="mb-2">
                <span class="bg-primary neo-border px-1.5 py-0.5 text-[8px] font-bold uppercase">${card.category || 'General'}</span>
            </div>
            <div class="flex-1">
                <h3 class="text-xl font-black italic tracking-tighter uppercase leading-tight mb-1">${card.english_term}</h3>
                <p class="text-[10px] leading-tight opacity-70 line-clamp-2">${card.chinese_translation}。${description}</p>
            </div>
            <div class="flex justify-end gap-2 mt-2">
                <span data-card-id="${card.id}" data-action="edit"
                    class="material-symbols-outlined text-base cursor-pointer hover:text-primary">edit_square</span>
                <span data-card-id="${card.id}" data-action="delete"
                    class="material-symbols-outlined text-base cursor-pointer text-red-500">delete</span>
            </div>
        </a>
    `;
}

/**
 * 綁定卡片操作事件
 */
function bindCardActions() {
    // 編輯按鈕
    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const cardId = this.getAttribute('data-card-id');
            window.location.href = `edit.html?id=${cardId}`;
        });
    });

    // 刪除按鈕
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', async function (e) {
            e.preventDefault();
            e.stopPropagation();
            const cardId = this.getAttribute('data-card-id');

            if (!confirm('確定要刪除這張卡片嗎？')) return;

            const result = await apiService.deleteCard(cardId, currentUser.id);
            if (result.success) {
                await loadUserCards(); // 重新載入卡片
            } else {
                alert('刪除失敗: ' + result.error.message);
            }
        });
    });
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

