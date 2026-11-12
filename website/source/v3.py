
# ======================= v3: bespoke templates, motion, centred layout =======================
def art_hero(title, img_src, crumbs_html, lede='', label='', tall=False, alt=''):
    bg = imgtag(img_src, alt or title, 2200, eager=True) if img_src and valid(img_src) else ''
    return f'''<section class="ahero{" tall" if tall else ""}"><div class="ahero-img" data-parallax>{bg}</div>
<div class="ahero-copy wrap"><div class="crumbs">{crumbs_html}</div>{f'<span class="label">{esc(label)}</span>' if label else ''}
<h1 class="caps">{esc(title)}</h1>{f'<p class="lede">{esc(lede)}</p>' if lede else ''}</div></section>'''

def split_row(img_src, inner_html, flip=False, alt='', cls=''):
    return f'''<section class="srow rv{" flip" if flip else ""} {cls}"><div class="wrap srow-in">
<figure class="srow-img rvimg">{imgtag(img_src, alt, 1400)}</figure>
<div class="srow-tx">{inner_html}</div></div></section>'''

def col_section(inner_html, cls=''):
    return f'<section class="csec rv {cls}"><div class="wrap"><div class="col">{inner_html}</div></div></section>'

def wide_fig(src, alt=''):
    return f'<section class="wfig rv"><div class="wrap"><figure class="rvimg">{imgtag(src, alt, 2000)}</figure></div></section>'

def pair_fig(a, b, alt=''):
    return f'<section class="pfig rv"><div class="wrap pfig-in"><figure class="rvimg">{imgtag(a, alt, 1200)}</figure><figure class="rvimg off">{imgtag(b, alt, 1200)}</figure></div></section>'

def head_html(label, h, tag_='h2'):
    return (f'<span class="label">{esc(label)}</span>' if label else '') + (f'<{tag_} class="d3">{esc(h)}</{tag_}>' if h else '')

def render_sections(secs, used=None, start=0):
    """Vary the rhythm: split rows with images, centred text columns, wide and paired figures."""
    out = []; used = used if used is not None else set(); k = start
    for s in secs:
        if not s['blocks'] and not s['h']: continue
        bl = s['blocks']
        paired = set()
        for i2, b in enumerate(bl):
            if b['t'] == 'img' and i2 + 1 < len(bl) and bl[i2 + 1]['t'] == 'li': paired.add(id(b))
        loose = [b['src'] for b in bl if b['t'] == 'img' and id(b) not in paired and valid(b['src']) and b['src'] not in used]
        text = [b for b in bl if not (b['t'] == 'img' and id(b) not in paired)]
        has_tiles = bool(paired)
        hh = head_html(s.get('label'), s.get('h'))
        body = render_blocks(text)
        nwords = sum(len(b.get('text', '').split()) for b in text if b['t'] in ('p', 'li'))
        if loose and not has_tiles and nwords < 260:
            used.add(loose[0])
            out.append(split_row(loose[0], f'{hh}<div class="prose">{body}</div>', flip=(k % 2 == 1), alt=s.get('h') or ''))
            rest = loose[1:3]
            if len(rest) == 2: out.append(pair_fig(rest[0], rest[1])); used.update(rest)
            elif len(rest) == 1: out.append(wide_fig(rest[0])); used.add(rest[0])
        else:
            if has_tiles:
                out.append(f'<section class="csec rv"><div class="wrap"><div class="col">{hh}</div><div class="prose wide-prose">{body}</div></div></section>')
            else:
                out.append(col_section(f'{hh}<div class="prose">{body}</div>'))
            if len(loose) >= 2: out.append(pair_fig(loose[0], loose[1])); used.update(loose[:2])
            elif loose: out.append(wide_fig(loose[0])); used.add(loose[0])
        k += 1
    return '\n'.join(out)

def split_secs(rest):
    secs = []; cur = None; pending = None
    for b in rest:
        if b['t'] in ('h5', 'h6'): pending = b['text']; continue
        if b['t'] == 'h2':
            cur = {'label': pending, 'h': b['text'], 'blocks': []}; secs.append(cur); pending = None; continue
        if cur is None:
            cur = {'label': pending, 'h': None, 'blocks': []}; secs.append(cur); pending = None
        cur['blocks'].append(b)
    return secs

