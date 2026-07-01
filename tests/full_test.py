"""v9.x 全功能 7 點 Playwright 測試."""
from playwright.sync_api import sync_playwright

URL = 'http://localhost:8890'

TESTS = []

def test(name):
    def decorator(fn):
        TESTS.append((name, fn))
        return fn
    return decorator

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={'width': 390, 'height': 844})
    page = ctx.new_page()
    page.goto(f'{URL}/?cb=full-test', wait_until='networkidle')
    page.wait_for_timeout(1500)

    results = []

    def run(name, fn):
        try:
            ok, msg = fn(page)
            results.append((name, '✓' if ok else '✗', msg))
        except Exception as e:
            results.append((name, '✗', str(e)[:80]))

    @test('1. 載入 + 167 卡片')
    def t1(page):
        ok = page.evaluate('document.querySelectorAll("article.shop-card").length === 167')
        return ok, '167 cards rendered'

    @test('2. 縣市切換 (高雄→台南)')
    def t2(page):
        page.click('[data-city="tn"]')
        page.wait_for_timeout(400)
        visible = page.evaluate('''() => Array.from(document.querySelectorAll("article.shop-card")).filter(c => getComputedStyle(c).display !== "none").length''')
        return visible == 50, f'tn visible: {visible}'

    @test('3. 切回高雄')
    def t3(page):
        page.click('[data-city="kh"]')
        page.wait_for_timeout(400)
        visible = page.evaluate('''() => Array.from(document.querySelectorAll("article.shop-card")).filter(c => getComputedStyle(c).display !== "none").length''')
        return visible == 46, f'kh visible: {visible}'

    @test('4. 點卡片 → Sheet')
    def t4(page):
        page.locator('article.shop-card:visible').first.click()
        page.wait_for_timeout(400)
        ok = page.evaluate('document.getElementById("shopSheet")?.classList.contains("show")')
        return bool(ok), 'sheet shown'

    @test('5. 關 Sheet')
    def t5(page):
        page.click('.sheet-close')
        page.wait_for_timeout(400)
        ok = not page.evaluate('document.getElementById("shopSheet")?.classList.contains("show")')
        return bool(ok), 'sheet closed'

    @test('6. 主題切換')
    def t6(page):
        before = page.evaluate('document.documentElement.dataset.theme || "dark"')
        page.click('#themeToggle')
        page.wait_for_timeout(300)
        after = page.evaluate('document.documentElement.dataset.theme || "dark"')
        return before != after, f'{before} → {after}'

    @test('7. 切縣市後篩選 chip 點')
    def t7(page):
        # 點 "24hr" 篩選
        page.click('button.quick-chip:has-text("24hr")')
        page.wait_for_timeout(300)
        active = page.evaluate('''() => document.querySelectorAll("button.quick-chip.active").length''')
        return active >= 1, f'active quick-chips: {active}'

    @test('8. 縮圖點 → Album')
    def t8(page):
        # 重新整理
        page.goto(f'{URL}/?cb=album-test', wait_until='networkidle')
        page.wait_for_timeout(1500)
        page.locator('.card-photo-thumb:visible').first.click()
        page.wait_for_timeout(400)
        ok = page.evaluate('''() => {
            const v = document.getElementById("albumViewer");
            return v && v.classList.contains("show");
        }''')
        return bool(ok), 'album viewer shown'

    @test('9. Album 關閉')
    def t9(page):
        # album viewer close 按鈕
        page.click('.album-viewer-close')
        page.wait_for_timeout(400)
        ok = not page.evaluate('''() => {
            const v = document.getElementById("albumViewer");
            return v && v.classList.contains("show");
        }''')
        return bool(ok), 'album closed'

    @test('10. FAB 顯示 (滾動後)')
    def t10(page):
        page.evaluate('window.scrollTo(0, 1000)')
        page.wait_for_timeout(500)
        ok = page.evaluate('''() => {
            const fab = document.querySelector(".fab");
            return fab && fab.classList.contains("show");
        }''')
        return bool(ok), 'fab shown'

    for name, fn in TESTS:
        run(name, fn)

    print()
    print('=' * 60)
    passed = sum(1 for _, s, _ in results if s == '✓')
    print(f'  {passed}/{len(results)} 通過')
    print('=' * 60)
    for name, status, msg in results:
        print(f'  {status} {name}: {msg}')

    browser.close()