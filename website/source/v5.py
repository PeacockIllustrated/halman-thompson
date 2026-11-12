# ======================= v5: product copy as components (finish cards, process steps, icon cards, ready card) =======================
_IC = {
 'laser': '<path d="M12 2v6M9 5l3 3 3-3"/><path d="M4 14h16l-2 7H6z"/><path d="M12 8v6"/>',
 'flask': '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 15h9"/>',
 'shield': '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
 'box': '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
 'ruler': '<path d="M3 16L16 3l5 5L8 21z"/><path d="M7 12l2 2M10 9l2 2M13 6l2 2"/>',
 'hand': '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4a1.5 1.5 0 0 1 3 0v7M14 10V5.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6 7s-5-2-6.5-4.5L3 13.5a1.5 1.5 0 0 1 2.5-1.5L8 15"/>',
 'drop': '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/>',
 'spark': '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
 'wood': '<rect x="3" y="7" width="18" height="10" rx="1"/><path d="M7 10c2 0 3 1.5 5 1.5s3-1.5 5-1.5M7 14c2 0 3-1 5-1s3 1 5 1"/>',
 'truck': '<path d="M2 6h12v10H2zM14 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
 'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 'check': '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
 'layers': '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
 'pin': '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
}
def icon(k):
    return f'<svg class="ic" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{_IC.get(k, _IC["spark"])}</svg>'
def icon_for(t):
    t = t.lower()
    for k, words in [('laser', ('laser', ' cut')), ('flask', ('chemical', 'patina', 'ageing process', 'age the')), ('shield', ('lacquer', 'seal', 'protect', 'durab')),
                     ('box', ('package', 'packag', 'dispatch')), ('truck', ('ship', 'deliver')), ('ruler', ('measure', 'size', 'thick', 'mm')),
                     ('drop', ('clean', 'soapy', 'care', 'water', 'maintain')), ('hand', ('by hand', 'hand made', 'handmade', 'hand crafted', 'craft')),
                     ('wood', ('wood',)), ('clock', ('week', 'turnaround', 'time')), ('pin', ('install', 'fit', 'epoxy', 'adhesive', 'wall'))]:
        if any(w in t for w in words): return k
    return 'spark'

_FINRE = re.compile(r'^\s*([A-Z][\w ]{2,40}?\bfinish(?:es)?)\s*[–—-]\s*(.+)$', re.I)
_TERMRE = re.compile(r'^\s*([^–—:]{3,48}?)\s*[–—:]\s+(.+)$')
def fin_lookup(term):
    k = re.sub(r'\s*finish(es)?\s*$', '', term.strip(), flags=re.I).lower()
    for f in FIN:
        n = re.sub(r'\s*finish\s*$', '', f['name'], flags=re.I).lower()
        if n == k: return f
    return None

def fin_cards(items):
    out = []
    for term, desc in items:
        f = fin_lookup(term)
        ph = imgtag(f['swatch'], f['name'], 500) if f and f['swatch'] and valid(f['swatch']) else ''
        metal = f['metal'] if f else ''
        name = esc(re.sub(r'\s*finish\s*$', '', term, flags=re.I).strip().title())
        inner = (f'<span class="fc-ph">{ph}</span>' if ph else '') + f'<span class="fc-b"><span class="label">{esc(metal)}</span><span class="fc-nm">{name}</span><span class="fc-ds">{esc(desc)}</span></span>'
        out.append(f'<a class="fc" href="{f["href"]}">{inner}<span class="fc-go" aria-hidden="true">→</span></a>' if f else f'<div class="fc">{inner}</div>')
    return '<div class="fcards">' + ''.join(out) + '</div>'

def tick_cards(items):
    out = []
    for txt in items:
        m = _TERMRE.match(txt)
        body = f'<b>{esc(m.group(1))}</b><span>{esc(m.group(2))}</span>' if m else f'<span>{esc(txt)}</span>'
        out.append(f'<li>{icon(icon_for(txt) if m else "check")}<div>{body}</div></li>')
    return '<ul class="ticks">' + ''.join(out) + '</ul>'

def proc_steps(items):
    out = []
    for n, txt in enumerate(items, 1):
        t = re.sub(r'^(We then|Then we|We)\s+', '', txt.strip()).rstrip('.')
        t = t[:1].upper() + t[1:]
        out.append(f'<li><span class="ps-top">{icon(icon_for(txt))}<span class="ps-n">{n:02d}</span></span><p>{esc(t)}</p></li>')
    return f'<ol class="psteps" style="--n:{len(items)}">' + ''.join(out) + '</ol>'

def feat_cards(groups):
    out = []
    for h, bl in groups:
        k = icon_for(h + ' ' + ' '.join(b.get('text', '') for b in bl))
        out.append(f'<article class="feat">{icon(k)}<h3>{esc(h)}</h3><div class="feat-b">{_render_blocks_v1(bl)}</div></article>')
    return '<div class="feats">' + ''.join(out) + '</div>'

