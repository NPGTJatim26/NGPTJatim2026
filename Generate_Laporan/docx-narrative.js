/* Data rekap Excel dan narasi Bab III-IV untuk template DOCX NPGT. Bergantung pada helper global app.js. */
(function(g){
'use strict';
const NUMW=['nol','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan','sepuluh','sebelas','dua belas'];
const nw=n=>NUMW[n]??String(n);
const BU=/Kampung|Perumahan|Perkantoran|Industri|Pergudangan|Jasa|Emplasemen|Olahraga|Gedung|Jalan/i;
const ha=v=>f(v)+' Ha',pc=v=>f(v)+'%',lc=s=>String(s).replace(/\s+/g,' ').trim().toLowerCase();
const share=(v,tot)=>pc(tot?v/tot*100:0);
const kecName=k=>'Kecamatan '+k;

function makeData(S){
  const keys=Object.keys(S);
  const sh=k=>{const n=keys.find(x=>x.endsWith('Tabel_'+k)||x.endsWith('Grafik_'+k));return n&&S[n]};
  const bl=k=>{const r=sh(k);return r?blocks(r).map(b=>{let h=1;while(h<b.length&&B(b[h][0])&&B(b[h][1]))h++;return{head:b.slice(0,h).map(r=>r.map(x=>typeof x==='string'?x.replace(/\.\d$/,''):x)),body:b.slice(h)}}):null};
  const M=k=>{const b=bl(k);return b&&b[0]};
  const D=t=>t?t.body.filter(r=>!isT(r)):[];
  const TT=t=>t&&(t.body.find(isT)||[]);
  const plan=k=>{const t=(M(k)?.head||[]).flat().filter(v=>typeof v==='string').join(' ');return /RDTR\s*\/\s*RTRW/i.test(t)?'RDTR/RTRW':/Rencana Detail Tata Ruang|\bRDTR\b/i.test(t)?'RDTR':/\bRTRW\b/.test(t)?'RTRW':null};
  return{sh,bl,M,D,TT,plan};
}

function makeContext(S,form){
  const d=makeData(S),{M,D,TT}=d,t1=M('III-1');
  const W=(form.wilayah||(TT(t1)||[])[0]||'Wilayah').trim();
  const hd=k=>(M(k)||{head:[[]]}).head[0];
  const y0=(String(hd('III-6')[1]).match(/\d{4}/)||['2020'])[0],y1=(String(hd('III-7')[1]).match(/\d{4}/)||['2026'])[0];
  const h4=hd('III-4'),ya=String(h4[2]||'2021'),yp=String(h4.at(-1)||(+y1-1));
  const kc=form.kecamatan&&form.kecamatan.length?form.kecamatan:(t1?D(t1).map(r=>r[1]):[]);
  return{d,W,pv:(form.provinsi||'').trim(),y0,y1,ya,yp,kc,isKota:/^Kota\b/i.test(W),nm:W.replace(/^(Kota|Kabupaten)\s+/i,'')};
}

// Isi sel kosong kecamatan/kelompok pada tabel rinci (baris pertama kelompok saja yang terisi).
function fillRecs(t,map){
  let kec='',grp='';const out=[];
  t.body.forEach(r=>{
    if(/^(Jumlah|Total|Kota |Kabupaten )/.test(String(r[0]||''))||/^(Jumlah|Total)/.test(String(r[2]||'')))return;
    if(!B(r[1]))kec=r[1];
    if(!B(r[2]))grp=r[2];
    out.push(map(r,kec,grp));
  });
  return out;
}
const groupSum=(recs,key,val)=>{const m={};recs.forEach(x=>{if(N(x[val]))m[x[key]]=(m[x[key]]||0)+x[val]});return Object.entries(m).sort((a,b)=>b[1]-a[1])};

function makeNarr(C){
  const{d,W,pv,y0,y1,ya,yp,kc}=C,{M,D,TT,bl,sh}=d;
  const need=k=>{const t=M(k);if(!t)throw new Error('Sheet Tabel_'+k+' tidak ditemukan');return t};
  const areaTot=()=>{const t=need('III-1');return TT(t)[2]};
  const kecArea=()=>{const o={};D(need('IV-9')).forEach(r=>{o[r[1]]=r[6]});return o};
  const agg=t=>{const w=t.head[0].length,r=D(t),T=TT(t),tot=T[w-2];return{bs:sum(r.filter(x=>BU.test(x[1])),w-2)/tot*100,as:sum(r.filter(x=>AG.test(x[1])),w-2)/tot*100}};
  const sector=s=>lc(String(s).replace(/^Potensi\s+(Pengembangan\s+)?(Sektor\s+)?/i,'').replace(/\s*\(Ha\)\s*$/,''));
  const N_={};
  const add=(idx,kw,fn)=>{N_[idx]={kw,fn}};

  // ===== BAB III =====
  add(254,/Secara Administrasi wilayah/,()=>`Secara administrasi wilayah ${W} terletak di Provinsi ${pv||'[ISI: provinsi]'} yang terdiri dari ${kc.length} kecamatan dengan [ISI: jumlah kelurahan/desa] kelurahan/desa. Luas wilayah ${W} adalah sebesar [ISI: luas wilayah] Ha. Wilayah ${W} secara geografis terletak pada koordinat antara [ISI: koordinat bujur dan lintang]. (Sumber : [ISI: sumber data]). Batas-batas administratif wilayah ${W} sebagai berikut:`);
  add(328,/^Sumber/,()=>'Sumber : [ISI: peraturan daerah/kepala daerah tentang RDTR beserta nomor dan tahun]');
  add(262,/luas wilayah administrasi/,()=>`Berdasarkan Tabel di atas, menunjukkan bahwa luas wilayah administrasi ${W} seluas [ISI: luas wilayah menurut Kemendagri/BPS] Ha dengan urutan kecamatan terluas adalah [ISI: urutan kecamatan terluas beserta luasnya]. Sedangkan, [ISI: nama kecamatan] merupakan kecamatan dengan persentase terendah yakni [ISI: persentase] atau seluas [ISI: luas] Ha.`);
  add(266,/luas wilayah administrasi/,()=>{
    const t=need('III-1'),r=D(t),T=TT(t),s=srt(r,2),top=s.slice(0,Math.min(4,Math.max(1,s.length-1))),lo=s.at(-1);
    return `Berdasarkan Tabel di atas, menunjukkan bahwa luas wilayah administrasi ${W} seluas ${ha(T[2])} dengan urutan kecamatan terluas adalah ${L(top.map(x=>`${kecName(x[1])} seluas ${ha(x[2])}`))}. Sedangkan, ${kecName(lo[1])} merupakan kecamatan dengan persentase terendah yakni ${pc(lo[3])} atau seluas ${ha(lo[2])}.`;
  });
  add(274,/Jumlah Penduduk di/,()=>`Jumlah Penduduk di ${W} menurut ${W} Dalam Angka ${y1} sebanyak ${f(TT(need('III-1'))[4],0)} jiwa. Berikut merupakan data kependudukan di ${W} yang diklasifikasikan berdasarkan jumlah penduduk dan kepadatan penduduk.`);
  add(278,/kondisi kependudukan/,()=>{
    const t=need('III-1'),r=D(t),T=TT(t),mp=mx(r,4),np=mn(r,4),md=mx(r,6),nd=mn(r,6);
    const cmp=mp[1]!==md[1]?`Namun, berbanding terbalik dengan jumlah penduduk, ${kecName(md[1])} justru memiliki kepadatan terbesar yakni ${f(md[6],0)} jiwa/km2, sedangkan kepadatan terendah pada ${kecName(nd[1])} sebesar ${f(nd[6],0)} jiwa/km2.`:`Sejalan dengan itu, ${kecName(md[1])} juga memiliki kepadatan terbesar yakni ${f(md[6],0)} jiwa/km2, sedangkan kepadatan terendah pada ${kecName(nd[1])} sebesar ${f(nd[6],0)} jiwa/km2.`;
    return `Berdasarkan tabel di atas, menunjukkan bahwa kondisi kependudukan di ${W} dengan total penduduk sebanyak ${f(T[4],0)} jiwa dan kepadatan penduduk ${f(T[6],0)} jiwa/km2. Jumlah penduduk terbanyak berada di ${kecName(mp[1])} ialah sebesar ${f(mp[4],0)} jiwa. Sedangkan, jumlah penduduk terendah ialah ${kecName(np[1])} sebesar ${f(np[4],0)} jiwa. ${cmp} Selanjutnya, berikut merupakan laju pertumbuhan penduduk dan rasio jenis kelamin penduduk di ${W}.`;
  });
  add(282,/laju pertumbuhan agregat/,()=>{
    const t=need('III-2'),r=D(t),T=TT(t),mp=mx(r,2),aj=mx(r,3),bj=mn(r,3),rr=mx(r,4),rm=mn(r,4);
    const lead=mp[1]===aj[1]?`${kecName(mp[1])} menjadi wilayah dengan jumlah penduduk terbesar (${f(mp[2],0)} jiwa) sekaligus laju pertumbuhan tertinggi (${pc(aj[3])} per tahun)`:`${kecName(mp[1])} menjadi wilayah dengan jumlah penduduk terbesar (${f(mp[2],0)} jiwa), sementara laju pertumbuhan tertinggi tercatat di ${kecName(aj[1])} (${pc(aj[3])} per tahun)`;
    return `Berdasarkan data kependudukan ${W} yang memiliki total penduduk sebanyak ${f(T[2],0)} jiwa dengan laju pertumbuhan agregat ${pc(T[3])} per tahun, terlihat bahwa ${lead}, sedangkan laju pertumbuhan terendah terdapat di ${kecName(bj[1])} (${pc(bj[3])} per tahun). Selain itu, secara keseluruhan rasio jenis kelamin ${W} berada di angka ${f(T[4],1)} yang menunjukkan ${T[4]<100?'dominasi penduduk perempuan':T[4]>100?'dominasi penduduk laki-laki':'komposisi yang seimbang'}, di mana rasio tertinggi tercatat di ${kecName(rr[1])} (${f(rr[4],1)}) dan terendah di ${kecName(rm[1])} (${f(rm[4],1)}).`;
  });
  add(283,/Mata pencaharian penduduk/,()=>{
    const t=need('III-3'),r=D(t),T=TT(t);
    return `Mata pencaharian penduduk di ${W} menunjukkan keberagaman struktur ketenagakerjaan yang mencerminkan dinamika kegiatan ekonomi wilayah. Tabel berikut menyajikan data distribusi jumlah penduduk bekerja di ${W} berdasarkan status pekerjaan utama dan jenis kelamin dengan total penduduk bekerja mencapai ${f(T[4],0)} jiwa. Data ini mengelompokkan tenaga kerja ke dalam ${nw(r.length)} kategori status pekerjaan, yaitu ${L(r.map(x=>lc(x[1])))}, guna memberikan gambaran mengenai profil struktur pekerjaan dan partisipasi gender dalam perekonomian wilayah.`;
  });
  add(288,/mayoritas penduduk/,()=>{
    const t=need('III-3'),r=D(t),T=TT(t),s=srt(r,4),a=s[0],b=s[1],fe=[...r].sort((x,y)=>(y[3]-y[2])-(x[3]-x[2]))[0],lk=T[2]>=T[3];
    const fem=fe&&fe[3]>fe[2]?` Namun, pada kategori ${fe[1]}, partisipasi perempuan justru tercatat lebih tinggi (${f(fe[3],0)} jiwa) dibandingkan laki-laki (${f(fe[2],0)} jiwa)${/keluarga|tidak dibayar/i.test(fe[1])?', yang mengindikasikan tingginya keterlibatan perempuan dalam menopang usaha/ekonomi keluarga secara tidak berbayar':''}.`:'';
    return `Berdasarkan data pada tabel dan grafik di atas, mayoritas penduduk di ${W} bekerja pada status ${a[1]} dengan jumlah tertinggi mencapai ${f(a[4],0)} jiwa (${f(a[2],0)} laki-laki dan ${f(a[3],0)} perempuan), disusul oleh kategori ${b[1]} sebanyak ${f(b[4],0)} jiwa. Secara umum, tenaga kerja ${lk?'laki-laki':'perempuan'} mendominasi dengan total ${f(Math.max(T[2],T[3]),0)} jiwa dibandingkan ${lk?'perempuan':'laki-laki'} yang berjumlah ${f(Math.min(T[2],T[3]),0)} jiwa.${fem}`;
  });
  const pdrb=(k,real)=>()=>{
    const t=need(k),r=D(t),T=TT(t),w=t.head[0].length,vals=T.slice(2,w),first=vals[0],last=vals.at(-1),mono=vals.every((v,i)=>!i||v>=vals[i-1]);
    const cagr=(Math.pow(last/first,1/Math.max(1,vals.length-1))-1)*100,s=srt(r,w-1),sh_=x=>pc(x.at(-1)/last*100);
    return `Berdasarkan data Produk Domestik Regional Bruto (PDRB) Atas Dasar Harga ${real?'Konstan (ADHK)':'Berlaku (ADHB)'} menurut lapangan usaha ${W} tahun ${ya}–${yp}, total PDRB wilayah ini menunjukkan ${mono?(real?'pertumbuhan ekonomi riil yang konsisten':'tren peningkatan yang konsisten'):'perkembangan yang berfluktuasi'}, dari ${f(first)} miliar rupiah pada tahun ${ya} hingga mencapai ${f(last)} miliar rupiah pada tahun ${yp} atau tumbuh rata-rata ${pc(cagr)} per tahun. Struktur ${real?'pertumbuhan ekonomi riil':'perekonomian wilayah'} ini didominasi oleh sektor ${s[0][1]} dan ${s[1][1]} yang menyumbang porsi terbesar (${sh_(s[0])} dan ${sh_(s[1])}), diikuti oleh ${L(s.slice(2,5).map(x=>`${x[1]} (${sh_(x)})`))} sebagai penggerak aktivitas ${real?'produksi':'ekonomi'} daerah.`;
  };
  add(292,/PDRB Atas Dasar Harga Berlaku/,pdrb('III-4',false));
  add(296,/Produk Domestik Regional Bruto/,pdrb('III-5',true));
  add(302,/Kondisi penggunaan tanah/,()=>{
    const t=need('III-6'),w=t.head[0].length,r=D(t),T=TT(t),s=srt(r,w-2).slice(0,3);
    return `Kondisi penggunaan tanah di ${W} pada tahun ${y0} mencerminkan struktur keruangan wilayah yang didominasi oleh ${L(s.map(x=>lc(x[1])))}. Tabel berikut menyajikan distribusi eksisting penggunaan tanah lama di ${W} Tahun ${y0} berdasarkan jenis tutupan/penggunaan lahan, luas wilayah dalam hektar (Ha), dan proporsi persentasenya dari total luas wilayah sebesar ${ha(T[w-2])}. Data ini memberikan gambaran dasar mengenai pola pemanfaatan ruang sebelum dilakukan evaluasi atau perencanaan tata ruang lebih lanjut.`;
  });
  const luKec=(t,yr)=>{
    const w=t.head[0].length,r=D(t),T=TT(t),tot=T[w-2],kcs=t.head[1].slice(2,w-2).map(String);
    const per=kcs.map((k,i)=>({k,col:2+i,area:T[2+i]})).sort((a,b)=>b.area-a.area);
    return per.map((p,i)=>{
      const top=srt(r,p.col).filter(x=>x[p.col]>0).slice(0,2);
      return `${i?(i===1?'Sementara itu, ':i===2?'Selanjutnya, ':'Adapun '):''}${kecName(p.k)} ${i?'dengan luas':'mencatatkan wilayah terluas yaitu'} ${ha(p.area)} (${pc(p.area/tot*100)}) ${top.length?`yang didominasi oleh ${L(top.map(x=>`${x[1]} (${ha(x[p.col])})`))}`:''}`.replace(/\s+$/,'')+'.';
    }).join(' ');
  };
  add(307,/distribusi spatial|distribusi spasial/,()=>{
    const t=need('III-6'),a=agg(t);
    return `Berdasarkan data distribusi spasial penggunaan tanah lama ${W} Tahun ${y0}, ${luKec(t,y0)} Secara agregat, penggunaan tanah terbangun mencakup ${pc(a.bs)} dan penggunaan pertanian mencakup ${pc(a.as)} dari luas wilayah, sehingga karakter penggunaan tanah antarkecamatan perlu dibaca sesuai dominasi penggunaan tanah pada masing-masing wilayah.`;
  });
  add(309,/Dinamika pemanfaatan ruang/,()=>{
    const t=need('III-7'),w=t.head[0].length,T=TT(t),n=t.head[1].slice(2,w-2).length;
    return `Dinamika pemanfaatan ruang di ${W} pada tahun ${y1} mencerminkan perkembangan tata guna lahan eksisting terbaru yang tersebar di ${nw(n)} kecamatan. Tabel berikut menyajikan struktur penggunaan tanah baru ${W} Tahun ${y1}, yang memuat rincian luas area per kecamatan (dalam hektar) beserta proporsi persentase dari total wilayah sebesar ${ha(T[w-2])}. Data ini memberi gambaran komprehensif mengenai proporsi kawasan terbangun dan non-terbangun yang mendasari analisis perkembangan spasial terkini.`;
  });
  add(314,/penggunaan tanah baru tahun/,()=>{
    const t=need('III-7'),w=t.head[0].length,r=D(t),T=TT(t),s=srt(r,w-2),a=agg(t),b=agg(need('III-6')),tot=T[w-2];
    return `Berdasarkan data penggunaan tanah baru tahun ${y1}, struktur pemanfaatan ruang ${W} secara dominan ${a.bs>=a.as?'dialokasikan untuk fungsi terbangun':'masih dialokasikan untuk fungsi pertanian'}, dengan ${s[0][1]} mencapai ${ha(s[0][w-2])} (${pc(s[0][w-1])}), ${s[1][1]} seluas ${ha(s[1][w-2])} (${pc(s[1][w-1])}) dan ${s[2][1]} sebesar ${ha(s[2][w-2])} (${pc(s[2][w-1])}). Distribusi spasial menunjukkan bahwa ${luKec(t,y1)} Dibandingkan Tahun ${y0}, porsi tanah terbangun ${a.bs>=b.bs?'meningkat':'menurun'} ${f(Math.abs(a.bs-b.bs))} poin persentase menjadi ${pc(a.bs)} dan porsi pertanian ${a.as>=b.as?'meningkat':'menurun'} ${f(Math.abs(a.as-b.as))} poin persentase menjadi ${pc(a.as)}, yang mengindikasikan bahwa pola ruang ${W} di tahun ${y1} ${a.bs>b.bs?'bergerak ke arah penguatan fungsi terbangun':'relatif bertahan'} dengan tetap menyisakan ruang pertanian yang perlu dijaga dari total luas ${ha(tot)}.`;
  });
  add(322,/Gambaran Umum Penguasaan Tanah \(GUPT\)/,()=>{
    const t=need('III-8'),w=t.head[0].length,r=D(t),T=TT(t),tot=T[w-2],s=srt(r,w-2),top=s[0];
    const kcs=t.head[1].slice(2,w-2),ti=kcs.map((k,i)=>[k,top[2+i]]).sort((a,b)=>b[1]-a[1])[0];
    const hgb=r.filter(x=>/^Hak Guna Bangunan/i.test(x[1])),bt=r.find(x=>/belum terdaftar/i.test(x[1])),ex=new Set([top,bt,...hgb]);
    const rest=s.filter(x=>!ex.has(x)).slice(0,4),reg=sum(r.filter(x=>/^(Hak Milik|Hak Guna|Hak Pakai|Hak Pengelolaan|Tanah Milik Wakaf)/i.test(x[1])),w-2)/tot*100;
    return `Berdasarkan data Gambaran Umum Penguasaan Tanah (GUPT) ${W} Tahun ${y1}, status penguasaan lahan secara signifikan didominasi oleh ${top[1]} sebesar ${ha(top[w-2])} (${pc(top[w-1])}), dengan konsentrasi terluas berada di ${kecName(ti[0])} mencapai ${ha(ti[1])}.${hgb.length?` Penguasaan tanah berstatus Hak Guna Bangunan (HGB) menempati porsi ${pc(sum(hgb,w-1))} yang terdiri atas ${L(hgb.map(x=>`${x[1].replace(/^Hak Guna Bangunan \(HGB\) - /,'HGB ')} seluas ${ha(x[w-2])} (${pc(x[w-1])})`))}.`:''}${bt?` Sementara itu, ${bt[1]} sebesar ${ha(bt[w-2])} (${pc(bt[w-1])}); kategori tersebut memiliki catatan bahwa data tersebut mencakup beberapa kekosongan data spasial akibat galat pada data unduhan Geo-KKP serta bidang tanah yang masih dalam proses pendaftaran (K1, K2, K3, K4) sehingga tidak serta-merta menunjukkan bahwa seluruh luasan tersebut benar-benar belum terdaftar secara yuridis.`:''}${rest.length?` Selanjutnya, ${L(rest.map(x=>`${x[1]} seluas ${ha(x[w-2])} (${pc(x[w-1])})`))}.`:''} Kondisi tersebut mengindikasikan bahwa ${reg>=50?`mayoritas penguasaan tanah di ${W} telah teregistrasi sebagai hak atas tanah`:`sebagian besar tanah di ${W} belum tercatat sebagai hak atas tanah`}.`;
  });
  add(325,/Rencana Detail Tata Ruang \(RDTR\)/,()=>{
    const t=need('III-10'),w=t.head[0].length,T=TT(t);
    return `Rencana Detail Tata Ruang (RDTR) ${W} yang diatur melalui [ISI: peraturan daerah/kepala daerah beserta nomor dan tahun] merupakan instrumen operasional tata ruang wilayah yang menjadi acuan penting dalam mewujudkan pemanfaatan ruang yang serasi, selaras, berwawasan lingkungan, serta berkelanjutan untuk jangka waktu [ISI: jangka waktu rencana]. Berdasarkan dokumen RDTR ini, struktur pemanfaatan ruang di seluruh Wilayah Perencanaan (WP) ${W} seluas ${ha(T[w-2])} dibagi ke dalam [ISI: alokasi utama pola ruang]. Berikut merupakan Pola Ruang dalam RDTR ${W} Tahun [ISI: tahun penetapan].`;
  });
  add(330,/rencana pola ruang/,()=>{
    const t=need('III-10'),w=t.head[0].length,r=D(t),s=srt(r,w-2),kcs=t.head[1].slice(2,w-2).map(String),RT=d.plan('III-10')||'RDTR';
    const byKec=row=>kcs.map((k,i)=>[k,row[2+i]]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
    const pg=r.find(x=>/Tanaman Pangan/i.test(x[1])),t1=byKec(s[0]),t2=byKec(s[1]);
    let tx=`Adapun rencana pola ruang ${RT} ${W} dalam hal ini didominasi oleh ${lc(s[0][1])} seluas ${ha(s[0][w-2])} (${pc(s[0][w-1])}), diikuti ${L(s.slice(1,5).map(x=>`${lc(x[1])} sebesar ${ha(x[w-2])} (${pc(x[w-1])})`))}. Spesifik distribusi spasial, ${lc(s[0][1])} tersebar di ${nw(t1.length)} kecamatan dengan luasan terbesar di ${L(t1.slice(0,3).map(x=>`${x[0]} sebesar ${ha(x[1])}`))}. Sementara itu, ${lc(s[1][1])} relatif terkonsentrasi di ${L(t2.slice(0,2).map(x=>`${x[0]} sebesar ${ha(x[1])}`))}.`;
    if(pg){const tp=byKec(pg),zero=kcs.filter((k,i)=>!(pg[2+i]>0));tx+=` Sebaliknya, fungsi tanaman pangan memiliki luasan yang lebih besar di ${L(tp.slice(0,3).map(x=>`${x[0]} sebesar ${ha(x[1])}`))}${zero.length?`, sedangkan ${L(zero.map(kecName))} nihil`:''}. Pola ini menunjukkan pembagian karakter ruang yang jelas, dengan wilayah sebagai kawasan permukiman dan kegiatan ekonomi di satu sisi, serta ruang yang masih diarahkan untuk fungsi pertanian di sisi lainnya.`}
    return tx;
  });
  add(331,/Rencana pola ruang/,()=>{
    const t=need('III-10'),w=t.head[0].length,r=D(t),T=TT(t),RT=d.plan('III-10')||'RDTR';
    const pg=r.find(x=>/Tanaman Pangan/i.test(x[1])),prot=r.filter(x=>/Perlindungan|Taman|Pemakaman|Jalur Hijau|Mangrove|Ruang Terbuka|Badan Air|Cagar/i.test(x[1])&&x[w-2]>0),ps=srt(prot,w-2).slice(0,4),urb=srt(r.filter(x=>/Perumahan|Perdagangan|Jasa/i.test(x[1])),w-2).slice(0,2);
    return `Rencana pola ruang ${W} berdasarkan ${RT} menunjukkan bahwa arah perkembangan wilayah tetap bertumpu pada fungsi perkotaan${urb.length?`, terutama ${L(urb.map(x=>lc(x[1])))}`:''}, namun masih disertai dengan ruang yang dipertahankan untuk fungsi pertanian, perlindungan, dan ruang terbuka. Kondisi ini terlihat dari dialokasikannya ${[pg?`${ha(pg[w-2])} untuk tanaman pangan`:'',ps.length?`${L(ps.map(x=>`${lc(x[1])} seluas ${ha(x[w-2])}`))}`:''].filter(Boolean).join(' serta ')}. Di sisi lain, dominasi zona perumahan maupun perdagangan menunjukkan tingginya kebutuhan ruang dalam rangka mendukung aktivitas perkotaan dan perekonomian ${W}. Komposisi ini menggambarkan adanya keseimbangan yang perlu dijaga antara perkembangan kawasan terbangun dengan keberadaan ruang pertanian dan kawasan yang memiliki fungsi perlindungan. Dengan karakter tersebut, rencana pola ruang dapat memberikan gambaran arah perkembangan ${W} sekaligus batasan fungsi ruang yang perlu diperhatikan dalam pemanfaatan tanah di masing-masing wilayah dengan total luas ${ha(T[w-2])}.`;
  });
  add(334,/Kawasan hutan merupakan/,old=>{
    const t=need('III-11'),w=t.head[0].length,r=D(t),T=TT(t),fo=r.filter(x=>!/Penggunaan Lain/i.test(x[1])&&x[w-2]>0),apl=r.find(x=>/Penggunaan Lain/i.test(x[1]));
    const last=fo.length?`${W} memiliki Kawasan Hutan berupa ${L(fo.map(x=>`${x[1]} seluas ${ha(x[w-2])} (${pc(x[w-1])})`))}${apl?`, sedangkan Area Penggunaan Lain seluas ${ha(apl[w-2])} atau sebesar ${pc(apl[w-1])} dari luas wilayah`:''}.`:`${W} tidak memiliki Kawasan Hutan, melainkan Area Penggunaan Lain seluas ${ha(T[w-2])} atau sebesar ${pc(100)} dari luas wilayah.`;
    return old.replace(/Kab\/Kota XXX tidak memiliki Kawasan Hutan.*$/,last);
  });

  // ===== BAB IV =====
  add(348,/perubahan penggunaan tanah/,()=>{
    const t=need('IV-1'),r=D(t),T=TT(t),s=srt(r,3),am=mx(r,2),mid=s.slice(1,-1),lo=s.at(-1);
    return `Merujuk pada Tabel IV-1, Gambar IV-1, dan Lampiran 8, secara umum perubahan penggunaan tanah di ${W} selama periode Tahun ${y0}–${y1} mencapai ${ha(T[2])} atau ${pc(T[3])} dari luas wilayah, sedangkan ${ha(T[4])} (${pc(T[5])}) tidak berubah. Secara spasial, ${kecName(s[0][1])} mencatatkan persentase perubahan penggunaan tanah tertinggi, yakni sebesar ${pc(s[0][3])} (${ha(s[0][2])})${mid.length?`, dilanjut oleh ${L(mid.map(x=>`${kecName(x[1])} sebesar ${pc(x[3])} (${ha(x[2])})`))}`:''}. Sementara itu, ${kecName(lo[1])} merupakan wilayah dengan tingkat perubahan penggunaan tanah paling rendah, yaitu ${pc(lo[3])} atau seluas ${ha(lo[2])}. ${am[1]!==s[0][1]?`Secara absolut, luas lahan berubah terbesar berada di ${kecName(am[1])} (${ha(am[2])}). `:''}Kondisi tersebut menunjukkan dinamika penggunaan tanah ${s[0][3]-lo[3]>1?'tidak tersebar secara merata, sehingga perkembangan pemanfaatan ruang lebih intensif pada kecamatan dengan persentase perubahan tertinggi':'relatif merata antarkecamatan'}. Di sisi lain, dominasi penggunaan tanah tidak berubah menunjukkan sebagian besar wilayah ${W} masih mempertahankan fungsi penggunaan tanahnya.`;
  });
  add(352,/pergeseran luasan|Penggunaan tanah/,()=>{
    const t=need('IV-2'),r=D(t).filter(x=>N(x[4])),inc=srt(r,4).filter(x=>x[4]>.005).slice(0,4),dec=[...r].sort((a,b)=>a[4]-b[4]).filter(x=>x[4]<-.005).slice(0,5);
    const agriDown=dec.some(x=>AG.test(x[1])),builtUp=inc.some(x=>BU.test(x[1]));
    return `Penggunaan tanah ${W} Tahun ${y0}–${y1} menunjukkan pergeseran luasan yang cukup beragam antar jenis penggunaan tanah (Tabel IV-2). Peningkatan terbesar terjadi pada ${L(inc.map(x=>`${lc(x[1])} sebesar ${ha(x[4])}`))}. Sementara itu, pengurangan terbesar terjadi pada ${L(dec.map(x=>`${lc(x[1])} sebesar ${ha(-x[4])}`))}. ${agriDown&&builtUp?'Komposisi tersebut memperlihatkan perubahan struktur penggunaan tanah yang cukup nyata, terutama berkurangnya ruang pertanian bersamaan dengan bertambahnya beberapa penggunaan yang mendukung fungsi permukiman dan perkotaan. Kondisi ini menggambarkan semakin intensifnya pemanfaatan ruang di wilayah tersebut, sejalan dengan kebutuhan ruang permukiman serta kegiatan perdagangan dan jasa.':'Komposisi tersebut memperlihatkan perubahan struktur penggunaan tanah antarjenis yang perlu dibaca bersama matriks perubahan penggunaan tanah pada bagian berikutnya.'}`;
  });
  const trans=()=>{const m3=need('IV-3'),nm=m3.head[1].slice(2),tr=[];D(m3).forEach(r=>nm.forEach((n,j)=>{const v=r[2+j];if(N(v)&&v>.005&&n&&r[1]!==n)tr.push([r[1],n,v])}));tr.sort((a,b)=>b[2]-a[2]);return tr};
  add(363,/pola perubahan penggunaan tanah/,()=>{
    const tr=trans(),all=sum(tr,2),t4=tr.slice(0,4),toBuilt=t4.filter(x=>BU.test(x[1])).length>=Math.ceil(t4.length/2);
    return `Merujuk Tabel IV-3, Gambar IV-2, dan Gambar IV-3, dapat diketahui pola perubahan penggunaan tanah di ${W} ${toBuilt?'cenderung mengarah pada peningkatan fungsi terbangun':'cukup beragam antarjenis penggunaan tanah'}, ditunjukkan perubahan ${lc(t4[0][0])} menjadi ${lc(t4[0][1])} sebesar ${ha(t4[0][2])} (${share(t4[0][2],all)})${t4.length>1?`, disusul ${L(t4.slice(1).map(x=>`${lc(x[0])} menjadi ${lc(x[1])} dengan luas ${ha(x[2])} (${share(x[2],all)})`))}`:''}. Adapun komposisi tersebut memperlihatkan bahwa perubahan penggunaan tanah ${t4.some(x=>AG.test(x[0])&&!AG.test(x[1]))?'tidak hanya terjadi pada lahan nonpertanian, tetapi juga menyentuh ruang pertanian yang kemudian beralih fungsi untuk memenuhi kebutuhan permukiman dan aktivitas perkotaan':'terjadi pada berbagai jenis penggunaan tanah'}. Hal ini memperkuat gambaran perkembangan ${W} yang berlangsung melalui intensifikasi pemanfaatan ruang, terutama pada ruang yang memiliki keterkaitan dengan kebutuhan hunian serta kegiatan ekonomi.`;
  });
  add(364,/Di sisi lain/,()=>{
    const tr=trans(),all=sum(tr,2),a2n=tr.filter(x=>AG.test(x[0])&&!AG.test(x[1])&&!WT.test(x[1])),sa=sum(a2n,2),oth=tr.slice(0,12).find(x=>!BU.test(x[1])&&!AG.test(x[0])&&x[0]!==x[1]);
    return `${oth?`Di sisi lain, perubahan ${lc(oth[0])} menjadi ${lc(oth[1])} sebesar ${ha(oth[2])} (${share(oth[2],all)}) menunjukkan adanya perubahan menuju fungsi yang berbeda dari kecenderungan perubahan lainnya. `:''}Secara keseluruhan, alih fungsi lahan pertanian (sawah, tegalan/ladang, dan tambak) menjadi penggunaan nonpertanian mencapai ${ha(sa)} (${share(sa,all)} dari seluruh perubahan antarjenis penggunaan tanah)${a2n.length?`, terutama ${L(srt(a2n,2).slice(0,3).map(x=>`${lc(x[0])} menjadi ${lc(x[1])} (${ha(x[2])})`))}`:''}. Kondisi ini menunjukkan bahwa di ${W}, tekanan kebutuhan ruang perkotaan semakin nyata. Apabila kecenderungan tersebut terus berlangsung, ruang pertanian yang tersisa akan semakin terfragmentasi dan berkurang, terutama pada wilayah yang mengalami perkembangan permukiman dan aktivitas perkotaan lebih intensif. Dinamika perubahan tersebut perlu menjadi perhatian dalam mengarahkan perkembangan ${W} agar kebutuhan ruang untuk permukiman dan kegiatan ekonomi tetap dapat terpenuhi tanpa mengurangi ruang pertanian dan ruang nonterbangun yang masih memiliki fungsi penting bagi keseimbangan wilayah.`;
  });
  const iv4=()=>{
    const r16=sh('IV-4');if(!r16)throw new Error('Sheet Tabel_IV-4 tidak ditemukan');
    const gm={};let fn='';
    blocks(r16)[0].slice(1).forEach(r=>{if(!B(r[1])){fn=r[1];gm[fn]=gm[fn]||{l:r[2],c:0,t:[]}}const m=String(r[3]).match(/^(.+) menjadi (.+)$/);if(m&&m[1]!==m[2]&&N(r[4])&&gm[fn]){gm[fn].c+=r[4];gm[fn].t.push([m[1],m[2],r[4]])}});
    const all=Object.values(gm).reduce((s,v)=>s+v.c,0);
    return{list:Object.entries(gm).map(([n,v])=>({n,l:v.l,c:v.c,t:v.t.sort((a,b)=>b[2]-a[2])})).sort((a,b)=>b.c-a.c),all};
  };
  add(371,/Masuk pada konteks/,()=>{
    const{list,all}=iv4(),top=list.slice(0,5).filter(x=>x.c>0);
    const seg=top.map((x,i)=>{const t=x.t.slice(0,2);return `${i===0?'':i===1?'Selanjutnya, pada ':'Pada '}zona ${lc(x.n)} seluas ${ha(x.c)} atau ${share(x.c,all)} dari total perubahan, perubahan utama berupa ${L(t.map(y=>`${lc(y[0])} menjadi ${lc(y[1])} dengan luas ${ha(y[2])} (${share(y[2],all)})`))}`});
    return `Masuk pada konteks yang lebih rinci dengan merujuk Tabel IV-4, dapat diketahui bahwa perubahan penggunaan tanah terbesar di ${W} selama periode Tahun ${y0}-${y1} terkonsentrasi pada ${seg.join('. ')}. Pola tersebut memperlihatkan bahwa perubahan penggunaan tanah ${top.length>1?'tidak tersebar secara merata antar-zona, tetapi terkonsentrasi pada zona-zona tertentu':'terkonsentrasi pada zona tertentu'}, dengan perubahan yang paling menonjol berasal dari ${L([...new Set(top.flatMap(x=>x.t.slice(0,1).map(y=>lc(y[0]))))])} menjadi penggunaan yang lebih intensif.`;
  });
  add(372,/Kondisi perubahan penggunaan tanah/,()=>{
    const{list}=iv4(),top=list.slice(0,3).filter(x=>x.c>0),pg=list.find(x=>/Tanaman Pangan/i.test(x.n)&&x.c>0);
    const pgCh=pg&&pg.t.find(y=>AG.test(y[0])&&BU.test(y[1]));
    return `Kondisi perubahan penggunaan tanah di ${W} telah menunjukkan bagaimana intensifnya perkembangan ruang, khususnya pada zona ${L(top.map(x=>lc(x.n)))}. Besarnya perubahan pada zona tersebut menunjukkan bahwa kebutuhan ruang menjadi salah satu penggerak utama perubahan penggunaan tanah, serta perlu diperhatikan keselarasannya dengan arahan fungsi kawasan dalam rencana tata ruang.${pgCh?` Di sisi lain, perubahan ${lc(pgCh[0])} menjadi ${lc(pgCh[1])} pada zona tanaman pangan menunjukkan adanya kondisi yang perlu dicermati karena perkembangan penggunaan tanah berlangsung pada ruang yang secara tata ruang masih diarahkan untuk fungsi pangan.`:''}`;
  });
  add(379,/Seperti dijabarkan/,()=>{
    const t=need('IV-5'),r=D(t).filter(x=>N(x[4])),inc=srt(r,4).filter(x=>x[4]>.005),dec=[...r].sort((a,b)=>a[4]-b[4]).filter(x=>x[4]<-.005),gone=r.filter(x=>x[2]>.005&&x[3]<=.005),neu=r.filter(x=>x[2]<=.005&&x[3]>.005);
    const i0=inc[0];
    return `Seperti dijabarkan Tabel IV-5 dan Gambar IV-4, dapat dijelaskan bahwa penggunaan tanah reklasifikasi menggambarkan perubahan pada tingkat kelas yang lebih umum, sehingga pola perubahan yang muncul tidak dipengaruhi oleh perbedaan nomenklatur antarjenis penggunaan tanah yang secara karakteristik masih sejenis. Hasil reklasifikasi penggunaan tanah ${W} Tahun ${y0}–${y1} menunjukkan ${i0?`peningkatan kelas ${lc(i0[1])} sebesar ${ha(i0[4])}, dari ${ha(i0[2])} menjadi ${ha(i0[3])}`:'tidak adanya peningkatan kelas yang signifikan'}${dec.length?`, yang utamanya berhadapan dengan penurunan ${L(dec.slice(0,2).map(x=>`${lc(x[1])} sebesar ${ha(-x[4])}`))}`:''}.${inc.slice(1,3).filter(x=>!neu.includes(x)).length?` Selain itu, ${L(inc.slice(1,3).filter(x=>!neu.includes(x)).map(x=>`kelas ${lc(x[1])} bertambah ${ha(x[4])}`))}.`:''}${gone.length?` Kelas ${L(gone.map(x=>lc(x[1])))} tidak lagi teridentifikasi pada tahun ${y1}.`:''}${neu.length?` Kelas ${L(neu.map(x=>lc(x[1])))} muncul pada tahun ${y1} seluas ${L(neu.map(x=>ha(x[3])))}.`:''} Pola tersebut mempertegas matriks perubahan sebelumnya bahwa dinamika penggunaan tanah ${W} ${i0&&/Nonpertanian/i.test(i0[1])?'mengalami peningkatan pemanfaatan kegiatan nonpertanian yang berlangsung bersamaan dengan berkurangnya ruang pertanian':'perlu dibaca bersama perubahan antarjenis penggunaan tanah'}.`;
  });
  add(380,/Berkaitan dengan perkembangan/,()=>{
    const t=need('IV-5'),r=D(t).filter(x=>N(x[4])),inc=srt(r,4)[0],dec=[...r].sort((a,b)=>a[4]-b[4]).filter(x=>x[4]<-.005).slice(0,2),nonp=inc&&/Nonpertanian/i.test(inc[1]);
    return `Berkaitan dengan perkembangan ${W}, perubahan pada tingkat reklasifikasi menunjukkan pergeseran struktur penggunaan tanah ${nonp?'dari pola ruang yang berkarakter pertanian menuju penggunaan lebih intensif dan berorientasi pada aktivitas perkotaan':'antarkelas penggunaan tanah'}. Peningkatan ${lc(inc[1])} sebesar ${ha(inc[4])} mencerminkan akumulasi berbagai perubahan penggunaan tanah yang pada tingkat jenis sebelumnya terlihat lebih sporadik${dec.length?`, sementara penurunan luas ${L(dec.map(x=>lc(x[1])))} memperlihatkan ${dec.some(x=>/sawah|pertanian/i.test(x[1]))?'semakin terbatasnya ruang yang mempertahankan fungsi pertanian':'berkurangnya luasan kelas tersebut'}`:''}.`;
  });
  add(388,/laju perubahan penggunaan tanah/,()=>{
    const t=need('IV-6'),r=D(t),ex=r.filter(x=>Math.abs(x[7])>100),nr=r.filter(x=>Math.abs(x[7])>1e-6&&Math.abs(x[7])<=100),up=srt(nr,7).filter(x=>x[7]>0),dn=[...nr].sort((a,b)=>a[7]-b[7]).filter(x=>x[7]<0),big=[...r].sort((a,b)=>Math.abs(b[2])-Math.abs(a[2]))[0];
    return `Adapun laju perubahan penggunaan tanah memperlihatkan tingkat dinamika masing-masing kelas penggunaan tanah selama periode Tahun ${y0}–${y1} (Tabel IV-6 dan Gambar IV-5). ${up.length?`Secara positif, kelas ${lc(up[0][1])} memiliki laju perubahan tertinggi sebesar ${pc(up[0][7])} per tahun, dari ${ha(up[0][4])} menjadi ${ha(up[0][3])}${up.length>1?`, diikuti ${L(up.slice(1,3).map(x=>`${lc(x[1])} sebesar ${pc(x[7])} per tahun`))}`:''}.`:'Tidak terdapat kelas dengan laju perubahan positif yang signifikan.'}${ex.length?` Kelas ${L(ex.map(x=>lc(x[1])))} memiliki laju yang sangat tinggi karena luas tahun awal relatif sangat kecil sehingga lebih tepat dibaca melalui selisih luas absolut (${L(ex.map(x=>ha(x[2])))}).`:''}${dn.length?` Sementara itu, penurunan paling tinggi terjadi pada ${L(dn.slice(0,3).map(x=>`${lc(x[1])} sebesar ${pc(x[7])} per tahun`))}.`:''}${big?` Secara luasan absolut, perubahan terbesar terjadi pada kelas ${lc(big[1])} yang ${big[2]>=0?'bertambah':'berkurang'} ${ha(Math.abs(big[2]))}.`:''}`;
  });
  add(391,/Adapun kesesuaian penggunaan tanah terhadap rencana tata ruang secara konseptual/,old=>old.replace(/Adapun RDTR ditetapkan melalui .*?\. (?=Ketentuan ITBX)/,'Adapun RDTR ditetapkan melalui [ISI: nomor dan tahun peraturan RDTR]. '));
  const srcLine=()=>`Sumber: Pengolahan Kantor Wilayah Badan Pertanahan Nasional Provinsi ${pv||'[ISI: Provinsi]'} Tahun ${y1}; [ISI: nomor dan tahun peraturan RDTR/RTRW]`;
  add(396,/^Sumber/,srcLine);
  add(400,/^Sumber/,srcLine);
  const iv8=()=>{
    const b8=bl('IV-8');if(!b8)throw new Error('Sheet Tabel_IV-8 tidak ditemukan');
    const dt=b8[0],sm=b8[1]||b8[0],r8=sm.body.filter(r=>!/^(Kota|Kabupaten|Total|Jumlah)/.test(String(r[0]))&&N(r[2])),T=sm.body.find(r=>/^(Kota|Kabupaten|Total)/.test(String(r[0])))||[];
    const rec=fillRecs(dt,(r,k,gp)=>({k,p:gp,s:r[3],sp:r[4],m:r[5],t:r[7],tp:r[8],j:r[9]}));
    return{r8,T,rec,RT:d.plan('IV-8')||'RDTR'};
  };
  add(405,/Penggunaan tanah .* Tahun .* secara umum menunjukkan/,()=>{
    const{r8,T,RT}=iv8(),s=srt(r8,3);
    return `Penggunaan tanah ${W} Tahun ${y1} secara umum menunjukkan tingkat kesesuaian yang ${T[3]>=80?'relatif tinggi':T[3]>=50?'sedang':'relatif rendah'} terhadap ${RT}, yaitu sebesar ${ha(T[2])} atau ${pc(T[3])} dari total wilayah ${ha(T[8])} sedangkan ${ha(T[6])} atau ${pc(T[7])} tergolong tidak sesuai${T[4]>0?`, serta ${ha(T[4])} atau ${pc(T[5])} tergolong mendukung`:''}. Adapun kesesuaian terbesar terdapat di ${kecName(s[0][1])} sebesar ${pc(s[0][3])}${s.length>1?`, disusul ${L(s.slice(1).map(x=>`${kecName(x[1])} ${pc(x[3])}`))}`:''}. Komposisi ini menunjukkan ${T[3]>=80?'sebagian besar penggunaan tanah aktual telah berada pada fungsi ruang yang diperbolehkan dalam ketentuan ITBX':T[3]>=50?'sebagian besar penggunaan tanah aktual telah berada pada fungsi ruang yang diperbolehkan dalam ketentuan ITBX, meskipun masih terdapat bagian yang cukup besar yang belum selaras':'masih terdapat bagian yang cukup besar dari penggunaan tanah aktual yang belum selaras dengan fungsi ruang dalam ketentuan ITBX'} sehingga perkembangan pemanfaatan ruang di ${W} ${T[3]>=50?'telah banyak mengikuti':'perlu diarahkan agar sesuai dengan'} arah ruang yang direncanakan.`;
  });
  add(406,/Kesesuaian sebagaimana dimaksud/,()=>{
    const{r8,rec}=iv8(),area={};r8.forEach(r=>{area[r[1]]=r[8]});
    const ks=[...new Set(rec.map(x=>x.k))].map(k=>{const top=rec.filter(x=>x.k===k&&x.s>0).sort((a,b)=>b.s-a.s).slice(0,3);return `Di ${kecName(k)}, ${top.map(x=>`${lc(x.p)} seluas ${ha(x.s)} (${share(x.s,area[k])} dari luas wilayah kecamatan)`).join(', ')} tergolong sesuai.`});
    return `Kesesuaian sebagaimana dimaksud terlihat pada penggunaan tanah yang menempati zona dengan fungsi yang relatif jelas. ${ks.join(' ')} Hal ini menunjukkan bahwa struktur ruang yang telah berkembang pada sebagian besar lokasi telah memiliki keterkaitan dengan fungsi ruang yang direncanakan. Kondisi tersebut memberikan ruang yang relatif jelas bagi keberlanjutan aktivitas wilayah sekaligus menjadi dasar yang lebih terarah dalam mengendalikan perkembangan pemanfaatan tanah.`;
  });
  add(407,/Sementara itu, ketidaksesuaian/,()=>{
    const{r8,T,rec,RT}=iv8(),area={};r8.forEach(r=>{area[r[1]]=r[8]});
    const gp=groupSum(rec,'p','t').filter(x=>x[1]>0).slice(0,3);
    const det=gp.slice(0,3).map((x,i)=>{const ks=rec.filter(y=>y.p===x[0]&&y.t>0).sort((a,b)=>b.t-a.t).slice(0,3);return `${i===0?'Ketidaksesuaian terbesar secara keseluruhan terdapat pada':i===1?'Selain itu,':'Ketidaksesuaian juga cukup besar pada'} ${lc(x[0])} sebesar ${ha(x[1])} (${share(x[1],T[8])})${/Jalan|Air|Sungai/i.test(x[0])&&i===0?` yang dapat dipengaruhi oleh perbedaan skala pemetaan NPGT dan ${RT}`:''}, dengan konsentrasi terbesar di ${L(ks.map(y=>`${kecName(y.k)} ${ha(y.t)} atau ${share(y.t,area[y.k])} dari luas wilayah kecamatan`))}.`});
    return `Sementara itu, ketidaksesuaian penggunaan tanah sebesar ${ha(T[6])} atau ${pc(T[7])} dari luas wilayah ${W}, tersebar pada beberapa fungsi ruang dan karakter spasial berbeda antarwilayah. ${det.join(' ')} Sebaran tersebut menunjukkan bahwa bagian wilayah yang belum sepenuhnya selaras dengan ${RT} tidak hanya berada pada kawasan budidaya, tetapi juga dapat menyentuh fungsi transportasi, ruang terbuka, perlindungan, dan pertanian yang memiliki peran penting dalam menjaga struktur serta keseimbangan ruang ${W}.`;
  });
  add(408,/Secara keseluruhan, dapat diketahui/,()=>{
    const{T,rec,RT}=iv8(),gp=groupSum(rec,'p','t').filter(x=>x[1]>0).slice(0,3);
    return `Secara keseluruhan, dapat diketahui bahwa tantangan penataan ruang ${W} ${T[3]>=50?'bukan terletak pada kesesuaian mayoritas penggunaan tanah, melainkan pada pengelolaan bagian wilayah yang masih tidak sesuai agar tidak berkembang menjadi tekanan ruang yang lebih besar':'terletak pada besarnya bagian wilayah yang masih tidak sesuai sehingga perlu dikendalikan agar tidak berkembang menjadi tekanan ruang yang lebih besar'}. Perhatian terutama diperlukan pada penggunaan tanah yang tidak sesuai di sekitar ${L(gp.map(x=>lc(x[0])))} sebab perubahan atau intensifikasi pemanfaatannya dapat berpengaruh terhadap fungsi layanan, produktivitas ruang, dan kualitas lingkungan. Dengan demikian, hasil kesesuaian ini dapat menjadi dasar untuk menentukan lokasi yang memerlukan pengendalian lebih lanjut sekaligus mempertahankan penggunaan tanah yang telah sejalan dengan ${RT}.`;
  });
  add(420,/Sebagaimana dijelaskan Tabel IV-9/,()=>{
    const t=need('IV-9'),T=TT(t),mostly=T[5]>=50;
    return `Sebagaimana dijelaskan Tabel IV-9, Gambar IV-7, serta Lampiran 10, ${mostly?`sebagian besar wilayah ${W} berada pada kategori tidak tersedia, yaitu ${ha(T[4])} atau ${pc(T[5])} dari luas wilayah, sedangkan tanah tersedia sebesar ${ha(T[2])} atau ${pc(T[3])}`:`tanah tersedia mencapai ${ha(T[2])} atau ${pc(T[3])} dari luas wilayah, sedangkan ${ha(T[4])} atau ${pc(T[5])} berada pada kategori tidak tersedia`}. Komposisi tersebut menunjukkan ruang dengan peluang pemanfaatan secara indikatif ${T[3]<20?'cenderung terbatas':'cukup besar'} dibandingkan keseluruhan wilayah sehingga ketersediaan tanah perlu dipahami sebagai ${T[3]<20?'keterbatasan ruang dalam mendukung pembangunan':'peluang yang tetap perlu dikendalikan sesuai fungsi ruang'}.`;
  });
  add(421,/Merujuk pada distribusi/,()=>{
    const t=need('IV-9'),r=D(t),s=srt(r,2),hp=mx(r,3);
    return `Merujuk pada distribusi secara spasial, tanah tersedia terbesar terdapat di ${kecName(s[0][1])} sebesar ${ha(s[0][2])} atau ${pc(s[0][3])} dari luas kecamatannya${s.length>1?`, disusul ${L(s.slice(1).map(x=>`${kecName(x[1])} sebesar ${ha(x[2])} (${pc(x[3])})`))}`:''}. ${hp[1]!==s[0][1]?`Meskipun ${kecName(hp[1])} memiliki proporsi tertinggi, ${kecName(s[0][1])} memiliki luasan tersedia paling besar. `:''}Sebaran tersebut menunjukkan bahwa peluang pemanfaatan tanah ${s[0][3]-mn(r,3)[3]>10?'terkonsentrasi lebih besar pada kecamatan tertentu':'tidak terkonsentrasi pada satu kecamatan'}, sehingga pemanfaatannya perlu diarahkan secara selektif dengan mempertimbangkan kebutuhan ruang dan karakter perkembangan masing-masing wilayah.`;
  });
  add(422,/Di sisi lain, tanah tidak tersedia/,()=>{
    const t=need('IV-9'),r=D(t),s=srt(r,5);
    return `Di sisi lain, tanah tidak tersedia ${s.every(x=>x[5]>=50)?'mendominasi seluruh kecamatan':'tersebar pada seluruh kecamatan'} dengan proporsi tertinggi di ${kecName(s[0][1])} seluas ${pc(s[0][5])}${s.length>1?`, ${L(s.slice(1).map(x=>`${kecName(x[1])} ${pc(x[5])}`))}`:''}. Kondisi tersebut menunjukkan bahwa ruang pengembangan ${W} dihadapkan pada keterbatasan tanah yang dapat dimanfaatkan secara indikatif sehingga pemenuhan kebutuhan permukiman, kegiatan ekonomi maupun fasilitas perkotaan perlu lebih mengutamakan optimalisasi ruang yang telah tersedia tanpa mendorong tekanan baru terhadap ruang pertanian dan ruang nonterbangun yang tersisa.`;
  });
  const iv10=()=>fillRecs(need('IV-10'),(r,k,gp)=>({k,u:gp,a:r[3],n:r[5],j:r[7]}));
  add(429,/Ketersediaan tanah di .* tersebar pada berbagai jenis/,()=>{
    const rec=iv10(),gs=groupSum(rec,'u','a').filter(x=>x[1]>0),tot=rec.reduce((s,x)=>s+(N(x.a)?x.a:0),0),top=gs.slice(0,3);
    const builtTop=top.filter(x=>BU.test(x[0])).length>=2;
    return `Ketersediaan tanah di ${W} tersebar pada berbagai jenis penggunaan tanah, namun secara luasan paling banyak berada pada ${lc(top[0][0])} sebesar ${ha(top[0][1])} atau ${share(top[0][1],tot)} dari total tanah tersedia${top.length>1?`, disusul ${L(top.slice(1).map(x=>`${lc(x[0])} sebesar ${ha(x[1])} (${share(x[1],tot)})`))}`:''} (Tabel IV-10). Adapun komposisi tersebut menunjukkan bahwa tanah yang secara indikatif tersedia ${builtTop?'tidak hanya berupa ruang yang belum terbangun, tetapi cukup besar justru berada pada penggunaan tanah yang telah berkembang sebagai kawasan terbangun sehingga peluang pemanfaatannya perlu dilihat secara lebih selektif sesuai fungsi dan karakter ruang yang telah terbentuk':'sebagian besar berada pada penggunaan tanah nonterbangun sehingga pemanfaatannya perlu dikendalikan agar tidak menekan ruang pertanian maupun fungsi ruang lainnya'}.`;
  });
  add(430,/Secara spasial, .* memiliki tanah tersedia terbesar/,()=>{
    const rec=iv10(),t9=need('IV-9'),r9=srt(D(t9),2),tot=TT(t9)[2];
    const seg=r9.map((x,i)=>{const us=rec.filter(y=>y.k===x[1]&&y.a>0).sort((a,b)=>b.a-a.a).slice(0,3);return `${i===0?`Secara spasial, ${kecName(x[1])} memiliki tanah tersedia terbesar yaitu`:i===1?`Sementara itu, ${kecName(x[1])} memiliki`:`${kecName(x[1])} memiliki`} ${ha(x[2])} (${share(x[2],tot)} dari total tanah tersedia), dengan kontribusi utama ${L(us.map(y=>`${lc(y.u)} seluas ${ha(y.a)} (${share(y.a,x[2])})`))}.`});
    const ag=groupSum(rec,'u','a').filter(x=>AG.test(x[0])&&x[1]>0).slice(0,2);
    return `${seg.join(' ')} Pola tersebut menunjukkan bahwa peluang pemanfaatan tanah tersedia di setiap kecamatan ${groupSum(rec,'u','a').slice(0,3).filter(x=>BU.test(x[0])).length>=2?'banyak berada pada kawasan yang telah berkembang sehingga pemanfaatannya lebih relevan diarahkan pada optimalisasi dan penataan ruang yang sudah berkembang daripada membuka ruang baru secara ekstensif':'tersebar pada berbagai penggunaan tanah sehingga arah pemanfaatannya perlu disesuaikan dengan karakter masing-masing kecamatan'}.${ag.length?` Sementara itu, ruang pertanian yang tersedia meliputi ${L(ag.map(x=>`${lc(x[0])} sebesar ${ha(x[1])} (${share(x[1],tot)})`))}. Kondisi ini perlu dibaca bersama temuan sebelumnya mengenai tekanan perubahan ruang pertanian menuju fungsi perkotaan di ${W}.`:''}`;
  });
  const iv11=()=>fillRecs(need('IV-11'),(r,k,gp)=>({k,p:gp,a:r[3],n:r[5],j:r[7]}));
  add(437,/Ketersediaan tanah berdasarkan rencana pola ruang/,()=>{
    const rec=iv11(),gs=groupSum(rec,'p','a').filter(x=>x[1]>0).slice(0,5),RT=d.plan('IV-11')||'RDTR';
    return `Ketersediaan tanah berdasarkan rencana pola ruang ${RT} menunjukkan bahwa ruang yang masih memiliki peluang pengembangan di ${W} tersebar pada berbagai fungsi ruang dan tidak seluruhnya berada pada pola ruang yang bersifat pengembangan (Tabel IV-11). Sebagian tanah tersedia berada pada pola ruang ${L(gs.map(x=>`${lc(x[0])} (${ha(x[1])})`))}. Dengan demikian, tanah yang teridentifikasi tersedia di ${W} perlu diarahkan dengan mempertimbangkan fungsi ruang agar pemanfaatannya dapat berkembang secara tepat sesuai karakter dan ketentuan pola ruang masing-masing wilayah.`;
  });
  add(438,/Secara spasial, ketersediaan tanah/,()=>{
    const rec=iv11(),ar=kecArea(),ks=[...new Set(rec.map(x=>x.k))];
    const seg=ks.map((k,i)=>{const top=rec.filter(x=>x.k===k&&x.a>0).sort((a,b)=>b.a-a.a).slice(0,3);return `${i===0?'Secara spasial, ketersediaan tanah di':i===1?'Sementara itu, di':'Adapun di'} ${kecName(k)} lebih banyak berada pada ${L(top.map(x=>`${lc(x.p)} sebesar ${ha(x.a)} (${share(x.a,ar[k])} dari luas wilayah kecamatan)`))}.`});
    return `${seg.join(' ')} Sebaran tersebut memperlihatkan tanah tersedia di ${W} memiliki karakter ruang beragam sehingga peluang pengembangannya tidak hanya ditentukan oleh luas, tetapi juga oleh lokasi serta fungsi ruangnya.`;
  });
  add(439,/Sementara itu, tanah tidak tersedia tetap mendominasi/,()=>{
    const t=need('IV-9'),r=D(t),ps=r.map(x=>x[5]),mxA=mx(r,4),RT=d.plan('IV-11')||'RDTR';
    return `Sementara itu, tanah tidak tersedia ${ps.every(v=>v>=50)?'tetap mendominasi seluruh kecamatan':'tersebar pada seluruh kecamatan'}, dengan proporsi berkisar ${f(Math.min(...ps))}–${pc(Math.max(...ps))} dan luas terbesar terdapat di ${kecName(mxA[1])} sebesar ${ha(mxA[4])} (${pc(mxA[5])}). Dominasi tersebut menggambarkan keterbatasan ruang yang dapat dikembangkan secara baru, terutama pada wilayah yang telah memiliki fungsi ruang perkotaan maupun fungsi strategis lainnya. Bagi ${W}, kondisi ini menegaskan perlunya mengoptimalkan tanah yang masih tersedia secara selektif, sekaligus mengendalikan tekanan terhadap ruang yang telah memiliki fungsi tertentu agar perkembangan permukiman, kegiatan ekonomi, dan infrastruktur tetap sejalan dengan struktur ruang yang telah ditetapkan. Sebagai catatan kemudian bahwa status ketersediaan hasil penyandingan dengan pola ruang ${RT} belum menunjukkan bentuk pemanfaatan yang dapat dilakukan secara langsung karena setiap bidang masih memiliki keterkaitan fungsi ruang yang ditetapkan. Oleh karena itu, hasil tersebut perlu diterjemahkan ke dalam arahan ketersediaan tanah (Tabel IV-12) untuk melihat bentuk pemanfaatan atau penyesuaian yang sesuai dengan fungsi ruang masing-masing.`;
  });
  const clsA=a=>/^Tidak tersedia/i.test(a)?'tidak':/Kawasan lindung/i.test(a)?'lindung':/optimalisasi/i.test(a)?'opt':/sesuai tata ruang/i.test(a)?'sesuai':/penyesuaian/i.test(a)?'sesuaikan':'lain';
  const iv12=()=>{
    const r12=need('IV-12');let kec='',pol='';const rec=[];
    r12.body.forEach(r=>{if(/^(Jumlah|Total|Kota |Kabupaten )/.test(String(r[0]||'')))return;if(!B(r[1]))kec=r[1];if(!B(r[2]))pol=r[2];if(!B(r[3])&&N(r[4]))rec.push({k:kec,p:pol,c:clsA(String(r[3])),a:r[4]})});
    return rec;
  };
  add(450,/Lebih lanjut, berdasarkan Tabel IV-12/,()=>{
    const rec=iv12(),tot=areaTot(),by=c=>rec.filter(x=>x.c===c);
    const S=c=>by(c).reduce((s,x)=>s+x.a,0),cs=[['opt','optimalisasi penggunaan tanah'],['sesuai','tersedia sesuai tata ruang'],['sesuaikan','penyesuaian penggunaan tanah'],['lindung','penyesuaian di kawasan lindung'],['tidak','tidak tersedia']].map(([c,n])=>({c,n,v:S(c)})).sort((a,b)=>b.v-a.v);
    const opt=by('opt'),op=groupSum(opt,'p','a').slice(0,5);
    return `Lebih lanjut, berdasarkan Tabel IV-12, arahan ${cs[0].n} merupakan kategori dengan luasan terbesar di ${W} yaitu ${ha(cs[0].v)} atau sekitar ${share(cs[0].v,tot)}. ${opt.length?`${cs[0].c==='opt'?'Jika':'Arahan untuk optimalisasi penggunaan tanah mencapai '+ha(S('opt'))+' ('+share(S('opt'),tot)+') yang jika'} dilihat berdasarkan rencana pola ruangnya paling banyak diarahkan pada ${L(op.map(x=>`${lc(x[0])} sebesar ${ha(x[1])} (${share(x[1],tot)})`))}. Besarnya arahan optimalisasi pada ${lc(op[0][0])} menunjukkan bahwa peluang pemanfaatan tanah di ${W} berkaitan dengan penguatan dan optimalisasi fungsi ruang yang telah memiliki peruntukan tersebut, bukan membuka ruang baru sehingga pemanfaatan dilakukan dengan mengoptimalkan kapasitas dan fungsi yang telah ada.`:'Tidak terdapat arahan optimalisasi penggunaan tanah pada wilayah ini.'}`;
  });
  add(451,/Dalam dimensi spasial/,()=>{
    const rec=iv12(),tot=areaTot(),ks=[...new Set(rec.map(x=>x.k))],ar=kecArea();
    const seg=ks.map((k,i)=>{const o=rec.filter(x=>x.k===k&&x.c==='opt'),sv=o.reduce((s,x)=>s+x.a,0),top=groupSum(o,'p','a').slice(0,3);return {k,sv,txt:`${kecName(k)} memiliki arahan optimalisasi sebesar ${ha(sv)} (${share(sv,tot)} dari total luas wilayah)${top.length?`, terutama pada ${L(top.map(x=>`${lc(x[0])} sebesar ${ha(x[1])} (${share(x[1],tot)})`))}`:''}`}}).sort((a,b)=>b.sv-a.sv);
    return `Dalam dimensi spasial, ${seg.map((s,i)=>`${i===0?'':i===1?'Sementara itu, ':'Selanjutnya, '}${s.txt}.`).join(' ')} Sebaran tersebut memperlihatkan bahwa setiap wilayah memiliki kombinasi fungsi yang berbeda sesuai karakter ruangnya sehingga optimalisasi perlu dilakukan secara berbeda pada masing-masing kecamatan, dengan mempertahankan fungsi yang telah sesuai sekaligus meningkatkan pemanfaatannya agar kebutuhan ruang dapat dipenuhi tanpa memperluas tekanan terhadap fungsi ruang lainnya.`;
  });
  add(452,/Selain arahan optimalisasi/,old=>{
    const rec=iv12(),tot=areaTot(),S=c=>rec.filter(x=>x.c===c).reduce((s,x)=>s+x.a,0);
    const first=`Selain arahan optimalisasi, terdapat ${ha(S('sesuai'))} (${share(S('sesuai'),tot)}) yang diarahkan tersedia sesuai tata ruang, ${ha(S('sesuaikan'))} (${share(S('sesuaikan'),tot)}) untuk penyesuaian penggunaan tanah, dan ${ha(S('lindung'))} (${share(S('lindung'),tot)}) untuk penyesuaian penggunaan tanah di kawasan lindung, sementara ${ha(S('tidak'))} (${share(S('tidak'),tot)}) tetap berada pada kategori tidak tersedia.`;
    return old.replace(/^Selain arahan optimalisasi.*?kategori tidak tersedia\./,first).replace(/rencana pola ruang RDTR/g,`rencana pola ruang ${d.plan('IV-12')||'RDTR'}`);
  });
  add(454,/Potensi pertanian pangan dan potensi sektor lain/,old=>{
    const t=need('IV-16'),sec=[...new Set(t.body.filter(r=>!B(r[1])&&typeof r[1]==='string').map(r=>sector(r[1])))];
    return old.replace(/dalam hal ini adalah sektor pariwisata dan perumahan/,`dalam hal ini adalah sektor ${L(sec)}`);
  });
  add(461,/Secara umum, arahan ketersediaan tanah/,()=>{
    const t=need('IV-14'),r=D(t),T=TT(t),sisa=r.find(x=>/Sisa/i.test(x[1])),pot=srt(r.filter(x=>!/Sisa/i.test(x[1])),2);
    return `Secara umum, arahan ketersediaan tanah seperti yang telah dijelaskan sebelumnya dapat menjadi informasi potensi sektoral untuk melihat ruang yang memiliki peluang pemanfaatan bagi sektor tertentu di ${W}. Adapun ${W} memiliki potensi ${sector(pot[0][1])} terbesar seluas ${ha(pot[0][2])} atau ${pc(pot[0][3])}${pot.length>1?`, diikuti ${L(pot.slice(1,4).map(x=>`potensi ${sector(x[1])} sebesar ${ha(x[2])} atau ${pc(x[3])}`))}`:''}${sisa?`, sedangkan sisa luas ${W} sebesar ${ha(sisa[2])} atau ${pc(sisa[3])} belum teridentifikasi sebagai potensi sektoral`:''}. Komposisi tersebut menunjukkan bahwa potensi sektoral ${W} ${/Permukiman|Perumahan/i.test(pot[0][1])?'masih didominasi kebutuhan ruang permukiman':'didominasi oleh '+sector(pot[0][1])}, sementara potensi sektor lainnya memberikan ruang untuk mempertahankan serta mengoptimalkan fungsi produksi dan ekonomi yang telah menjadi bagian dari karakter wilayah. Kondisi ini penting bagi ${W} sebab pemanfaatan tanah untuk memenuhi kebutuhan perkotaan perlu dilakukan secara selektif agar tidak mengurangi ruang yang masih berfungsi mendukung pertanian pangan dan fungsi ruang lainnya.`;
  });
  const iv15=()=>{
    const t=need('IV-15'),w=t.head[0].length,kcs=t.head[1].slice(2,w-1).map(String),T=TT(t),rows=D(t).filter(x=>N(x[w-1]));
    const opt=rows.filter(x=>/optimalisasi/i.test(x[1])),ses=rows.filter(x=>/sesuai tata ruang/i.test(x[1])),so=opt.reduce((s,x)=>s+x[w-1],0),ss=ses.reduce((s,x)=>s+x[w-1],0);
    return{w,kcs,T,so,ss,perKec:kcs.map((k,i)=>[k,T[2+i]])};
  };
  add(470,/Adapun potensi pertanian pangan/,()=>{
    const{w,kcs,T,so,ss,perKec}=iv15(),tot=areaTot(),ar=kecArea(),s=perKec.filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
    return `Adapun potensi pertanian pangan di ${W} mencapai ${ha(T[w-1])} atau ${share(T[w-1],tot)} dari luas wilayah ${W}, terdiri atas ${so>0&&ss>0?`${ha(so)} atau ${share(so,tot)} untuk tanaman pangan dalam rangka optimalisasi penggunaan tanah dan ${ha(ss)} atau ${share(ss,tot)} yang tersedia sesuai tata ruang`:so>0?'seluruhnya arahan optimalisasi penggunaan tanah pada fungsi tanaman pangan':'seluruhnya tersedia sesuai tata ruang'}. Secara spasial, potensi tersebut paling luas terdapat di ${L(s.map(x=>`${kecName(x[0])} sebesar ${ha(x[1])} atau ${share(x[1],ar[x[0]])} dari luas kecamatan`))}. ${so>=ss?`Dominannya arahan optimalisasi menunjukkan potensi pertanian pangan di ${W} lebih banyak berkaitan dengan penguatan dan peningkatan produktivitas ruang pertanian yang telah ada dibandingkan pembukaan ruang pertanian baru. `:''}Kondisi ini penting diperhatikan sebab ruang pertanian di ${W} menghadapi tekanan perkembangan perkotaan sehingga pemanfaatan tanah yang telah diarahkan untuk tanaman pangan perlu dipertahankan dan dioptimalkan agar fungsi produksi pangan tetap dapat berjalan di tengah kebutuhan ruang yang terus berkembang.`;
  });
  add(471,/Sebagai catatan, /,()=>{
    const{ss}=iv15();
    return ss>0?`Sebagai catatan, ${ha(ss)} yang tersedia sesuai tata ruang menunjukkan adanya ruang yang secara rencana diarahkan untuk tanaman pangan, tetapi kondisi tersebut tetap perlu dilihat bersama penggunaan tanah eksisting. Apabila ruang tersebut saat ini telah digunakan untuk fungsi nonpertanian, kesesuaiannya dengan pola ruang tidak serta-merta menunjukkan bahwa lahan tersebut dapat langsung dikembangkan sebagai pertanian, karena perubahan penggunaan tanah memerlukan penyesuaian terhadap kondisi pemanfaatan yang telah ada. Kondisi ini menjadi penting bagi ${W} yang menghadapi tekanan alih fungsi sehingga ruang pertanian eksisting perlu lebih diutamakan untuk dipertahankan dan dioptimalkan, sedangkan ruang yang diarahkan untuk tanaman pangan dapat menjadi bagian dari penataan secara bertahap sesuai kondisi lapangan dan rencana tata ruang.`:`Sebagai catatan, tidak terdapat tanah yang tersedia sesuai tata ruang untuk potensi pertanian pangan sehingga seluruh potensi berasal dari arahan optimalisasi penggunaan tanah. Kondisi ini menunjukkan bahwa ruang pertanian eksisting di ${W} perlu lebih diutamakan untuk dipertahankan dan dioptimalkan produktivitasnya di tengah tekanan alih fungsi lahan.`;
  });
  add(473,/Adapun potensi sektor lain/,old=>{
    const t=need('IV-16'),sec=[...new Set(t.body.filter(r=>!B(r[1])&&typeof r[1]==='string').map(r=>sector(r[1])))],ls=L(sec);
    return old.replace(/dalam hal ini adalah pariwisata dan perumahan\./,`dalam hal ini adalah ${ls}.`).replace(/Kedua sektor tersebut/,'Sektor-sektor tersebut').replace(/pengembangan pariwisata dan perumahan secara lebih terarah/,`pengembangan ${ls} secara lebih terarah`);
  });
  const iv16=()=>{
    const t=need('IV-16'),w=t.head[0].length,kcs=t.head[1].slice(3,w-1).map(String);let cur='';const secs=[],ar=[];
    t.body.forEach(r=>{
      if(/^Jumlah/.test(String(r[0]||'')))return;
      if(!B(r[1])&&typeof r[1]==='string'&&B(r[0])===false)cur=r[1];
      if(typeof r[2]==='string'&&/\(Ha\)\s*$/.test(r[2])&&B(r[0]))secs.push({n:sector(r[2]),v:r.slice(3,w-1),t:r[w-1]});
      else if(typeof r[2]==='string'&&N(r[w-1]))ar.push({s:sector(cur),a:String(r[2]),t:r[w-1]});
    });
    return{secs,ar,kcs,w,T:TT(t)};
  };
  add(483,/Adapun potensi sektor lain/,()=>{
    const{secs,kcs,T,w}=iv16(),tot=areaTot(),ar=kecArea(),ss=[...secs].sort((a,b)=>b.t-a.t).filter(x=>x.t>0);
    const sp=ss.slice(0,3).map(s=>{const o=kcs.map((k,i)=>[k,s.v[i]]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);return `potensi ${s.n} ${o.length?`terbesar di ${L(o.slice(0,2).map(x=>`${kecName(x[0])} ${ha(x[1])} atau ${share(x[1],ar[x[0]])} dari luas kecamatan`))}`:'belum teridentifikasi'}`});
    return `Adapun potensi sektor lain di ${W} mencapai ${ha(T[w-1])} atau ${share(T[w-1],tot)} dari luas wilayah, yang terdiri atas ${L(ss.map(s=>`potensi ${s.n} sebesar ${ha(s.t)} atau ${share(s.t,tot)}`))}. Secara spasial, ${sp.join('; ')}. Pola ini menunjukkan bahwa potensi sektor lain di ${W} ${ss[0]&&/permukiman|perumahan/i.test(ss[0].n)?'lebih banyak berkaitan dengan peningkatan fungsi permukiman/perumahan yang telah berkembang':'terdistribusi menurut karakter ruang masing-masing kecamatan'}.`;
  });
  add(484,/Potensi permukiman yang tersedia/,()=>{
    const{ar}=iv16(),tot=areaTot(),pm=ar.filter(x=>/permukiman|perumahan/.test(x.s)),pses=pm.filter(x=>/sesuai tata ruang/i.test(x.a)).reduce((s,x)=>s+x.t,0),popt=pm.filter(x=>/optimalisasi/i.test(x.a)).reduce((s,x)=>s+x.t,0);
    return `Potensi permukiman yang tersedia sesuai tata ruang sebesar ${ha(pses)} (${share(pses,tot)}), sedangkan potensi permukiman melalui optimalisasi penggunaan tanah sebesar ${ha(popt)} (${share(popt,tot)}). Kategori sesuai tata ruang tetap perlu dipahami bersama kondisi penggunaan tanah eksisting. Apabila suatu ruang secara rencana diarahkan untuk perumahan atau fungsi tertentu tetapi saat ini digunakan untuk fungsi lain, kondisi tersebut lebih menunjukkan adanya arahan penyesuaian penggunaan tanah daripada ruang yang langsung siap dikembangkan. Sebaliknya, arahan optimalisasi lebih menekankan peningkatan fungsi yang telah ada. Pola ini menunjukkan bahwa pemenuhan kebutuhan sektor lain di ${W} perlu diarahkan melalui optimalisasi ruang yang telah berkembang, dengan tetap mengendalikan perubahan penggunaan tanah agar tidak menekan fungsi pertanian, ruang terbuka, maupun fungsi ruang lainnya.`;
  });
  add(493,/Potensi cadangan karbon/,()=>{
    const t=need('IV-17'),r=D(t).filter(x=>N(x[4])),T=TT(t),inc=srt(r,4).filter(x=>x[4]>.5).slice(0,3),dec=[...r].sort((a,b)=>a[4]-b[4]).filter(x=>x[4]<-.5).slice(0,4),up=T[4]>=0;
    return `Potensi cadangan karbon ${W} ${up?'meningkat':'menurun'} dari ${f(T[2])} Ton pada Tahun ${y0} menjadi ${f(T[3])} Ton Tahun ${y1} atau mengalami ${up?'surplus':'defisit'} sebesar ${f(Math.abs(T[4]))} Ton. ${inc.length?`Peningkatan tersebut terutama dipengaruhi oleh bertambahnya cadangan karbon pada kelas ${L(inc.map(x=>`${lc(x[1])} sebesar ${f(x[4])} Ton`))}`:''}${dec.length?`${inc.length?', sedangkan':'Penurunan terjadi pada'} ${L(dec.map(x=>`${lc(x[1])} (${f(Math.abs(x[4]))} Ton)`))} ${inc.length?'mengalami penurunan':''}`:''}. Kondisi tersebut menunjukkan bahwa ${up?'surplus':'perubahan'} cadangan karbon ${W} dipengaruhi oleh perubahan komposisi penutup lahan sehingga besar perubahan total karbon tidak serta-merta menunjukkan bahwa seluruh kondisi lingkungan mengalami peningkatan.`;
  });
  add(494,/Temuan tersebut/,()=>{
    const t=need('IV-17'),r=D(t).filter(x=>N(x[4])),T=TT(t),inc=srt(r,4).filter(x=>x[4]>.5),dec=[...r].sort((a,b)=>a[4]-b[4]).filter(x=>x[4]<-.5).slice(0,3);
    return `Temuan tersebut memiliki implikasi penting dalam melihat perkembangan ruang ${W}. ${inc.length?`Di satu sisi, bertambahnya cadangan karbon pada ${lc(inc[0][1])} memberikan kontribusi terhadap perubahan simpanan karbon wilayah`:'Di satu sisi, perubahan cadangan karbon relatif kecil'}${dec.length?`, namun di sisi lain penurunan cadangan karbon pada ${L(dec.map(x=>`${lc(x[1])} sebesar ${f(Math.abs(x[4]))} Ton`))} menunjukkan berkurangnya simpanan karbon pada beberapa ruang yang sebelumnya memiliki fungsi vegetasi dan produksi`:''}. Dengan demikian, ${T[4]>=0?'surplus':'perubahan'} yang tercatat perlu dipahami bersama sumber perubahan penutup lahannya agar tidak hanya berfokus pada nilai total cadangan karbon. Bagi ${W}, informasi tersebut dapat menjadi pertimbangan dalam mengendalikan perubahan penggunaan tanah dengan tetap mempertahankan ruang pertanian dan vegetasi yang masih tersisa sekaligus memastikan bahwa perubahan cadangan karbon yang berasal dari perubahan penutup lahan tidak mengaburkan kehilangan fungsi ekologis pada ruang lainnya.`;
  });
  add(506,/Potensi sosial ekonomi/,()=>{
    const t=need('IV-18'),T=TT(t);
    return `Potensi sosial ekonomi ${W} menunjukkan keterkaitan ketersediaan tanah, penguasaan tanah dan kepadatan penduduk sebagai informasi dalam melihat peluang pengembangan wilayah. Secara keseluruhan, tanah teridentifikasi tersedia mencapai ${ha(T[2])} atau ${pc(T[3])} dari luas wilayah dan ${ha(T[4])} (${pc(T[5])}) termasuk tidak tersedia. Dari sisi penguasaan, sebanyak ${ha(T[8])} (${pc(T[9])}) telah memiliki hak atas tanah (HAT), sementara ${ha(T[6])} (${pc(T[7])}) belum memiliki HAT. Kondisi tersebut menunjukkan ruang yang tersedia ${T[3]<30?'relatif terbatas':'cukup besar'}, ${T[9]>=50?'meskipun sebagian besar tanah memiliki kepastian penguasaan':'dan sebagian besar tanah belum memiliki kepastian penguasaan'}. Kombinasi ketersediaan tanah, HAT, dan kepadatan penduduk menjadi indikasi awal dalam menelaah lokasi pengembangan atau investasi, tetapi tidak menunjukkan bahwa tanah tersebut otomatis siap dimanfaatkan.`;
  });
  add(507,/Malang|Kecamatan|memiliki tanah tersedia/,()=>{
    const t=need('IV-18'),r=D(t),s=srt(r,2),dn=mx(r,10),dl=mn(r,10),RT=d.plan('IV-9')||d.plan('IV-8')||'RDTR';
    const seg=s.map((x,i)=>`${i===0?'':i===1?'Sementara itu, ':'Selanjutnya, '}${kecName(x[1])} memiliki tanah tersedia sebesar ${ha(x[2])} (${pc(x[3])}), dengan HAT ${ha(x[8])} (${pc(x[9])}) dan kepadatan penduduk ${f(x[10],0)} jiwa/km².`);
    return `${seg.join(' ')} Kepadatan penduduk tertinggi terdapat di ${kecName(dn[1])} (${f(dn[10],0)} jiwa/km²) dan terendah di ${kecName(dl[1])} (${f(dl[10],0)} jiwa/km²). Dalam hal ini, ${kecName(s[0][1])} menjadi kecamatan yang paling potensial untuk ditelaah lebih lanjut karena memiliki luasan tanah tersedia terbesar${s[0][9]>=50?' dan persentase HAT yang tinggi':''}. Meskipun demikian, pemanfaatan informasi sosial ekonomi perlu dilakukan secara selektif dengan menelaah status penguasaan, penggunaan tanah, dan kesesuaiannya terhadap ${RT}.`;
  });
  return N_;
}

// Data diagram sebagai cadangan jika grafik Excel tidak tersedia.
function makeFigs(C){
  const{d,W}=C,{M,D,TT,bl}=d,top5=(t,w)=>srt(D(t),w-2).slice(0,5);
  return{
    '3.1':()=>{const r=D(M('III-3'));return{lb:r.map(x=>x[1]),vs:r.map(x=>x[4]),u:' jiwa',key:'kerja'}},
    '3.2':()=>{const t=M('III-6'),w=t.head[0].length,r=top5(t,w);return{lb:r.map(x=>x[1]),vs:r.map(x=>x[w-2]),u:' Ha',key:'lama'}},
    '3.3':()=>{const t=M('III-7'),w=t.head[0].length,r=top5(t,w);return{lb:r.map(x=>x[1]),vs:r.map(x=>x[w-2]),u:' Ha',key:'baru'}},
    '3.4':()=>{const t=M('III-8'),w=t.head[0].length,r=srt(D(t),w-2).slice(0,6);return{lb:r.map(x=>x[1]),vs:r.map(x=>x[w-2]),u:' Ha',key:'gupt'}},
    '3.5':()=>{const t=M('III-10'),w=t.head[0].length,r=top5(t,w);return{lb:r.map(x=>x[1]),vs:r.map(x=>x[w-2]),u:' Ha',key:'rtr'}},
    'IV1':()=>{const r=D(M('IV-1'));return{lb:r.map(x=>x[1]),vs:r.map(x=>x[2]),u:' Ha',key:'ubah'}},
    'IV2':()=>{const m3=M('IV-3'),nm=m3.head[1].slice(2),tr=[];D(m3).forEach(r=>nm.forEach((n,j)=>{const v=r[2+j];if(N(v)&&v>.005&&n&&r[1]!==n)tr.push([r[1],n,v])}));tr.sort((a,b)=>b[2]-a[2]);const t5=tr.slice(0,5);return{lb:t5.map(x=>`${x[0]} → ${x[1]}`),vs:t5.map(x=>x[2]),u:' Ha',key:'dom'}},
    'IV4':()=>{const r=D(M('IV-5'));return{lb:r.map(x=>x[1]),vs:r.map(x=>x[4]),u:' Ha',key:'reklas'}},
    'IV5':()=>{const r=D(M('IV-6')).filter(x=>Math.abs(x[7])>1e-6&&Math.abs(x[7])<=100);return{lb:r.map(x=>x[1]),vs:r.map(x=>x[7]),u:'%',key:'laju'}},
    'IV6':()=>{const b=bl('IV-8'),sm=b[1]||b[0],r=sm.body.filter(x=>!/^(Kota|Kabupaten|Total|Jumlah)/.test(String(x[0]))&&N(x[2]));return{lb:r.map(x=>x[1]),vs:r.map(x=>x[3]),u:'%',key:'sesuai'}},
    'IV7':()=>{const r=D(M('IV-9'));return{lb:r.map(x=>x[1]),vs:r.map(x=>x[2]),u:' Ha',key:'ters'}},
    'IV8':()=>{const r=D(M('IV-14'));return{lb:r.map(x=>x[1]),vs:r.map(x=>x[2]),u:' Ha',key:'sekt'}},
    'IV9':()=>{const t=M('IV-15'),w=t.head[0].length,T=TT(t),kc=t.head[1].slice(2,w-1);return{lb:kc,vs:T.slice(2,w-1),u:' Ha',key:'pangan'}},
    'IV10':()=>{const t=M('IV-16'),w=t.head[0].length,s=t.body.filter(r=>typeof r[2]==='string'&&/\(Ha\)\s*$/.test(r[2])&&B(r[0]));return{lb:s.map(x=>x[2].replace(/^Potensi Pengembangan Sektor /,'').replace(/\s*\(Ha\)/,'')),vs:s.map(x=>x[w-1]),u:' Ha',key:'lain'}},
    'IV11':()=>{const r=D(M('IV-17'));return{lb:r.map(x=>x[1]),vs:r.map(x=>x[4]),u:'',key:'karbon'}},
    'IV12':()=>{const r=D(M('IV-18'));return{lb:r.map(x=>x[1]),vs:r.map(x=>x[3]),u:'%',key:'sosek'}}
  };
}

g.NpgtDocData={makeData,makeContext,makeNarr,makeFigs};
})(window);
