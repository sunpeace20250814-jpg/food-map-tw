"""
regen_cards.py - 從 shop_data.json 重新生成 index.html 的 <main> 與 SHOP_DATA

警告: 此腳本會覆蓋 index.html 的店家卡片區塊與 inline SHOP_DATA。
執行前請先 commit 當前狀態以便回退。
"""
import json, os, html, re, sys
from pathlib import Path

BASE = Path(r'C:\Users\sunpe\美食遊覽')
SHOP_DATA_JSON = BASE / 'assets' / 'data' / 'shop_data.json'
INDEX_HTML = BASE / 'index.html'
CARD_OUT = BASE / 'assets' / 'data' / 'shop_cards.html'


def derive_line(station: str) -> str:
    """從 station 名稱推導捷運線"""
    if not station:
        return 'red'  # 預設
    s = station.strip()
    if s.startswith('R'):
        return 'red'
    if s.startswith('O'):
        return 'orange'
    if s.startswith('C'):
        return 'lrt'
    # 處理非標準站名
    if '苓雅' in s:
        return 'orange'
    if '輕軌' in s or '美術館' in s:
        return 'lrt'
    return 'red'


def derive_attrs(s: dict) -> dict:
    """從 shop 物件的 time 標籤推導 data-late / data-22start"""
    time_str = (s.get('time') or '').strip()
    is_late = False
    is_22start = False
    if '24 小時' in time_str:
        is_late = True
    elif '即將打烊' in time_str:
        is_late = True
    elif '營業至' in time_str:
        m = re.search(r'營業至 (\d+):', time_str)
        if m:
            hh = int(m.group(1))
            # 22:00 之後、24:00(=0 隔天)、< 05:00 凌晨都算宵夜
            is_late = (hh >= 22) or (hh < 5) or (hh == 0)
    elif '下次開門' in time_str:
        m = re.search(r'下次開門 (\d+):', time_str)
        if m:
            hh = int(m.group(1))
            is_22start = hh >= 22
            is_late = is_22start or (hh < 5) or (hh == 0)
    return {'data_late': '1' if is_late else '0', 'data_22start': '1' if is_22start else '0'}


def clean_address(addr: str) -> str:
    """去掉地址開頭的 PUA 字符 (Google Maps marker)"""
    return re.sub(r'^[\ue000-\uf8ff]+', '', addr or '')


def make_card(i: int, s: dict) -> str:
    name = html.escape(s.get('name', ''))
    cat = html.escape(s.get('cat_main', ''))
    cat_sub = html.escape(s.get('cat_sub', ''))
    addr = clean_address(s.get('address', '') or s.get('addr', ''))
    addr = html.escape(addr)
    addr_short = addr[:20] + '…' if len(addr) > 20 else addr
    station = html.escape(s.get('station', ''))
    time = html.escape(s.get('time', ''))
    rating = s.get('rating', '')

    rm = re.search(r'([\d.]+)\(([\d,]+)\)', rating)
    if rm:
        star_num = rm.group(1)
        review_n = rm.group(2)
        rating_html = f'<span class="star">★</span><span class="num">{star_num}</span> <span class="num">({review_n})</span>'
    else:
        star_num = rating.replace('顆星', '').strip() or '-'
        rating_html = f'<span class="star">★</span><span class="num">{star_num}</span>'

    photos = s.get('photos', [])
    if photos:
        thumbs = photos[:3]
        more_n = max(0, len(photos) - 3)
        thumbs_html = ''.join(
            f'<div class="card-photo-thumb" data-shop-idx="{i}" data-action="album"><img src="{p_}" alt="" loading="lazy" /></div>'
            for p_ in thumbs
        )
        if more_n > 0:
            thumbs_html += f'<div class="card-photo-thumb more" data-shop-idx="{i}" data-action="album">+{more_n}</div>'
        photos_html = f'<div class="card-photo-strip">{thumbs_html}</div><button class="btn-album" data-shop-idx="{i}" data-action="album">看完整相簿 · {len(photos)} 張</button>'
    else:
        photos_html = '<div class="btn-album" style="opacity:0.4;cursor:default">暫無照片</div>'

    is_closed = s.get('closed', False)
    closed_badge = '<span class="closed-badge">歇業</span>' if is_closed else ''
    card_class = 'shop-card shop-card-closed' if is_closed else 'shop-card'

    gmaps = s.get('gmaps_url', '')

    # 動態推導的屬性
    line = derive_line(s.get('station', ''))
    attrs = derive_attrs(s)
    env = s.get('env', '')

    return f'''<article class="{card_class}" data-late="{attrs["data_late"]}" data-line="{line}" data-price="{s.get("price_bar", "")}" data-station="{station}" data-mcat="{cat}" data-env="{env}" data-22start="{attrs["data_22start"]}" data-shop-idx="{i}">
{closed_badge}
<div class="card-top">
<div class="card-title-block">
<h3 class="card-name">{name}</h3>
<div class="card-meta-line">
<span>{cat}</span>
{f'<span class="dot"></span><span>{cat_sub}</span>' if cat_sub else ''}
{f'<span class="dot"></span><span class="tag tag-mrt">{station}</span>' if station else ''}
</div>
</div>
<div class="card-right">
<button class="card-fav" aria-label="收藏">♡</button>
<div class="card-rating">{rating_html}</div>
</div>
</div>
<div class="card-info-row">
{f'<span class="tag">營業：{time}</span>' if time else ''}
</div>
{f'<div class="card-addr" title="{addr}">{addr_short}</div>' if addr else ''}
{photos_html}
<div class="card-actions">
<button class="btn btn-primary" data-shop-idx="{i}" data-action="detail">詳細</button>
<a class="btn btn-map" href="{gmaps}" target="_blank" rel="noopener">開啟 Google 地圖 ↗</a>
</div>
</article>'''


