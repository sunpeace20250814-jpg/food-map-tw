"""
v9.0-code-supervisor
代碼監督 agent: 檢視 JS/CSS/HTML 潛在問題 (a11y, 性能, XSS, 錯誤處理)

用法: python3 data/agents/code_supervisor.py
"""
import re
import json
from pathlib import Path

REPO = Path(r'C:\Users\sunpe\美食遊覽')

FILES = {
    'html': REPO / 'index.html',
    'css': REPO / 'assets' / 'css' / 'app.css',
    'shop_loader': REPO / 'assets' / 'js' / 'supabase' / 'shop-loader.js',
    'app_js': REPO / 'assets' / 'js' / 'app.js',
}

def check_html():
    issues = []
    suggestions = []
    html = FILES['html'].read_text(encoding='utf-8')

    # 1. 沒有 alt 的 img
    imgs = re.findall(r'<img[^>]*>', html)
    no_alt = [m for m in imgs if 'alt=""' not in m and 'alt=' not in m]
    if no_alt:
        issues.append(f'圖片無 alt: {len(no_alt)}/{len(imgs)} 個')

    # 2. 內嵌 script (XSS 風險低, 但檢查有沒有 alert/prompt)
    if 'window.alert' in html or 'window.confirm' in html:
        issues.append('發現 alert/confirm (違反 check.sh Gate 3)')

    # 3. 內嵌 secret
    if re.search(r'sb_[a-z]+_[A-Za-z0-9_]{20,}', html):
        issues.append('內嵌 Supabase key (應放 env)')

    # 4. 內嵌資料大小
    if len(html) > 700_000:
        suggestions.append(f'HTML 大小 {len(html)//1024}KB (建議拆 lazy load)')

    # 5. async/defer script
    scripts = re.findall(r'<script[^>]*>', html)
    no_async = [s for s in scripts if 'src=' in s and 'async' not in s and 'defer' not in s and 'type="module"' not in s]
    if no_async:
        suggestions.append(f'{len(no_async)} 個外部 script 沒 async/defer (阻塞 render)')

    return issues, suggestions

def check_css():
    issues = []
    suggestions = []
    css = FILES['css'].read_text(encoding='utf-8')

    # 1. 圖片無 lazy
    # (CSS 不直接處理 img)

    # 2. 大量 transition 重複
    transitions = re.findall(r'transition:\s*([^;]+);', css)
    long_trans = [t for t in transitions if '0.4s' in t or '0.5s' in t]
    if len(long_trans) > 5:
        suggestions.append(f'{len(long_trans)} 個 transition > 0.4s (可能卡頓)')

    # 3. !important 使用
    important_count = css.count('!important')
    if important_count > 10:
        issues.append(f'!important 用了 {important_count} 次 (避免高耦合)')

    # 4. 動畫無限 loop
    infinite = re.findall(r'@keyframes\s+(\w+)', css)
    for kf in infinite:
        usages = re.findall(rf'animation:[^;]*\b{kf}\b', css)
        for u in usages:
            if 'infinite' in u:
                suggestions.append(f'動畫 {kf} infinite (省電模式應關掉)')

    # 5. unused class (在 CSS 但 HTML 沒用)
    defined = set(m.group(1) for m in re.finditer(r'\.([a-z][a-z0-9_-]+)\s*[{,:]', css))
    html = FILES['html'].read_text(encoding='utf-8')
    html_used = set()
    for m in re.finditer(r'class="([^"]+)"', html):
        for c in m.group(1).split():
            html_used.add(c)
    unused = defined - html_used - {'no-js'}  # 排除通用
    if len(unused) > 20:
        suggestions.append(f'{len(unused)} 個 CSS class 未被 HTML 使用')

    # 6. CSS file size
    size_kb = len(css) // 1024
    if size_kb > 30:
        suggestions.append(f'CSS 大小 {size_kb}KB')

    return issues, suggestions

def check_shop_loader_js():
    issues = []
    suggestions = []
    js = FILES['shop_loader'].read_text(encoding='utf-8')

    # 1. innerHTML 使用 (XSS)
    innerhtml = js.count('.innerHTML')
    if innerhtml > 5:
        suggestions.append(f'innerHTML 用 {innerhtml} 次 (盡量 DOM API)')

    # 2. addEventListener 沒清理 (memory leak)
    if 'addEventListener' in js and 'removeEventListener' not in js:
        suggestions.append('addEventListener 沒 cleanup (換頁可能 leak)')

    # 3. 同步 fetch (沒用 await)
    if 'fetch(' in js and 'async' not in js:
        issues.append('有 fetch 但沒 async/await')

    # 4. console.log 殘留
    if js.count('console.log') > 0:
        suggestions.append(f'console.log {js.count("console.log")} 個 (生產應移除)')

    # 5. eval 使用
    if 'eval(' in js:
        issues.append('使用 eval (危險)')

    # 6. 函式複雜度 (if 嵌套)
    if js.count('if (') > 30:
        suggestions.append(f'if 條件 {js.count("if (")} 個 (過多複雜度)')

    # 7. onclick inline (a11y + 維護)
    onclick = js.count('onclick=')
    if onclick > 0:
        suggestions.append(f'HTML inline onclick {onclick} 次 (改 addEventListener)')

    # 8. 錯誤處理
    if 'try {' not in js and 'catch' not in js:
        issues.append('無 try/catch 錯誤處理')

    return issues, suggestions

def check_app_js():
    issues = []
    suggestions = []
    js = FILES['app_js'].read_text(encoding='utf-8')

    # 大小
    size_kb = len(js) // 1024
    if size_kb > 25:
        suggestions.append(f'app.js {size_kb}KB (建議模組化)')

    # deprecated
    if 'window.event' in js:
        suggestions.append('window.event (deprecated)')

    return issues, suggestions

def main():
    print('=' * 60)
    print('  v9.0 CODE SUPERVISOR')
    print('=' * 60)

    total_issues = 0
    total_sugg = 0

    sections = [
        ('HTML', check_html),
        ('CSS', check_css),
        ('shop-loader.js', check_shop_loader_js),
        ('app.js', check_app_js),
    ]

    for name, fn in sections:
        print(f'\n[{name}]')
        issues, suggestions = fn()
        for i in issues:
            print(f'  ✗ {i}')
            total_issues += 1
        for s in suggestions:
            print(f'  ℹ  {s}')
            total_sugg += 1
        if not issues and not suggestions:
            print('  ✓ 無問題')

    print('\n' + '=' * 60)
    if total_issues == 0:
        print(f'  ✓ 無嚴重問題 (待修: {total_sugg})')
    else:
        print(f'  ⚠️  {total_issues} 個問題, {total_sugg} 個建議')
    print('=' * 60)

    return {
        'issues_count': total_issues,
        'suggestions_count': total_sugg,
    }

if __name__ == '__main__':
    main()