"""Convert the supplied 2017 DOCX intermediary, preserving Word content and roles.

Usage: python convert-workings-of-kamma.py source.docx repository-directory
The binary .doc is first opened and saved as DOCX by LibreOffice, without editing.
Only front-cover duplicates, blank print spacers and the printed Contents are
replaced. Pali compound separators U+2219 are removed; sentence dots are kept.
"""
from pathlib import Path
from zipfile import ZipFile
from collections import Counter
from copy import deepcopy
from html import escape
import json, re, sys, unicodedata
from lxml import etree as ET, html as LH

SOURCE, REPO = Path(sys.argv[1]), Path(sys.argv[2])
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
NS = {'w': W, 'r': R, 'a':'http://schemas.openxmlformats.org/drawingml/2006/main',
      'mc':'http://schemas.openxmlformats.org/markup-compatibility/2006'}
def q(name): return '{'+W+'}'+name
def tag(el): return ET.QName(el).localname
def val(el, default=None): return el.get(q('val'),default) if el is not None else default
def text(el): return ''.join(el.xpath('.//w:t/text()', namespaces=NS))
def normal(s): return re.sub(r'\s+', ' ', s).strip()
def clean(s): return unicodedata.normalize('NFC',s.replace('∙','').replace('·','').replace('\u00ad',''))
def esc(s): return escape(str(s),quote=True)

z=ZipFile(SOURCE)
doc=ET.fromstring(z.read('word/document.xml'));body=doc.find(q('body'))
styles={el.get(q('styleId')):el for el in ET.fromstring(z.read('word/styles.xml'))}
rels={}
for part in ['document','footnotes','endnotes']:
    filename='word/_rels/'+part+'.xml.rels'
    rels[part]={el.get('Id'):el.get('Target') for el in ET.fromstring(z.read(filename))} if filename in z.namelist() else {}

def properties(style_id,kind):
    s=styles.get(style_id)
    if s is None:return {}
    parent=val(s.find(q('basedOn')))
    out=properties(parent,kind) if parent else {}
    p=s.find(q(kind))
    if p is not None:
        for c in p:out[tag(c)]=dict(c.attrib)
    return out
def props_for(el,kind,base):
    out=properties(base,kind)
    p=el.find(q(kind))
    if p is not None:
        for c in p:
            k=tag(c);out[k]={**out.get(k,{}),**dict(c.attrib)}
    return out
def prop(pr,key,attr='val',default=None):return pr.get(key,{}).get(q(attr),default)
def enabled(pr,key):return key in pr and prop(pr,key,default='1') not in ['0','false','off']

assets=REPO/'workings-of-kamma-assets';assets.mkdir(exist_ok=True)
counts=Counter();font_map=Counter();note_seen={'footnote':[], 'endnote':[]}
note_labels={};endnote_groups={};pending_endnotes=[];toc=[];paragraph_checks=[];image_files=set()
main_paragraphs=body.findall(q('p'));pindexes={p:i for i,p in enumerate(main_paragraphs)}
all_bookmarks={el.get(q('name')) for part in ['document','footnotes','endnotes'] for el in ET.fromstring(z.read('word/'+part+'.xml')).findall('.//'+q('bookmarkStart'))}
emitted_bookmarks=set();unhandled=Counter();current_part='document';last_heading='';note_building=False

def bookmark(name):
    if not name or name in emitted_bookmarks:return ''
    emitted_bookmarks.add(name)
    return '<span class="source-anchor" id="'+esc(name)+'"></span>'

def picture(el):
    # AlternateContent chooses one representation; do not duplicate fallback.
    global last_heading
    imgs=[]
    for blip in el.xpath('.//a:blip',namespaces=NS):
        rid=blip.get('{'+R+'}embed');target=rels.get(current_part,{}).get(rid)
        if not target:continue
        srcname='word/'+target.lstrip('/')
        data=z.read(srcname)
        filename=Path(target).name
        dest=assets/filename
        if not dest.exists():dest.write_bytes(data)
        image_files.add(filename);counts['image_uses']+=1
        imgs.append('<figure class="source-figure"><img src="workings-of-kamma-assets/'+esc(filename)+'" alt="'+esc('Source illustration — '+last_heading)+'" loading="lazy"></figure>')
    boxes=el.findall('.//'+q('txbxContent'))
    for box in boxes:
        imgs.append('<div class="source-drawing">'+blocks(box)+'</div>')
    return ''.join(imgs)