_render_blocks_v1 = render_blocks
def render_blocks(blocks):
    out = []; chunk = []; i = 0; n = len(blocks)
    def flush():
        nonlocal chunk
        if chunk: out.append(_render_blocks_v1(chunk)); chunk = []
    while i < n:
        b = blocks[i]; t = b['t']
        prev_img = i > 0 and blocks[i - 1]['t'] == 'img'
        # runs of list items
        if t == 'li' and not prev_img and not b.get('href'):
            j = i
            while j < n and blocks[j]['t'] == 'li' and not blocks[j].get('href'): j += 1
            run = [x['text'] for x in blocks[i:j]]
            fm = [_FINRE.match(x) for x in run]
            if len(run) >= 3 and sum(1 for m in fm if m) >= max(3, len(run) - 1):
                flush(); out.append(fin_cards([(m.group(1), m.group(2)) if m else (x, '') for m, x in zip(fm, run)])); i = j; continue
            if len(run) >= 3 and all(len(x.split()) <= 45 for x in run):
                flush(); out.append(tick_cards(run)); i = j; continue
            chunk.extend(blocks[i:j]); i = j; continue
        # "... like this:" followed by short steps
        if t == 'p' and b['text'].rstrip().endswith(':'):
            j = i + 1
            while j < n and blocks[j]['t'] == 'p' and len(blocks[j]['text'].split()) <= 28 and not blocks[j]['text'].rstrip().endswith(':'): j += 1
            if j - i - 1 >= 3:
                chunk.append(b); flush(); out.append(proc_steps([x['text'] for x in blocks[i + 1:j]])); i = j; continue
        # two or more short h3 sub-sections become feature cards
        if t in ('h3', 'h4'):
            groups = []; j = i
            while j < n and blocks[j]['t'] == t:
                k = j + 1; bl = []
                while k < n and blocks[k]['t'] in ('p', 'li'): bl.append(blocks[k]); k += 1
                if not bl or sum(len(x['text'].split()) for x in bl) > 140: break
                groups.append((blocks[j]['text'], bl)); j = k
            if len(groups) >= 2:
                flush(); out.append(feat_cards(groups)); i = j; continue
        chunk.append(b); i += 1
    flush()
    return '\n'.join(out)

def ready_card(s, used):
    bl = s['blocks']
    im = next((b['src'] for b in bl if b['t'] == 'img' and valid(b['src'])), None)
    if not im:
        pool = [x for x in PROJECTS if x['imgs']]
        im = pool[sum(map(ord, s.get('label') or 'x')) % len(pool)]['imgs'][0] if pool else None
    paras = [b['text'] for b in bl if b['t'] == 'p' and 'form below' not in b['text'].lower()]
    txt = ' '.join(paras).lower()
    chips = [('ruler', 'Cut to your size'), ('layers', 'Any of our finishes')]
    if 'wood' in txt: chips.append(('wood', 'Wrapped around wood'))
    if 'lacquer' in txt: chips.append(('shield', 'Lacquer finished'))
    if 'team' in txt or 'work with you' in txt: chips.append(('hand', 'Guided by our team'))
    chips.append(('clock', '5–8 weeks, made to order'))
    chips_html = ''.join(f'<li>{icon(k)}<span>{esc(l)}</span></li>' for k, l in chips[:4])
    label = s.get('label') or 'Bespoke'
    return f'''<section class="ready rv"><div class="wrap"><div class="ready-in">
<figure class="ready-img rvimg">{imgtag(im, label, 1400) if im else ''}<span class="ready-badge">{icon("check")}Ready to fit</span></figure>
<div class="ready-tx"><span class="label">{esc(label)}</span><h2 class="d2">Ready to go</h2>{''.join(f'<p>{esc(p_)}</p>' for p_ in paras)}
<ul class="ready-chips">{chips_html}</ul>
<div class="btnrow"><a class="btn btn-v" href="bespoke.html#quote">Request a quote</a><a class="btn" href="samples.html">Order a sample</a></div></div>
</div></div></section>'''

_render_sections_v4 = render_sections
def render_sections(secs, used=None, start=0):
    used = used if used is not None else set()
    for i, s in enumerate(secs):
        if (s.get('h') or '').strip().lower() == 'ready to go' and i > 0 and secs[i - 1]['blocks'] and secs[i - 1]['blocks'][-1]['t'] == 'img':
            s['blocks'].insert(0, secs[i - 1]['blocks'].pop())
    out = []; grp = []
    for s in secs:
        if (s.get('h') or '').strip().lower() == 'ready to go':
            if grp: out.append(_render_sections_v4(grp, used, start)); grp = []
            out.append(ready_card(s, used))
        else: grp.append(s)
    if grp: out.append(_render_sections_v4(grp, used, start))
    return '\n'.join(out)