def crumbs_of(crumbs):
    return ' / '.join(f'<a href="{h}">{esc(n)}</a>' if h else esc(n) for n, h in crumbs)

def longform(p, active, crumbs, extra_after='', show_strip=True):
    blocks = clean_blocks(p)
    hi = next((i for i, b in enumerate(blocks) if b['t'] == 'h1'), None)
    title = h1_of(p, blocks)
    pre = blocks[:hi] if hi is not None else []
    rest = blocks[hi + 1:] if hi is not None else blocks
    eyebrow = next((b['text'] for b in pre if b['t'] in ('p', 'h5', 'h6') and len(b['text']) < 80), '')
    lead_img = next((b for b in pre if b['t'] == 'img' and valid(b['src'])), None) or next((b for b in rest if b['t'] == 'img' and valid(b['src'])), None)
    intro = []; j = 0
    while j < len(rest) and rest[j]['t'] not in ('h2', 'h3', 'h5', 'h6'):
        intro.append(rest[j]); j += 1
    rest = rest[j:]
    if lead_img and lead_img in intro: intro.remove(lead_img)
    if lead_img and lead_img in rest: rest.remove(lead_img)
    intro_p = [b for b in intro if b['t'] == 'p']
    intro_other = [b for b in intro if b['t'] != 'p']
    lede = intro_p[0]['text'] if intro_p else (p.get('description') or '')
    out = [art_hero(title, lead_img['src'] if lead_img else None, crumbs_of(crumbs), lede if len(lede) < 220 else '', eyebrow)]
    more = ([intro_p[0]] if len(lede) >= 220 else []) + intro_p[1:] + intro_other
    if more:
        out.append(f'<section class="csec rv intro"><div class="wrap"><div class="col prose lead-prose">{render_blocks(more)}</div></div></section>')
    used = {lead_img['src']} if lead_img else set()
    out.append(render_sections(split_secs(rest), used))
    out.append(extra_after)
    if show_strip: out.append(finishes_strip(p['slug']))
    out.append(cta_band())
    return title, '\n'.join(out)

# ---------- index rows with real thumbnails ----------
def index_rows(items):
    out = []
    for n, (label, slug, im, meta) in enumerate(items, 1):
        if slug not in P and slug not in SPECIAL.values(): continue
        im = im or app_img(slug)
        out.append(f'<a class="ix2 rv" href="{slug}.html"><span class="ix2-n">{n:02d}</span><span class="ix2-im">{imgtag(im, "", 700) if im else ""}</span>'
                   f'<span class="ix2-t">{esc(label)}</span><span class="ix2-m label">{esc(meta)}</span><span class="ix2-a" aria-hidden="true">→</span></a>')
    return '<div class="ix2-list">' + ''.join(out) + '</div>'

# ---------- samples: finished cards ----------
def sample_card(f):
    return f'''<article class="scard"><a class="scard-ph" href="{f["href"]}">{imgtag(f["swatch"], f["name"] + " finish sample", 600)}<span class="scard-view">View finish</span></a>
<div class="scard-b"><h3 class="scard-nm"><a href="{f["href"]}">{esc(f["name"])}</a></h3><p class="scard-ds">{esc(f["desc"])}</p></div>
<form class="js-sample scard-f"><div class="seg" role="radiogroup" aria-label="Lacquer for {esc(f["name"])}">
<label><input type="radio" name="lq" value="Gloss" checked><span>Gloss</span></label><label><input type="radio" name="lq" value="Matte"><span>Matte</span></label></div>
<div class="scard-buy"><span class="scard-pr">£26.34</span><button class="scard-add" type="submit">Add <span aria-hidden="true">+</span></button></div>
<p class="note js-msg" role="status" hidden></p></form></article>'''