def inline(el,pstyle='Normal',base_r=None):
    global current_part
    name=tag(el)
    if name=='r':
        rp=props_for(el,'rPr',pstyle)
        cstyle=val(el.find('w:rPr/w:rStyle',NS))
        if cstyle:
            rp={**properties(pstyle,'rPr'),**properties(cstyle,'rPr')}
            direct=el.find(q('rPr'))
            if direct is not None:
                for c in direct:rp[tag(c)]={**rp.get(tag(c),{}),**dict(c.attrib)}
        family=prop(rp,'rFonts','ascii','Tahoma')
        if family not in ['Symbol','Wingdings','Wingdings 2','Wingdings 3']:font_map[family]+=1
        out=''.join(inline(c,pstyle,rp) for c in el if tag(c)!='rPr')
        if not out:return ''
        if '<figure' in out or '<div' in out:return out
        # Pali role comes from Word's explicit styles, not a paragraph-wide guess.
        raw=text(el);pali='Pali' in (cstyle or '') or pstyle=='PQPali' or '∙' in raw or (enabled(rp,'i') and bool(re.search('[āīūṅñṭḍṇḷṁṃĀĪŪṄÑṬḌṆḶ]',raw)))
        classes=['pali-run' if pali else 'source-run'];css=[]
        if prop(rp,'color')=='FFFFFF' and re.fullmatch(r'x+',raw):classes.append('source-print-spacer')
        if enabled(rp,'b'):css.append('font-weight:700')
        if enabled(rp,'i'):css.append('font-style:italic')
        if enabled(rp,'smallCaps'):css.append('font-variant:small-caps')
        if enabled(rp,'caps'):css.append('text-transform:uppercase')
        if enabled(rp,'strike'):css.append('text-decoration:line-through')
        if prop(rp,'u',default='none') not in ['none',None]:css.append('text-decoration:underline')
        size=float(prop(rp,'sz',default=20))/20
        if abs(size-1)>0.01:css.append('--source-size:'+str(round(max(.7,min(size,2)),3)))
        if family in ['Times New Roman','Calibri','Script MT Bold'] and not pali:classes.append('font-'+{'Times New Roman':'times','Calibri':'calibri','Script MT Bold':'script'}[family])
        sup=prop(rp,'vertAlign')
        if sup in ['superscript','subscript']:out=('<sup>' if sup=='superscript' else '<sub>')+out+('</sup>' if sup=='superscript' else '</sub>')
        return '<span class="'+' '.join(classes)+'"'+(' aria-hidden="true"' if 'source-print-spacer' in classes else '')+(' style="'+';'.join(css)+'"' if css else '')+'>'+out+'</span>'
    if name in ['t','delText']:return esc(clean(el.text or '')) if name=='t' else ''
    if name=='tab':return '<span class="source-tab"> </span>'
    if name in ['br','cr']:return '' if el.get(q('type'))=='page' else '<br>'
    if name=='noBreakHyphen':return '‑'
    if name in ['softHyphen','rPr','pPr','bookmarkEnd','instrText','footnoteRef','endnoteRef','lastRenderedPageBreak','proofErr']:return ''
    if name=='bookmarkStart':return bookmark(el.get(q('name')))
    if name in ['footnoteReference','endnoteReference']:
        kind=name[:-9];nid=el.get(q('id'));key=(kind,nid)
        if key not in note_labels:
            note_labels[key]=str(len(note_seen[kind])+1);note_seen[kind].append(nid)
            if kind=='endnote' and not note_building:pending_endnotes.append(nid)
        label=note_labels[key];pref='fn' if kind=='footnote' else 'en'
        return '<sup><a class="fn-marker" id="ref-'+pref+'-'+nid+'" href="#'+pref+'-'+nid+'" data-note="'+pref+'-'+nid+'" aria-label="'+kind.title()+' '+label+'">'+('E' if pref=='en' else '')+label+'</a></sup>'
    if name=='hyperlink':
        href='#'+el.get(q('anchor')) if el.get(q('anchor')) else rels.get(current_part,{}).get(el.get('{'+R+'}id'),'')
        content=''.join(inline(c,pstyle,base_r) for c in el)
        if not href or (href.startswith('#') and href[1:] not in all_bookmarks):return content
        return '<a class="source-link" href="'+esc(href)+'">'+content+'</a>'
    if name=='fldChar':return ''
    if name=='sym':
        font=el.get(q('font'),'');char=el.get(q('char'),'').upper()
        mapping={'F0B7':'•','F0D8':'›','F0FC':'✓','F0AE':'→','F0DF':'⇓','F0A7':'▪','F076':'◆','F0A9':'♥','F0A8':'♦','F092':'→','F084':'➢','F0E5':'↙','F0D5':'↗','F0D6':'↘','F0BD':'⏐','00AF':'↓','F0B9':'≠','F0F0':'→'}
        return mapping.get(char,esc(chr(int(char,16))) if char else '')
    if name=='AlternateContent':
        branch=el.find('mc:Choice',NS)
        if branch is None:branch=el.find('mc:Fallback',NS)
        return ''.join(inline(c,pstyle,base_r) for c in branch) if branch is not None else ''
    if name in ['drawing','pict']:return picture(el)
    if name=='tbl':return table(el)
    if name=='p':return paragraph(el)
    if name in ['sdt','sdtContent','smartTag','ins','fldSimple','customXml']:
        return ''.join(inline(c,pstyle,base_r) for c in el)
    if name in ['del','sectPr','sdtPr','sdtEndPr','permStart','permEnd','commentRangeStart','commentRangeEnd','commentReference']:return ''
    if len(el):return ''.join(inline(c,pstyle,base_r) for c in el)
    if el.text:unhandled[name]+=1
    return ''

