/**
 * js/theme-config.js
 * 全站共用 Tailwind CSS 主題設定
 * 所有 HTML 檔案只需引入此檔，即可共享完整的設計語言。
 *
 * 依賴：design-tokens.css（需先於 Tailwind CDN 前載入）
 */
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                // ── 品牌色 ─────────────────────────────────────
                "primary": "var(--color-primary)",
                // ── 背景 ───────────────────────────────────────
                "background-light": "var(--color-bg-light)",
                "background-dark": "var(--color-bg-dark)",
                "surface": "var(--color-surface)",
                // ── 文字 ───────────────────────────────────────
                "text-base": "var(--color-text-base)",
                "brutal-black": "#000000",
                "brutal-white": "#ffffff",
                // ── 邊框 ───────────────────────────────────────
                "border-main": "var(--color-border-main)",
                // ── 狀態色 ─────────────────────────────────────
                "danger": "var(--color-danger)",
                "success": "var(--color-success)",
                "warning": "var(--color-warning)",
            },
            fontFamily: {
                "display": ["Space Grotesk", "Noto Sans TC", "sans-serif"],
            },
            borderRadius: {
                "DEFAULT": "0.125rem",
                "lg": "0.25rem",
                "xl": "0.5rem",
                "full": "0.75rem",
            },
        },
    },
};
