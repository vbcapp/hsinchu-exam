/**
 * VibeCoding Flashcard - OpenAI API Service
 * 處理與 OpenAI ChatGPT API 的交互
 */

class AIService {
    constructor() {
        // OpenAI API Key (應該從安全的地方獲取，但這裡先直接使用)
        this.apiKey = '***REMOVED***';
        this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
    }

    /**
     * 生成學習卡片的 Prompt 模板
     * @param {string[]} termList - 專有名詞列表
     * @returns {string} - 完整的 prompt
     */
    generatePrompt(termList) {
        // Ensure termList is an array
        const list = Array.isArray(termList) ? termList : [termList];
        const terms = list.join('、');
        return `你現在是一位 AI應用規劃師 iPAS 證照輔導老師兼程式教學專家，請根據我提供的專有名詞列表，幫我生成一份 JSON 格式的學習卡片資料。

你的回覆必須是純粹的 JSON 格式，不要包含任何解釋性文字或程式碼區塊標記。

**重要：請回傳一個 JSON 陣列 (Array)，包含所有請求的名詞資料。**

每個物件必須包含：
1. "term": 請求的專有名詞
2. "cardData": 包含卡片顯示資訊的物件
3. "quizQuestions": 包含 5 個測驗題目的陣列

JSON 結構範例：
[
  {
    "term": "API",
    "cardData": {
      "level": 數字，代表難度等級 (1-5),
      "category": "字串，該名詞的技術分類 (例如: JavaScript, CSS, React)",
      "title": "字串，必須是專有名詞的英文全稱 (Full Name)。**嚴禁**填入縮寫。若全稱超過 25 字元請精簡但不可變回縮寫。內容絕對不准與 abbreviation 重複。建議保留專業全名，可將常用短名放在 abbreviation 中。",
      "subtitle": "字串，專有名詞的繁體中文翻譯",
      "abbreviation": "字串，該專有名詞的代號或縮寫 (Abbreviation)。若無縮寫則**必須**填入空字串 \"\"。禁止填入全名。可將 title 的短名稱或常用簡稱放在此欄。",
      "content": "字串，用簡單易懂的方式解釋這個名詞",
      "analogy": "字串，用大白話做一個小學生都能聽懂的生活化比喻"
    },
    "quizQuestions": [
      {
        "question": "題目敘述",
        "options": ["選項A", "選項B", "選項C"],
        "correctAnswer": 0,
        "explanation": "清楚說明為何正確、其他選項為何錯"
      },
      {
        "question": "第二題題目",
        "options": ["選項A", "選項B", "選項C"],
        "correctAnswer": 1,
        "explanation": "清楚說明為何正確、其他選項為何錯"
      },
      {
        "question": "第三題題目",
        "options": ["選項A", "選項B", "選項C"],
        "correctAnswer": 2,
        "explanation": "清楚說明為何正確、其他選項為何錯"
      },
      {
        "question": "第四題題目",
        "options": ["選項A", "選項B", "選項C"],
        "correctAnswer": 1,
        "explanation": "清楚說明為何正確、其他選項為何錯"
      },
      {
        "question": "第五題題目",
        "options": ["選項A", "選項B", "選項C"],
        "correctAnswer": 0,
        "explanation": "清楚說明為何正確、其他選項為何錯"
      }
    ]
  }
]

每個測驗題目必須包含：
- question: 題目敘述
- options: 3個選項的陣列
- correctAnswer: 正確答案的索引 (0, 1, 或 2)
- explanation: 清楚說明為何正確、其他選項為何錯

**題目設計要求：**
- 5 題測驗題目應涵蓋不同面向，包括：概念理解、應用情境、常見誤解、實務判斷、進階辨析
- 題目難度應有層次，從基礎到進階
- 避免題目之間答案模式過於相似

這是我要學習的專有名詞列表：
${terms}`;
    }

    /**
     * 調用 OpenAI API 生成卡片數據
     * @param {string[]} termList - 專有名詞列表
     * @returns {Promise<object>} - 生成的卡片數據
     */
    async generateFlashcards(termList) {
        try {
            console.log('開始調用 OpenAI API...');
            console.log('專有名詞列表:', termList);

            const prompt = this.generatePrompt(termList);

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 8000
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('OpenAI API 錯誤:', errorData);
                throw new Error(`API 請求失敗: ${response.status} - ${errorData.error?.message || '未知錯誤'}`);
            }

            const data = await response.json();
            console.log('OpenAI API 回應:', data);

            // 解析 ChatGPT 的回應
            const content = data.choices[0].message.content;
            console.log('生成的內容:', content);

            // 嘗試解析 JSON
            let parsedData;
            try {
                // 移除可能的程式碼區塊標記
                const cleanContent = content
                    .replace(/```json\n?/g, '')
                    .replace(/```\n?/g, '')
                    .trim();

                // 嘗試提取 JSON (支援陣列 [] 或物件 {})
                const jsonMatch = cleanContent.match(/(\[[\s\S]*\])|(\{[\s\S]*\})/);
                let jsonStr = jsonMatch ? jsonMatch[0] : cleanContent;

                // 移除 JSON 中的尾部逗號 (Trailing Commas)
                // 例如: "key": "value", } -> "key": "value" }
                jsonStr = jsonStr.replace(/,(\s*[\]}])/g, '$1');