def main():
    if not SHOP_DATA_JSON.exists():
        print(f'找不到 {SHOP_DATA_JSON}', file=sys.stderr)
        sys.exit(1)
    with open(SHOP_DATA_JSON, 'r', encoding='utf-8') as f:
        shops = json.load(f)

    # 去重: 用 name 去重,保留第一個出現的
    seen = set()
    unique_shops = []
    for s in shops:
        nm = s.get('name', '').strip()
        if nm in seen:
            print(f'  跳過重複: {nm}')
            continue
        seen.add(nm)
        unique_shops.append(s)
    if len(unique_shops) != len(shops):
        print(f'去重: {len(shops)} → {len(unique_shops)}')
        shops = unique_shops

    # 1) 產生 shop_cards.html
    cards_html = '\n'.join(make_card(i, s) for i, s in enumerate(shops))
    with open(CARD_OUT, 'w', encoding='utf-8') as f:
        f.write(cards_html)
    print(f'已寫入 {CARD_OUT} ({len(shops)} 卡片)')

    # 2) 更新 index.html
    if not INDEX_HTML.exists():
        print(f'找不到 {INDEX_HTML}', file=sys.stderr)
        sys.exit(1)

    with open(INDEX_HTML, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # 替換 <main>
    main_re = re.compile(r'<main class="shop-list"[^>]*>.*?</main>', re.DOTALL)
    new_main = '<main class="shop-list" id="shopList">\n' + cards_html + '\n</main>'
    html_content, n1 = main_re.subn(new_main, html_content)
    if n1 != 1:
        print(f'警告: <main> 替換 {n1} 次', file=sys.stderr)

    # 替換 SHOP_DATA_INITIAL (用深度匹配避免上次的 bug)
    si = html_content.index('window.SHOP_DATA_INITIAL = [')
    data_start = si + len('window.SHOP_DATA_INITIAL = ') - 1
    depth = 0; in_str = False; escape_next = False; end_idx = -1
    for j in range(data_start, len(html_content)):
        ch = html_content[j]
        if in_str:
            if escape_next: escape_next = False
            elif ch == chr(92): escape_next = True
            elif ch == '"': in_str = False
            continue
        if ch == '"': in_str = True
        elif ch == '[': depth += 1
        elif ch == ']':
            depth -= 1
            if depth == 0: end_idx = j + 1; break
    semi_idx = html_content.find(';', end_idx)
    repl_end = semi_idx + 1
    new_data_str = json.dumps(shops, ensure_ascii=False, separators=(',', ':'))
    new_block = 'window.SHOP_DATA_INITIAL = ' + new_data_str + ';'
    html_content = html_content[:si] + new_block + html_content[repl_end:]

    # 更新店家總數文字
    html_content = re.sub(r'\d+ 家精選', f'{len(shops)} 家精選', html_content)
    html_content = re.sub(r'id="resultCount">\d+', f'id="resultCount">{len(shops)}', html_content)

    with open(INDEX_HTML, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f'已更新 {INDEX_HTML} ({os.path.getsize(INDEX_HTML)} chars)')


if __name__ == '__main__':
    main()