def build_samples():
    p = P.get('samples')
    intro = next((b['text'] for b in p['blocks'] if b['t'] == 'p'), '') if p else ''
    groups = ''
    for key, title, sym, blurb in GROUPS:
        fs = [f for f in FIN if f['metal'] == key]
        groups += f'<div class="sgroup rv" id="{key.lower()}"><div class="wall-head"><h2 class="d3">{title}</h2><span class="label">{len(fs)} finishes</span></div><div class="sgrid">' + ''.join(sample_card(f) for f in fs) + '</div></div>'
    body = f'''<section class="ph-head"><div class="wrap g7">
<div class="rail"><div class="crumbs"><a href="index.html">Home</a> / Samples</div></div>
<div class="body" style="display:grid;gap:24px"><span class="label">£26.34 each · 2–3 working days</span><h1 class="d1">Order samples</h1><p class="lede">{esc(intro)}</p>
<dl class="spec spec-row"><div><dt>Size</dt><dd>150 × 150mm</dd></div><div><dt>Thickness</dt><dd>0.9mm</dd></div><div><dt>Lacquer</dt><dd>Gloss or matte</dd></div><div><dt>Delivery</dt><dd>2–3 working days</dd></div></dl></div>
</div></section>
<nav class="stick-tabs"><div class="wrap tabs">{"".join(f'<a href="#{k.lower()}">{t}</a>' for k,t,s,_ in GROUPS)}</div></nav>
<section class="band" style="padding-top:clamp(32px,4vw,56px)"><div class="wrap">{groups}</div></section>
{steps()}'''
    page('samples', 'Samples · Halman Thompson', 'Order 150 × 150mm samples of every Halman Thompson finish.', 'samples', body)

# ---------- our work: bespoke catalogue ----------
def metal_word(x):
    return {'Cu': 'Copper', 'CuZn': 'Brass', 'Zn': 'Zinc', 'Fe': 'Steel'}[x['metal']]

def build_our_work():
    cards = []
    for n, x in enumerate(PROJECTS, 1):
        if not x['imgs']: continue
        m = metal_word(x)
        cards.append(f'''<a class="wk rv" href="{x["slug"]}.html" data-metal="{m}" style="--i:{n % 6}">
<figure class="wk-ph">{imgtag(x["imgs"][0], x["name"], 1400)}{('<span class="wk-alt">' + imgtag(x["imgs"][1], "", 1000) + '</span>') if len(x["imgs"]) > 1 else ''}</figure>
<div class="wk-cap"><span class="wk-n">{n:02d}</span><h2 class="wk-t">{esc(x["name"])}</h2><span class="label">{esc(m)}{(" · " + esc(x["cats"].split(" · ")[-1])) if x["cats"] else ""}</span></div></a>''')
    metals = [m for m in ('Copper', 'Brass', 'Zinc', 'Steel') if any(metal_word(x) == m for x in PROJECTS)]
    chips = '<button type="button" class="chip" aria-pressed="true" data-f="all">All work</button>' + ''.join(f'<button type="button" class="chip" aria-pressed="false" data-f="{m}">{m}</button>' for m in metals)
    feat = PROJECTS[0]
    body = f'''<section class="wk-hero"><div class="wrap wk-hero-in">
<div class="wk-hero-tx"><div class="crumbs"><a href="index.html">Home</a> / Our work</div><h1 class="caps">Our work</h1>
<p class="lede">Kitchens, bathrooms, bars and offices finished in our aged metals. Every piece was cut to size and finished by hand for the room it went into.</p>
<p class="wk-count"><b>{len(cards)}</b> projects, each one a one-off</p></div>
<div class="wk-reel" aria-hidden="true">{"".join(f'<span>{imgtag(x["imgs"][0], "", 700)}</span>' for x in PROJECTS[:10] if x["imgs"])}</div>
</div></section>
<section class="band wk-band"><div class="wrap">
<div class="wk-bar"><div class="chips" role="group" aria-label="Filter by metal">{chips}</div><span class="label wk-shown" aria-live="polite">Showing {len(cards)}</span></div>
<div class="wk-grid">{"".join(cards)}</div>
</div></section>{cta_band()}'''
    page('our-work', 'Our work · Halman Thompson', 'Projects finished in Halman Thompson aged brass, copper and zinc.', 'our-work', body)