def merge_pali(fragment):
    root=LH.fragment_fromstring('<div>'+fragment+'</div>')
    for parent in list(root.iter()):
        for child in list(parent):
            if child.getparent() is not parent or child.get('class')!='pali-run':continue
            nxt=child.getnext()
            while nxt is not None and nxt.get('class')=='pali-run' and not (child.tail or ''):
                if len(child):child[-1].tail=(child[-1].tail or '')+(nxt.text or '')
                else:child.text=(child.text or '')+(nxt.text or '')
                for item in list(nxt):child.append(item)
                child.tail=nxt.tail;parent.remove(nxt);nxt=child.getnext()
    pattern=re.compile(r"[A-Za-zÀ-žĀ-ṿ]+(?:[’'-][A-Za-zÀ-žĀ-ṿ]+)*")
    def words(value):
        result=[];last=0
        for m in pattern.finditer(value or ''):
            result.append(esc(value[last:m.start()]));word=esc(m.group())
            result.append('<span class="pali-word" data-word="'+word+'" tabindex="0" role="button" aria-label="Look up '+word+'">'+word+'</span>');last=m.end()
        return ''.join(result)+esc((value or '')[last:])
    def contents(el):
        out=words(el.text)
        for c in el:
            if c.tag=='sup' or c.get('class')=='fn-marker':
                out+=ET.tostring(c,encoding='unicode',method='html',with_tail=False)
            else:
                copy=deepcopy(c);copy.text=None
                for sub in list(copy):copy.remove(sub)
                opening=ET.tostring(copy,encoding='unicode',method='html',with_tail=False).split('</',1)[0]
                out+=opening+contents(c)+'</'+c.tag+'>'
            out+=words(c.tail)
        return out
    for run in list(root.xpath('.//span[@class="pali-run"]')):
        markup=contents(run);style=run.get('style');tail=run.tail
        replacement=LH.fragment_fromstring('<span class="pali-text" lang="pi">'+markup+'</span>')
        if style:replacement.set('style',style)
        replacement.tail=tail;run.getparent().replace(run,replacement)
    return (root.text or '')+''.join(ET.tostring(c,method='html',encoding='unicode') for c in root)

