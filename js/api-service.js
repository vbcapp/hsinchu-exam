/**
 * VibeCoding Flashcard - Supabase API Service
 * 完整的後端 API 封裝，處理所有資料庫操作
 */

class ApiService {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
    }

    /**
     * 初始化 Supabase 客戶端
     */
    async initialize() {
        try {
            if (typeof supabase === 'undefined') {
                console.error('Supabase SDK 未載入');
                return { success: false, error: 'SDK Not Loaded' };
            }

            this.supabase = supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey
            );

            // 取得當前使用者
            const { data: { user } } = await this.supabase.auth.getUser();
            this.currentUser = user;

            return { success: true, user };
        } catch (error) {
            console.error('初始化失敗:', error);
            return this._handleError(error);
        }
    }

    // ==================== 認證相關 ====================

    /**
     * 快速註冊/登入 (使用暱稱自動產生帳號)
     */
    async quickLogin(nickname) {
        try {
            // 產生一個固定的假 Email，基於暱稱 (實際應用建議用 UUID)
            // 為了避免重複，這裡加個隨機數，但在真實場景中你可能希望使用者能找回帳號
            // 這裡我們先用 localStorage 存儲的 UUID 來保持持久性
            let userUuid = localStorage.getItem('user_device_id');
            if (!userUuid) {
                userUuid = crypto.randomUUID();
                localStorage.setItem('user_device_id', userUuid);
            }

            const email = `${userUuid}@vibecoding.app`;
            const password = `pass_${userUuid}`; // 自動產生密碼

            // 1. 嘗試登入
            let { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            // 2. 如果登入失敗（帳號不存在），則註冊
            if (error && error.message.includes('Invalid login credentials')) {
                console.log('帳號不存在，正在註冊...');
                const signUpResult = await this.supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: nickname
                        }
                    }
                });

                if (signUpResult.error) throw signUpResult.error;
                data = signUpResult.data;

                // 註冊成功後，建立 users 資料表的個人檔案
                if (data.user) {
                    await this._createUserProfile(data.user.id, nickname, email);
                }
            } else if (error) {
                throw error;
            }

            this.currentUser = data.user;
            return { success: true, user: data.user };

        } catch (error) {
            return this._handleError(error);
        }
    }

    /**
     * 建立使用者 Profile (內部使用)
     */
    async _createUserProfile(userId, username, email) {
        const { error } = await this.supabase
            .from('users')
            .insert({
                id: userId,
                username: username,
                email: email,
                current_level: 1,
                current_xp: 0,
                // 其他欄位用預設值
            });

        if (error) {
            // 如果重複鍵錯誤，表示 Profile 已存在，忽略即可
            if (error.code === '23505') return;
            throw error;
        }
    }

    // ==================== 使用者相關 ====================

    /**
     * 取得使用者資料
     */
    async getUserProfile(userId) {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;

            return {
                success: true,
                data: {
                    ...data,
                    levelProgressPercentage: (data.current_xp / data.next_level_xp * 100).toFixed(1)
                }
            };
        } catch (error) {
            return this._handleError(error, ERROR_CODES.USER_NOT_FOUND);
        }
    }

    /**
     * 更新使用者資料
     */
    async updateUser(userId, updates) {
        try {
            updates.updated_at = new Date().toISOString();

            const { data, error } = await this.supabase
                .from('users')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            return this._handleError(error);
        }
    }

    /**
     * 增加使用者 XP 並處理升級
     */
    async addUserXp(userId, xpToAdd) {
        try {
            const userResult = await this.getUserProfile(userId);
            if (!userResult.success) return userResult;

            const user = userResult.data;
            let newXp = user.current_xp + xpToAdd;
            let newLevel = user.current_level;
            let leveledUp = false;

            while (newXp >= user.next_level_xp) {
                newXp -= user.next_level_xp;
                newLevel++;
                leveledUp = true;
            }

            const newNextLevelXp = calculateNextLevelXp(newLevel);

            const updateResult = await this.updateUser(userId, {
                current_level: newLevel,
                current_xp: newXp,
                next_level_xp: newNextLevelXp
            });

            if (!updateResult.success) return updateResult;

            return {
                success: true,
                data: {
                    leveledUp,
                    newLevel,
                    newXp,
                    newNextLevelXp,
                    user: updateResult.data
                }
            };
        } catch (error) {
            return this._handleError(error);
        }
    }

    // ==================== 卡片相關 ====================

    /**
     * 取得卡片列表（支援分頁與篩選）
     */
    async getCards(options = {}) {
        try {
            const {
                userId,
                category = null,
                masteryLevel = null,
                searchQuery = null,
                page = 1,
                limit = 20
            } = options;

            let query = this.supabase
                .from('flashcards')
                .select('*, user_card_progress(*)', { count: 'exact' })
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (category) {
                query = query.eq('category', category);
            }

            if (masteryLevel !== null) {
                query = query.eq('user_card_progress.mastery_level', masteryLevel);
            }

            if (searchQuery) {
                query = query.or(
                    `english_term.ilike.%${searchQuery}%,` +
                    `chinese_translation.ilike.%${searchQuery}%,` +
                    `abbreviation.ilike.%${searchQuery}%`
                );
            }

            const offset = (page - 1) * limit;
            query = query.range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) throw error;

            return {
                success: true,
                data: {
                    cards: data.map(card => ({
                        ...card,
                        progress: card.user_card_progress?.[0] || null
                    })),
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(count / limit),
                        totalItems: count,
                        itemsPerPage: limit
                    }
                }
            };
        } catch (error) {
            return this._handleError(error);
        }
    }

    /**
     * 取得單張卡片詳細資訊（含進度）
     */
    async getCardWithProgress(cardId, userId) {
        try {
            const { data: card, error: cardError } = await this.supabase
                .from('flashcards')
                .select('*')
                .eq('id', cardId)
                .single();

            if (cardError) throw cardError;

            const { data: progress, error: progressError } = await this.supabase
                .from('user_card_progress')
                .select('*')
                .eq('user_id', userId)
                .eq('card_id', cardId)
                .maybeSingle();

            if (progressError && progressError.code !== 'PGRST116') {
                console.warn('取得進度失敗:', progressError);
            }

            return {
                success: true,
                data: {
                    card,
                    progress: progress || null
                }
            };
        } catch (error) {
            return this._handleError(error, ERROR_CODES.CARD_NOT_FOUND);
        }
    }

    /**
     * 建立新卡片
     */
    async createCard(cardData) {
        try {
            const now = new Date().toISOString();
            const newCard = {
                ...cardData,
                created_at: now,
                updated_at: now
            };

            const { data, error } = await this.supabase
                .from('flashcards')
                .insert(newCard)
                .select()
                .single();

            if (error) throw error;

            await this.addUserXp(cardData.user_id, XP_REWARDS.CREATE_CARD);

            const userResult = await this.getUserProfile(cardData.user_id);
            if (userResult.success) {
                await this.updateUser(cardData.user_id, {
                    total_cards_created: userResult.data.total_cards_created + 1
                });
            }

            return {
                success: true,
                data,
                xpEarned: XP_REWARDS.CREATE_CARD
            };
        } catch (error) {
            if (error.code === '23505') {
                return this._handleError(error, ERROR_CODES.DUPLICATE_CARD);
            }
            return this._handleError(error);
        }
    }

    /**
     * 更新卡片
     */
    async updateCard(cardId, updates) {
        try {
            updates.updated_at = new Date().toISOString();

            const { data, error } = await this.supabase
                .from('flashcards')
                .update(updates)
                .eq('id', cardId)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            return this._handleError(error, ERROR_CODES.CARD_NOT_FOUND);
        }
    }

    /**
     * 刪除卡片
     */
    async deleteCard(cardId, userId) {
        try {
            const { error } = await this.supabase
                .from('flashcards')
                .delete()
                .eq('id', cardId)
                .eq('user_id', userId);

            if (error) throw error;

            const userResult = await this.getUserProfile(userId);
            if (userResult.success && userResult.data.total_cards_created > 0) {
                await this.updateUser(userId, {
                    total_cards_created: userResult.data.total_cards_created - 1
                });
            }

            return { success: true };
        } catch (error) {
            return this._handleError(error);
        }
    }

    // ==================== 進度與測驗相關 ====================

    /**
     * 提交測驗結果（完整流程）
     */
    async submitTestResult(testData) {
        try {
            const { userId, cardId, isCorrect, responseTimeMs, testType = 'quiz' } = testData;

            const progressResult = await this._getCardProgress(userId, cardId);
            const isFirstTime = !progressResult.data;

            const xpEarned = isCorrect
                ? (isFirstTime ? XP_REWARDS.CORRECT_FIRST : XP_REWARDS.CORRECT_REVIEW)
                : XP_REWARDS.INCORRECT;

            const { data: testRecord, error: testError } = await this.supabase
                .from('test_records')
                .insert({
                    user_id: userId,
                    card_id: cardId,
                    is_correct: isCorrect,
                    response_time_ms: responseTimeMs,
                    test_type: testType,
                    xp_earned: xpEarned,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (testError) throw testError;

            const updatedProgress = await this._updateProgressAfterTest(userId, cardId, isCorrect);
            const xpResult = await this.addUserXp(userId, xpEarned);

            return {
                success: true,
                data: {
                    testRecord,
                    cardProgress: updatedProgress.data,
                    xpEarned,
                    levelUp: xpResult.data.leveledUp,
                    newLevel: xpResult.data.newLevel,
                    newXp: xpResult.data.newXp
                }
            };
        } catch (error) {
            return this._handleError(error);
        }
    }

    async _getCardProgress(userId, cardId) {
        try {
            const { data, error } = await this.supabase
                .from('user_card_progress')
                .select('*')
                .eq('user_id', userId)
                .eq('card_id', cardId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;

            return { success: true, data };
        } catch (error) {
            return this._handleError(error);
        }
    }

    async _updateProgressAfterTest(userId, cardId, isCorrect) {
        try {
            const progressResult = await this._getCardProgress(userId, cardId);
            const now = new Date().toISOString();

            if (!progressResult.data) {
                const { data, error } = await this.supabase
                    .from('user_card_progress')
                    .insert({
                        user_id: userId,
                        card_id: cardId,
                        mastery_level: isCorrect ? 1 : 0,
                        times_reviewed: 1,
                        times_correct: isCorrect ? 1 : 0,
                        times_incorrect: isCorrect ? 0 : 1,
                        last_reviewed_at: now,
                        created_at: now,
                        updated_at: now
                    })
                    .select()
                    .single();

                if (error) throw error;
                return { success: true, data };
            } else {
                const progress = progressResult.data;
                const newTimesCorrect = progress.times_correct + (isCorrect ? 1 : 0);
                const newTimesIncorrect = progress.times_incorrect + (isCorrect ? 0 : 1);
                const newTimesReviewed = progress.times_reviewed + 1;

                const accuracyRate = newTimesCorrect / newTimesReviewed;
                let newMasteryLevel = progress.mastery_level;

                if (isCorrect && accuracyRate >= 0.9 && progress.mastery_level < 5) {
                    newMasteryLevel = progress.mastery_level + 1;
                } else if (!isCorrect && accuracyRate < 0.5 && progress.mastery_level > 0) {
                    newMasteryLevel = progress.mastery_level - 1;
                }

                const { data, error } = await this.supabase
                    .from('user_card_progress')
                    .update({
                        mastery_level: newMasteryLevel,
                        times_reviewed: newTimesReviewed,
                        times_correct: newTimesCorrect,
                        times_incorrect: newTimesIncorrect,
                        last_reviewed_at: now,
                        updated_at: now
                    })
                    .eq('user_id', userId)
                    .eq('card_id', cardId)
                    .select()
                    .single();

                if (error) throw error;
                return { success: true, data };
            }
        } catch (error) {
            return this._handleError(error);
        }
    }

    // ==================== 錯誤處理 ====================

    _handleError(error, defaultCode = ERROR_CODES.INTERNAL_ERROR) {
        console.error('API Error:', error);

        let errorCode = defaultCode;
        let message = error.message || '發生未知錯誤';

        if (error.code === 'PGRST116') {
            errorCode = ERROR_CODES.CARD_NOT_FOUND;
            message = '找不到指定的資料';
        } else if (error.code === '23505') {
            errorCode = ERROR_CODES.DUPLICATE_CARD;
            message = '此卡片已存在';
        } else if (error.code === '42501') {
            errorCode = ERROR_CODES.FORBIDDEN;
            message = '無權限執行此操作';
        }

        return {
            success: false,
            error: {
                code: errorCode,
                message,
                details: error
            }
        };
    }
}

// 建立全域實例
const apiService = new ApiService();
