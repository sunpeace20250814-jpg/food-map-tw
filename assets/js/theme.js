// theme.js - 簡約暗黑風主題切換
// 主題: light / dark / auto (跟系統)
// 存到 localStorage

(function() {
    const STORAGE_KEY = 'food-map-tw-theme';

    function getInitialTheme() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return saved;
        // 預設 dark (用戶之前看見的暗黑風)
        return 'dark';
    }

    function applyTheme(theme) {
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        localStorage.setItem(STORAGE_KEY, theme);
        updateThemeIcon(theme);
    }

    function updateThemeIcon(theme) {
        const btn = document.getElementById('themeToggle');
        if (!btn) return;
        const icons = { light: '☀️', dark: '🌙', auto: '🌓' };
        btn.textContent = icons[theme] || '🌙';
        btn.title = '當前主題: ' + theme + ' (點擊切換)';
    }

    function cycleTheme() {
        const current = localStorage.getItem(STORAGE_KEY) || 'dark';
        const order = ['dark', 'light', 'auto'];
        const idx = order.indexOf(current);
        const next = order[(idx + 1) % order.length];
        applyTheme(next);
    }

    // 立即套用主題 (避免 FOUC)
    applyTheme(getInitialTheme());

    // DOM ready 後掛按鈕 + 系統主題監聽
    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('themeToggle');
        if (btn) {
            btn.addEventListener('click', cycleTheme);
        }
        // 系統主題變化時 (auto mode)
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            const current = localStorage.getItem(STORAGE_KEY);
            if (current === 'auto') applyTheme('auto');
        });
    });
})();