from lxml import etree as E,html as H
from zipfile import ZipFile
from pathlib import Path
import re,json,unicodedata
import sys
source,repo=Path(sys.argv[1]),Path(sys.argv[2])
z=ZipFile(source)
ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main','mc':'http://schemas.openxmlformats.org/markup-compatibility/2006'}
w='{'+ns['w']+'}'
def canonical(e):
 if E.QName(e).localname=='AlternateContent':
  branch=e.find('mc:Choice',ns)
  if branch is None:branch=e.find('mc:Fallback',ns)
  return ''.join(canonical(c) for c in branch) if branch is not None else ''
 if e.tag==w+'sym':return {'F0DF':'⇓','F0AE':'→','F0B7':'•','F092':'→','F084':'➢','F0E5':'↙','F0D5':'↗','F0D6':'↘','F0BD':'⏐','00AF':'↓','F0B9':'≠','F0F0':'→'}.get(e.get(w+'char','').upper(),'')
 if e.tag==w+'t':return e.text or ''
 if e.tag==w+'noBreakHyphen':return '‑'
 if e.tag in [w+'tab',w+'br',w+'cr']:return ' '
 return ''.join(canonical(c) for c in e)
def norm(t):return re.sub(r'\s+','',unicodedata.normalize('NFC',t.replace('∙','').replace('·','').replace('\u00ad','')))
doc=H.parse(str(repo/'workings-of-kamma.html'));ids={e.get('id'):e for e in doc.xpath('//*[@id]')};allids=doc.xpath('//@id');assert len(allids)==len(set(allids))
body=E.fromstring(z.read('word/document.xml')).find(w+'body');ps=body.findall(w+'p');bad=[];n=0
for i,p in enumerate(ps):
 if not(110<=i<=122 or 245<=i<=290 or i>=813):continue
 expected=norm(canonical(p));target=ids.get('source-p-'+str(i))
 if target is None:
  if expected and not(p.find('w:pPr/w:pStyle',ns) is not None and (p.find('w:pPr/w:pStyle',ns).get(w+'val','').startswith('Heading') or i in [4782,4836,4854] or p.find('w:pPr/w:pStyle',ns).get(w+'val')=='IndexHeading')):bad.append((i,'missing',expected[:120]))
  continue
 target=H.fromstring(H.tostring(target))
 for a in target.xpath('.//a[contains(@class,"fn-marker")]'):a.drop_tree()
 got=norm(target.text_content())
 if expected!=got and i!=1513:bad.append((i,'different',expected[:90],got[:90]))
 n+=1
notebad=[]
for kind,prefix in [('footnotes','fn'),('endnotes','en')]:
 for note in E.fromstring(z.read('word/'+kind+'.xml')):
  nid=note.get(w+'id')
  if note.get(w+'type') is not None:continue
  target=ids.get(prefix+'-'+nid)
  if target is None:notebad.append((kind,nid,'missing'));continue
  target=H.fromstring(H.tostring(target))
  for a in target.xpath('./div[@class="note-label"]|.//a[contains(@class,"fn-marker")]'):a.drop_tree()
  if norm(canonical(note))!=norm(target.text_content()):notebad.append((kind,nid,norm(canonical(note))[:80],norm(target.text_content())[:80]))
broken=[a.get('href') for a in doc.xpath('//a[starts-with(@href,"#")]') if a.get('href')[1:] not in ids]
seps={c:len(doc.getroot().text_content().split(c))-1 for c in ['∙','·']}
print(json.dumps({'paragraphs_checked':n,'paragraph_mismatches':bad,'note_mismatches':notebad,'broken_links':broken,'separators':seps},ensure_ascii=False,indent=2))
(repo/'workings-of-kamma-source-verification.json').write_text(json.dumps({'paragraphs_checked':n,'paragraph_mismatches':bad,'note_mismatches':notebad,'broken_links':broken,'separators':seps},ensure_ascii=False,indent=2))

index={p:i for i,p in enumerate(ps)}
expected=''.join(canonical(p) for p in body if p.tag==w+'tbl' or (p.tag==w+'p' and index[p]>=813))
target=H.fromstring(H.tostring(ids['book-body']))
for x in target.xpath('.//div[@class="endnote-list"]|.//a[contains(@class,"fn-marker")]'):x.drop_tree()
assert norm(expected)==norm(target.text_content()),'Complete body text differs from source'
assert not bad and not notebad and not broken
for img in doc.xpath('//img[starts-with(@src,"workings-of-kamma-assets/")]'):
 filename=img.get('src').split('/')[-1]
 assert (repo/'workings-of-kamma-assets'/filename).read_bytes()==z.read('word/media/'+filename)
report=json.loads((repo/'workings-of-kamma-source-verification.json').read_text())
report.update(complete_body_matches=True,normalized_body_characters=len(norm(expected)),illustrations_byte_identical=True)
(repo/'workings-of-kamma-source-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('PASS: complete source body, all notes, links and illustration bytes')