def paragraph(p,include_notes=True):
    global pending_endnotes,last_heading
    pi=pindexes.get(p,-1);pstyle=val(p.find('w:pPr/w:pStyle',NS),'Normal');raw=text(p)
    if not raw.strip() and not p.findall('.//'+q('drawing')) and not p.findall('.//'+q('pict')) and not p.findall('.//'+q('bookmarkStart')) and not p.findall('.//'+q('sym')):return ''
    pr=props_for(p,'pPr',pstyle);classes=['source-paragraph'];css=[]
    match=re.fullmatch(r'Heading(\d+)',pstyle);level=int(match.group(1)) if match else None
    if pi in [4782,4836,4854]:level=2
    if pstyle=='IndexHeading':level=3
    if level:
        name='h'+str(min(6,max(2,level)));classes+=['section-heading' if level==2 else 'subsection-heading','source-level-'+str(level)];last_heading=normal(clean(raw))
    else:name='p'
    if pstyle=='PQPali':classes.append('pali-text')
    if pstyle.lower().startswith('index'):classes.append('source-index')
    if not level:
        ind=pr.get('ind',{});left=float(ind.get(q('start'),ind.get(q('left'),0)))/200;right=float(ind.get(q('end'),ind.get(q('right'),0)))/200
        first=float(ind.get(q('firstLine'),0))/200-float(ind.get(q('hanging'),0))/200
        css+=['--source-left:'+str(round(left,3))+'em','--source-right:'+str(round(right,3))+'em','--source-indent:'+str(round(first,3))+'em']
        alignment=prop(pr,'jc',default='left');css.append('text-align:'+{'both':'justify','start':'left','end':'right','distribute':'left'}.get(alignment,alignment))
    ident='source-p-'+str(pi) if pi>=0 else ''
    if level:
        ident='section-'+str(len(toc)+1);toc.append({'id':ident,'level':level,'title':normal(clean(raw))})
    inner=''.join(inline(c,pstyle) for c in p if tag(c)!='pPr')
    if not inner.strip():return ''
    inner=merge_pali(inner)
    if not raw.strip() and not p.findall('.//'+q('drawing')) and not p.findall('.//'+q('pict')):
        return inner
    # A Word textbox may contain a whole table, outside the surrounding prose.
    fragment=LH.fragment_fromstring('<div>'+inner+'</div>')
    block_children=fragment.xpath('./div|./figure')
    extra=''
    for item in block_children:
        extra+=ET.tostring(item,encoding='unicode',method='html');fragment.remove(item)
    if block_children:inner=(fragment.text or '')+''.join(ET.tostring(c,method='html',encoding='unicode') for c in fragment)
    attrs=' class="'+' '.join(classes)+'"'+(' id="'+ident+'"' if ident else '')+(' style="'+';'.join(css)+'"' if css else '')+(' data-source-style="'+esc(pstyle)+'"')
    if pstyle!='PQPali':attrs+=' data-lang="en"'
    rendered='<'+name+attrs+'>'+inner+'</'+name+'>'+extra
    counts['paragraphs']+=1
    if pi>=813:paragraph_checks.append({'index':pi,'text':clean(raw)})
    if include_notes and level and normal(raw).startswith('Endnotes') and current_part=='document':
        group=list(pending_endnotes);pending_endnotes=[];endnote_groups[ident]=group
        rendered+='<div class="endnote-list">'+''.join(render_note('endnote',nid,visible=True) for nid in group)+'</div>'
    return rendered

def table(tbl):
    counts['tables']+=1
    grid=tbl.find(q('tblGrid'));widths=[int(x.get(q('w'),'0')) for x in grid] if grid is not None else []
    rows=[];active={}
    for tr in tbl.findall(q('tr')):
        out=[];column=0
        for tc in tr.findall(q('tc')):
            span=int(val(tc.find('w:tcPr/w:gridSpan',NS),'1'));vm=tc.find('w:tcPr/w:vMerge',NS)
            if vm is not None and val(vm,'continue')=='continue':
                if column in active:active[column]['rowspan']+=1
                column+=span;continue
            cell={'span':span,'rowspan':1,'html':blocks(tc),'styles':[]}
            shade=tc.find('w:tcPr/w:shd',NS)
            if shade is not None and shade.get(q('fill')) not in [None,'auto','FFFFFF']:cell['styles'].append('background:#'+shade.get(q('fill')))
            va=val(tc.find('w:tcPr/w:vAlign',NS),'top');cell['styles'].append('vertical-align:'+{'center':'middle'}.get(va,va))
            if vm is not None:active[column]=cell
            else:active.pop(column,None)
            out.append(cell);column+=span
        rows.append(out)
    bordered=bool(tbl.xpath('.//w:tcBorders/*[@w:val="single" or @w:val="double"]|./w:tblPr/w:tblBorders/*[@w:val="single"]',namespaces=NS))
    htmlrows=[]
    for row in rows:
        cells=[]
        for c in row:
            attr=(' colspan="'+str(c['span'])+'"' if c['span']>1 else '')+(' rowspan="'+str(c['rowspan'])+'"' if c['rowspan']>1 else '')
            cells.append('<td'+attr+' style="'+';'.join(c['styles'])+'">'+c['html']+'</td>')
        htmlrows.append('<tr>'+''.join(cells)+'</tr>')
    ncols=max((sum(c['span'] for c in row) for row in rows),default=1)
    minwidth=max(0, min(1000, ncols*65)) if ncols>4 else 0
    cols=''
    if widths and sum(widths):cols='<colgroup>'+''.join('<col style="width:'+str(round(x/sum(widths)*100,3))+'%">' for x in widths)+'</colgroup>'
    return '<div class="table-scroll" tabindex="0" role="region" aria-label="Source table '+str(counts['tables'])+'"><table class="source-table '+('bordered' if bordered else 'unbordered')+'" style="'+('min-width:'+str(minwidth)+'px' if minwidth else '')+'">'+cols+'<tbody>'+''.join(htmlrows)+'</tbody></table></div>'

