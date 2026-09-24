/* Mark Roman Pāli terms in Chinese reading passages without rewriting book text. */
(()=>{
  'use strict';
  const reader=document.getElementById('reader-main');
  if(!reader)return;
  const chinese='.zh-text,.source-paragraph,.single-text,.numbered-item,.rule-item,.ch10-chinese-line,.source-meaning,.opening-quotation,.translation-cell,.chinese-cell,.prose-zh-cell,.book-heading,.chapter-title';
  const skip='.pali-word,[data-word],.pali-cell,.pali-source-line,.ch10-pali-line,.opening-pali,.en-cell,.en-text,.english-prose,.translation-en,.heading-en,.title-en,.note-en,.en-title,.toc-en,.pinyin,rt,button,a,script,style,[hidden],[aria-hidden="true"],.cover-card,.contents,.contents-panel,.modal,.footnote-popup';
  const latin=/[\p{Script=Latin}][\p{Script=Latin}\p{Mark}]*/gu;
  const nodes=[];
  const walker=document.createTreeWalker(reader,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
    const node=walker.currentNode,parent=node.parentElement;
    if(!parent||!parent.closest(chinese)||parent.closest(skip))continue;
    if(!/[\p{Script=Latin}]/u.test(node.data))continue;
    nodes.push(node);
  }
  for(const node of nodes){
    if(!node.isConnected)continue;
    const source=node.data,fragment=document.createDocumentFragment();
    let last=0,count=0;
    for(const match of source.matchAll(latin)){
      const word=match[0];
      // Avoid reference letters and Roman numerals in source citations.
      if(word.length<2||/^\.[0-9]/.test(source.slice(match.index+word.length))||/^(?:ii|iii|iv|vi|vii|viii|ix|xi|xii|pdf|isbn|suttacentral)$/i.test(word))continue;
      fragment.append(document.createTextNode(source.slice(last,match.index)));
      const span=document.createElement('span');
      span.className='pali-word';
      span.dataset.word=word;
      span.setAttribute('role','button');
      span.setAttribute('tabindex','0');
      span.setAttribute('title','点击查询 PCED');
      span.textContent=word;
      fragment.append(span);
      last=match.index+word.length;
      count++;
    }
    if(!count)continue;
    fragment.append(document.createTextNode(source.slice(last)));
    node.replaceWith(fragment);
  }
})();