def build_project(x):
    imgs = x['imgs']
    m = metal_word(x)
    others = [z for z in PROJECTS if z['slug'] != x['slug'] and z['imgs']]
    idx = [z['slug'] for z in PROJECTS].index(x['slug'])
    nxt = PROJECTS[(idx + 1) % len(PROJECTS)]
    if not nxt['imgs']: nxt = others[0]
    paras = x['paras']
    first = [b for b in paras if b['t'] == 'p'][:1]
    restp = [b for b in paras if b not in first]
    cats = [c for c in x['cats'].split(' · ') if c] if x['cats'] else []
    facts = ''.join(f'<div><dt>{k}</dt><dd>{esc(v)}</dd></div>' for k, v in [('Metal', m), ('Type', cats[-1] if cats else 'Bespoke'), ('Made', 'Newcastle upon Tyne')])
    gallery = imgs[1:7]
    body = art_hero(x['name'], imgs[0] if imgs else None, crumbs_of([('Home', 'index.html'), ('Our work', 'our-work.html')]), '', m + ' · Project', tall=True)
    body += f'''<section class="pj-intro rv"><div class="wrap pj-intro-in"><dl class="pj-facts">{facts}</dl>
<div class="pj-lead">{''.join(f'<p>{esc(b["text"])}</p>' for b in first)}</div></div></section>'''
    if restp:
        if gallery:
            body += split_row(gallery[0], f'<span class="label">The project</span><div class="prose">{render_blocks(restp)}</div><div class="btnrow" style="margin-top:8px"><a class="btn btn-v" href="bespoke.html">Start a project like this</a>{f"<a class=\"btn\" href=\"{x["insta"]}\">See it on Instagram</a>" if x["insta"] else ""}</div>', alt=x['name'])
            gallery = gallery[1:]
        else:
            body += col_section(f'<div class="prose">{render_blocks(restp)}</div>')
    if gallery:
        body += f'<section class="pj-gal rv"><div class="wrap"><div class="pj-gal-in n{min(len(gallery),5)}">' + ''.join(f'<figure class="rvimg">{imgtag(s, x["name"], 1400)}</figure>' for s in gallery[:5]) + '</div></div></section>'
    body += f'''<a class="pj-next" href="{nxt["slug"]}.html"><span class="pj-next-img" data-parallax>{imgtag(nxt["imgs"][0], nxt["name"], 2000)}</span>
<span class="pj-next-tx wrap"><span class="label">Next project</span><span class="caps pj-next-t">{esc(nxt["name"])}</span><span class="more">View project</span></span></a>'''
    body += cta_band()
    page(x['slug'], f'{x["name"]} · Halman Thompson', x['name'], 'our-work', body)

def build_post(p):
    bl = clean_blocks(p)
    hi = next((i for i, b in enumerate(bl) if b['t'] == 'h1'), 0)
    title = h1_of(p, bl)
    rest = bl[hi + 1:]
    lead = next((b for b in bl if b['t'] == 'img' and valid(b['src'])), None)
    if lead in rest: rest.remove(lead)
    intro = []; j = 0
    while j < len(rest) and rest[j]['t'] not in ('h2', 'h3'):
        intro.append(rest[j]); j += 1
    secs = split_secs(rest[j:])
    words = sum(len(b.get('text', '').split()) for b in bl)
    mins = max(2, round(words / 220))
    related = [q for q in POSTS if q['slug'] != p['slug']][:3]
    def rcard(q):
        qb = clean_blocks(q); im = next((b['src'] for b in qb if b['t'] == 'img' and valid(b['src'])), None)
        return f'<a class="tile" href="{q["slug"]}.html"><div class="ph wide">{imgtag(im, "", 800) if im else ""}</div><span class="label">{fmt_date(q.get("date"))}</span><div class="nm">{esc(h1_of(q, qb))}</div></a>'
    body = f'''<div class="readbar" aria-hidden="true"><span></span></div>
<section class="post-head"><div class="wrap"><div class="crumbs"><a href="index.html">Home</a> / <a href="journal.html">Journal</a></div>
<h1 class="d1">{esc(title)}</h1><p class="post-meta label">{fmt_date(p.get("date"))} · {mins} min read</p></div></section>
{f'<figure class="post-lead" data-parallax-wrap><span data-parallax>{imgtag(lead["src"], lead.get("alt") or title, 2200, eager=True)}</span></figure>' if lead else ''}
<section class="csec intro rv"><div class="wrap"><div class="col prose lead-prose dropcap">{render_blocks(intro)}</div></div></section>
{render_sections(secs, {lead["src"]} if lead else set())}
<section class="sec"><div class="wrap"><div class="wall-head" style="border:0;padding:0"><h2 class="d3">More from the journal</h2><a class="more" href="journal.html">All articles</a></div><div class="tiles t3">{"".join(rcard(q) for q in related)}</div></div></section>
{cta_band()}'''
    page(p['slug'], f'{title} · Halman Thompson', p.get('description') or title, 'journal', body)