def blocks(parent):
    result=[]
    for c in parent:
        if tag(c)=='p':result.append(paragraph(c))
        elif tag(c)=='tbl':result.append(table(c))
        elif tag(c) in ['sdt','sdtContent']:result.append(blocks(c))
    return ''.join(result)

note_xml={}
for kind in ['footnote','endnote']:
    root=ET.fromstring(z.read('word/'+kind+'s.xml'))
    note_xml[kind]={el.get(q('id')):el for el in root if el.get(q('type')) is None}
note_cache={}
def render_note(kind,nid,visible=False):
    global current_part,note_building
    key=(kind,nid)
    if key not in note_cache:
        prior=current_part;current_part=kind+'s';note_building=True
        contents=blocks(note_xml[kind][nid]);note_building=False;current_part=prior
        pref='fn' if kind=='footnote' else 'en';label=note_labels[key]
        note_cache[key]='<article class="note-entry" id="'+pref+'-'+nid+'" data-note-label="'+kind.title()+' '+label+'"><div class="note-label"><a href="#ref-'+pref+'-'+nid+'" aria-label="Return to note reference">'+('E' if pref=='en' else '')+label+' ↩</a></div>'+contents+'</article>'
    return note_cache[key]

# This source has two print cover/title repetitions followed by the legal/front
# matter, a printed overview and detailed Contents, then the complete book body.
front=[];main=[]
for item in body:
    if tag(item)=='p':
        i=pindexes[item]
        if 110<=i<=122 or 245<=i<=290:front.append(paragraph(item))
        elif i>=813:main.append(paragraph(item))
    elif tag(item)=='tbl':main.append(table(item))
main_html='\n'.join(main)
footnote_html=''.join(render_note('footnote',nid) for nid in list(note_seen['footnote']))
remaining=[nid for nid in note_seen['endnote'] if ('endnote',nid) not in note_cache]
if remaining:main_html+='<h2 class="section-heading">Additional Endnotes</h2>'+''.join(render_note('endnote',nid,True) for nid in remaining)

