// ============================================
// error-tracker.js - 全域錯誤追蹤 (v10.8)
//   - window.onerror: 未捕捉例外
//   - unhandledrejection: 未處理 Promise rejection
//   - console.error 攔截 (包裝原方法)
//   - 設計為 Sentry / Datadog 等後端可插拔
//
// 用法：
//   <script src="assets/js/error-tracker.js" defer></script>
//   設 window.__ERROR_ENDPOINT__ = 'https://your-sentry/sink' 啟用上報
// ============================================

(function() {
    'use strict';

    // === 設定 ===
    // 如要啟用 Sentry/Datadog 上報，設：
    //   window.__ERROR_ENDPOINT__ = 'https://...';
    //   window.__ERROR_SAMPLE_RATE__ = 1.0; // 0-1
    const ENDPOINT = window.__ERROR_ENDPOINT__ || null;
    const SAMPLE_RATE = window.__ERROR_SAMPLE_RATE__ ?? 1.0;

    // === 內部佇列（避免 endpoint 未就緒時丟失事件）===
    const QUEUE = [];
    const MAX_QUEUE = 50;

    function enqueue(event) {
        if (QUEUE.length >= MAX_QUEUE) QUEUE.shift();
        QUEUE.push(event);
    }

    // === 送出（fire-and-forget，不阻擋主執行緒）===
    function send(event) {
        if (!ENDPOINT) return; // 沒設 endpoint 就只在 console 顯示
        if (Math.random() > SAMPLE_RATE) return;
        try {
            const payload = JSON.stringify({
                ...event,
                url: location.href,
                ua: navigator.userAgent,
                ts: new Date().toISOString(),
                ref: document.referrer || null
            });
            // 使用 sendBeacon 確保頁面卸載時也能送達
            if (navigator.sendBeacon) {
                navigator.sendBeacon(ENDPOINT, payload);
            } else {
                fetch(ENDPOINT, { method: 'POST', body: payload, keepalive: true }).catch(() => {});
            }
        } catch (_) { /* 錯誤追蹤本身不能再爆 */ }
    }

    // === 事件統一處理 ===
    function report(level, message, meta) {
        const event = { level, message, ...meta };
        // 1) console 輸出（開發者看得到）
        if (level === 'error') console.error('[error-tracker]', message, meta);
        else if (level === 'warn') console.warn('[error-tracker]', message, meta);
        // 2) 進佇列
        enqueue(event);
        // 3) 上報
        send(event);
    }

    // === window.onerror ===
    window.addEventListener('error', (e) => {
        report('error', e.message || 'Unknown error', {
            kind: 'uncaught',
            filename: e.filename,
            lineno: e.lineno,
            colno: e.colno,
            stack: e.error?.stack || null
        });
    });

    // === unhandledrejection ===
    window.addEventListener('unhandledrejection', (e) => {
        const reason = e.reason;
        report('error', reason?.message || String(reason) || 'Unhandled rejection', {
            kind: 'promise',
            stack: reason?.stack || null
        });
    });

    // === 攔截 console.error/warn（其他模組的錯誤也納入追蹤）===
    const origError = console.error;
    const origWarn = console.warn;
    console.error = function(...args) {
        report('error', args.map(a => typeof a === 'string' ? a : (a?.message || JSON.stringify(a))).join(' '), { kind: 'console.error' });
        origError.apply(console, args);
    };
    console.warn = function(...args) {
        report('warn', args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' '), { kind: 'console.warn' });
        origWarn.apply(console, args);
    };

    // === 暴露手動回報 API ===
    window.reportError = function(err, ctx) {
        report('error', err?.message || String(err), { kind: 'manual', context: ctx });
    };
    window.reportEvent = function(name, data) {
        report('info', name, { kind: 'event', data });
    };

    // === Debug 標記 ===
    if (window.__DEBUG__) {
        console.log('[error-tracker] initialized, endpoint:', ENDPOINT || '(console-only)');
    }
})();