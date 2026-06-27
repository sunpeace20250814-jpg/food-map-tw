// build-inject.js - 從 Vercel 環境變數 inject 到 frontend JS
// 觸發時機: Vercel build phase (每次 deploy 跑一次)
// 環境變數來源: Vercel dashboard 設的 SUPABASE_URL + SUPABASE_ANON_KEY

const fs = require('fs');
const path = require('path');

const BOOTSTRAP_FILE = 'assets/js/supabase/supabase-bootstrap.js';
const INDEX_FILE = 'index.html';

// 只信任長度正確的 key (避免 sandbox env 污染)
// sb_publishable_... = 46 chars
// sb_secret_... = service_role 不應該暴露前端
const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_ANON_KEY;

if (!URL || !KEY) {
    console.error('[build-inject] FATAL: SUPABASE_URL 或 SUPABASE_ANON_KEY 環境變數未設定');
    console.error('  在 Vercel Dashboard > Settings > Environment Variables 設這兩個 (Production)');
    process.exit(1);
}

if (KEY.length !== 46 || !KEY.startsWith('sb_publishable_')) {
    console.error(`[build-inject] FATAL: SUPABASE_ANON_KEY 長度/格式錯誤 (got ${KEY.length} chars, expected 46, must start with sb_publishable_)`);
    process.exit(1);
}

const bootstrap = `// supabase-bootstrap.js - AUTO-INJECTED by build-inject.js
// Build time: ${new Date().toISOString()}
// Source: Vercel env SUPABASE_URL + SUPABASE_ANON_KEY

(function() {
    window.SUPABASE_URL = ${JSON.stringify(URL)};
    window.SUPABASE_ANON_KEY = ${JSON.stringify(KEY)};
})();
`;

fs.writeFileSync(path.join(__dirname, BOOTSTRAP_FILE), bootstrap);
console.log(`[build-inject] OK: ${BOOTSTRAP_FILE} updated (URL length: ${URL.length}, KEY length: ${KEY.length})`);

// Inject anon key 到 index.html meta tag (placeholder)
let html = fs.readFileSync(path.join(__dirname, INDEX_FILE), 'utf-8');
const ANON_PLACEHOLDER = '<meta name="supabase-anon-key" content="__SUPABASE_ANON_KEY__" />';
const ANON_META = `<meta name="supabase-anon-key" content="${KEY}" />`;
if (html.includes(ANON_PLACEHOLDER)) {
    html = html.replace(ANON_PLACEHOLDER, ANON_META);
} else if (!html.includes(ANON_META)) {
    // 沒 placeholder 也沒 meta → 加在 supabase-url 後
    html = html.replace(
        '<meta name="supabase-url" content="' + URL + '" />',
        '<meta name="supabase-url" content="' + URL + '" />\n<meta name="supabase-anon-key" content="' + KEY + '" />'
    );
}
fs.writeFileSync(path.join(__dirname, INDEX_FILE), html);
console.log(`[build-inject] OK: ${INDEX_FILE} meta tags updated`);