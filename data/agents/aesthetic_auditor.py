"""
v9.0-aesthetic-auditor
審查 v9.0 科幻未來風 UI 設計, 檢視美學/可讀性/一致性/a11y

用法:
  python3 data/agents/aesthetic_auditor.py [--url URL] [--viewport mobile|desktop]
  或用 execute_code 內嵌呼叫

回報:
- 設計 token 使用率
- 字體一致性
- 色彩對比 (a11y)
- 切角 clip-path 使用一致性
- 動畫/效果
- 待修問題清單
"""
import sys
import json
import time
import re
from pathlib import Path

REPO = Path(r'C:\Users\sunpe\美食遊覽')
CSS = REPO / 'assets' / 'css' / 'app.css'

DESIGN_TOKENS = {
    'colors': {
        'cyan': '#00f0ff',
        'purple': '#b829ff',
        'pink': '#ff007a',
        'ok': '#00ff88',
        'warn': '#ffcc00',
        'err': '#ff0055',
        'bg-0': '#000010',
        'bg-1': '#0a0a1a',
        'bg-2': '#12122a',
    },
    'fonts': ['Orbitron', 'JetBrains Mono', 'system-ui', 'monospace'],
    'effects': ['clip-path', 'backdrop-filter', 'box-shadow', 'linear-gradient', 'text-shadow'],
}

def load_css():
    with open(CSS, 'r', encoding='utf-8') as f:
        return f.read()

def check_color_contrast():
    """檢查文字 vs 背景對比度 (WCAG AA: 4.5, AAA: 7)"""
    issues = []
    pairs = [
        ('#e0f0ff', '#000010', 'text on bg-0'),
        ('#8aa0c0', '#000010', 'text-2 on bg-0'),
        ('#506080', '#000010', 'text-muted on bg-0'),
        ('#00f0ff', '#000010', 'cyan on bg-0'),
        ('#b829ff', '#000010', 'purple on bg-0'),
        ('#00ff88', '#000010', 'ok on bg-0'),
        ('#ff0055', '#000010', 'err on bg-0'),
        ('#000010', '#00f0ff', 'bg-0 on cyan'),
    ]
    def luminance(hex):
        h = hex.lstrip('#')
        r, g, b = (int(h[i:i+2], 16) / 255 for i in (0, 2, 4))
        def c(v): return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
        return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b)
    def ratio(a, b):
        L1, L2 = sorted([luminance(a), luminance(b)], reverse=True)
        return (L1 + 0.05) / (L2 + 0.05)
    results = []
    for fg, bg, desc in pairs:
        r = ratio(fg, bg)
        aa_pass = r >= 4.5
        aaa_pass = r >= 7
        results.append({'fg': fg, 'bg': bg, 'desc': desc, 'ratio': round(r, 2), 'AA': aa_pass, 'AAA': aaa_pass})
        if not aa_pass:
            issues.append(f'{desc}: {round(r,2)}:1 (需 ≥ 4.5 AA)')
    return results, issues

def check_css_consistency(css):
    """檢查 CSS 一致性"""
    issues = []
    # 統計設計 token 使用
    tokens = {
        'cyan': len(re.findall(r'#00f0ff|var\(--cyan\)', css)),
        'purple': len(re.findall(r'#b829ff|var\(--purple\)', css)),
        'border-radius: 4px': len(re.findall(r'border-radius:\s*4px', css)),
        'clip-path:': len(re.findall(r'clip-path:', css)),
        'backdrop-filter:': len(re.findall(r'backdrop-filter:', css)),
        '@keyframes': len(re.findall(r'@keyframes', css)),
        'transition:': len(re.findall(r'transition:', css)),
    }
    # 檢查不一致的 border-radius (除 999px 全圓)
    radii = re.findall(r'border-radius:\s*(\d+)px', css)
    unique_radii = sorted(set(radii))
    if len(unique_radii) > 3:
        issues.append(f'過多 border-radius 變化: {unique_radii} (應 ≤ 3 種)')
    # 檢查空 font-family fallback
    fonts = re.findall(r'font-family:\s*([^;]+);', css)
    fallback = ['Orbitron', 'JetBrains', 'system-ui', 'sans-serif', 'monospace', 'var(--font']
    for f in fonts:
        if not any(t in f for t in fallback):
            issues.append(f'可疑 font-family: {f[:60]}')
    # 檢查 transition 時間
    times = re.findall(r'transition:[^;]*?(\d+)ms', css)
    return tokens, issues, unique_radii

def check_html_class_consistency():
    """檢查 HTML class 名 vs CSS class 名"""
    with open(REPO / 'index.html', 'r', encoding='utf-8') as f:
        html = f.read()
    classes_used = set()
    for m in re.finditer(r'class="([^"]+)"', html):
        for c in m.group(1).split():
            classes_used.add(c)
    with open(CSS, 'r', encoding='utf-8') as f:
        css = f.read()
    classes_defined = set(m.group(1) for m in re.finditer(r'\.([a-z][a-z0-9_-]+)\s*[{,]', css))
    used_no_def = classes_used - classes_defined
    # 過濾掉 vendor / 動態 / js-only
    used_no_def = {c for c in used_no_def if not c.startswith('js-') and 'active' not in c}
    return classes_used, classes_defined, used_no_def

def main():
    print('=' * 60)
    print('  v9.0 AESTHETIC AUDITOR')
    print('=' * 60)

    css = load_css()

    # 1. 色彩對比
    print('\n[1] 色彩對比 (WCAG AA = 4.5, AAA = 7)')
    results, contrast_issues = check_color_contrast()
    for r in results:
        flag = '✓' if r['AA'] else '✗'
        print(f'  {flag} {r["desc"]:<25} {r["ratio"]}:1 (AA)')
    if contrast_issues:
        print('\n  ⚠️  對比度問題:')
        for i in contrast_issues:
            print(f'    - {i}')

    # 2. CSS 一致性
    print('\n[2] CSS 一致性')
    tokens, css_issues, radii = check_css_consistency(css)
    print(f'  Token 使用:')
    for k, v in tokens.items():
        print(f'    {k:<22} {v}')
    print(f'  Border-radius: {radii}')
    if css_issues:
        print('\n  ⚠️  CSS 問題:')
        for i in css_issues:
            print(f'    - {i}')

    # 3. HTML/CSS class 一致
    print('\n[3] HTML vs CSS class 一致性')
    used, defined, missing = check_html_class_consistency()
    print(f'  HTML 使用: {len(used)} unique')
    print(f'  CSS 定義: {len(defined)} unique')
    if missing:
        print(f'  ⚠️  HTML 用但 CSS 未定義 ({len(missing)}):')
        for m in sorted(missing)[:10]:
            print(f'    - {m}')

    # 4. 總結
    print('\n' + '=' * 60)
    total = len(contrast_issues) + len(css_issues) + len(missing)
    if total == 0:
        print('  ✓ 全部通過')
    else:
        print(f'  ⚠️  發現 {total} 個問題')
    print('=' * 60)

    return {
        'contrast': results,
        'tokens': tokens,
        'css_issues': css_issues,
        'class_missing': list(missing),
        'total_issues': total,
    }

if __name__ == '__main__':
    main()