def build_about():
    if 'about' in P:
        generic('about', 'about', [('Home', 'index.html')], strip=False); return
    body = art_hero('About', 'Aged-Copper-Kitchen-Counter-Top-scaled.jpg', crumbs_of([('Home', 'index.html'), ('About', None)]), 'Bespoke metal creations, made by hand in Newcastle upon Tyne.', '', tall=True)
    body += f'''<section class="statement rv"><div class="wrap"><p class="statement-t">Every finish is applied by hand in our Newcastle workshop, and every piece is made to order for the space it&rsquo;s going into.</p></div></section>
<section class="facts facts-lg rv"><div class="wrap"><div><b>{len(FIN)}</b><span>Hand-applied finishes</span></div><div><b>4</b><span>Metals: brass, copper, zinc, steel</span></div><div><b>1</b><span>Workshop, on Tyneside</span></div><div><b>UK + abroad</b><span>Where we ship</span></div></div></section>'''
    body += split_row('aged-copper-bath-panels-northumberland-finish-scaled.jpeg', '<span class="label">Our signature</span><h2 class="d3">Northumberland</h2><div class="prose"><p>Our signature Northumberland finish is inspired by the seascapes and beaches on our doorstep. It mixes the earthy tones of natural copper with whorls of verdigris in shades of turquoise and jade.</p></div><p><a class="more" href="finish__northumberland-finish.html">See the finish</a></p>', alt='Copper bath panel in the Northumberland finish')
    body += split_row('The-Publisher-Hotel-Aged-Brass-Reception-Desk-scaled.jpg', '<span class="label">Beyond the sheet</span><h2 class="d3">Woods and metals, together</h2><div class="prose"><p>Our designers and craftspeople work with a variety of woods and metals to make bars, tables, balustrades, staircases, worktops and much more, and we ship to customers in the UK and abroad.</p></div><p><a class="more" href="bespoke.html">Start a bespoke project</a></p>', flip=True, alt='Aged brass reception desk')
    body += f'''<section class="band"><div class="wrap"><div class="shead"><div class="h"><span class="label">Where to next</span><h2 class="d2">Find out more</h2></div></div>
<div class="mosaic mosaic-3">
<a class="mo" href="our-work.html">{imgtag("Tattersalls009-1-2048x1356.jpg", "", 1000)}<span><b>Our work</b><i>Explore →</i></span></a>
<a class="mo" href="our-clients.html">{imgtag("Patina-Brass-Sheet-for-Shelf-Display-scaled.jpg", "", 1000)}<span><b>Our clients</b><i>Explore →</i></span></a>
<a class="mo" href="press-coverage.html">{imgtag("metal-coffee-table-1-1600x1067.jpg", "", 1000)}<span><b>Press</b><i>Explore →</i></span></a></div></div></section>''' + cta_band()
    page('about', 'About · Halman Thompson', 'About Halman Thompson.', 'about', body)

