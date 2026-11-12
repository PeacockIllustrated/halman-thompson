# Turn scraped rendered.html into structured content.json
import os,re,json,sys
from bs4 import BeautifulSoup, NavigableString
SRC='/mnt/project-files/halman-thompson-site/'
IMGDIR=SRC+'assets/images/'
have=set(os.listdir(IMGDIR))
def localname(u):
    if not u: return None
    u=u.split('?')[0]
    n=os.path.basename(u)
    try:
        from urllib.parse import unquote; n=unquote(n)
    except: pass
    n=re.sub(r'[^a-zA-Z0-9._-]+','-',n)[:100]
    if n in have: return n
    # strip WP size suffix -1024x683
    b=re.sub(r'-\d+x\d+(\.\w+)$',r'\1',n)
    if b in have: return b
    stem=os.path.splitext(b)[0]
    for h in have:
        if h.startswith(stem) : return h
    return None
def best(img):
    for a in ('data-large_image','data-src','data-lazy-src'):
        if img.get(a): return img.get(a)
    ss=img.get('srcset') or img.get('data-srcset') or ''
    c=[]
    for part in ss.split(','):
        bits=part.strip().split()
        if bits: c.append((int(re.sub(r'\D','',bits[1]) or 0) if len(bits)>1 else 0,bits[0]))
    if c: return sorted(c)[-1][1]
    return img.get('src')
SKIP_CLASS=re.compile(r'^(cky-|top-bar|site-header|site-footer|footer|mobile-menu|header-search|speak|chat|cookie|woocommerce-breadcrumb)')
TEXT_TAGS={'h1','h2','h3','h4','h5','h6','p','li','blockquote','figcaption'}
def clean(t): return re.sub(r'\s+',' ',t).strip()
def blocks_of(root):
    out=[]; seen_img=set()
    def bg(el):
        st=el.get('style') or ''
        m=re.search(r'url\([\'"]?([^\'")]+)',st)
        if m:
            n=localname(m.group(1))
            if n and n not in seen_img: seen_img.add(n); out.append({'t':'img','src':n,'alt':'','bg':True})
    def walk(el):
        for c in el.children:
            if isinstance(c,NavigableString): continue
            if c.name in ('script','style','noscript','svg','form','select','button','iframe','template'): 
                if c.name=='iframe' and c.get('src'): out.append({'t':'embed','src':c.get('src')})
                continue
            cls=' '.join(c.get('class') or [])
            if any(SKIP_CLASS.match(x) for x in (c.get('class') or [])): continue
            if c.name in ('header','footer','nav'): continue
            bg(c)
            if c.name=='img':
                n=localname(best(c))
                if n and n not in seen_img and not n.endswith('.svg'):
                    seen_img.add(n); out.append({'t':'img','src':n,'alt':clean(c.get('alt') or '')})
                continue
            if c.name in TEXT_TAGS:
                # images inside
                for im in c.find_all('img'):
                    n=localname(best(im))
                    if n and n not in seen_img and not n.endswith('.svg'): seen_img.add(n); out.append({'t':'img','src':n,'alt':clean(im.get('alt') or '')})
                t=clean(c.get_text(' '))
                if t:
                    b={'t':c.name,'text':t}
                    a=c.find('a',href=True)
                    if a and c.name in('li','p') and clean(a.get_text())==t: b['href']=a['href']
                    out.append(b)
                continue
            if c.name=='a' and ('btn' in cls or 'button' in cls):
                t=clean(c.get_text(' '))
                if t: out.append({'t':'cta','text':t,'href':c.get('href')})
                continue
            if c.name in ('table',):
                rows=[[clean(td.get_text(' ')) for td in tr.find_all(['td','th'])] for tr in c.find_all('tr')]
                out.append({'t':'table','rows':rows}); continue
            walk(c)
    walk(root)
    # dedupe consecutive identical text
    res=[]
    for b in out:
        if res and b.get('text') and res[-1].get('text')==b.get('text'): continue
        res.append(b)
    return res
pages=[]
for slug in sorted(os.listdir(SRC+'pages')):
    d=SRC+'pages/'+slug+'/'
    if not os.path.exists(d+'rendered.html') or not os.path.exists(d+'meta.json'): continue
    meta=json.load(open(d+'meta.json'))
    html=open(d+'rendered.html').read()
    s=BeautifulSoup(html,'html.parser')
    body=s.body
    if not body: continue
    bc=body.get('class') or []
    kind=('home' if 'home' in bc else 'post' if 'single-post' in bc else 'finish' if 'single-finish' in bc else 'project' if 'single-project' in bc else 'product' if 'single-product' in bc else 'testimonial' if 'single-testimonials' in bc else 'shop' if 'woocommerce-shop' in bc or 'post-type-archive-product' in bc else 'page' if 'page' in bc else 'archive')
    m=meta.get('meta',meta)
    title=(m.get('title') if isinstance(m,dict) else meta.get('title')) or meta.get('title')
    desc=(m.get('description') if isinstance(m,dict) else None) or meta.get('description')
    # remove chrome
    for sel in ['header','footer','.top-bar','[class^=cky]','.site-footer','.mobile-menu','#header-search-popout']:
        for e in body.select(sel): e.decompose()
    blocks=blocks_of(body)
    # drop leading junk before h1
    h1=next((i for i,b in enumerate(blocks) if b['t']=='h1'),None)
    url=meta.get('url')
    path='/'+url.split('halmanthompson.com',1)[1].strip('/')
    path=path if path!='/' else '/'
    date=None
    mm=re.search(r'"datePublished":"([^"]+)"',html)
    if mm: date=mm.group(1)[:10]
    price=meta.get('price')
    pages.append({'slug':slug,'path':path,'kind':kind,'title':title,'description':desc,'date':date,'price':price,'blocks':blocks,'h1index':h1,'source':meta.get('source','crawl')})
json.dump(pages,open(sys.argv[1],'w'),indent=1)
import collections
print(collections.Counter(p['kind'] for p in pages))
print(sum(len(p['blocks']) for p in pages), sum(1 for p in pages for b in p['blocks'] if b['t']=='img'))
