"""Static site generator for the Halman Thompson rebuild.
Reads content.json (from extract.py) and writes out/ with flat pages, site.css and img/."""
import json, os, re, sys, shutil, html as H
from urllib.parse import urlparse
from PIL import Image

BUILD = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BUILD, 'out')
SRCIMG = '/mnt/project-files/halman-thompson-site/assets/images/'
C = json.load(open(os.path.join(BUILD, 'content.json')))
P = {p['slug']: p for p in C}
EXTRA = {}
if os.path.exists(os.path.join(BUILD, 'extra.json')):
    EXTRA = json.load(open(os.path.join(BUILD, 'extra.json')))
    for p in EXTRA.get('pages', []):
        P[p['slug']] = p

esc = lambda s: H.escape(s or '', quote=True)
PHONE = '0191 250 9853'
EMAIL = 'sales@halmanthompson.com'
ADDRESS = 'Newburn Industrial Estate, 26–29 Shelley Road, Newcastle upon Tyne NE15 9RT'

# ---------------- images ----------------
USED = {}
_VALID = {}
def valid(src):
    if not src: return False
    if src not in _VALID:
        try:
            with Image.open(SRCIMG + src) as im: im.verify()
            _VALID[src] = True
        except Exception:
            _VALID[src] = False
    return _VALID[src]
def img(src, w=1600):
    if not valid(src): return None
    stem = os.path.splitext(src)[0]
    stem = re.sub(r'-\d+x\d+$', '', stem)
    stem = re.sub(r'[^a-zA-Z0-9_-]+', '-', stem).strip('-').lower()[:70]
    name = stem + '.webp'
    if name not in USED or USED[name][1] < w:
        USED[name] = (src, w)
    return 'img/' + name

def process_images():
    os.makedirs(OUT + '/img', exist_ok=True)
    n = 0
    for name, (src, w) in USED.items():
        dst = OUT + '/img/' + name
        if os.path.exists(dst): continue
        try:
            im = Image.open(SRCIMG + src)
            im = im.convert('RGB')
            if im.width > w:
                im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
            im.save(dst, 'WEBP', quality=74, method=5)
            n += 1
        except Exception as e:
            print('img fail', src, e)
    return n

def imgtag(src, alt='', w=1600, cls='', eager=False, sizes=None):
    u = img(src, w)
    if not u: return ''
    return f'<img src="{u}" alt="{esc(alt)}"{" class=%s" % chr(34)+cls+chr(34) if cls else ""} loading="{"eager" if eager else "lazy"}" decoding="async">'

# ---------------- finishes ----------------
FINISH_ORDER = [
 # (slug, name, metal, symbol, descriptor override)
 ('finish__antique-brass','Antique Brass','Brass'),
 ('finish__berkshire-bronzed-brass','Berkshire Bronzed Brass','Brass'),
 ('finish__somerset-finish','Somerset Finish','Brass'),
 ('finish__natural-brass-2','Natural Brass','Brass'),
 ('finish__antique-brushed-brass','Antique Brushed Brass','Brass'),
 ('finish__wiltshire-finish','Wiltshire Finish','Brass'),
 ('finish__cambridgeshire-finish','Cambridgeshire Finish','Brass'),
 ('finish__northumberland-finish','Northumberland Finish','Copper'),
 ('finish__antique-burnished-copper','Antique Burnished Copper','Copper'),
 ('finish__ayrshire-finish','Ayrshire Finish','Copper'),
 ('finish__cheshire-finish','Cheshire Finish','Copper'),
 ('finish__hertfordshire-finish','Hertfordshire Finish','Copper'),
 ('finish__natural-copper','Natural Copper','Copper'),
 ('finish__brushed-copper','Brushed Copper','Copper'),
 ('finish__lightly-burnished-copper','Lightly Burnished Copper','Copper'),
 ('finish__antique-brushed-copper','Antique Brushed Copper','Copper'),
 ('finish__lightly-aged-zinc','Lightly Aged Zinc','Zinc'),
 ('finish__antique-zinc','Antique Zinc','Zinc'),
 ('finish__blackened-steel','Blackened Steel','Zinc'),
 ('finish__weathered-corten','Weathered Corten','Zinc'),
 ('product__blackened-corton','Blackened Corten','Zinc'),
]
SYM = {'Brass':'CuZn','Copper':'Cu','Zinc':'Zn','Steel':'Fe'}
GROUPS = [('Brass','Brass','CuZn','An alloy of copper and zinc. Warm gold through to deep bronzed browns.'),
          ('Copper','Copper','Cu','From bright natural copper to heavy verdigris.'),
          ('Zinc','Zinc and steel','Zn · Fe','Soft zinc greys, blackened steel and weathered corten.')]
SHORT = {  # short descriptors; from the scraped finish pages and sample listings
 'finish__northumberland-finish':'Aged copper with verdigris','finish__somerset-finish':'Stained glass brass',
 'finish__ayrshire-finish':'With specks of verdigris','finish__cheshire-finish':'Aged copper',
 'finish__hertfordshire-finish':'Aged copper','finish__wiltshire-finish':'Aged brass',
 'finish__cambridgeshire-finish':'Brushed brass','finish__antique-brass':'Darker, more intense brass',
 'finish__berkshire-bronzed-brass':'Lightly burnished, bronzed','finish__natural-brass-2':'Bright, lacquered brass',
 'finish__antique-brushed-brass':'Golden-brown, brushed','finish__antique-burnished-copper':'Burnished, deep tones',
 'finish__natural-copper':'The original natural copper','finish__brushed-copper':'Bright, brushed copper',
 'finish__lightly-burnished-copper':'Lightly aged antique copper','finish__antique-brushed-copper':'Brushed, aged copper',
 'finish__lightly-aged-zinc':'Delicate grey patina','finish__antique-zinc':'Deep burnished zinc',
 'finish__blackened-steel':'Deep, dark steel','finish__weathered-corten':'Rust-orange weathering steel',
 'product__blackened-corton':'Darkened weathering steel'}
FIN = []
count = {}
for slug, name, metal in FINISH_ORDER:
    p = P.get(slug)
    sym = 'Fe' if ('steel' in name.lower() or 'corten' in name.lower()) else SYM[metal]
    count[sym] = count.get(sym, 0) + 1
    swatch = None
    if p:
        swatch = next((b['src'] for b in p['blocks'] if b['t'] == 'img'), None)
    if slug == 'product__blackened-corton': swatch = '4.-Blackened-Corten.jpeg'
    FIN.append(dict(slug=slug, name=name, metal=metal, sym=sym, num=count[sym], swatch=swatch, desc=SHORT.get(slug, ''),
                    href=(slug + '.html') if slug.startswith('finish__') else 'product__blackened-corton.html'))
FIN_BY = {f['slug']: f for f in FIN}
def tag(sym, num=None):
    return f'<span class="tag" aria-label="{ {"CuZn":"Brass","Cu":"Copper","Zn":"Zinc","Fe":"Steel"}[sym] }{(" number "+str(num)) if num else ""}"><b>{sym}</b>{("%02d" % num) if num else ""}</span>'
def ftag(f): return tag(f['sym'], f['num'])

def swatch_tile(f, w=700):
    return (f'<a class="sw" href="{f["href"]}"><div class="ph">{imgtag(f["swatch"], f["name"] + " finish sample", w)}</div>'
            f'<div class="row">{ftag(f)}</div><div class="nm">{esc(f["name"])}</div><div class="ds">{esc(f["desc"])}</div></a>')

def wall(groups=None, limit=None):
    out = []
    for key, title, sym, blurb in GROUPS:
        if groups and key not in groups: continue
        fs = [f for f in FIN if f['metal'] == key][:limit] if limit else [f for f in FIN if f['metal'] == key]
        out.append(f'<div class="wall-group" id="{key.lower()}"><div class="wall-head"><h3 class="d4">{title}</h3><span class="label">{sym} · {len([f for f in FIN if f["metal"]==key])} finishes</span></div>'
                   f'<div class="wall" style="--n:{max(len(fs),5)}">{"".join(swatch_tile(f) for f in fs)}</div></div>')
    return ''.join(out)

# ---------------- links ----------------
PATHMAP = {}
for p in P.values():
    PATHMAP[p['path'].rstrip('/') or '/'] = p['slug']
SPECIAL = {'/': 'index', '/samples': 'samples', '/finishes': 'finishes', '/products': 'products', '/shop': 'shop',
           '/our-work': 'our-work', '/bespoke': 'bespoke', '/about': 'about', '/contact-us': 'contact-us', '/blog': 'journal',
           '/journal': 'journal', '/bespoke-quote': 'bespoke', '/bespoke-quote-for-businesses': 'bespoke-quote-for-businesses',
           '/gallery': 'our-work', '/aged-metal-care-guide': 'aged-metal-care-guide'}