def build_products():
    allapps = APPS + [('Brass sheets', 'brass-sheets', None, 'Brass'), ('Copper sheets', 'copper-sheets', None, 'Copper'), ('Zinc and steel sheets', 'zinc-steel-sheets', None, 'Zinc · Steel'),
                      ('Kitchen products', 'copper-kitchen-products', None, 'Brass · Copper'), ('Door numbers and letters', 'metal-letters', None, 'Brass · Copper'),
                      ('Laser-cut screens', 'laser-cut-screens', None, 'All metals'), ('Garden screens and panels', 'products__garden-screens-and-panels', None, 'All metals'),
                      ('Decorative door push plates', 'products__decorative-door-push-plates', None, 'Brass · Copper'), ('Dining table tops', 'products__bespoke-dining-table-tops', None, 'Brass · Copper · Zinc'),
                      ('Patina finishing service', 'patina-finishing-service', None, 'Your metal, our finish')]
    body = f'''<section class="ph-head"><div class="wrap g7">
<div class="rail"><div class="crumbs"><a href="index.html">Home</a> / Products</div></div>
<div class="body" style="display:grid;gap:24px"><h1 class="d1">Products</h1><p class="lede">Our pieces can be used for a wide range of projects: splashbacks, table and bar tops, decorative pieces, wall art, garden screens and other projects, and wall cladding to name a few.</p></div>
</div></section>
<section class="band" style="padding-top:clamp(32px,4vw,56px)"><div class="wrap">{index_rows(allapps)}</div></section>{cta_band()}'''
    page('products', 'Products · Halman Thompson', 'Splashbacks, worktops, tables, wall panels, signage and more in hand-aged metal.', 'products', body)

def build_journal():
    def card(q, big=False):
        qb = clean_blocks(q); im = next((b['src'] for b in qb if b['t'] == 'img' and valid(b['src'])), None)
        return f'<a class="jc rv{" big" if big else ""}" href="{q["slug"]}.html"><figure class="jc-ph">{imgtag(im, "", 1400 if big else 800) if im else ""}</figure><span class="label">{fmt_date(q.get("date"))}</span><span class="jc-t">{esc(h1_of(q, qb))}</span></a>'
    body = f'''<section class="ph-head"><div class="wrap g7">
<div class="rail"><div class="crumbs"><a href="index.html">Home</a> / Journal</div></div>
<div class="body" style="display:grid;gap:24px"><h1 class="d1">Journal</h1><p class="lede">Guides to our finishes, fitting and care, and ideas for using aged metal at home.</p></div></div></section>
<section class="band" style="padding-top:clamp(32px,4vw,56px)"><div class="wrap"><div class="jgrid">{card(POSTS[0], True)}{"".join(card(q) for q in POSTS[1:])}</div></div></section>{cta_band()}'''
    page('journal', 'Journal · Halman Thompson', 'Guides and ideas from Halman Thompson.', 'journal', body)

