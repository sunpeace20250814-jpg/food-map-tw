// build-inject.js - 從 Vercel 環境變數 inject 到 frontend JS
// 觸發時機: Vercel build phase (每次 deploy 跑一次)
// 環境變數來源: Vercel dashboard 設的 SUPABASE_URL + SUPABASE_ANON_KEY

const fs = require('fs');
const path = require('path');

const BOOTSTRAP_FILE = 'assets/js/supabase/supabase-bootstrap.js';

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

const content = `// supabase-bootstrap.js - AUTO-INJECTED by build-inject.js
// Build time: ${new Date().toISOString()}
// Source: Vercel env SUPABASE_URL + SUPABASE_ANON_KEY

(function() {
    window.SUPABASE_URL = ${JSON.stringify(URL)};
    window.SUPABASE_ANON_KEY = ${JSON.stringify(KEY)};
})();
`;

fs.writeFileSync(path.join(__dirname, BOOTSTRAP_FILE), content);
console.log(`[build-inject] OK: ${BOOTSTRAP_FILE} updated (URL length: ${URL.length}, KEY length: ${KEY.length})`);