def link(href):
    if not href: return '#'
    if href.startswith(('tel:', 'mailto:', '#')): return href
    u = urlparse(href)
    if u.netloc and 'halmanthompson.com' not in u.netloc: return href
    path = (u.path or '/').rstrip('/') or '/'
    if path in SPECIAL: return SPECIAL[path] + '.html' + (('#' + u.fragment) if u.fragment and u.fragment not in ('quote',) else '')
    if path in PATHMAP: return PATHMAP[path] + '.html'
    if path.startswith('/product-category/') or path.startswith('/product-tag/'): return 'shop.html'
    if path.startswith('/finish/'): return 'finishes.html#' + path.split('/')[-1]
    if path.startswith('/product/'): return 'shop.html'
    if path.startswith('/category/'): return 'journal.html'
    return 'products.html'

# ---------------- shell ----------------
NAV = [('finishes', 'Finishes'), ('samples', 'Samples'), ('products', 'Products'), ('shop', 'Shop'),
       ('our-work', 'Our work'), ('bespoke', 'Bespoke'), ('about', 'About'), ('journal', 'Journal')]
FONTS = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'

def head(title, desc, fragment=False):
    t = f'<title>{esc(title)}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
    t += f'<meta name="description" content="{esc(desc)}">\n' if desc else ''
    t += f'<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n<link rel="stylesheet" href="{FONTS}">\n<link rel="stylesheet" href="site.css">\n<link rel="icon" href="brand/ht-icon.svg">\n'
    if fragment: return t
    return ('<!doctype html>\n<html lang="en-GB">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + t + '</head>\n<body>\n')

def header(active):
    nav = ''.join(f'<a href="{k}.html"{" aria-current=page" if k == active else ""}>{v}</a>' for k, v in NAV)
    panel = ''.join(f'<a href="{k}.html">{v}</a>' for k, v in NAV)
    return f'''<a class="skip" href="#main">Skip to content</a>
<div class="top"><div class="wrap"><span>Hand-finished in Newcastle upon Tyne</span><span>Samples from £26.34 · UK-made, shipped worldwide</span><span><a href="tel:01912509853">{PHONE}</a></span></div></div>
<header class="hdr"><div class="wrap">
<a class="brand" href="index.html"><img src="brand/halman-logo.svg" alt="Halman Thompson, bespoke metal creations" width="177" height="54"></a>
<nav class="nav" aria-label="Main">{nav}</nav>
<a class="btn btn-v" href="samples.html">Order samples</a>
<details class="menu"><summary>Menu</summary><div class="panel">{panel}<a class="btn btn-v" href="samples.html">Order samples</a></div></details>
</div></header>
<main id="main">'''

def cta_band():
    return f'''<section class="steel split">
<div class="im">{imgtag("Patina-Brass-Sheet-for-Shelf-Display-scaled.jpg", "Plum sitting room with aged brass lining the shelving alcove", 1600)}</div>
<div class="tx"><img class="mono-mark" src="brand/ht-icon-white.svg" alt="" width="44" height="55"><span class="label" style="color:var(--verdigris-light)">Bespoke quote</span>
<h2 class="d2">If you can dream it, we&rsquo;ll make it.</h2>
<p class="lede">Bars, balustrades, staircases, worktops, cladding and pieces that don&rsquo;t have a name yet. Our designers and craftspeople work in brass, copper, zinc and steel, and alongside wood.</p>
<div class="btnrow"><a class="btn btn-v" href="bespoke.html">Get a bespoke quote</a><a class="btn" href="samples.html">Order samples first</a></div>
</div></section>'''

def footer():
    return f'''</main>
<footer class="ftr band"><div class="wrap">
<div class="g7">
<div class="rail" style="display:grid;gap:20px;align-content:start"><img class="flogo" src="brand/halman-logo-light.svg" alt="Halman Thompson" width="220" height="67"><p>Bespoke brass, copper, zinc and steel, aged by hand and made to order in Newcastle upon Tyne.</p><div class="tagstack">{tag("CuZn")}{tag("Cu")}{tag("Zn")}{tag("Fe")}</div></div>
<div class="fcols">
<div><p class="label" style="margin-bottom:14px;color:var(--verdigris-light)">Workshop</p><p>{ADDRESS}</p><p style="margin-top:12px" class="mono">{PHONE}<br>{EMAIL}</p></div>
<div><p class="label" style="margin-bottom:14px;color:var(--verdigris-light)">Explore</p><ul><li><a href="finishes.html">Finishes</a></li><li><a href="samples.html">Samples</a></li><li><a href="products.html">Products</a></li><li><a href="shop.html">Shop</a></li><li><a href="our-work.html">Our work</a></li><li><a href="journal.html">Journal</a></li></ul></div>
<div><p class="label" style="margin-bottom:14px;color:var(--verdigris-light)">Help</p><ul><li><a href="aged-metal-care-guide.html">Care guide</a></li><li><a href="delivery.html">Delivery</a></li><li><a href="returns.html">Returns</a></li><li><a href="terms-and-conditions.html">Terms and conditions</a></li><li><a href="privacy-policy.html">Privacy policy</a></li><li><a href="contact-us.html">Contact us</a></li></ul></div>
</div></div>
<div class="fbase"><span>© Halman Thompson</span><span>UK-made · International delivery available</span></div>
</div></footer>
<script src="site.js"></script>
'''

PAGES = {}
BANNERS = {'finishes': 'Berkshire-Bronzed-Kitchen-Splashback-scaled.png', 'samples': 'navy.jpg',
           'products': 'The-Publisher-Hotel-Aged-Brass-Reception-Desk-scaled.jpg', 'shop': 'metal-coasters-somerset-2048x1365.jpg',
           'our-work': 'Tattersalls009-1-2048x1356.jpg', 'journal': 'Decorative-Copper-Sheet-Behind-Wine-Rack-scaled.jpg',
           'about': 'Aged-Copper-Kitchen-Counter-Top-scaled.jpg', 'bespoke': 'Aged-Brass-Sheet-as-Cupboard-Decoration-scaled.jpg',
           'contact-us': 'Copper-Backsplash-Behind-Hob-Burners-in-White-Kitchen-2048x1356.jpg', 'bespoke-quote-for-businesses': 'The-Publisher-Hotel-Aged-Brass-Reception-Desk-scaled.jpg'}
def page(slug, title, desc, active, body, fragment=False):
    if slug in BANNERS and '<section class="ph-head">' in body:
        body = body.replace('<section class="ph-head">', f'<section class="ph-head ph-banner" style="--bg:url({img(BANNERS[slug], 2200)})">', 1)
    doc = head(title, desc, fragment) + header(active) + body + footer() + ('' if fragment else '</body>\n</html>\n')
    PAGES[slug] = doc

# ---------------- content helpers ----------------
STOP_TEXT = ('Create something extraordinary',)
JUNK = re.compile(r'^(" \* " indicates required fields|Notifications|Terrain|Labels|Reviews \(0\)|There are no reviews yet\.|Add to basket|Select options|Read more)$')
def clean_blocks(p):
    out = []
    for b in p['blocks']:
        t = b.get('text', '')
        if b['t'] in ('h4', 'h5', 'h6', 'h3', 'h2') and t in STOP_TEXT: break
        if b['t'] == 'embed': continue
        if t and JUNK.match(t): continue
        if b['t'] == 'img' and re.search(r'(icon|logo)', b['src'], re.I): continue
        if b['t'] == 'cta' and re.match(r'(Buy now • Pay with Link|Need help\? Call us)', t): continue
        if b['t'] == 'p' and re.match(r'^by Halman \|', t): continue
        out.append(b)
    # drop a trailing "Bespoke quote" block (we add our own band)
    for i, b in enumerate(out):
        if b['t'] in ('h5', 'h6') and b.get('text', '').lower() == 'bespoke quote' and i > 3:
            out = out[:i]; break
    return out

def h1_of(p, blocks):
    h = next((b['text'] for b in blocks if b['t'] == 'h1'), None)
    return h or (p['title'] or '').split(' | ')[0].split(' - ')[0]

def nice_title(t):
    t = (t or '').replace(' - Halman Thompson', '').replace(' | Halman Thompson', '')
    return t

def render_blocks(blocks):
    """Render a flat list of blocks into prose html. img+li pairs become tiles."""
    out = []; i = 0; ul = []
    def flush():
        nonlocal ul
        if ul: out.append('<ul>' + ''.join(ul) + '</ul>'); ul = []
    tiles = []
    def flush_tiles():
        nonlocal tiles
        if tiles:
            out.append('<div class="tiles t3" style="margin-block:12px">' + ''.join(tiles) + '</div>'); tiles = []
    while i < len(blocks):
        b = blocks[i]; t = b['t']
        if t == 'img' and i + 1 < len(blocks) and blocks[i + 1]['t'] == 'li':
            flush()
            li = blocks[i + 1]
            href = link(li.get('href')) if li.get('href') else None
            name = re.sub(r'\s+(View all|View finish|Select options|Add to basket).*$', '', li['text'])
            m = re.search(r'(From )?£\s?[\d,]+\.\d\d.*?$', name)
            price = ''
            if m: price = m.group(0).replace('£ ', '£'); name = name[:m.start()].strip()
            inner = f'<div class="ph">{imgtag(b["src"], name, 900)}</div><div class="nm">{esc(name)}</div>' + (f'<div class="pr">{esc(price)}</div>' if price else '')
            tiles.append(f'<a class="tile" href="{href}">{inner}</a>' if href else f'<div class="tile">{inner}</div>')
            i += 2; continue
        flush_tiles()
        if t == 'li':
            txt = esc(b['text'])
            if b.get('href'): txt = f'<a href="{link(b["href"])}">{txt}</a>'
            ul.append(f'<li>{txt}</li>'); i += 1; continue
        flush()
        if t == 'p':
            txt = b['text']
            if b.get('href'): out.append(f'<p><a href="{link(b["href"])}">{esc(txt)}</a></p>')
            else: out.append(f'<p>{esc(txt)}</p>')
        elif t in ('h2', 'h3', 'h4'):
            out.append(f'<{t}>{esc(b["text"])}</{t}>')
        elif t in ('h5', 'h6'):
            out.append(f'<p class="label">{esc(b["text"])}</p>')
        elif t == 'blockquote':
            out.append(f'<blockquote>{esc(b["text"])}</blockquote>')
        elif t == 'img':
            out.append(f'<figure>{imgtag(b["src"], b.get("alt", ""), 1400)}</figure>')
        elif t == 'cta':
            out.append(f'<p><a class="btn" href="{link(b.get("href"))}">{esc(b["text"])}</a></p>')
        elif t == 'table':
            rows = ''.join('<tr>' + ''.join(f'<td>{esc(c)}</td>' for c in r) + '</tr>' for r in b['rows'] if any(r))
            if rows: out.append(f'<div class="tablewrap"><table>{rows}</table></div>')
        i += 1
    flush(); flush_tiles()
    return '\n'.join(out)

def metal_of(slug):
    s = slug.lower()
    if 'copper' in s: return ['Copper']
    if 'brass' in s or 'golden' in s: return ['Brass']
    if 'zinc' in s: return ['Zinc']
    if 'corten' in s or 'steel' in s: return ['Steel']
    return None

def finishes_strip(slug):
    ms = metal_of(slug)
    fs = [f for f in FIN if (not ms or f['metal'] in ms)]
    if not ms: fs = [FIN_BY[s] for s in ('finish__northumberland-finish', 'finish__somerset-finish', 'finish__cambridgeshire-finish', 'finish__antique-zinc', 'finish__blackened-steel', 'finish__hertfordshire-finish')]
    fs = fs[:6]
    label = (ms[0] + ' finishes') if ms else 'Popular finishes'
    return f'''<section class="sec"><div class="wrap">
<div class="wall-head" style="border:0;padding:0"><h2 class="d3">{label}</h2><a class="more" href="finishes.html">All {len(FIN)} finishes</a></div>
<div class="wall">{"".join(swatch_tile(f) for f in fs)}</div></div></section>'''

def longform(p, active, crumbs, extra_after='', show_strip=True):
    blocks = clean_blocks(p)
    hi = next((i for i, b in enumerate(blocks) if b['t'] == 'h1'), None)
    title = h1_of(p, blocks)
    pre = blocks[:hi] if hi is not None else []
    rest = blocks[hi + 1:] if hi is not None else blocks
    eyebrow = next((b['text'] for b in pre if b['t'] in ('p', 'h5', 'h6') and len(b['text']) < 80), '')
    lead_img = next((b for b in pre if b['t'] == 'img' and valid(b['src'])), None) or next((b for b in rest if b['t'] == 'img' and valid(b['src'])), None)
    # intro paragraphs = before first heading
    intro = []
    j = 0
    while j < len(rest) and rest[j]['t'] not in ('h2', 'h3', 'h5', 'h6'):
        intro.append(rest[j]); j += 1
    rest = rest[j:]
    if lead_img and lead_img in intro: intro.remove(lead_img)
    if lead_img and lead_img in rest: rest.remove(lead_img)
    intro_p = [b for b in intro if b['t'] == 'p']
    intro_other = [b for b in intro if b['t'] != 'p']
    lede = intro_p[0]['text'] if intro_p else (p.get('description') or '')
    # split rest into sections at h2
    secs = []; cur = None; pending_label = None
    for b in rest:
        if b['t'] in ('h5', 'h6'):
            pending_label = b['text']; continue
        if b['t'] == 'h2':
            cur = {'label': pending_label, 'h': b['text'], 'blocks': []}; secs.append(cur); pending_label = None; continue
        if cur is None:
            cur = {'label': pending_label, 'h': None, 'blocks': []}; secs.append(cur); pending_label = None
        cur['blocks'].append(b)
    crumb = ' / '.join(f'<a href="{h}">{esc(n)}</a>' if h else esc(n) for n, h in crumbs)
    out = [f'''<section class="ph-head"><div class="wrap g7">
<div class="rail"><div class="crumbs">{crumb}</div></div>
<div class="body" style="display:grid;gap:24px">{('<span class="label">' + esc(eyebrow) + '</span>') if eyebrow else ''}<h1 class="d2">{esc(title)}</h1>{('<p class="lede">' + esc(lede) + '</p>') if lede else ''}</div>
</div></section>''']
    if lead_img:
        out.append(f'<div class="wrap g7"><figure class="body leadimg" style="margin:0">{imgtag(lead_img["src"], lead_img.get("alt") or title, 1800, eager=True)}</figure></div>')
    more_intro = intro_p[1:] + intro_other
    if more_intro:
        out.append(f'<section class="sec" style="border:0"><div class="wrap g7"><div class="rail"></div><div class="body prose">{render_blocks(more_intro)}</div></div></section>')
    for s in secs:
        if not s['blocks'] and not s['h']: continue
        imgs = [b for b in s['blocks'] if b['t'] == 'img']
        paired = set()
        bl = s['blocks']
        for k, b in enumerate(bl):
            if b['t'] == 'img' and k + 1 < len(bl) and bl[k + 1]['t'] == 'li': paired.add(id(b))
        loose = [b for b in imgs if id(b) not in paired and valid(b['src'])][:4]
        text = [b for b in bl if not (b['t'] == 'img' and id(b) not in paired)]
        figs = ''
        if loose:
            cls = 'figs one' if len(loose) == 1 else 'figs'
            figs = f'<div class="{cls}">' + ''.join(imgtag(b['src'], b.get('alt', ''), 1400) for b in loose[:2 if len(loose) > 1 else 1]) + '</div>'
        rail = (f'<span class="label" style="display:block;margin-bottom:12px">{esc(s["label"])}</span>' if s['label'] else '') + (f'<h2>{esc(s["h"])}</h2>' if s['h'] else '')
        out.append(f'<section class="sec"><div class="wrap g7"><div class="rail">{rail}</div><div class="body"><div class="prose">{render_blocks(text)}</div>{figs}</div></div></section>')
    out.append(extra_after)
    if show_strip: out.append(finishes_strip(p['slug']))
    out.append(cta_band())
    return title, '\n'.join(out)

# ---------------- collections ----------------
def clean_price(s):
    if not s: return ''
    s = s.replace('£ ', '£')
    s = re.sub(r'Price range:.*$', '', s).strip()
    s = re.sub(r'Original price.*?Current price is:\s*', '', s)
    return s.strip()

def product_info(p):
    bl = clean_blocks(p)
    hi = next((i for i, b in enumerate(bl) if b['t'] == 'h1'), None)
    name = bl[hi]['text'] if hi is not None else nice_title(p['title'])
    imgs = [b['src'] for b in bl[:hi or 0] if b['t'] == 'img' and valid(b['src'])]
    price = clean_price(p.get('price'))
    rest = bl[hi + 1:] if hi is not None else bl
    if rest and rest[0]['t'] == 'p' and '£' in rest[0]['text'] and len(rest[0]['text']) < 120:
        if not price: price = clean_price(rest[0]['text'])
        rest = rest[1:]
    body = []
    for b in rest:
        t = b.get('text', '')
        if b['t'] in ('h2', 'h6', 'h5') and re.match(r'(Reviews|Related products|Frequently asked questions|Good to know|You may also like)', t): break
        if b['t'] == 'li' and t in ('Description', 'Additional information', 'Facebook', 'Instagram'): continue
        if b['t'] == 'img':
            if b['src'] not in imgs and valid(b['src']): imgs.append(b['src'])
            continue
        if b['t'] == 'p' and t.startswith('This size is larger than a single sheet'): continue
        if b['t'] in ('h3', 'h4') and sum(1 for x in body if x['t'] == 'p') >= 2 and not re.search(r'(guide|thickness|fitting|measur|gloss|first|care|deliver)', t, re.I): break
        body.append(b)
    kind = 'Samples' if re.search(r'sample', p['slug'] + name, re.I) else 'Tables' if 'table' in p['slug'] else 'Sheets and splashbacks'
    fin = None
    for f in FIN:
        key = f['name'].lower().replace(' finish', '').split()[0:2]
        nm = name.lower()
        if all(k in nm for k in key): fin = f; break
    return dict(slug=p['slug'], name=name, price=price, imgs=imgs, body=body, kind=kind, fin=fin, desc=p.get('description'))

PRODUCTS = [product_info(p) for p in P.values() if p['kind'] == 'product' and '%f0' not in p['slug']]
PRODUCTS.sort(key=lambda x: ({'Sheets and splashbacks': 0, 'Tables': 1, 'Samples': 2}[x['kind']], x['name']))
PROD_BY = {x['slug']: x for x in PRODUCTS}

def project_info(p):
    bl = clean_blocks(p)
    hi = next((i for i, b in enumerate(bl) if b['t'] == 'h1'), 0)
    cats = next((b['text'] for b in bl[:hi] if b['t'] == 'p' and '·' in b['text']), '')
    imgs = [b['src'] for b in bl if b['t'] == 'img' and valid(b['src'])]
    paras = [b for b in bl[hi + 1:] if b['t'] in ('p', 'li', 'h3', 'h4', 'blockquote')]
    ctas = [b for b in bl if b['t'] == 'cta' and 'instagram' in (b.get('href') or '')]
    return dict(slug=p['slug'], name=bl[hi]['text'] if bl else nice_title(p['title']), cats=cats, imgs=imgs, paras=paras, insta=ctas[0]['href'] if ctas else None,
                metal=('Cu' if 'Copper' in cats else 'CuZn' if 'Brass' in cats else 'Zn' if 'Zinc' in cats else 'Fe'))
PROJECTS = [project_info(p) for p in P.values() if p['kind'] == 'project']
ORDER_PROJ = ['project__verdigris-copper-kitchen-backsplash', 'project__aged-copper-bath-panels', 'project__brass-aga-splashback', 'project__aged-copper-feature-wall-in-holborn-office']
PROJECTS.sort(key=lambda x: (ORDER_PROJ.index(x['slug']) if x['slug'] in ORDER_PROJ else 99, x['name']))

POSTS = sorted([p for p in P.values() if p['kind'] == 'post'], key=lambda p: p.get('date') or '', reverse=True)
def fmt_date(d):
    if not d: return ''
    import datetime
    try: return datetime.date.fromisoformat(d).strftime('%-d %b %Y')
    except Exception: return d

def project_card(x, cls='a', w=1400):
    return (f'<a class="tile {cls}" href="{x["slug"]}.html"><div class="ph">{imgtag(x["imgs"][0] if x["imgs"] else None, x["name"], w)}</div>'
            f'<div class="tagstack">{tag(x["metal"])}<span class="label" style="align-self:center">{esc(x["cats"].replace(" · ", ", "))}</span></div><div class="nm">{esc(x["name"])}</div></a>')

def product_tile(x, w=900):
    first = x['imgs'][0] if x['imgs'] else (x['fin']['swatch'] if x['fin'] else None)
    t = ftag(x['fin']) if x['fin'] else ''
    return (f'<a class="tile" href="{x["slug"]}.html"><div class="ph">{imgtag(first, x["name"], w)}</div>'
            f'<div class="tagstack">{t}</div><div class="nm">{esc(x["name"])}</div><div class="pr">{esc(x["price"])}</div></a>')

APPS = [  # application index: (label, page slug, image, metals)
 ('Splashbacks', 'products__splashbacks', None, 'Brass · Copper · Zinc · Corten'),
 ('Worktops', 'products__worktops', None, 'Brass · Copper · Zinc'),
 ('Table tops', 'products__table-tops', None, 'Brass · Copper · Zinc'),
 ('Coffee tables', 'products__coffee-tables', None, 'Brass · Copper'),
 ('Bar tops', 'products__bar-tops', None, 'Brass · Copper · Zinc'),
 ('Wall panels and cladding', 'metal-wall-panels', None, 'All metals'),
 ('Cooker hoods', 'bespoke-metal-cooker-hoods', None, 'Brass · Copper'),
 ('Tiles', 'metal-tiles', None, 'Brass · Copper'),
 ('Bath panels', 'metal-bath-panels', None, 'Brass · Copper'),
 ('Cupboard doors and plinths', 'metal-cupboard-doors', None, 'Brass · Copper'),
 ('Stair risers', 'decorative-metal-stair-risers', None, 'Brass · Copper'),
 ('Signage and lettering', 'metal-signage', None, 'Brass · Copper · Zinc'),
 ('Wall art and screens', 'metal-wall-art', None, 'All metals'),
]
def app_img(slug):
    p = P.get(slug)
    if not p: return None
    return next((b['src'] for b in clean_blocks(p) if b['t'] == 'img'), None)

def index_rows(items):
    out = []
    for label, slug, im, meta in items:
        if slug not in P and slug not in SPECIAL.values(): continue
        im = im or app_img(slug)
        out.append(f'<a class="ix" href="{slug}.html"><span class="thumb">{imgtag(im, "", 500) if im else ""}</span><span class="t">{esc(label)}</span><span class="m"><span class="label">{esc(meta)}</span><span class="arrow" aria-hidden="true">→</span></span></a>')
    return '<div class="rows">' + ''.join(out) + '</div>'

def steps():
    return f'''<section class="steel band"><div class="wrap">
<div class="shead"><div class="h"><span class="label" style="color:var(--verdigris-light)">How it works</span><h2 class="d2">From a 150mm square to a finished wall</h2></div></div>
<ol class="steps" style="list-style:none;margin:0;padding:0">
<li class="step"><span class="n">1 · Sample</span><h3>See it in your own light</h3><p>Every sample is a 150 × 150mm piece of 0.9mm metal, finished by hand.</p><p class="mono">£26.34 · 2–3 working days</p></li>
<li class="step"><span class="n">2 · Measure</span><h3>Send us your sizes</h3><p>We cut to the millimetre, with cut-outs for sockets and pipes on request.</p><p class="mono">0.9mm or 1.5mm sheet</p></li>
<li class="step"><span class="n">3 · Make</span><h3>Aged by hand to order</h3><p>Each piece is finished in our workshop and sealed in gloss or matte lacquer.</p><p class="mono">5–8 weeks · delivery included</p></li>
<li class="step"><span class="n">4 · Fit</span><h3>Ready to go up</h3><p>Pieces arrive ready to fit to most flat surfaces with epoxy resin or liquid nail.</p><p class="mono">UK mainland and international</p></li>
</ol></div></section>'''

# ---------------- pages ----------------
MOSAIC = [('Splashbacks', 'products__splashbacks', 'Aged-Brass-Backsplash-scaled.jpg', 'Aged brass splashback in a white kitchen'),
          ('Bar tops', 'products__bar-tops', 'The-Publisher-Hotel-Aged-Brass-Reception-Desk-scaled.jpg', 'Aged brass reception desk at The Publisher hotel'),
          ('Worktops', 'products__worktops', 'Wood-and-Copper-Worktop-scaled.jpg', 'Aged copper worktop with verdigris beside walnut'),
          ('Table tops', 'products__table-tops', 'metal-coffee-table-1-1600x1067.jpg', 'Aged brass coffee table in a sitting room'),
          ('Wall panels', 'metal-wall-panels', 'aged-copper-feature-wall-cheshire-finish.jpeg', 'Aged copper feature wall'),
          ('Bath panels', 'metal-bath-panels', 'aged-copper-bath-panels-northumberland-finish-scaled.jpeg', 'Copper bath panel with verdigris')]

def mosaic():
    out = []
    for k, (label, slug, im, alt) in enumerate(MOSAIC, 1):
        href = slug + '.html' if (slug in P or slug in SPECIAL.values()) else 'products.html'
        out.append(f'<a class="mo m{k}" href="{href}">{imgtag(im, alt, 1400 if k == 1 else 900)}<span><b>{esc(label)}</b><i>Explore →</i></span></a>')
    return '<div class="mosaic">' + ''.join(out) + '</div>'

def build_home():
    proj = PROJECTS[:2]
    best = [x for x in PRODUCTS if x['slug'] in ('product__aged-brass-coffee-table', 'product__northumberland-finish', 'product__somerset-finish-stained-glass-brass', 'product__blackened-corton')]
    posts = POSTS[:4]
    body = f'''
<section class="hero">
<figure class="hero-img">{imgtag("Copper-Splashback-with-Plug-Socket-Cutouts-scaled.jpg", "White kitchen with a full-width aged copper splashback behind the hob", 2400, eager=True)}<figcaption>Aged copper splashback, cut to fit</figcaption></figure>
<div class="hero-copy"><div class="wrap">
<div><span class="kicker">Made in Britain · Newcastle upon Tyne</span><h1 class="caps">Bespoke metal,<br>aged by hand</h1><p class="lede">Splashbacks, worktops, tables and wall panels in brass, copper, zinc and steel, cut to your size and finished to order in our workshop.</p></div>
<div class="btnrow"><a class="btn btn-v" href="samples.html">Order samples</a><a class="btn" href="finishes.html">Explore finishes</a></div>
</div></div>
</section>
<section class="facts"><div class="wrap">
<div><b>{len(FIN)} finishes</b><span>Brass, copper, zinc and steel</span></div>
<div><b>Samples £26.34</b><span>150 × 150mm, in 2–3 days</span></div>
<div><b>Cut to the millimetre</b><span>Cut-outs for sockets and pipes</span></div>
<div><b>Made in 5–8 weeks</b><span>Delivered UK-wide and abroad</span></div>
</div></section>

<section class="band"><div class="wrap">
<div class="shead"><div class="h"><span class="label">What we make</span><h2 class="d2">Beautiful metalwork for exceptional spaces</h2></div><a class="more" href="products.html">All products</a></div>
{mosaic()}
</div></section>

<section class="band tint" id="finishes"><div class="wrap">
<div class="shead"><div class="h"><span class="label">Metal finishes</span><h2 class="d2">Every finish is made by hand, so no two sheets are the same</h2><p class="lede">We age brass, copper, zinc and steel with heat, chemistry and time, then seal the surface so it stays the way you chose it.</p></div>
<nav class="tabs" aria-label="Metals">{"".join(f'<a href="#{k.lower()}">{t}</a>' for k,t,s,_ in GROUPS)}</nav></div>
{wall()}
</div></section>

<section class="split" style="background:var(--sand)">
<div class="im">{imgtag("Berkshire-Bronzed-3.jpg", "A Berkshire bronzed brass sample sheet", 1400)}</div>
<div class="tx"><span class="label">Samples</span><h2 class="d2">See it in your own light first</h2>
<p class="lede">Every finish changes with the room it lives in. Order a 150 × 150mm sample of 0.9mm sheet, finished by hand exactly as your piece will be, and hold it up against your worktop, tiles and paint.</p>
<dl class="spec" style="max-width:460px"><dt>Size</dt><dd>150 × 150mm, 0.9mm</dd><dt>Lacquer</dt><dd>Gloss or matte</dd><dt>Delivery</dt><dd>2–3 working days</dd></dl>
<div class="btnrow"><a class="btn btn-v" href="samples.html">Order samples · £26.34</a></div></div>
</section>

{steps()}

<section class="band"><div class="wrap">
<div class="shead"><div class="h"><span class="label">Our work</span><h2 class="d2">In people&rsquo;s homes</h2></div><a class="more" href="our-work.html">All projects</a></div>
<div class="pair">{project_card(proj[0], "a")}{project_card(proj[1], "b", 1000)}</div>
</div></section>

<section class="band tint"><div class="wrap">
<div class="shead"><div class="h"><span class="label">Shop</span><h2 class="d2">Made to order, priced online</h2></div><a class="more" href="shop.html">Visit the shop</a></div>
<div class="tiles">{"".join(product_tile(x) for x in best)}</div>
</div></section>

{cta_band()}

<section class="band"><div class="wrap">
<div class="shead"><div class="h"><span class="label">Journal</span><h2 class="d3">Notes from the workshop</h2></div><a class="more" href="journal.html">Read the journal</a></div>
<div class="rows">{"".join(f'<a class="jrow" href="{p["slug"]}.html"><span class="dt">{fmt_date(p.get("date"))}</span><span class="tt">{esc(h1_of(p, clean_blocks(p)))}</span><span class="ar">→</span></a>' for p in posts)}</div>
</div></section>'''
    page('index', 'Halman Thompson · Bespoke metal creations', 'Bespoke brass, copper, zinc and steel splashbacks, worktops, tables and wall panels, aged by hand and made to order in Newcastle upon Tyne.', 'index', body)

def build_finishes():
    p = P.get('finishes')
    body = f'''<section class="ph-head"><div class="wrap g7">
<div class="rail"><div class="crumbs"><a href="index.html">Home</a> / Finishes</div></div>
<div class="body" style="display:grid;gap:24px"><span class="label">{len(FIN)} finishes · 4 metals</span><h1 class="d1">Finishes</h1><p class="lede">A range of brass, copper, zinc and steel finishes for tables, worktops, splashbacks and more. Each one is applied by hand, then sealed in gloss or matte lacquer.</p>
<nav class="tabs" aria-label="Metals">{"".join(f'<a href="#{k.lower()}">{t} <span class="muted mono">{s}</span></a>' for k,t,s,_ in GROUPS)}</nav></div>
</div></section>
<section class="band" style="padding-top:0"><div class="wrap">{wall()}</div></section>
<section class="sec"><div class="wrap g7"><div class="rail"><span class="label">By metal</span></div><div class="body">{index_rows([("Brass finishes","brass-finishes",None,"CuZn · 7 finishes"),("Copper finishes","copper-finishes",None,"Cu · 9 finishes"),("Zinc and steel finishes","zinc-steel-finishes",None,"Zn · Fe · 5 finishes")])}</div></div></section>
{steps()}{cta_band()}'''
    page('finishes', 'Finishes · Halman Thompson', 'Brass, copper, zinc and steel finishes, aged by hand.', 'finishes', body)

def build_finish(f):
    p = P.get(f['slug'])
    if not p or not f['slug'].startswith('finish__'): return
    bl = clean_blocks(p)
    hi = next((i for i, b in enumerate(bl) if b['t'] == 'h1'), 0)
    sub = bl[hi + 1]['text'] if hi + 1 < len(bl) and bl[hi + 1]['t'] == 'p' and len(bl[hi + 1]['text']) < 60 else f['desc']
    paras = []
    for b in bl[hi + 1:]:
        if b['t'] in ('h2', 'h5', 'h6'): break
        if b['t'] == 'p' and b['text'] != sub: paras.append(b['text'])
    # made for you list
    made = []
    for b in bl:
        if b['t'] == 'li' and ('£' in b['text']) and b.get('href'):
            m = re.match(r'(.*?)\s*((?:Made to measure.*?)?(?:from|From) £[\d,.]+)', b['text'])
            nm, pr = (m.group(1), m.group(2)) if m else (b['text'], '')
            made.append((nm, pr, link(b['href'])))
    uses = []
    started = False
    for b in bl:
        if b['t'] == 'h2' and 'in use' in b['text']: started = True; continue
        if started and b['t'] == 'h2': break
        if started and b['t'] == 'img' and valid(b['src']): uses.append(b['src'])
    if f['swatch'] in uses: uses.remove(f['swatch'])
    similar = [x for x in FIN if x['metal'] == f['metal'] and x['slug'] != f['slug']][:4]
    sample = next((x for x in PRODUCTS if x['kind'] == 'Samples' and x['fin'] and x['fin']['slug'] == f['slug']), None)
    sheet = next((x for x in PRODUCTS if x['kind'] != 'Samples' and x['fin'] and x['fin']['slug'] == f['slug']), None)
    madehtml = ''.join(f'<a href="{h}"><span>{esc(n)}</span><span class="mono">{esc(pr)}</span></a>' for n, pr, h in made)
    if not madehtml and sheet: madehtml = f'<a href="{sheet["slug"]}.html"><span>Sheet or splashback, made to measure</span><span class="mono">{esc(sheet["price"])}</span></a>'
    body = f'''<section class="ph-head"><div class="wrap">
<div class="crumbs" style="margin-bottom:28px"><a href="index.html">Home</a> / <a href="finishes.html">Finishes</a> / <a href="finishes.html#{f["metal"].lower()}">{f["metal"]}</a></div>
<div class="finish-hero">
<div class="sq">{imgtag(f["swatch"], f["name"] + " finish, close up", 1400, eager=True)}</div>
<div class="txt"><div class="tagstack">{ftag(f)}<span class="label" style="align-self:center">{f["metal"]}</span></div>
<h1 class="d2">{esc(f["name"])}</h1><p class="ital" style="font-size:22px;color:var(--ink2)">{esc(sub)}</p>
<div class="prose">{"".join(f"<p>{esc(t)}</p>" for t in paras)}</div>
<form class="js-sample" style="display:grid;gap:14px;border-top:1px solid var(--line);padding-top:20px">
<p class="label">150 × 150mm sample · 0.9mm</p>
<div class="choice" role="radiogroup" aria-label="Lacquer"><input type="radio" name="lq" id="lq-g" value="Gloss" checked><label for="lq-g">Gloss</label><input type="radio" name="lq" id="lq-m" value="Matte"><label for="lq-m">Matte</label></div>
<div class="btnrow"><button class="btn btn-v" type="submit">Add sample · £26.34</button>{f'<a class="btn" href="{sheet["slug"]}.html">Buy cut to size</a>' if sheet else ''}</div>
<p class="note js-msg" role="status" hidden></p>
</form></div></div></div></section>
{f'<section class="sec"><div class="wrap g7"><div class="rail"><span class="label">Shop this finish</span><h2 style="margin-top:12px">Made for you in {esc(f["name"])}</h2></div><div class="body"><div class="made">{madehtml}</div></div></div></section>' if madehtml else ''}
{f'<section class="sec"><div class="wrap"><div class="g7" style="margin-bottom:28px"><div class="rail"><span class="label">In use</span></div><div class="body"><h2 class="d3">{esc(f["name"])} in people&rsquo;s homes</h2></div></div><div class="uses">{"".join(imgtag(u, f["name"] + " in use", 900) for u in uses[:4])}</div></div></section>' if uses else ''}
<section class="sec"><div class="wrap"><div class="wall-head" style="border:0;padding:0"><h2 class="d3">More {f["metal"].lower()} finishes</h2><a class="more" href="finishes.html">All finishes</a></div><div class="wall">{"".join(swatch_tile(x) for x in similar)}</div></div></section>
{cta_band()}'''
    page(f['slug'], f'{f["name"]} · Halman Thompson', f'{f["name"]}: {sub}. Hand-applied {f["metal"].lower()} finish by Halman Thompson.', 'finishes', body)

def build_samples():
    p = P.get('samples')
    intro = next((b['text'] for b in p['blocks'] if b['t'] == 'p'), '') if p else ''
    groups = ''
    for key, title, sym, blurb in GROUPS:
        fs = [f for f in FIN if f['metal'] == key]
        groups += f'''<div class="wall-group" id="{key.lower()}"><div class="wall-head"><h2 class="d4">{title}</h2><span class="label">{sym}</span></div><div class="wall">''' + ''.join(
            f'<div class="sw">{swatch_tile(f).replace("<a class=\"sw\"", "<a class=\"sw\"")}<form class="js-sample" style="display:grid;gap:8px"><p class="mono">£26.34</p><button class="btn" type="submit" style="padding:9px 12px;font-size:13.5px">Add sample</button><p class="note js-msg" role="status" hidden></p></form></div>'
            for f in fs) + '</div></div>'
    body = f'''<section class="ph-head"><div class="wrap g7">
<div class="rail"><div class="crumbs"><a href="index.html">Home</a> / Samples</div></div>
<div class="body" style="display:grid;gap:24px"><span class="label">£26.34 each · 2–3 working days</span><h1 class="d1">Order samples</h1><p class="lede">{esc(intro)}</p>
<dl class="spec" style="max-width:560px"><dt>Size</dt><dd class="mono">150 × 150mm</dd><dt>Thickness</dt><dd class="mono">0.9mm</dd><dt>Lacquer</dt><dd>Gloss or matte, your choice</dd><dt>Price</dt><dd class="mono">£26.34 per sample</dd><dt>Delivery</dt><dd>2–3 working days</dd></dl></div>
</div></section>
<section class="band" style="padding-top:0"><div class="wrap">{groups}</div></section>
{steps()}'''
    page('samples', 'Samples · Halman Thompson', 'Order 150 × 150mm samples of every Halman Thompson finish.', 'samples', body)

def build_products():
    allapps = APPS + [('Brass sheets', 'brass-sheets', None, 'CuZn'), ('Copper sheets', 'copper-sheets', None, 'Cu'), ('Zinc and steel sheets', 'zinc-steel-sheets', None, 'Zn · Fe'),
                      ('Kitchen products', 'copper-kitchen-products', None, 'Brass · Copper'), ('Door numbers and letters', 'metal-letters', None, 'Brass · Copper'),
                      ('Laser-cut screens', 'laser-cut-screens', None, 'All metals'), ('Garden screens and panels', 'products__garden-screens-and-panels', None, 'All metals'),
                      ('Decorative door push plates', 'products__decorative-door-push-plates', None, 'Brass · Copper'), ('Dining table tops', 'products__bespoke-dining-table-tops', None, 'Brass · Copper · Zinc'),
                      ('Patina finishing service', 'patina-finishing-service', None, 'Your metal, our finish')]
    body = f'''<section class="ph-head"><div class="wrap g7">
<div class="rail"><div class="crumbs"><a href="index.html">Home</a> / Products</div></div>
<div class="body" style="display:grid;gap:24px"><h1 class="d1">Products</h1><p class="lede">Our pieces can be used for a wide range of projects: splashbacks, table and bar tops, decorative pieces, wall art, garden screens and other projects, and wall cladding to name a few.</p></div>
</div></section>
<section class="band" style="padding-top:0"><div class="wrap">{index_rows(allapps)}</div></section>{cta_band()}'''
    page('products', 'Products · Halman Thompson', 'Splashbacks, worktops, tables, wall panels, signage and more in hand-aged metal.', 'products', body)

def build_shop():
    sec = ''
    for k in ('Sheets and splashbacks', 'Tables', 'Samples'):
        xs = [x for x in PRODUCTS if x['kind'] == k]
        if not xs: continue
        sec += f'<section class="sec"><div class="wrap"><div class="wall-head" style="border:0;padding:0;margin-bottom:28px"><h2 class="d3" id="{k.split()[0].lower()}">{k}</h2><span class="label">{len(xs)} items</span></div><div class="tiles">{"".join(product_tile(x) for x in xs)}</div></div></section>'
    body = f'''<section class="ph-head"><div class="wrap g7">
<div class="rail"><div class="crumbs"><a href="index.html">Home</a> / Shop</div></div>
<div class="body" style="display:grid;gap:24px"><h1 class="d1">Shop</h1><p class="lede">Sheets and splashbacks cut to your size, tables made to order, and samples of every finish. Delivery is included on made-to-measure pieces.</p>
<nav class="tabs"><a href="#sheets">Sheets and splashbacks</a><a href="#tables">Tables</a><a href="#samples">Samples</a></nav></div></div></section>{sec}{cta_band()}'''
    page('shop', 'Shop · Halman Thompson', 'Buy made-to-measure metal sheets, splashbacks, tables and samples.', 'shop', body)

def build_product(x):
    gal = ''.join(imgtag(s, x['name'], 1400 if i == 0 else 800, eager=(i == 0)) for i, s in enumerate(x['imgs'][:5]))
    is_sheet = x['kind'] == 'Sheets and splashbacks'
    form = ''
    if is_sheet:
        form = f'''<form class="js-order" style="display:grid;gap:14px">
<div class="fields"><div class="field"><label for="w-{x['slug']}">Width (mm)</label><input id="w-{x['slug']}" inputmode="numeric" placeholder="900"></div><div class="field"><label for="h-{x['slug']}">Height (mm)</label><input id="h-{x['slug']}" inputmode="numeric" placeholder="600"></div>
<div class="field full"><label for="t-{x['slug']}">Thickness</label><select id="t-{x['slug']}"><option>0.9mm, recommended for splashbacks and wall panels</option><option>1.5mm, more rigid</option></select></div></div>
<div class="choice" role="radiogroup" aria-label="Lacquer"><input type="radio" name="lq" id="pg-{x['slug']}" checked><label for="pg-{x['slug']}">Gloss</label><input type="radio" name="lq" id="pm-{x['slug']}"><label for="pm-{x['slug']}">Matte</label></div>
<button class="btn btn-v" type="submit">Add to basket</button><p class="note js-msg" role="status" hidden></p></form>'''
    elif x['kind'] == 'Samples':
        form = '<form class="js-sample" style="display:grid;gap:12px"><div class="choice" role="radiogroup" aria-label="Lacquer"><input type="radio" name="lq" id="sg" checked><label for="sg">Gloss</label><input type="radio" name="lq" id="sm"><label for="sm">Matte</label></div><button class="btn btn-v" type="submit">Add sample to basket</button><p class="note js-msg" role="status" hidden></p></form>'
    else:
        form = '<form class="js-order" style="display:grid;gap:12px"><button class="btn btn-v" type="submit">Choose size and finish</button><p class="note js-msg" role="status" hidden></p></form>'
    spec = ''
    if is_sheet:
        spec = '<dl class="spec"><dt>Cut</dt><dd>To your exact size, to the millimetre</dd><dt>Sheet</dt><dd class="mono">0.9mm or 1.5mm</dd><dt>Finish</dt><dd>Hand-finished and lacquered, ready to fit</dd><dt>Delivery</dt><dd>Included</dd></dl>'
    elif x['kind'] == 'Samples':
        spec = '<dl class="spec"><dt>Size</dt><dd class="mono">150 × 150mm</dd><dt>Thickness</dt><dd class="mono">0.9mm</dd><dt>Delivery</dt><dd>2–3 working days</dd></dl>'
    t = ftag(x['fin']) if x['fin'] else ''
    body = f'''<section class="ph-head"><div class="wrap">
<div class="crumbs" style="margin-bottom:28px"><a href="index.html">Home</a> / <a href="shop.html">Shop</a> / {esc(x["kind"])}</div>
<div class="prod"><div class="gal">{gal}</div>
<div class="buy"><div class="tagstack">{t}<span class="label" style="align-self:center">{esc(x["kind"])}</span></div><h1 class="d3">{esc(x["name"])}</h1><p class="price">{esc(x["price"])}</p>{form}{spec}
{f'<p class="note">Want to see it first? <a href="{[s for s in PRODUCTS if s["kind"]=="Samples" and s["fin"] and x["fin"] and s["fin"]["slug"]==x["fin"]["slug"]][0]["slug"]}.html">Order a sample</a>.</p>' if is_sheet and x['fin'] and any(s["kind"]=="Samples" and s["fin"] and s["fin"]["slug"]==x["fin"]["slug"] for s in PRODUCTS) else ''}
</div></div></div></section>
<section class="sec"><div class="wrap g7"><div class="rail"><span class="label">About this piece</span></div><div class="body prose">{render_blocks(x["body"])}</div></div></section>
{cta_band()}'''
    page(x['slug'], f'{x["name"]} · Halman Thompson', x['desc'] or x['name'], 'shop', body)

def build_our_work():
    cards = ''.join(project_card(x, '', 1000) for x in PROJECTS)
    body = f'''<section class="ph-head"><div class="wrap g7">
<div class="rail"><div class="crumbs"><a href="index.html">Home</a> / Our work</div></div>
<div class="body" style="display:grid;gap:24px"><h1 class="d1">Our work</h1><p class="lede">Kitchens, bathrooms, bars and offices finished in our aged metals. Every one of these pieces was cut to size and finished by hand for the space it went into.</p></div></div></section>
<section class="band" style="padding-top:0"><div class="wrap"><div class="tiles t3">{cards.replace('class="ph"', 'class="ph wide"')}</div></div></section>{cta_band()}'''
    page('our-work', 'Our work · Halman Thompson', 'Projects finished in Halman Thompson aged brass, copper and zinc.', 'our-work', body)

def build_project(x):
    imgs = x['imgs'][:5]
    figs = ''.join(imgtag(s, x['name'], 1400) for s in imgs[1:5])
    body = f'''<section class="ph-head"><div class="wrap g7">
<div class="rail"><div class="crumbs"><a href="index.html">Home</a> / <a href="our-work.html">Our work</a></div></div>
<div class="body" style="display:grid;gap:22px"><div class="tagstack">{tag(x["metal"])}<span class="label" style="align-self:center">{esc(x["cats"].replace(" · ", ", "))}</span></div><h1 class="d2">{esc(x["name"])}</h1></div></div></section>
<div class="wrap g7"><figure class="body leadimg" style="margin:0">{imgtag(imgs[0] if imgs else None, x["name"], 1800, eager=True)}</figure></div>
<section class="sec" style="border:0"><div class="wrap g7"><div class="rail"><h2>The project</h2></div><div class="body"><div class="prose">{render_blocks(x["paras"])}</div>
<div class="btnrow" style="margin-top:28px"><a class="btn btn-v" href="bespoke.html">Get a bespoke quote</a>{f'<a class="btn" href="{x["insta"]}">View on Instagram</a>' if x["insta"] else ''}</div>
{f'<div class="figs">{figs}</div>' if figs else ''}</div></div></section>
<section class="sec"><div class="wrap"><div class="wall-head" style="border:0;padding:0"><h2 class="d3">More projects</h2><a class="more" href="our-work.html">All projects</a></div><div class="tiles t3">{"".join(project_card(y, "", 900).replace('class="ph"','class="ph wide"') for y in [z for z in PROJECTS if z["slug"]!=x["slug"]][:3])}</div></div></section>
{cta_band()}'''
    page(x['slug'], f'{x["name"]} · Halman Thompson', x['name'], 'our-work', body)

def build_journal():
    rows = ''.join(f'<a class="jrow" href="{p["slug"]}.html"><span class="dt">{fmt_date(p.get("date"))}</span><span class="tt">{esc(h1_of(p, clean_blocks(p)))}</span><span class="ar">→</span></a>' for p in POSTS)
    body = f'''<section class="ph-head"><div class="wrap g7">
<div class="rail"><div class="crumbs"><a href="index.html">Home</a> / Journal</div></div>
<div class="body" style="display:grid;gap:24px"><h1 class="d1">Journal</h1><p class="lede">Guides to our finishes, fitting and care, and ideas for using aged metal at home.</p></div></div></section>
<section class="band" style="padding-top:0"><div class="wrap"><div class="rows">{rows}</div></div></section>{cta_band()}'''
    page('journal', 'Journal · Halman Thompson', 'Guides and ideas from Halman Thompson.', 'journal', body)

def build_post(p):
    bl = clean_blocks(p)
    hi = next((i for i, b in enumerate(bl) if b['t'] == 'h1'), 0)
    title = h1_of(p, bl)
    rest = bl[hi + 1:]
    lead = next((b for b in bl if b['t'] == 'img' and valid(b['src'])), None)
    if lead in rest: rest.remove(lead)
    body = f'''<section class="ph-head"><div class="wrap g7">
<div class="rail"><div class="crumbs"><a href="index.html">Home</a> / <a href="journal.html">Journal</a></div><p class="mono muted" style="margin-top:14px">{fmt_date(p.get("date"))}</p></div>
<div class="body"><h1 class="d2">{esc(title)}</h1></div></div></section>
{f'<div class="wrap g7"><figure class="body leadimg" style="margin:0">{imgtag(lead["src"], lead.get("alt") or title, 1800, eager=True)}</figure></div>' if lead else ''}
<section class="sec" style="border:0"><div class="wrap g7"><div class="rail"></div><div class="body prose">{render_blocks(rest)}</div></div></section>
{finishes_strip(p["slug"])}{cta_band()}'''
    page(p['slug'], f'{title} · Halman Thompson', p.get('description') or title, 'journal', body)

def form_page(slug, title, lede, active, crumbs, fields_html, aside, submit='Send enquiry'):
    body = f'''<section class="ph-head"><div class="wrap g7">
<div class="rail"><div class="crumbs">{crumbs}</div></div>
<div class="body" style="display:grid;gap:24px"><h1 class="d1">{esc(title)}</h1><p class="lede">{lede}</p></div></div></section>
<section class="sec"><div class="wrap g7"><div class="rail" style="display:grid;gap:20px;align-content:start">{aside}</div>
<div class="body"><form class="js-enquiry" style="display:grid;gap:20px;max-width:760px"><div class="fields">{fields_html}</div>
<div><button class="btn btn-v" type="submit">{submit}</button></div><p class="formdone js-msg" role="status" hidden></p></form></div></div></section>'''
    return body

def fld(id_, label, kind='input', full=False, opts=None, ph=''):
    if kind == 'textarea': c = f'<textarea id="{id_}" name="{id_}" placeholder="{esc(ph)}"></textarea>'
    elif kind == 'select': c = f'<select id="{id_}" name="{id_}">' + ''.join(f'<option>{esc(o)}</option>' for o in opts) + '</select>'
    else: c = f'<input id="{id_}" name="{id_}" type="{kind}" placeholder="{esc(ph)}">'
    return f'<div class="field{" full" if full else ""}"><label for="{id_}">{label}</label>{c}</div>'

CONTACT_ASIDE = f'<span class="label">Workshop</span><p>{ADDRESS}</p><p class="mono">{PHONE}<br>{EMAIL}</p>'
def build_contact():
    f = fld('c-name', 'Name') + fld('c-email', 'Email', 'email') + fld('c-phone', 'Phone', 'tel') + fld('c-subject', 'About', 'select', opts=['A finish or sample', 'An order', 'A bespoke project', 'Something else']) + fld('c-msg', 'Message', 'textarea', True)
    body = form_page('contact-us', 'Contact us', f'No matter what your project, we&rsquo;re happy to help. Call {PHONE} or send us a message.', 'contact-us',
                     '<a href="index.html">Home</a> / Contact', f, CONTACT_ASIDE)
    page('contact-us', 'Contact us · Halman Thompson', 'Contact Halman Thompson.', 'contact-us', body + cta_band())

def build_bespoke():
    f = (fld('b-name', 'Name') + fld('b-email', 'Email', 'email') + fld('b-phone', 'Phone', 'tel') +
         fld('b-type', 'Project', 'select', opts=['Splashback', 'Worktop or bar top', 'Table top', 'Wall panels or cladding', 'Cooker hood', 'Signage or lettering', 'Something else']) +
         fld('b-finish', 'Finish', 'select', opts=['Not sure yet'] + [x['name'] for x in FIN]) + fld('b-size', 'Approximate size (mm)', ph='e.g. 2400 × 600') +
         fld('b-msg', 'Tell us about it', 'textarea', True, ph='Where it is going, cut-outs, deadlines, anything else'))
    ex = EXTRA.get('bespoke_intro') or 'In addition to our brass and copper finishes, our team of artisan designers and craftspeople are ready to bring your project to life. We work with a variety of woods and metals to create bars, tables, balustrades, staircases, worktops and much more.'
    aside = '<p><a class="more" href="bespoke-quote-for-businesses.html">Bespoke quotes for businesses</a></p>' + CONTACT_ASIDE
    body = form_page('bespoke', 'Bespoke', 'If you can dream it, we will create it. ' + esc(ex), 'bespoke', '<a href="index.html">Home</a> / Bespoke', f, aside, 'Request a quote')
    proj = ''.join(project_card(y, '', 900).replace('class="ph"', 'class="ph wide"') for y in PROJECTS[:3])
    body += f'<section class="sec"><div class="wrap"><div class="wall-head" style="border:0;padding:0"><h2 class="d3">Recent bespoke work</h2><a class="more" href="our-work.html">All projects</a></div><div class="tiles t3">{proj}</div></div></section>'
    page('bespoke', 'Bespoke · Halman Thompson', 'Request a bespoke quote from Halman Thompson.', 'bespoke', body)

def generic(slug, active='products', crumbs=None, strip=True):
    p = P[slug]
    crumbs = crumbs or [('Home', 'index.html'), ('Products', 'products.html')]
    title, body = longform(p, active, crumbs, show_strip=strip)
    page(slug, f'{nice_title(p["title"]) or title}', p.get('description') or title, active, body)

def simple_page(slug, title, lede, active, prose_html, crumbs):
    body = f'''<section class="ph-head"><div class="wrap g7">
<div class="rail"><div class="crumbs">{crumbs}</div></div>
<div class="body" style="display:grid;gap:24px"><h1 class="d1">{esc(title)}</h1><p class="lede">{lede}</p></div></div></section>
<section class="sec"><div class="wrap g7"><div class="rail"></div><div class="body prose">{prose_html}</div></div></section>'''
    return body

def build_about():
    if 'about' in P:
        generic('about', 'about', [('Home', 'index.html')], strip=False); return
    prose = f'''<p>Halman Thompson makes bespoke metal pieces in brass, copper, zinc and steel. Every finish is applied by hand in our workshop at {ADDRESS}, and every piece is made to order for the space it is going into.</p>
<p>Our signature Northumberland finish is inspired by the seascapes and beaches on our doorstep. It mixes the earthy tones of natural copper with whorls of verdigris in shades of turquoise and jade.</p>
<p>Our designers and craftspeople work with a variety of woods and metals to make bars, tables, balustrades, staircases, worktops and much more, and we ship to customers in the UK and abroad.</p>
<h2>Where to next</h2><ul><li><a href="our-clients.html">Our clients</a></li><li><a href="press-coverage.html">Press coverage</a></li><li><a href="our-work.html">Our work</a></li></ul>'''
    body = simple_page('about', 'About', 'Bespoke metal creations, made by hand in Newcastle upon Tyne.', 'about', prose, '<a href="index.html">Home</a> / About')
    body += f'<div class="wrap g7"><figure class="body leadimg" style="margin:0 0 72px">{imgtag("001-Halman-Thompson-Sept23.jpg", "Inside the Halman Thompson workshop", 1800)}</figure></div>' + cta_band()
    page('about', 'About · Halman Thompson', 'About Halman Thompson.', 'about', body)

def build_delivery():
    if 'delivery' in P: generic('delivery', 'shop', [('Home', 'index.html')], strip=False); return
    prose = '''<dl class="spec"><dt>Made to measure</dt><dd>Delivery is included in the price of made-to-measure pieces</dd><dt>Free UK delivery</dt><dd>Mainland UK, on orders up to 2500 × 1500mm</dd><dt>Lead time</dt><dd class="mono">5–8 weeks for sheets and splashbacks · 8–10 weeks for tables</dd><dt>Samples</dt><dd>£26.34, arriving in 2–3 working days</dd><dt>International</dt><dd>Available. Ask us for a quote</dd></dl>
<p>Please check your order on delivery and report any damage within 7 days, keeping the original packaging.</p><p><a href="returns.html">Returns policy</a> · <a href="contact-us.html">Contact us</a></p>'''
    page('delivery', 'Delivery · Halman Thompson', 'Delivery information.', 'shop', simple_page('delivery', 'Delivery', 'How long things take and how they reach you.', 'shop', prose, '<a href="index.html">Home</a> / Delivery'))

def build_care():
    if 'aged-metal-care-guide' in P: generic('aged-metal-care-guide', 'journal', [('Home', 'index.html')], strip=False); return
    prose = '''<p>Every piece is sealed with a protective lacquer or crystalline wax to keep the finish as it is. If that layer is damaged, the metal underneath will start to age again.</p>
<h2>Day to day</h2><ul><li>Clean gently with warm, soapy water</li><li>Wipe up spills straight away. Acidic liquids like vinegar or fruit juice will mark the finish</li><li>Use heat mats and avoid scratching</li><li>Re-lacquer if needed</li></ul>
<h2>Splashbacks</h2><p>Our pieces are suitable for use behind non-steam cookers only. Keep the surface away from direct steam and excessive heat, which will damage the finish.</p>'''
    page('aged-metal-care-guide', 'Care guide · Halman Thompson', 'How to look after aged metal.', 'journal', simple_page('care', 'Care guide', 'How to keep an aged metal finish looking the way you chose it.', 'journal', prose, '<a href="index.html">Home</a> / Care guide'))

SKIP = {'index', 'finishes', 'samples', 'shop', 'contact-us', 'blog', 'gallery', 'my-account', 'bespoke-quote', 'products', 'thank-you', 'form-test', 'bespoke-business-form-test', 'metal-wall-panels-old', 'corten-steel-wall-panels-2'}
LEGAL = {'privacy-policy', 'terms-and-conditions', 'returns', 'cookie-policy', 'delivery'}

def main():
    if os.path.exists(OUT): shutil.rmtree(OUT)
    os.makedirs(OUT)
    build_home(); build_finishes(); build_samples(); build_products(); build_shop(); build_our_work(); build_journal()
    build_contact(); build_bespoke(); build_about(); build_delivery(); build_care()
    for f in FIN: build_finish(f)
    for x in PRODUCTS: build_product(x)
    for x in PROJECTS: build_project(x)
    for p in POSTS: build_post(p)
    for slug, p in P.items():
        if p['kind'] in ('page', 'archive') and slug not in SKIP and slug not in PAGES and slug not in ('about', 'delivery', 'aged-metal-care-guide'):
            if slug in LEGAL: generic(slug, 'about', [('Home', 'index.html')], strip=False)
            elif slug in ('our-clients', 'press-coverage', 'patina-finishing-service'): generic(slug, 'about', [('Home', 'index.html'), ('About', 'about.html')], strip=False)
            elif slug.endswith('-finishes'): generic(slug, 'finishes', [('Home', 'index.html'), ('Finishes', 'finishes.html')])
            else: generic(slug)
    # links that point at pages we don't have yet fall back to products.html; record which
    for slug, doc in PAGES.items():
        open(os.path.join(OUT, slug + '.html'), 'w').write(doc)
    d = PAGES['index']
    frag = re.sub(r'<!doctype html>\n<html lang="en-GB">\n<head>\n<meta charset="utf-8">\n<meta name="viewport"[^>]*>\n', '', d)
    frag = frag.replace('</head>\n<body>\n', '').replace('</body>\n</html>\n', '')
    open(os.path.join(BUILD, 'artifact-index.html'), 'w').write(frag)
    shutil.copy(os.path.join(BUILD, 'site.css'), OUT)
    shutil.copy(os.path.join(BUILD, 'site.js'), OUT)
    shutil.copytree(os.path.join(BUILD, 'brand'), os.path.join(OUT, 'brand'))
    n = process_images()
    # broken internal links
    names = set(os.listdir(OUT))
    bad = {}
    for slug, doc in PAGES.items():
        for h in re.findall(r'href="([^"#:]+\.html)', doc):
            if h not in names: bad.setdefault(h, set()).add(slug)
    print('pages', len(PAGES), 'images', len(USED), 'new', n)
    if bad: print('missing targets', {k: len(v) for k, v in bad.items()})

if __name__ == '__main__':
    main()