def build_bespoke():
    f = (fld('b-name', 'Name') + fld('b-email', 'Email', 'email') + fld('b-phone', 'Phone', 'tel') +
         fld('b-type', 'Project', 'select', opts=['Splashback', 'Worktop or bar top', 'Table top', 'Wall panels or cladding', 'Cooker hood', 'Signage or lettering', 'Something else']) +
         fld('b-finish', 'Finish', 'select', opts=['Not sure yet'] + [x['name'] for x in FIN]) + fld('b-size', 'Approximate size (mm)', ph='e.g. 2400 × 600') +
         fld('b-msg', 'Tell us about it', 'textarea', True, ph='Where it is going, cut-outs, deadlines, anything else'))
    ex = EXTRA.get('bespoke_intro') or 'In addition to our brass and copper finishes, our team of artisan designers and craftspeople are ready to bring your project to life. We work with a variety of woods and metals to create bars, tables, balustrades, staircases, worktops and much more.'
    fins = [dict(slug=x['slug'], name=x['name'], metal=x['metal'], tex=img(x['swatch'], 1024)) for x in FIN if x['swatch'] and valid(x['swatch'])]
    builder = f'''<section class="wb-sec" id="builder"><div class="wrap">
<div class="shead"><div class="h"><span class="label">Worktop builder</span><h2 class="d2">Design your worktop in 3D</h2><p class="lede">Choose a finish, set the size and cut-outs, and turn it in the light. When it looks right, send the spec to us and we&rsquo;ll come back with a quote.</p></div></div>
<div class="wb" data-wb>
<div class="wb-stage"><canvas class="wb-canvas" aria-label="3D preview of your worktop"></canvas><div class="wb-load"><span></span>Loading the 3D preview</div>
<div class="wb-hud"><span class="wb-dim" data-out="dims"></span><span class="wb-hint">Drag to turn · scroll to zoom</span></div>
<div class="wb-views" role="group" aria-label="Camera"><button type="button" data-view="persp" aria-pressed="true">3D</button><button type="button" data-view="top" aria-pressed="false">Top</button><button type="button" data-view="front" aria-pressed="false">Front</button></div>
<noscript><p class="wb-fallback">The 3D builder needs JavaScript. Fill in the form below and we&rsquo;ll design it with you.</p></noscript></div>
<form class="wb-panel" onsubmit="return false">
<fieldset><legend>Shape</legend><div class="seg seg-lg"><label><input type="radio" name="shape" value="straight" checked><span>Straight</span></label><label><input type="radio" name="shape" value="l"><span>L-shape</span></label><label><input type="radio" name="shape" value="island"><span>Island</span></label></div></fieldset>
<fieldset><legend>Size</legend>
<div class="rng"><label for="wb-w">Length <output data-out="w"></output></label><input id="wb-w" name="w" type="range" min="600" max="4000" step="10" value="2400"></div>
<div class="rng"><label for="wb-d">Depth <output data-out="d"></output></label><input id="wb-d" name="d" type="range" min="400" max="1200" step="10" value="620"></div>
<div class="rng" data-only="l"><label for="wb-r">Return length <output data-out="r"></output></label><input id="wb-r" name="r" type="range" min="600" max="3000" step="10" value="1600"></div>
<div class="rng"><label for="wb-t">Edge thickness <output data-out="t"></output></label><input id="wb-t" name="t" type="range" min="20" max="60" step="10" value="40"></div>
</fieldset>
<fieldset><legend>Finish <span data-out="fin"></span></legend><div class="wb-fins">{"".join(f'<button type="button" class="wb-fin" data-tex="{q["tex"]}" data-metal="{q["metal"]}" data-name="{esc(q["name"])}" aria-pressed="{"true" if q["slug"]=="finish__northumberland-finish" else "false"}" title="{esc(q["name"])}"><img src="{q["tex"]}" alt="" loading="lazy" width="44" height="44"><span class="sr">{esc(q["name"])}</span></button>' for q in fins)}</div></fieldset>
<fieldset><legend>Details</legend>
<label class="tog"><input type="checkbox" name="sink" checked><span>Sink cut-out</span></label>
<label class="tog"><input type="checkbox" name="hob" checked><span>Hob cut-out</span></label>
<label class="tog"><input type="checkbox" name="upstand"><span>100mm upstand</span></label>
<div class="seg"><label><input type="radio" name="lq" value="Gloss" checked><span>Gloss lacquer</span></label><label><input type="radio" name="lq" value="Matte"><span>Matte lacquer</span></label></div>
</fieldset>
<p class="wb-note" data-out="note"></p>
<div class="wb-actions"><button type="button" class="btn btn-v" data-send>Send this spec for a quote</button><a class="more" href="samples.html">Order a sample first</a></div>
</form></div></div></section>'''
    aside = '<p><a class="more" href="bespoke-quote-for-businesses.html">Bespoke quotes for businesses</a></p>' + CONTACT_ASIDE
    body = form_page('bespoke', 'Bespoke', 'If you can dream it, we will create it. ' + esc(ex), 'bespoke', '<a href="index.html">Home</a> / Bespoke', f, aside, 'Request a quote')
    head_end = body.index('</section>') + len('</section>')
    body = body[:head_end] + builder + body[head_end:].replace('<section class="sec">', '<section class="sec" id="quote">', 1)
    proj = ''.join(project_card(y, '', 900).replace('class="ph"', 'class="ph wide"') for y in PROJECTS[:3])
    body += f'<section class="sec"><div class="wrap"><div class="wall-head" style="border:0;padding:0"><h2 class="d3">Recent bespoke work</h2><a class="more" href="our-work.html">All projects</a></div><div class="tiles t3">{proj}</div></div></section>'
    body += '<script type="importmap">{"imports":{"three":"./vendor/three.module.min.js","three/addons/":"./vendor/addons/"}}</script><script type="module" src="worktop.js"></script>'
    page('bespoke', 'Bespoke · Halman Thompson', 'Design a worktop in 3D and request a bespoke quote from Halman Thompson.', 'bespoke', body)