toc_html=''.join('<a class="toc-row toc-level-'+str(min(t['level'],6))+'" href="#'+t['id']+'">'+esc(t['title'])+'</a>' for t in toc)
logo=LH.parse(str(REPO/'mindfulness-of-breathing.html')).xpath('//a[contains(@class,"app-home-logo")]/img/@src')[0]
header=f'''<header class="topbar"><div class="topbar-inner"><div class="app-brand"><a class="app-home-logo" href="index.html" aria-label="Book catalogue"><img src="{logo}" alt="Pa-Auk emblem"></a><span class="app-brand-title">The Workings of Kamma</span></div><button id="contentsBtn" type="button">Contents</button><button id="fontMinus" type="button" aria-label="Decrease text size">A−</button><button id="fontPlus" type="button" aria-label="Increase text size">A+</button><button aria-controls="db-readaloud-panel" aria-expanded="false" aria-label="Read aloud" aria-pressed="false" class="db-readaloud-button" id="dbReadAloudButton" title="Read aloud" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6.5 9H3v6h3.5L11 19V5Z"></path><path d="M15 9a4 4 0 0 1 0 6"></path><path d="M18 6a8 8 0 0 1 0 12"></path></svg></button><div class="db-standard-controls" id="db-standard-controls"><button id="db-bookmark-button" class="db-bookmark-button" type="button" aria-label="Open book marks">Book Mark</button><div class="db-searchbox"><input id="db-search-input" type="search" placeholder="Search text…" aria-label="Search book text" autocomplete="off"><button id="db-search-button" type="button">Search</button><span class="db-search-status" id="db-search-status" aria-live="polite"></span></div></div></div></header>'''
cover='''<section class="cover" id="book-cover"><img class="official-book-cover" src="workings-of-kamma-cover-2017.jpg" width="261" height="400" alt="The Workings of Kamma — Second Revised Edition"><div class="cover-text"><h1>The Workings of Kamma</h1><p class="edition">Second Revised Edition · 2017</p><p>The Pa-Auk Tawya Sayadaw</p><p class="gift-notice">A Gift — Not for Sale</p></div></section>'''
popups='''<div class="modal" id="noteModal" aria-hidden="true"><div class="panel" role="dialog" aria-labelledby="noteTitle"><div class="panel-head"><div class="panel-title" id="noteTitle">Footnote</div><button type="button" class="close" id="noteClose" aria-label="Close footnote">×</button></div><div class="panel-body note-text" id="noteBody"></div></div></div><div class="modal" id="dictModal" aria-hidden="true"><div class="panel" role="dialog" aria-labelledby="dictTitle"><div class="panel-head"><div class="panel-title" id="dictTitle">Dictionary</div><button type="button" class="close" id="dictClose" aria-label="Close dictionary">×</button></div><div class="panel-meta" id="dictMeta"></div><div class="panel-body" id="dictBody"></div></div></div>'''
result='''<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Workings of Kamma · Pa-Auk Tawya Sayadaw</title><link rel="stylesheet" href="dhamma-books-reader-standard.css?v=1.3.24"><link rel="stylesheet" href="dhamma-books-read-aloud-books.css?v=1.3.1"><link rel="stylesheet" href="pced-books-popup.css?v=1.0.0"><link rel="stylesheet" href="workings-of-kamma.css?v=1.0.1"><link rel="stylesheet" href="dhamma-books-cover-width-standard.css?v=1.0.0"><link rel="stylesheet" href="dhamma-books-page-width-standard.css?v=1.0.0"></head><body class="db-standard-contents db-book-cover-standard db-page-standard-width kamma-reader">'''+header+'<main id="reader-main" class="reader active" data-lang="en">'+cover+'<section class="front-matter" aria-label="Publication information">'+''.join(front)+'</section><section class="contents" id="book-contents"><div class="contents-head"><h2>Content</h2><button class="contents-toggle" id="contentsToggle" type="button" aria-expanded="true" aria-controls="contents-scroll">Collapse</button></div><div class="contents-scroll" id="contents-scroll">'+toc_html+'</div></section><article class="book-body" id="book-body">'+main_html+'</article></main><div id="note-bank" hidden>'+footnote_html+'</div>'+popups+'<footer>Pa-Auk Meditation Centre (Singapore)</footer><script src="dhamma-books-reader-standard.js?v=1.3.21"></script><script src="dhamma-books-read-aloud-standard.js?v=1.4.6"></script><script src="dhamma-books-read-aloud-universal.js?v=1.3.6"></script><script src="dhamma-books-mobile-screen-awake.js?v=1.0.0"></script><script defer src="pced-standard-data.js"></script><script defer src="workings-of-kamma.js?v=1.0.1"></script><script defer src="pced-approved-terms.js"></script><script defer src="pced-lookup-core.js?v=3.9.28"></script><script defer src="pced-popup-standard.js?v=1.8.33" data-pced-mode="book"></script></body></html>'
(REPO/'workings-of-kamma.html').write_text(result,encoding='utf-8')
report={'source':SOURCE.name,'source_fonts':dict(font_map),'font_map':{'English prose/quotations/notes':'Tahoma, Geneva, sans-serif','Pali':'Times New Roman, Noto Serif, serif; italic; #155CA8','Times New Roman':'Times New Roman, serif','Calibri':'Calibri, Carlito, sans-serif','Script MT Bold':'Script MT Bold, cursive','VriRomanPali CN':'Only punctuation/space in this source; no encoded Pali letters'},'counts':dict(counts),'headings':len(toc),'footnotes':len(note_seen['footnote']),'endnotes':len(note_seen['endnote']),'image_files':sorted(image_files),'endnote_groups':{k:len(v) for k,v in endnote_groups.items()},'unhandled':dict(unhandled)}
(REPO/'workings-of-kamma-conversion.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
Path('kamma-work/paragraph-checks.json').write_text(json.dumps(paragraph_checks,ensure_ascii=False))
print(json.dumps(report,ensure_ascii=False,indent=2))
