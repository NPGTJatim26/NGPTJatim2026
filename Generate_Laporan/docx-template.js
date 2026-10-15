/* Penyusun laporan NPGT berbasis template DOCX resmi (Bab I-II tetap, Bab III-IV dari rekap Excel). */
(function(g){
'use strict';
const NSW='http://schemas.openxmlformats.org/wordprocessingml/2006/main',NSR='http://schemas.openxmlformats.org/officeDocument/2006/relationships',XMLNS='http://www.w3.org/XML/1998/namespace';
const TEMPLATE_URL='template/Template-NPGT-Regional.docx';
const FRAG='xmlns:w="'+NSW+'" xmlns:r="'+NSR+'" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
const AFTER_HL=['u','effect','bdr','shd','fitText','vertAlign','rtl','cs','em','lang','eastAsianLayout','specVanish','oMath'];
let DOC=null;

const els=(n,t)=>Array.from(n.getElementsByTagNameNS(NSW,t));
const isW=(n,t)=>!!n&&n.namespaceURI===NSW&&n.localName===t;
const kid=(n,t)=>n?Array.from(n.children).find(c=>isW(c,t))||null:null;
const xe=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const ptext=p=>els(p,'t').map(t=>t.textContent).join('');
const wAttr=(n,a)=>n?n.getAttributeNS(NSW,a):null;

function frag(xml){
  const d=new DOMParser().parseFromString('<root '+FRAG+'>'+xml+'</root>','application/xml');
  const err=d.getElementsByTagName('parsererror')[0];
  if(err)throw new Error('XML tidak valid: '+err.textContent.slice(0,200));
  return Array.from(d.documentElement.children).map(c=>DOC.importNode(c,true));
}

function addHl(rPr){
  if(kid(rPr,'highlight'))return;
  const h=DOC.createElementNS(NSW,'w:highlight');h.setAttributeNS(NSW,'w:val','yellow');
  rPr.insertBefore(h,Array.from(rPr.children).find(c=>c.namespaceURI===NSW&&AFTER_HL.includes(c.localName))||null);
}
function mkRun(text,rPrNode,hl){
  const r=DOC.createElementNS(NSW,'w:r'),rp=rPrNode?rPrNode.cloneNode(true):DOC.createElementNS(NSW,'w:rPr');
  if(hl)addHl(rp);
  if(rp.children.length)r.appendChild(rp);
  const t=DOC.createElementNS(NSW,'w:t');t.setAttributeNS(XMLNS,'xml:space','preserve');t.textContent=text;r.appendChild(t);
  return r;
}

// Ganti seluruh isi paragraf dengan teks baru; [ISI: ...] diberi stabilo kuning.
function setParaText(p,text){
  const runs=els(p,'r').filter(r=>r.getElementsByTagNameNS(NSW,'t').length);
  const hl=r=>!!kid(kid(r,'rPr'),'highlight'),rtx=r=>els(r,'t').map(t=>t.textContent).join('');
  const base=runs.find(r=>!hl(r)&&rtx(r).trim().length>3)||runs[0];
  const rp=base&&kid(base,'rPr')?kid(base,'rPr').cloneNode(true):null;
  if(rp){const h=kid(rp,'highlight');if(h)rp.removeChild(h)}
  Array.from(p.childNodes).forEach(c=>{if(!isW(c,'pPr'))p.removeChild(c)});
  text.split(/(\[ISI[^\]]*\])/).filter(Boolean).forEach(seg=>p.appendChild(mkRun(seg,rp,/^\[ISI/.test(seg))));
}

// Ganti teks lintas-run pada satu paragraf; stabilo dan cetak tebal penanda dihapus pada run yang diganti.
function replaceInPara(p,re,fn){
  const ms=[...ptext(p).matchAll(re)];
  if(!ms.length)return 0;
  for(let k=ms.length-1;k>=0;k--){
    const m=ms[k],a=m.index,b=a+m[0].length,rep=fn(m);
    let pos=0,first=true;const touched=[];
    for(const t of els(p,'t')){
      const s=t.textContent,st=pos,en=st+s.length;pos=en;
      if(en<=a)continue;if(st>=b)break;
      const ls=Math.max(a,st)-st,le=Math.min(b,en)-st;
      t.textContent=first?s.slice(0,ls)+rep+s.slice(le):s.slice(0,ls)+s.slice(le);
      t.setAttributeNS(XMLNS,'xml:space','preserve');first=false;touched.push(t);
    }
    const runs=touched.map(t=>t.parentNode);
    const plain=els(p,'r').find(r=>!runs.includes(r)&&!kid(kid(r,'rPr'),'highlight')&&els(r,'t').map(t=>t.textContent).join('').trim().length>3);
    const plainBold=plain&&!!kid(kid(plain,'rPr'),'b');
    runs.forEach((r,i)=>{
      const rp=kid(r,'rPr');if(!rp)return;
      const h=kid(rp,'highlight');
      if(h){rp.removeChild(h);if(i===0&&plain&&!plainBold)['b','bCs'].forEach(x=>{const e=kid(rp,x);if(e)rp.removeChild(e)})}
    });
  }
  return ms.length;
}

function sectOf(node){
  for(let n=node;n;n=n.nextElementSibling){
    if(isW(n,'p')){const sp=kid(kid(n,'pPr'),'sectPr');if(sp)return sp}
    else if(isW(n,'sectPr'))return n;
  }
  return null;
}
function pageInfo(node){
  const sp=sectOf(node),sz=kid(sp,'pgSz'),mar=kid(sp,'pgMar'),n=(e,a,d)=>+(wAttr(e,a)||d);
  const w=n(sz,'w',11906),h=n(sz,'h',16838);
  return{avail:w-n(mar,'left',1440)-n(mar,'right',1440),availH:h-n(mar,'top',1440)-n(mar,'bottom',1440),land:w>h};
}

// ===== Tabel =====
const rpr=o=>`<w:rPr><w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>${o.b?'<w:b/><w:bCs/>':''}${o.color?`<w:color w:val="${o.color}"/>`:''}<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>${o.hl?'<w:highlight w:val="yellow"/>':''}</w:rPr>`;
function cellXml(text,o){
  const tcPr=`<w:tcPr><w:tcW w:w="${o.w}" w:type="dxa"/>${o.span>1?`<w:gridSpan w:val="${o.span}"/>`:''}${o.vm?`<w:vMerge${o.vm==='restart'?' w:val="restart"':''}/>`:''}${o.fill?`<w:shd w:val="clear" w:color="auto" w:fill="${o.fill}"/>`:''}${o.vert?'<w:textDirection w:val="btLr"/>':''}<w:vAlign w:val="center"/></w:tcPr>`;
  const run=text===''||text==null?'':`<w:r>${rpr(o)}<w:t xml:space="preserve">${xe(text)}</w:t></w:r>`;
  return `<w:tc>${tcPr}<w:p><w:pPr><w:spacing w:after="0" w:line="${o.line||240}" w:lineRule="auto"/>${o.vert?'<w:ind w:left="113" w:right="113"/>':''}<w:jc w:val="${o.align||'left'}"/></w:pPr>${run}</w:p></w:tc>`;
}
function mkTable(t,avail,opt){
  opt=opt||{};
  let head=t.head.map(r=>r.slice()),body=t.body.map(r=>r.slice());
  if(opt.pick){head=head.map(r=>opt.pick.map(j=>r[j]??''));body=body.map(r=>opt.pick.map(j=>r[j]??''))}
  const Wc=Math.max(...head.map(r=>r.length)),H=head.length,num=v=>typeof v==='number'&&isFinite(v);
  head=head.map(r=>{const x=r.slice();while(x.length<Wc)x.push('');return x});
  body=body.map(r=>{const x=r.slice(0,Wc);while(x.length<Wc)x.push('');return x});
  body=body.filter(r=>!(typeof r[0]==='string'&&r[0].length>30&&r.slice(1).every(B))); // baris catatan Excel
  const matrix=Wc>=12,baseSz=Wc<=6?22:Wc<=8?20:Wc<=11?18:Wc<=16?16:Wc<=24?14:12,line=body.length>40?240:276;
  const ci=Array.from({length:Wc},(_,j)=>body.every(r=>!num(r[j])||Number.isInteger(r[j])));
  const fmt=(v,j)=>{if(num(v)){if(Math.abs(v)<0.005&&!Number.isInteger(v))v=0;if(matrix&&v===0&&j>=2)return'-';return f(v,ci[j]?0:2)}return v==null?'':String(v)};
  // header: gabungan sel (colspan/rowspan)
  const cover=head.map(()=>Array(Wc).fill(null)),cells=head.map(()=>[]);
  for(let i=0;i<H;i++)for(let j=0;j<Wc;j++){
    const cv=cover[i][j];
    if(cv){if(cv.t==='r')cells[i].push({cont:true,j,cs:cv.cs});continue}
    const c=head[i][j];let cs=1,rs=1;
    if(!B(c)){
      let lim=Wc;if(i>0){let q=j+1;while(q<Wc&&B(head[i-1][q]))q++;lim=q}
      while(j+cs<lim&&B(head[i][j+cs])&&!cover[i][j+cs])cs++;
      if(i<H-1){let ok=true;for(let k=i+1;k<H;k++)for(let x=j;x<j+cs;x++)if(!B(head[k][x]))ok=false;if(ok)rs=H-i}
    }
    for(let k=0;k<rs;k++)for(let x=0;x<cs;x++){if(!k&&!x)continue;cover[i+k][j+x]=k===0?{t:'c'}:(x===0?{t:'r',cs}:{t:'c'})}
    cells[i].push({c,cs,rs,j});
  }
  // lebar kolom: angka tidak boleh terpotong, kolom teks menyesuaikan sisa lebar; huruf dibesarkan bila halaman lebar
  const wl=s=>Math.max(1,...String(s).split(/\s+/).map(x=>x.length));
  const isMerged=r=>typeof r[0]==='string'&&!B(r[0])&&B(r[1])&&Wc>2&&(isT(r)||/^Jumlah|^Total/.test(r[0]));
  const allNum=Array.from({length:Wc},(_,j)=>body.some(r=>num(r[j]))&&body.every(r=>B(r[j])||num(r[j])));
  const noCol=body.every(r=>B(r[0])||num(r[0])||isMerged(r));
  const plan=z=>{
    const cwid=n=>Math.round(n*5*z)+130,need=Array(Wc).fill(0),pref=Array(Wc).fill(0),hdrMin=Array(Wc).fill(cwid(2));
    cells.forEach((row,i)=>row.forEach(ce=>{if(!ce.cont&&ce.cs===1&&!B(ce.c))hdrMin[ce.j]=Math.max(hdrMin[ce.j],matrix&&i>0?Math.round(z*8):cwid(wl(ce.c)*1.25+0.6))}));
    for(let j=0;j<Wc;j++){
      let mxl=0;body.forEach(r=>{if(j===0&&isMerged(r))return;mxl=Math.max(mxl,fmt(r[j],j).length)});
      if(allNum[j]||(j===0&&noCol)){need[j]=pref[j]=Math.max(cwid(mxl),hdrMin[j])}
      else{const mn_=Math.max(hdrMin[j],cwid(Math.min(mxl,8)));need[j]=mn_;pref[j]=Math.max(mn_,Math.round(Math.min(mxl,34)*4.7*z)+130)}
    }
    return{need,pref};
  };
  let sz=baseSz,P=plan(sz);
  for(let z=Math.min(22,baseSz+6);z>baseSz;z-=2){const q=plan(z);if(q.need.reduce((a,b)=>a+b,0)<=avail*0.97){sz=z;P=q;break}}
  const need=P.need,cw=P.pref.slice(),over=()=>cw.reduce((a,b)=>a+b,0)-avail;
  for(let it=0;it<6&&over()>0;it++){
    const slack=cw.map((w,j)=>Math.max(0,w-need[j])),sl=slack.reduce((a,b)=>a+b,0);
    if(!sl)break;
    const cut=Math.min(1,over()/sl);cw.forEach((w,j)=>{cw[j]=Math.round(w-slack[j]*cut)});
  }
  if(over()>0){const k=avail/cw.reduce((a,b)=>a+b,0);cw.forEach((w,j)=>{cw[j]=Math.max(Math.round(sz*8),Math.round(w*k))})}
  else if(over()<0){
    const wt=cw.map((_,j)=>(j===0&&noCol)?0:allNum[j]?1:2),tw=wt.reduce((a,b)=>a+b,0)||1,add=-over();
    cw.forEach((w,j)=>{cw[j]=w+Math.round(add*wt[j]/tw)});
  }
  cw[cw.indexOf(Math.max(...cw))]+=avail-cw.reduce((a,b)=>a+b,0);
  const wOf=(j,cs)=>cw.slice(j,j+cs).reduce((a,b)=>a+b,0),total=cw.reduce((a,b)=>a+b,0);
  const HF='1F3864';
  let rows='';
  cells.forEach((row,i)=>{
    const rotRow=matrix&&i>0&&row.some(ce=>!ce.cont&&ce.cs===1&&ce.rs===1&&ce.j>=2&&!B(ce.c));
    rows+=`<w:tr><w:trPr><w:cantSplit/>${rotRow?'<w:trHeight w:val="1700" w:hRule="atLeast"/>':''}<w:tblHeader/></w:trPr>`;
    row.forEach(ce=>{
      if(ce.cont){rows+=cellXml('',{w:wOf(ce.j,ce.cs),span:ce.cs,vm:'cont',fill:HF,b:1,color:'FFFFFF',sz,align:'center'});return}
      const vert=rotRow&&ce.cs===1&&ce.rs===1&&ce.j>=2&&!B(ce.c);
      rows+=cellXml(B(ce.c)?'':String(ce.c),{w:wOf(ce.j,ce.cs),span:ce.cs,vm:ce.rs>1?'restart':null,fill:HF,b:1,color:'FFFFFF',sz,align:'center',vert,line});
    });
    rows+='</w:tr>';
  });
  body.forEach(r=>{
    const tot=isT(r)||/^Jumlah|^Total/.test(String(r[0]||''))||r.slice(0,3).some(v=>typeof v==='string'&&/\(Ha\)\s*$/.test(v))&&r.slice(3).some(num);
    const mergeFirst=isMerged(r);
    rows+='<w:tr><w:trPr><w:cantSplit/></w:trPr>';
    for(let j=0;j<Wc;j++){
      const v=r[j],s=fmt(v,j),span=mergeFirst&&j===0?2:1;
      const align=num(v)?(j===0?'center':'right'):(j===0?'center':(matrix&&s.length<=2?'center':'left'));
      rows+=cellXml(s,{w:wOf(j,span),span,b:tot?1:0,sz,align,line,hl:/^\[ISI/.test(s)});
      if(span===2)j++;
    }
    rows+='</w:tr>';
  });
  return `<w:tbl><w:tblPr><w:tblW w:w="${total}" w:type="dxa"/><w:jc w:val="center"/><w:tblBorders>${['top','left','bottom','right','insideH','insideV'].map(s=>`<w:${s} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`).join('')}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="57" w:type="dxa"/><w:right w:w="57" w:type="dxa"/></w:tblCellMar><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid>${cw.map(x=>`<w:gridCol w:w="${x}"/>`).join('')}</w:tblGrid>${rows}</w:tbl>`;
}

// ===== Gambar =====
async function svgToPng(svgText){
  const holder=document.createElement('div');holder.innerHTML=svgText;
  const svg=holder.querySelector('svg');if(!svg)throw new Error('SVG kosong');
  const vb=(svg.getAttribute('viewBox')||'0 0 760 360').split(/\s+/).map(Number),w=900,h=Math.max(1,Math.round(w*vb[3]/vb[2]));
  svg.setAttribute('width',w);svg.setAttribute('height',h);svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
  if(!svg.getAttribute('font-family'))svg.setAttribute('font-family','Arial, sans-serif');
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'}));
  try{
    const img=new Image();await new Promise((ok,no)=>{img.onload=ok;img.onerror=()=>no(new Error('SVG gagal dirender'));img.src=url});
    const c=document.createElement('canvas');c.width=w*2;c.height=h*2;const cx=c.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,c.width,c.height);cx.drawImage(img,0,0,c.width,c.height);
    const blob=await new Promise(r=>c.toBlob(r,'image/png'));
    return{data:new Uint8Array(await blob.arrayBuffer()),w,h};
  }finally{URL.revokeObjectURL(url)}
}
function picXml(rid,id,name,cx,cy){
  return `<w:p><w:pPr><w:keepNext/><w:spacing w:before="120" w:after="60" w:line="240" w:lineRule="auto"/><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="${name}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="${name}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}
const placeholderPara=text=>`<w:p><w:pPr><w:keepNext/><w:spacing w:before="120" w:after="60"/><w:jc w:val="center"/></w:pPr><w:r>${rpr({sz:22,hl:1})}<w:t xml:space="preserve">${xe(text)}</w:t></w:r></w:p>`;

const capKey=t=>{
  let m=t.match(/^Gambar\s*(\d+)\.\s*(\d+)/);if(m)return m[1]+'.'+m[2];
  m=t.match(/^Gambar\s*IV[\s\-]*(\d+)/);return m?'IV'+m[1]:null;
};
const tblKey=t=>{
  let m=t.match(/^Tabel\s*(\d+)\.\s*(\d+)/);if(m)return 'T'+m[1]+'.'+m[2];
  m=t.match(/^Tabel\s*IV[\s\-]*(\d+)/);return m?'TIV'+m[1]:null;
};
const TBLS={
  'T3.2':{k:'III-1',pick:[0,1,2,3]},'T3.3':{k:'III-1',pick:[0,1,4,5,6]},'T3.4':{k:'III-2'},'T3.5':{k:'III-3'},'T3.6':{k:'III-4'},'T3.7':{k:'III-5'},
  'T3.8':{k:'III-6'},'T3.9':{k:'III-7'},'T3.10':{k:'III-8'},'T3.11':{k:'III-10'},
  'TIV1':{k:'IV-1'},'TIV2':{k:'IV-2'},'TIV3':{k:'IV-3'},'TIV4':{k:'IV-4'},'TIV5':{k:'IV-5'},'TIV6':{k:'IV-6'},'TIV7':{k:'IV-7'},'TIV8':{k:'IV-8'},
  'TIV9':{k:'IV-9'},'TIV10':{k:'IV-10'},'TIV11':{k:'IV-11'},'TIV12':{k:'IV-12'},'TIV14':{k:'IV-14'},'TIV15':{k:'IV-15'},'TIV16':{k:'IV-16'},'TIV17':{k:'IV-17'},'TIV18':{k:'IV-18'}
};

async function loadTemplate(onNeedFile){
  try{
    const res=await fetch(TEMPLATE_URL,{cache:'no-store'});
    if(!res.ok)throw new Error('HTTP '+res.status);
    return await res.arrayBuffer();
  }catch(e){
    if(!onNeedFile)throw new Error('Template DOCX tidak dapat dimuat ('+e.message+')');
    const file=await onNeedFile();
    if(!file)throw new Error('Template DOCX tidak dipilih');
    return await file.arrayBuffer();
  }
}

async function generateNpgtDocx(opt){
  const{SH,charts,wilayah,provinsi,kecamatan,onStatus,onNeedFile}=opt,warn=[],say=m=>onStatus&&onStatus(m);
  const C=NpgtDocData.makeContext(SH,{wilayah,provinsi,kecamatan}),{W,pv,kc,isKota,nm}=C;
  say('Memuat template Word…');
  const zip=await JSZip.loadAsync(await loadTemplate(onNeedFile));
  DOC=new DOMParser().parseFromString(await zip.file('word/document.xml').async('string'),'application/xml');
  if(DOC.getElementsByTagName('parsererror').length)throw new Error('document.xml pada template tidak dapat dibaca');
  const body=DOC.getElementsByTagNameNS(NSW,'body')[0],K=Array.from(body.children);

  // 1. Narasi Bab III-IV (sebelum penggantian nama)
  say('Menyusun narasi dari data rekap…');
  const narr=NpgtDocData.makeNarr(C);
  Object.entries(narr).forEach(([idx,{kw,fn}])=>{
    const p=K[idx-1];
    if(!p||!isW(p,'p')||!kw.test(ptext(p))){warn.push(`Paragraf ${idx} tidak cocok dengan template`);return}
    try{setParaText(p,fn(ptext(p),p))}catch(e){warn.push(`Narasi ${idx}: ${e.message}`);setParaText(p,`[ISI: narasi tidak dapat disusun otomatis - ${e.message}]`)}
  });

  // 2. Tabel
  say('Mengisi tabel dari rekap…');
  const{M}=C.d;
  K.forEach((n,i)=>{
    if(!isW(n,'tbl'))return;
    let key=null;
    for(let q=n.previousElementSibling,c=0;q&&c<3;q=q.previousElementSibling,c++){const tx=ptext(q).trim();if(tx){key=tblKey(tx);break}}
    if(!key)return;
    const pi=pageInfo(n);
    try{
      if(key==='T3.1'){
        const names=kc.length?kc:[];
        const t={head:[['No','Kecamatan','Luas',''],['','','Ha','% Wilayah']],body:[...names.map((k,j)=>[j+1,k,'[ISI]','[ISI]']),[W,'','[ISI]','[ISI]']]};
        n.replaceWith(...frag(mkTable(t,pi.avail)));return;
      }
      const spec=TBLS[key];if(!spec)return;
      const t=M(spec.k);
      if(!t){warn.push(`Sheet Tabel_${spec.k} tidak ditemukan untuk ${key}`);return}
      n.replaceWith(...frag(mkTable(t,pi.avail,spec)));
    }catch(e){warn.push(`Tabel ${key}: ${e.message}`)}
  });

  // 3. Gambar (diagram dari Excel; cadangan dari data tabel)
  say('Membuat diagram…');
  const figs=NpgtDocData.makeFigs(C),rels=[];let nf=0;
  const drawings=els(body,'drawing').filter(dw=>{for(let n=dw;n;n=n.parentNode)if(isW(n,'tc'))return false;return true});
  const byCap=new Map();
  drawings.forEach(dw=>{
    let holder=dw;while(holder&&!isW(holder,'p'))holder=holder.parentNode;
    if(!holder)return;
    let cap=holder,c=0;while(cap&&c<5&&!(isW(cap,'p')&&/^Gambar\s/.test(ptext(cap).trim()))){cap=cap.nextElementSibling;c++}
    if(!cap||c>=5)return;
    let run=dw;while(run&&!isW(run,'r'))run=run.parentNode;
    if(!byCap.has(cap))byCap.set(cap,[]);
    byCap.get(cap).push({run,holder});
  });
  for(const[cap,list]of byCap){
    const key=capKey(ptext(cap).trim());
    list.forEach(({run,holder})=>{
      if(run&&run.parentNode)run.parentNode.removeChild(run);
      if(!ptext(holder).trim()&&!els(holder,'drawing').length&&!kid(kid(holder,'pPr'),'sectPr')&&holder!==cap)holder.parentNode.removeChild(holder);
    });
    if(!key||!figs[key]){if(key==='IV3')cap.parentNode.insertBefore(frag(placeholderPara('[ISI: citra satelit Tahun '+C.y0+' dan Tahun '+C.y1+' serta dokumentasi survei lapangan]'))[0],cap);continue}
    const pi=pageInfo(cap);
    try{
      const fd=figs[key](),shn=FIG_SHEETS[fd.key];
      const entry=Object.entries(charts||{}).find(([name])=>shn&&name.endsWith(shn)),spec=entry&&entry[1][0];
      const svg=(spec&&excelChartSvg(spec))||(fd.lb.length?chart(fd.lb,fd.vs,fd.u):'');
      if(!svg)throw new Error('data diagram kosong');
      const png=await svgToPng(svg);nf++;
      const name=`npgt_gambar_${nf}.png`,rid='rIdNpgt'+nf;
      zip.file('word/media/'+name,png.data);rels.push(`<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${name}"/>`);
      let cx=Math.min(5700000,pi.avail*635),cy=Math.round(cx*png.h/png.w);const cap_=pi.availH*635*0.55;
      if(cy>cap_){cx=Math.round(cx*cap_/cy);cy=Math.round(cap_)}
      cap.parentNode.insertBefore(frag(picXml(rid,70000+nf,name,cx,cy))[0],cap);
    }catch(e){warn.push(`Gambar ${key}: ${e.message}`);cap.parentNode.insertBefore(frag(placeholderPara('[ISI: diagram '+key+' tidak dapat dibuat otomatis]'))[0],cap)}
  }

  // 4. Nama wilayah, provinsi, kecamatan, perbaikan kata rusak pada template
  say('Mengganti nama wilayah…');
  const n=kc.length,list=kc.map(k=>'Kecamatan '+k),ps=els(body,'p');
  const P=[
    [/xxx kecamatan yang meliputi Kecamatan xxx/g,()=>`${n} kecamatan yang meliputi ${list.length?L(list):'[ISI: daftar kecamatan]'}`],
    [/dengan xxx wilayah kecamatan/g,()=>`dengan ${n} wilayah kecamatan`],
    [/WaliKab\/Kota XXX/g,()=>isKota?'Wali Kota '+nm:'Bupati '+nm],
    [/KAB\/KOTA XXX/g,()=>W.toUpperCase()],
    [/Kab\/Kota XXX/g,()=>W],
    [/([A-Za-z])Jawa Timur/g,m=>m[1]+'bali'],
    [/Jawa Timur(?=[a-z])/g,()=>'bali']
  ];
  if(pv&&pv.toLowerCase()!=='jawa timur')P.push([/Jawa Timur/g,()=>pv],[/JAWA TIMUR/g,()=>pv.toUpperCase()]);
  // Nama wilayah yang berbatasan berbeda dengan wilayah laporan; jadikan isian manual
  ps.forEach(p=>{
    const tx=ptext(p).trim();
    if(/^Sebelah (Utara|Timur|Selatan|Barat)/.test(tx))replaceInPara(p,/Kab\/Kota XXX/g,()=>'[ISI: wilayah yang berbatasan]');
    else if(/berbatasan dengan Kab\/Kota XXX/.test(tx))replaceInPara(p,/berbatasan dengan Kab\/Kota XXX/g,()=>'berbatasan dengan [ISI: wilayah yang berbatasan]');
  });
  ps.forEach(p=>{const tx=ptext(p);if(!/XXX|xxx|Jawa Timur|JAWA TIMUR/.test(tx))return;P.forEach(([re,fn])=>replaceInPara(p,re,fn))});
  // Judul tabel/gambar: seragamkan cetak tebal; sorot sisa isian manual
  const boldOn=r=>{let rp=kid(r,'rPr');if(!rp){rp=DOC.createElementNS(NSW,'w:rPr');r.insertBefore(rp,r.firstChild)}if(kid(rp,'b'))return;const rf=kid(rp,'rFonts'),ref=rf?rf.nextSibling:rp.firstChild;rp.insertBefore(DOC.createElementNS(NSW,'w:b'),ref);rp.insertBefore(DOC.createElementNS(NSW,'w:bCs'),ref)};
  ps.forEach(p=>{
    const tx=ptext(p).trim(),runs=els(p,'r').filter(r=>r.getElementsByTagNameNS(NSW,'t').length);
    if(/^(Tabel|Gambar)\s/.test(tx)&&runs.some(r=>kid(kid(r,'rPr'),'b')))runs.forEach(boldOn);
    if(/\[ISI/.test(tx))runs.forEach(r=>{if(/\[ISI/.test(els(r,'t').map(t=>t.textContent).join(''))){let rp=kid(r,'rPr');if(!rp){rp=DOC.createElementNS(NSW,'w:rPr');r.insertBefore(rp,r.firstChild)}addHl(rp)}});
  });
  let rest=0;
  ps.forEach(p=>{if(!/XXX/.test(ptext(p)))return;rest++});
  if(rest)warn.push(`${rest} paragraf masih memuat "XXX"`);

  // 5. Sisa isi spesifik wilayah lain pada Bab I-II ditandai stabilo
  const marked=new Set();
  K.slice(0,250).forEach(p=>{
    if(!isW(p,'p'))return;
    els(p,'r').forEach(r=>{const tx=els(r,'t').map(t=>t.textContent).join('');if(/Malang|Brantas/.test(tx)){let rp=kid(r,'rPr');if(!rp){rp=DOC.createElementNS(NSW,'w:rPr');r.insertBefore(rp,r.firstChild)}addHl(rp);marked.add(p)}});
  });
  if(marked.size)warn.push(`${marked.size} paragraf Bab I berisi uraian khusus daerah contoh (disorot kuning) dan perlu disesuaikan manual`);

  // 6. Paket DOCX
  say('Menyusun berkas Word…');
  let out=new XMLSerializer().serializeToString(DOC);
  if(!out.startsWith('<?xml'))out='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'+out;
  zip.file('word/document.xml',out);
  if(rels.length){
    const rp='word/_rels/document.xml.rels';
    zip.file(rp,(await zip.file(rp).async('string')).replace('</Relationships>',rels.join('')+'</Relationships>'));
    let ct=await zip.file('[Content_Types].xml').async('string');
    if(!/Extension="png"/i.test(ct))zip.file('[Content_Types].xml',ct.replace('<Override','<Default Extension="png" ContentType="image/png"/><Override'));
  }
  const blob=await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',compression:'DEFLATE'});
  DOC=null;
  return{blob,warnings:warn};
}

g.generateNpgtDocx=generateNpgtDocx;
})(window);