                parsedData = JSON.parse(jsonStr);
            } catch (parseError) {
                console.error('JSON 解析錯誤:', parseError);
                console.error('原始內容:', content);
                throw new Error('無法解析 AI 生成的 JSON 數據');
            }

            return {
                success: true,
                data: parsedData
            };

        } catch (error) {
            console.error('生成卡片失敗:', error);
            return {
                success: false,
                error: {
                    message: error.message || '生成卡片時發生錯誤',
                    details: error
                }
            };
        }
    }

    /**
     * 將 AI 生成的數據轉換為 Supabase 卡片格式
     * @param {object} aiData - AI 生成的數據
     * @param {string} userId - 用戶 ID
     * @returns {array} - 轉換後的卡片數組
     */
    transformToFlashcardFormat(aiData, userId) {
        const cards = [];

        for (const [termKey, termData] of Object.entries(aiData)) {
            const { cardData, quizQuestions } = termData;

            const card = {
                user_id: userId,
                category: cardData.category,
                english_term: cardData.title,
                chinese_translation: cardData.subtitle,
                abbreviation: cardData.abbreviation || '',
                description: cardData.content,
                analogy: cardData.analogy,
                level: cardData.level,
                quiz_questions: quizQuestions,
                is_public: false,
                source_daily_card_id: null
            };

            cards.push(card);
        }

        return cards;
    }

    /**
     * 生成弱點分析的 Prompt
     * @param {object} stats - 用戶統計數據
     * @returns {string} - 完整的 prompt
     */
    generateWeaknessAnalysisPrompt(stats) {
        const {
            wrongQuestionCount,
            correctQuestionCount,
            totalAnswered,
            overallAccuracy,
            masteryRate,
            masteredCount,
            remainingQuestions,
            totalQuestionsInBank,
            improvement,
            weakSubjects,
            topWeakQuestions
        } = stats;

        // 格式化弱點科目
        const weakSubjectsText = weakSubjects && weakSubjects.length > 0
            ? weakSubjects.map(s => `- ${s.subject}: 錯誤率 ${Math.round(s.errorRate * 100)}%`).join('\n')
            : '- 暫無明顯弱點科目';

        // 格式化錯題
        const topWeakQuestionsText = topWeakQuestions && topWeakQuestions.length > 0
            ? topWeakQuestions.slice(0, 5).map((q, i) =>
                `${i + 1}. 「${q.question?.substring(0, 30)}...」- 錯 ${q.timesIncorrect} 次`
            ).join('\n')
            : '- 暫無錯題記錄';

        return `你是一位可愛又專業的學習秘書 🎀，請根據以下學員數據，用**可愛秘書風格**（帶有 emoji）給出個人化的學習分析與建議。

**重要格式要求：**
1. 不要開頭打招呼，直接從「## 📊 整體表現」開始
2. 使用 Markdown 格式
3. 語氣要可愛、親切、鼓勵性質，但內容要專業有深度
4. 適當使用 emoji 增加親和力

**必須包含的段落：**
1. ## 📊 整體表現 - 用數據說明目前學習狀態
2. ## 💡 學習建議 - 2-3 個具體可行的建議
3. ## 🔍 詳細分析 - 深入分析弱點、學習模式、進步空間

---

**學員數據：**

📈 答題統計
- 總答題數：${totalAnswered} 題
- 答對：${correctQuestionCount} 題
- 答錯：${wrongQuestionCount} 題
- 整體正確率：${overallAccuracy}%

🎯 熟練度
- 已熟練題目：${masteredCount} 題
- 熟練率：${masteryRate}%
- 待熟練題目：${remainingQuestions} 題
- 題庫總題數：${totalQuestionsInBank} 題

📊 近 7 天進步
- 正確率變化：${improvement?.accuracyChange > 0 ? '+' : ''}${improvement?.accuracyChange || 0}%

⚠️ 弱點科目（依錯誤率排序）
${weakSubjectsText}

❌ 最常答錯的題目
${topWeakQuestionsText}

---

請根據以上數據，給出約 300-500 字的個人化分析。記得用可愛秘書的語氣喔～`;
    }

    /**
     * 調用 AI 生成弱點分析
     * @param {object} stats - 用戶統計數據
     * @returns {Promise<object>} - AI 生成的分析結果
     */
    async generateWeaknessAnalysis(stats) {
        try {
            console.log('開始生成 AI 弱點分析...');

            const prompt = this.generateWeaknessAnalysisPrompt(stats);

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.8,
                    max_tokens: 1500
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('OpenAI API 錯誤:', errorData);
                throw new Error(`API 請求失敗: ${response.status} - ${errorData.error?.message || '未知錯誤'}`);
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            console.log('AI 弱點分析生成完成');

            return {
                success: true,
                data: content,
                generatedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('生成弱點分析失敗:', error);
            return {
                success: false,
                error: {
                    message: error.message || '生成分析時發生錯誤',
                    details: error
                }
            };
        }
    }
}

// 建立全域實例
const aiService = new AIService();
