/* Layout Peta Otomatis. Geometri template mengikuti 00_Template_Judul_2_Baris.pagx (A3 lebar, 42 x 29,7 cm) */
const $ = s => document.querySelector(s) || { value: '', checked: false, style: {}, textContent: '' };
const PG = { w: 42, h: 29.7 }, FR = { x: 2.31, y: 1.33, w: 27.5, h: 27 }, RX = 30.6, RW = 10.0;
const TEMA = {
  adm: ['Administrasi', 'WADMKC'], kerja: ['Peta Kerja', null], lama: ['Penggunaan Tanah Lama', 'GNAME25'], baru: ['Penggunaan Tanah Baru', 'QNAME25'],
  ubah: ['Perubahan Penggunaan Tanah', null], rdtr: ['Rencana Tata Ruang (RDTR/RTRW)', 'NAMOBJ'], rtrw: ['Kesesuaian terhadap Rencana Tata Ruang (RDTR/RTRW)', 'KSPOLA'],
  ket: ['Ketersediaan Tanah', 'Vname'], gupt: ['Gambaran Umum Penguasaan Tanah', 'ONAME25'], hutan: ['Kawasan Hutan', 'FKWS'],
  pangan: ['Potensi Pertanian Pangan', null], sektor: ['Potensi Sektor Lain', null], karl: ['Potensi Cadangan Karbon (Lama)', null], kar: ['Potensi Cadangan Karbon', null]
};
const RENCANA = { rdtr: 'Rencana Detail Tata Ruang', rtrw: 'Rencana Tata Ruang Wilayah' };
const titleOf = t => { if (t === 'karl') return TEMA.kar[0]; if (t !== 'rdtr' && t !== 'rtrw') return TEMA[t][0]; const term = ($('#rencanaTeks').value || '').trim() || RENCANA[$('#rencana').value] || RENCANA.rdtr; return t === 'rdtr' ? term : 'Kesesuaian Penggunaan Tanah terhadap ' + term };
const BINS = [[5, '0 - 5 Ton'], [10, '5 - 10 Ton'], [25, '10 - 25 Ton'], [50, '25 - 50 Ton'], [100, '50 - 100 Ton'], [200, '100 - 200 Ton'], [Infinity, '> 200 Ton']];
const BINCOL = Object.fromEntries(BINS.map((b, i) => [b[1], ['#e8e8ff', '#c9c9ff', '#a8a8ff', '#8585ff', '#5c5cff', '#2e2eff', '#0000b8'][i]]));
const PANGAN = 'Pertanian Pangan';
const SEK = [['Pertambangan', /tambang|mineral|batu ?bara|galian|migas|minyak|gas bumi|panas bumi|quarry|\bwi?up\b/i], ['Industri', /industri|pergudangan|pabrik|manufaktur|\bkip\b|\bkek\b/i], ['Pariwisata', /wisata|rekreasi|resort|daya tarik|taman hiburan/i], ['Perkebunan', /kebun|tanaman tahunan|sawit|karet|kopi|kakao|coklat|cokelat|tebu|cengkeh|kelapa|\bteh\b|tembakau/i], ['Permukiman/Perumahan', /permukiman|pemukiman|perumahan|hunian|rumah(?! sakit)|rusun|tempat tinggal|kasiba|lisiba/i], [PANGAN, /pangan|sawah|padi|palawija|lp2b|kp2b|lahan basah|hortikultura|pertanian|tegalan|ladang|semusim|lumbung/i]];
const sek = a => { const m = /Tersedia untuk (?:Kawasan |Peruntukan )*(.+?)(?: sesuai| dalam|$)/i.exec(a); if (!m) return null; for (const [n, re] of SEK) if (re.test(m[1])) return n; return 'Lainnya' };
const SEKCOL = { Pertambangan: '#8d6e63', Industri: '#7e57c2', Pariwisata: '#f06292', Perkebunan: '#c0a040', 'Permukiman/Perumahan': '#ffd54f', Lainnya: '#90a4ae' };
function keyOf(t, p) {
  const g = k => prop(p, k), a = String(g('V_ARAHAN') || '');
  if (t === 'kerja') return 'Batas Area Kerja';
  if (t === 'ubah') return g('GNAME25') === g('QNAME25') ? 'Tidak Berubah' : 'Berubah';
  if (t === 'pangan') return sek(a) === PANGAN ? 'Tersedia untuk Pertanian Pangan' : null;
  if (t === 'sektor') { const x = sek(a); return x === PANGAN ? null : x }
  if (t === 'kar' || t === 'karl') { const v = +g(t === 'kar' ? 'TON_C_Q' : 'TON_C_G') || 0; return BINS.find(b => v < b[0])[1] }
  return String(g(TEMA[t][1]) ?? '(kosong)');
}
/* citra Esri Wayback atau Google (Google bisa memblokir ekspor PNG karena CORS) */
const tc = new Map(), tile = u => { if (!tc.has(u)) tc.set(u, new Promise(r => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => r(i); i.onerror = () => r(null); i.src = u })); return tc.get(u) };
let wbP; const wayback = () => wbP || (wbP = fetch('https://s3-us-west-2.amazonaws.com/config.maptiles.arcgis.com/waybackconfig.json').then(r => r.json()).then(g => Object.entries(g).map(([n, v]) => ({ n, d: (/\d{4}-\d{2}-\d{2}/.exec(v.itemTitle) || [])[0] })).filter(x => x.d).sort((a, b) => b.d.localeCompare(a.d))[0]?.n).catch(() => null));
const LG = new Image(); LG.src = LOGO; const KP = new Image(); KP.src = KOMPAS;
const GF = new FontFace('Geosiana Desa', Uint8Array.from(atob(FONT_B64), ch => ch.charCodeAt(0))); document.fonts.add(GF); const FONT_OK = GF.load().catch(() => { });
function labelPt(RP, R, u) {
  const [x0, y0, x1, y1] = R; if (x1 - x0 < .8 * u || y1 - y0 < .35 * u) return null;
  const pip = (x, y) => { let ins = false; for (const r of RP) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) ins = !ins } return ins };
  const dist = (x, y) => { let m = 1e18; for (const r of RP) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[j], b = r[i], dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy; let t = l ? ((x - a[0]) * dx + (y - a[1]) * dy) / l : 0; t = Math.max(0, Math.min(1, t)); const ex = a[0] + t * dx - x, ey = a[1] + t * dy - y, d = ex * ex + ey * ey; if (d < m) m = d } return Math.sqrt(m) };
  let best = null; const n = 14;
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * j / n; if (!pip(x, y)) continue; const d = dist(x, y); if (!best || d > best.d) best = { p: [x, y], d } }
  return best && best.d > .25 * u ? best : null;
}
function drawPin(c, x, y, H) {
  const r = H * .32, cy = y - H + r; c.save(); c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x - r * .9, y - H * .32, x - r, cy + r * .55, x - r, cy); c.arc(x, cy, r, Math.PI, 0); c.bezierCurveTo(x + r, cy + r * .55, x + r * .9, y - H * .32, x, y); c.closePath();
  c.fillStyle = '#e53935'; c.fill(); c.lineWidth = Math.max(1, H * .06); c.strokeStyle = '#fff'; c.stroke(); c.beginPath(); c.arc(x, cy, r * .42, 0, 7); c.fillStyle = '#fff'; c.fill(); c.restore();
}
const RAMP = ['#c9f5ff', '#92daf6', '#5db6ec', '#2c8ce2', '#005ed9']; /* dangkal (indeks 0) = biru muda, dalam = biru tua */
const epsgToP4 = c => c === 4326 ? 'GEO' : (c >= 32601 && c <= 32660) ? `+proj=utm +zone=${c - 32600} +datum=WGS84 +units=m +no_defs` : (c >= 32701 && c <= 32760) ? `+proj=utm +zone=${c - 32700} +south +datum=WGS84 +units=m +no_defs` : c === 3857 ? '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +no_defs' : null;
async function loadBati(file) {
  const z = await JSZip.loadAsync(await file.arrayBuffer()), names = Object.keys(z.files).filter(n => !z.files[n].dir), ext = n => n.split('.').pop().toLowerCase(), tn = names.find(n => /^tiff?$/.test(ext(n)));
  if (!tn) throw new Error('ZIP tidak berisi file .tif');
  const image = await (await GeoTIFF.fromArrayBuffer(await z.file(tn).async('arraybuffer'))).getImage(), W = image.getWidth(), H = image.getHeight(); let x0, y0, rx, ry;
  try { const o = image.getOrigin(), r = image.getResolution(); x0 = o[0]; y0 = o[1]; rx = Math.abs(r[0]); ry = Math.abs(r[1]) } catch (e) { }
  if (!isFinite(x0) || x0 === undefined) { const wn = names.find(n => /\.(tfw|tifw|wld)$/i.test(n)); if (!wn) throw new Error('Raster tidak punya georeferensi. Sertakan file .tfw di dalam ZIP.'); const t = (await z.file(wn).async('string')).trim().split(/\s+/).map(Number); rx = Math.abs(t[0]); ry = Math.abs(t[3]); x0 = t[4] - rx / 2; y0 = t[5] + ry / 2 }
  let crs = null, tag = ''; const epsg = +$('#bEpsg').value, pn = names.find(n => ext(n) === 'prj');
  if (epsg) { crs = epsgToP4(epsg); tag = 'EPSG:' + epsg; if (!crs) throw new Error('EPSG ' + epsg + ' belum didukung. Gunakan UTM (326xx/327xx), 4326, atau sertakan .prj.') }
  else if (pn) { crs = await z.file(pn).async('string'); tag = 'dari .prj' }
  else { const gk = image.getGeoKeys ? image.getGeoKeys() : null, code = gk && (gk.ProjectedCSTypeGeoKey || gk.GeographicTypeGeoKey); if (code && code !== 32767) { crs = epsgToP4(code); tag = 'EPSG:' + code; if (!crs) throw new Error('EPSG ' + code + ' dari GeoTIFF belum didukung. Isi kolom EPSG atau sertakan .prj.') } }
  if (!crs) { crs = epsgToP4(32750); tag = 'tidak tertulis di file, diasumsikan UTM 50S (EPSG:32750)' }
  const geo = crs === 'GEO' || /^\s*GEOGCS/i.test(crs), fwd = geo ? { forward: p => p } : proj4('EPSG:4326', crs), nd = image.getGDALNoData ? image.getGDALNoData() : null;
  return { image, W, H, x0, y0, rx, ry, rxm: geo ? rx * 111320 : rx, rym: geo ? ry * 111320 : ry, fwd, nodata: nd == null ? 32767 : nd, info: `${W}x${H} px, resolusi ${(geo ? rx * 111320 : rx).toFixed(0)} m, CRS ${tag}` };
}
async function drawBati(c, P, [lo0, la0, lo1, la1]) {
  const B = S.bati; if (!B) return false;
  try {
    const n = 24, N1 = n + 1, cols = [], rows = []; let cmin = 1e18, cmax = -1e18, rmin = 1e18, rmax = -1e18;
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const [x, y] = B.fwd.forward([lo0 + (lo1 - lo0) * i / n, la1 - (la1 - la0) * j / n]), cc = (x - B.x0) / B.rx, rr = (B.y0 - y) / B.ry; cols.push(cc); rows.push(rr); cmin = Math.min(cmin, cc); cmax = Math.max(cmax, cc); rmin = Math.min(rmin, rr); rmax = Math.max(rmax, rr) }
    const c0 = Math.max(0, Math.floor(cmin) - 1), c1 = Math.min(B.W, Math.ceil(cmax) + 2), r0 = Math.max(0, Math.floor(rmin) - 1), r1 = Math.min(B.H, Math.ceil(rmax) + 2); if (c1 - c0 < 2 || r1 - r0 < 2) return false;
    const ww = c1 - c0, hh = r1 - r0, data = (await B.image.readRasters({ window: [c0, r0, c1, r1], samples: [0] }))[0], mxm = 111320 * Math.cos((la0 + la1) / 2 * Math.PI / 180);
    const ow = Math.max(16, Math.min(1600, Math.round((lo1 - lo0) * mxm / B.rxm))), oh = Math.max(16, Math.min(1600, Math.round((la1 - la0) * 111320 / B.rym)));
    const samp = (ix, iy, a) => { const u = (ix + .5) / ow * n, v = (iy + .5) / oh * n, i = Math.min(n - 1, Math.floor(u)), j = Math.min(n - 1, Math.floor(v)), fu = u - i, fv = v - j; return (a[j * N1 + i] * (1 - fu) + a[j * N1 + i + 1] * fu) * (1 - fv) + (a[(j + 1) * N1 + i] * (1 - fu) + a[(j + 1) * N1 + i + 1] * fu) * fv };
    const dep = new Float32Array(ow * oh).fill(-1), ds = [];
    for (let iy = 0; iy < oh; iy++) for (let ix = 0; ix < ow; ix++) { const cc = Math.round(samp(ix, iy, cols)) - c0, rr = Math.round(samp(ix, iy, rows)) - r0; if (cc < 0 || rr < 0 || cc >= ww || rr >= hh) continue; const v = data[rr * ww + cc]; if (v > 0 || v === B.nodata || !isFinite(v)) continue; dep[iy * ow + ix] = -v; if ((ix + iy * 7) % 5 === 0) ds.push(-v) }
    if (!ds.length) return false; ds.sort((a, b) => a - b); const dm = Math.max(15, ds[Math.floor(ds.length * .98)]), rgb = RAMP.map(h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16)));
    const cv = document.createElement('canvas'); cv.width = ow; cv.height = oh; const g = cv.getContext('2d'), im = g.createImageData(ow, oh);
    for (let k = 0; k < dep.length; k++) { const d = dep[k]; if (d < 0) continue; const t = Math.min(1, d / dm) * (rgb.length - 1), a = Math.min(rgb.length - 2, Math.floor(t)), f = t - a; for (let j = 0; j < 3; j++) im.data[k * 4 + j] = rgb[a][j] + (rgb[a + 1][j] - rgb[a][j]) * f; im.data[k * 4 + 3] = 255 }
    g.putImageData(im, 0, 0); const p0 = P(lo0, la1), p1 = P(lo1, la0); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(cv, p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1]); return true;
  } catch (e) { console.warn('batimetri gagal digambar', e); return false }
}
async function tiles(c, P, u, k, clon, clat, mx, my, TW = FR.w, TH = FR.h) {
  const R = Math.PI / 180, lx = (lo, z) => Math.floor((lo + 180) / 360 * 2 ** z), ly = (la, z) => Math.floor((1 - Math.log(Math.tan(la * R) + 1 / Math.cos(la * R)) / Math.PI) / 2 * 2 ** z);
  const dx = TW / 2 / k / mx, dy = TH / 2 / k / my; const wbN = $('#bm').value === 'wb' ? await wayback() : null, url = (z, x, y) => wbN ? `https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/${wbN}/${z}/${y}/${x}` : `https://mt1.google.com/vt/lyrs=s&x=${x}&y=${y}&z=${z}`;
  let z = Math.min(wbN ? 17 : 18, Math.ceil(Math.log2(156543.03 * Math.cos(clat * R) * k * u)) - 1), a, b, c2, d;
  for (; ; z--) { a = lx(clon - dx, z); b = lx(clon + dx, z); c2 = ly(clat + dy, z); d = ly(clat - dy, z); if ((b - a + 1) * (d - c2 + 1) <= 160 || z <= 3) break }
  const lo = x => x / 2 ** z * 360 - 180, la = y => Math.atan(Math.sinh(Math.PI * (1 - 2 * y / 2 ** z))) / R, jobs = [];
  for (let x = a; x <= b; x++) for (let y = c2; y <= d; y++) jobs.push(tile(url(z, x, y)).then(im => { if (!im) return; const p0 = P(lo(x), la(y)), p1 = P(lo(x + 1), la(y + 1)); c.drawImage(im, p0[0], p0[1], p1[0] - p0[0] + 1, p1[1] - p0[1] + 1) }));
  await Promise.all(jobs);
}

$('#tema').innerHTML = Object.entries(TEMA).map(([k, v]) => `<option value="${k}">${v[0]}</option>`).join('');
const S = { kab: null, djpa: null, dasar: [], sets: [], ptsym: new Map(), survey: null, top: new Map() };
const norm = t => String(t || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const st = t => $('#st').textContent = t;
function wilayahName() {
  const selected = ($('#wil').value || '').trim();
  if (selected) return selected;
  const counts = new Map();
  for (const f of S.djpa || []) {
    const name = String(prop(f.properties, 'WADMKK') || '').trim();
    if (name) counts.set(name, (counts.get(name) || 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}
function downloadBaseName(tema) {
  const region = wilayahName();
  if (!region) throw new Error('Nama Kabupaten/Kota tidak tersedia pada data DJPA.');
  const plan = $('#rencana').value === 'rtrw' ? 'RTRW' : 'RDTR';
  const labels = {
    adm: 'Peta Administrasi',
    gupt: 'Peta Gambaran Umum Penguasaan Tanah',
    lama: 'Peta Penggunaan Tanah Lama',
    baru: 'Peta Penggunaan Tanah Baru',
    ubah: 'Peta Perubahan Penggunaan Tanah',
    rdtr: `Peta ${plan}`,
    rtrw: `Peta Kesesuaian Penggunaan Tanah terhadap ${plan}`,
    ket: 'Peta Ketersediaan Tanah',
    pangan: 'Peta Potensi Pertanian Pangan',
    sektor: 'Peta Potensi Sektor Lain',
    karl: 'Peta Potensi Cadangan Karbon Lama',
    kar: 'Peta Potensi Cadangan Karbon Baru',
    hutan: 'Peta Kawasan Hutan',
    kerja: 'Peta Kerja'
  };
  if (!labels[tema]) throw new Error('Tema peta tidak dikenal: ' + tema);
  return `${labels[tema]}_${region}`.replace(/[<>:"\/\\|?*\u0000-\u001f]/g, '-').replace(/[. ]+$/, '');
}

/* ---- warna CIM (dari dashboard) ---- */
const h2 = n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
function cim(c) {
  if (!c || !Array.isArray(c.values)) return null; const v = c.values; let r, g, b;
  if (/HSV/.test(c.type)) { const hh = v[0] / 60, s = v[1] / 100, w = v[2] / 100, i = Math.floor(hh) % 6, f = hh - Math.floor(hh), p = w * (1 - s), q = w * (1 - f * s), t = w * (1 - (1 - f) * s); [r, g, b] = [[w, t, p], [q, w, p], [p, w, t], [p, q, w], [t, p, w], [w, p, q]][i].map(x => x * 255) }
  else if (/CMYK/.test(c.type)) { const k = v[3] / 100;[r, g, b] = [0, 1, 2].map(j => 255 * (1 - v[j] / 100) * (1 - k)) }
  else if (/HSL/.test(c.type) || v.length < 3) return null; else [r, g, b] = v;
  const a = /RGB|HSV/.test(c.type) ? (v[3] ?? 100) : 100; return a < 100 ? `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a / 100})` : '#' + h2(r) + h2(g) + h2(b);
}
function sym(o, kind) {
  const y = o && (o.symbol || o); if (!y || !Array.isArray(y.symbolLayers)) return null; if (y.type && !(kind === 'line' ? /Line/ : kind === 'point' ? /Point/ : /Polygon/).test(y.type)) return null;
  const L = [], dash = z => (z.effects || []).find(e => e.dashTemplate)?.dashTemplate;
  for (const l of y.symbolLayers) {
    if (l.enable === false) continue; const t = l.type;
    if (kind === 'point') { if (t === 'CIMCharacterMarker') { const f = (l.symbol?.symbolLayers || []).find(z => z.type === 'CIMSolidFill'); L.push({ k: 'g', font: l.fontFamilyName || '', ch: l.characterIndex, size: l.size || 10, c: (f && cim(f.color)) || '#000' }) } continue }
    if (t === 'CIMSolidStroke') { const c = cim(l.color); c && L.push({ k: 's', c, w: l.width || .5, d: dash(l) }) }
    else if (kind === 'line') continue;
    else if (t === 'CIMSolidFill') { const c = cim(l.color); c && L.push({ k: 'f', c }) }
    else if (t === 'CIMHatchFill') { const k = ((l.lineSymbol || {}).symbolLayers || []).find(z => z.type === 'CIMSolidStroke'), c = k && cim(k.color); c && L.push({ k: 'h', c, w: k.width || .5, rot: l.rotation || 0, sep: l.separation || 3, d: dash(k) }) }
    else if (t === 'CIMPictureFill' && l.url) L.push({ k: 'p', url: l.url, h: l.height || 8, sub: (l.colorSubstitutions || []).map(z => [z.oldColor.values, z.newColor.values]) });
    else if (l.markerPlacement && l.symbol) { const f = (l.symbol.symbolLayers || []).find(z => z.type === 'CIMSolidFill'), c = f && cim(f.color), mp = l.markerPlacement; c && L.push({ k: 'm', c, size: l.size || 3, sx: mp.stepX || 5, sy: mp.stepY || 5 }) }
  }
  const LL = kind !== 'line' && kind !== 'point' && L.some(l => l.k === 'f') ? L.filter(l => l.k !== 's') : L;
  return LL.length ? { L: LL.reverse(), f: (LL.find(l => l.c) || {}).c || '#999' } : null;
}
async function readStylx(file, kind) {
  const SQL = await initSqlJs({ locateFile: f => 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/' + f });
  const db = new SQL.Database(new Uint8Array(await file.arrayBuffer())), m = new Map(), r = db.exec('SELECT NAME, CONTENT FROM ITEMS');
  for (const [n, c] of (r[0] ? r[0].values : [])) try { const y = sym(JSON.parse((typeof c === 'string' ? c : new TextDecoder().decode(c)).replace(/\0+$/, '')), kind); if (y && !m.has(norm(n))) m.set(norm(n), y) } catch (e) { }
  db.close(); return m;
}
const errMsg = e => (e && e.message) || String(e);
const wktToProj4 = w => { if (!/Cylindrical_Equal_Area/i.test(w || '')) return null; const g = k => { const m = new RegExp('PARAMETER\\["' + k + '",([-0-9.eE]+)\\]', 'i').exec(w); return m ? +m[1] : 0 }; return `+proj=cea +lon_0=${g('Central_Meridian')} +lat_ts=${g('Standard_Parallel_1')} +x_0=${g('False_Easting')} +y_0=${g('False_Northing')} +datum=WGS84 +units=m +no_defs` };
async function shpFallback(buf, err) {
  const z = await JSZip.loadAsync(buf), names = Object.keys(z.files).filter(n => !z.files[n].dir), base = n => n.replace(/\.[^.]+$/, '').toLowerCase(), ext = n => n.split('.').pop().toLowerCase(), shps = names.filter(n => ext(n) === 'shp');
  if (!shps.length) throw err instanceof Error ? err : new Error(String(err));
  const res = [];
  for (const sn of shps) {
    const find = e => names.find(n => base(n) === base(sn) && ext(n) === e), pn = find('prj'), prj = pn ? await z.file(pn).async('string') : '', p4 = wktToProj4(prj);
    if (!p4) throw new Error('Proyeksi tidak dikenali (' + (prj.slice(0, 70) || 'tidak ada file .prj') + '). Ekspor ulang ke UTM/WGS84 atau Cylindrical Equal Area.');
    const dn = find('dbf'), cn = find('cpg'), geom = shp.parseShp(await z.file(sn).async('arraybuffer'), p4), dbf = dn ? shp.parseDbf(await z.file(dn).async('arraybuffer'), cn ? await z.file(cn).async('string') : undefined) : [], fc = shp.combine([geom, dbf]); fc.fileName = sn.replace(/\.[^.]+$/, ''); res.push(fc);
  }
  return res;
}
async function readZip(file) {
  const buf = await file.arrayBuffer(); let g;
  try { g = await shp(buf) } catch (e) { g = await shpFallback(buf, e) }
  if (!Array.isArray(g)) g = [g];
  const out = g.map(x => ({ name: x.fileName || '', features: x.features.filter(f => f.geometry) }));
  const q = out.flatMap(l => l.features.slice(0, 1))[0]; let c = q && q.geometry.coordinates; while (Array.isArray(c) && Array.isArray(c[0])) c = c[0];
  if (c && (Math.abs(c[0]) > 180 || Math.abs(c[1]) > 90)) throw new Error('Koordinat bukan lon/lat: ZIP tidak punya .prj yang valid. Sertakan file .prj (UTM/WGS84 atau Cylindrical Equal Area).');
  return out;
}
const bind = (id, fn) => $(id).onchange = async e => { const f = e.target.files[0]; if (!f) return; st('Membaca ' + f.name + '...'); try { const r = await fn(f); st(r || f.name + ' dimuat.') } catch (x) { st('Gagal: ' + errMsg(x)) } };
bind('#fDjpa', async f => { const l = await readZip(f); S.djpa = l[0].features; S._isl = null; const n = buildIslandUI(); return 'DJPA dimuat: ' + S.djpa.length + ' fitur' + (n ? ', ' + n + ' inset pulau terdeteksi' : '') });
bind('#fSrv', async f => { S.survey = (await readZip(f))[0].features });

/* ---- util ---- */
const hash = k => { let h = 0; for (const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0; return `hsl(${h % 360},60%,60%)` };
const symFor = (t, k) => { const R = /rtr|rdtr/i, o = S.sets.filter(z => !R.test(z.n)), r = S.sets.filter(z => R.test(z.n)), ord = t === 'rdtr' ? [...r, ...o] : [...o, ...r], n = norm(k); for (const z of ord) if (z.m.has(n)) return z.m.get(n); for (const z of ord) { const x = find(z.m, k); if (x) return x } return null };
const find = (m, k) => { const n = norm(k); return m.get(n) || [...m].find(([a]) => n.length > 4 && a.length > 4 && (a.includes(n) || n.includes(a)))?.[1] };
const prop = (p, k) => { const x = Object.keys(p).find(z => z.toUpperCase() === k.toUpperCase()); return x ? p[x] : undefined };
const dms = (v, lon) => { const a = Math.abs(v), d = Math.floor(a), m = Math.floor((a - d) * 60), s = Math.round(((a - d) * 60 - m) * 60); return `${d}°${m}'${s}" ${lon ? (v < 0 ? 'BB' : 'BT') : (v < 0 ? 'LS' : 'LU')}` };
function rings(g) { const o = []; const P = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []; P.forEach(p => p.forEach(r => o.push(r))); return o }
function lines(g) { return g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : g.type === 'Polygon' ? g.coordinates : g.type === 'MultiPolygon' ? g.coordinates.flat() : [] }
function bounds(fs) { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; const w = x => { if (typeof x[0] === 'number') { a = Math.min(a, x[0]); c = Math.max(c, x[0]); b = Math.min(b, x[1]); d = Math.max(d, x[1]) } else x.forEach(w) }; fs.forEach(f => w(f.geometry.coordinates)); return [a, b, c, d] }
function areaDeg(r) { let s = 0; for (let i = 0; i < r.length - 1; i++) s += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; return Math.abs(s / 2) }

/* ---- render ---- */
const bbOf = f => f._bb || (f._bb = bounds([f]));
const hit = (b, w) => b[2] >= w[0] && b[0] <= w[2] && b[3] >= w[1] && b[1] <= w[3];
const arOf = f => { if (f._ar === undefined) { const r0 = rings(f.geometry)[0]; f._ar = r0 ? areaDeg(r0) : 0 } return f._ar };
const niceN = n => { const p = 10 ** (Math.floor(Math.log10(n)) - 1); return Math.ceil(n / p) * p };
function detectIslands(fs, thrKm, maxN) {
  const none = { main: fs, islands: [], total: 1 }; if (!(thrKm > 0) || fs.length < 2) return none;
  const d = thrKm / 111, cell = new Map(), cells = [], par = [], first = new Array(fs.length);
  const id = (gx, gy) => { const kk = gx + ',' + gy; let v = cell.get(kk); if (v === undefined) { v = par.length; par.push(v); cells.push([gx, gy]); cell.set(kk, v) } return v };
  const find = i => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i] } return i }, uni = (a, b) => { a = find(a); b = find(b); if (a !== b) par[a] = b };
  fs.forEach((f, i) => { const b = bbOf(f); let a = -1; for (let gx = Math.floor(b[0] / d); gx <= Math.floor(b[2] / d); gx++) for (let gy = Math.floor(b[1] / d); gy <= Math.floor(b[3] / d); gy++) { const v = id(gx, gy); if (a < 0) a = v; else uni(a, v) } first[i] = a });
  cells.forEach(([gx, gy], v) => { for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { if (!dx && !dy) continue; const w = cell.get((gx + dx) + ',' + (gy + dy)); if (w !== undefined) uni(v, w) } });
  const G = new Map();
  fs.forEach((f, i) => { const r = find(first[i]), b = bbOf(f); let g = G.get(r); if (!g) G.set(r, g = { feats: [], ar: 0, bb: [1e9, 1e9, -1e9, -1e9] }); g.feats.push(f); g.ar += arOf(f); g.bb = [Math.min(g.bb[0], b[0]), Math.min(g.bb[1], b[1]), Math.max(g.bb[2], b[2]), Math.max(g.bb[3], b[3])] });
  const all = [...G.values()].sort((a, b) => b.ar - a.ar); if (all.length < 2) return none;
  return { main: all[0].feats, islands: all.slice(1, 1 + maxN), total: all.length };
}
function islandsFor(thrKm) { if (S._isl && S._isl.fs === S.djpa && S._isl.key === thrKm) return S._isl.r; const r = detectIslands(S.djpa, thrKm, 4); S._isl = { fs: S.djpa, key: thrKm, r }; return r }
function buildIslandUI() {
  const thr = +$('#pulauKm').value, isl = S.djpa ? islandsFor(Number.isFinite(thr) ? thr : 10) : { islands: [], total: 1 }, n = isl.islands.length, box = $('#pulauJudul');
  const info = $('#pulauInfo'); info.textContent = !S.djpa ? '' : n ? `Terdeteksi ${n} inset pulau` + (isl.total - 1 > n ? ` (${isl.total - 1 - n} gugus terkecil tidak ditampilkan; naikkan jarak untuk menggabungkan)` : '') + '.' : 'Tidak ada pulau terpisah terdeteksi.';
  if (!box.appendChild) return n; box.innerHTML = '';
  isl.islands.forEach((g, i) => { const cnt = {}; g.feats.forEach(f => { const nm = prop(f.properties, 'WADMKC') || prop(f.properties, 'WADMKK') || ''; cnt[nm] = (cnt[nm] || 0) + 1 }); const nm = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Pulau ' + (i + 1), l = document.createElement('label'); l.innerHTML = 'Judul inset ' + (i + 1) + '<input data-i="' + i + '">'; l.querySelector('input').value = nm; box.appendChild(l) });
  return n;
}
async function render(cv, dpi) {
  await FONT_OK; await Promise.all([LG, KP].map(i => i.decode ? i.decode().catch(() => { }) : 0));
  const u = dpi / 2.54, tema = $('#tema').value, pp = u * 2.54 / 72, TB = 1, TK = 1;
  cv.width = Math.round(PG.w * u); cv.height = Math.round(PG.h * u);
  const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, cv.width, cv.height);
  c.textBaseline = 'middle'; c.lineJoin = 'round';
  const X = v => v * u, Y = v => v * u, fnt = (cm, b) => `${b ? 'bold ' : ''}${cm * u}px Arial`;
  const txt = (t, x, y, sz, o = {}) => { c.font = fnt(sz, o.b); c.textAlign = o.a || 'left'; c.fillStyle = o.c || '#000'; if (o.halo) { c.strokeStyle = '#fff'; c.lineWidth = sz * u * .25; c.strokeText(t, X(x), Y(y)) } c.fillText(t, X(x), Y(y)) };
  const dot = (p, sy, sc = 1) => {
    for (const l of sy.L) {
      const d = l.size * pp * sc; c.fillStyle = l.c; c.strokeStyle = l.c; c.lineWidth = Math.max(1, d * .1); c.setLineDash([]);
      if (/ESRI/i.test(l.font)) {
        const i = l.ch; c.beginPath();
        if (i === 35 || i === 42) { const r = d * .5; c.moveTo(p[0], p[1] - r); c.lineTo(p[0] + r * .87, p[1] + r * .5); c.lineTo(p[0] - r * .87, p[1] + r * .5); c.closePath(); i === 35 ? c.fill() : c.stroke() }
        else if (i === 80 || i === 82) { c.arc(p[0], p[1], d * (i === 80 ? .32 : .3), 0, 7); c.stroke(); c.beginPath(); c.arc(p[0], p[1], d * .13, 0, 7); c.fill() }
        else { c.arc(p[0], p[1], d * .32, 0, 7); c.fill() }
      } else { c.font = `${d}px "Geosiana Desa"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String.fromCharCode(0xF000 + l.ch), p[0], p[1]) }
    }
  };
  const bw = n => /provinsi/i.test(n) ? 1 : /kab/i.test(n) ? .8 : /kecamatan/i.test(n) ? .6 : 1;
  const setStroke = (l, m) => { const w = l.w * pp * m; c.strokeStyle = l.c; c.lineWidth = Math.max(.8, w); let d = l.d && l.d.map(x => x * pp * m); c.lineCap = 'butt'; if (d && d.includes(0)) { c.lineCap = 'round'; d = d.map((x, i) => i % 2 ? Math.max(x - w, .5) : x + w) } c.setLineDash(d || []) };
  const runOps = ops => ops.forEach(o => { if (o.k === 'f') { c.fillStyle = o.st; c.fill('evenodd'); if (typeof o.st === 'string' && !/^rgba/.test(o.st)) { c.strokeStyle = o.st; c.lineWidth = .7; c.setLineDash([]); c.stroke() } } else { c.strokeStyle = o.st; c.lineWidth = o.w; c.setLineDash(o.d || []); c.stroke(); c.setLineDash([]) } });
  const tileC = (w, h) => { const t = document.createElement('canvas'); t.width = Math.max(2, Math.round(w)); t.height = Math.max(2, Math.round(h)); return t };
  const paints = async (sy, sc = 1) => {
    const pk = pp * sc;
    const ops = [];
    for (const l of sy.L) {
      if (l.k === 'f') ops.push({ k: 'f', st: l.c });
      else if (l.k === 's') ops.push({ k: 's', st: l.c, w: Math.max(1, l.w * pk), d: l.d && l.d.map(x => x * pk) });
      else if (l.k === 'h') { const per = l.d ? l.d.reduce((a, b) => a + b, 0) * pk : 16, t = tileC(Math.max(per, 4), l.sep * pk), g = t.getContext('2d'); g.strokeStyle = l.c; g.lineWidth = Math.max(1, l.w * pk); g.setLineDash(l.d ? l.d.map(x => x * pk) : []); g.beginPath(); g.moveTo(0, t.height / 2); g.lineTo(t.width, t.height / 2); g.stroke(); const p = c.createPattern(t, 'repeat'); p.setTransform && p.setTransform(new DOMMatrix().rotate(-l.rot)); ops.push({ k: 'f', st: p }) }
      else if (l.k === 'm') { const t = tileC(l.sx * pk, l.sy * pk), g = t.getContext('2d'); g.fillStyle = l.c; g.beginPath(); g.arc(t.width / 2, t.height / 2, Math.max(.8, l.size * pk * .35), 0, 7); g.fill(); ops.push({ k: 'f', st: c.createPattern(t, 'repeat') }) }
      else if (l.k === 'p') {
        try {
          const im = new Image(); im.src = l.url; await im.decode(); const a = tileC(im.width, im.height), g = a.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
          const d = g.getImageData(0, 0, a.width, a.height), q = d.data; for (let i = 0; i < q.length; i += 4) for (const [o, nw] of l.sub) if (Math.abs(q[i] - o[0]) + Math.abs(q[i + 1] - o[1]) + Math.abs(q[i + 2] - o[2]) < 90) { q[i] = nw[0]; q[i + 1] = nw[1]; q[i + 2] = nw[2]; q[i + 3] = nw[3] * 2.55; break }
          g.putImageData(d, 0, 0); const H = l.h * pk, t = tileC(H * im.width / im.height, H), g2 = t.getContext('2d'); g2.imageSmoothingEnabled = false; g2.drawImage(a, 0, 0, t.width, t.height); ops.push({ k: 'f', st: c.createPattern(t, 'repeat') });
        } catch (e) { ops.push({ k: 'f', st: '#999' }) }
      }
    }
    return ops;
  };
  const fs = S.djpa, thr = +$('#pulauKm').value, ISL = islandsFor(Number.isFinite(thr) ? thr : 10), mainFs = ISL.main;
  const [x0, y0, x1, y1] = bounds(mainFs), clon = (x0 + x1) / 2, clat = (y0 + y1) / 2, mx = 111320 * Math.cos(clat * Math.PI / 180), my = 111320;
  const needM = Math.max((x1 - x0) * mx / (FR.w / 100), (y1 - y0) * my / (FR.h / 100)) * (ISL.islands.length ? 1.18 : 1.06);
  const N = +$('#skala').value || Math.ceil(needM / 5000) * 5000, k = 100 / N, SC = 1;
  const P = (lo, la) => [X(FR.x + FR.w / 2 + (lo - clon) * mx * k), Y(FR.y + FR.h / 2 - (la - clat) * my * k)];
  const kab = {}; fs.forEach(f => { const v = prop(f.properties, 'WADMKK'); if (v) kab[v] = (kab[v] || 0) + 1 });
  const wil = $('#wil').value || Object.entries(kab).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  const winLL = [clon - FR.w / 2 / k / mx, clat - FR.h / 2 / k / my, clon + FR.w / 2 / k / mx, clat + FR.h / 2 / k / my];
  const tgt = (S.kab || []).filter(f => String(prop(f.properties, 'WADMKK') || '').toLowerCase() === wil.toLowerCase());
  /* ---- tata letak inset pulau terpencil ---- */
  const FRAMES = [{ F: FR, P, k, mx, my, clon, clat, win: winLL, main: true }], INS = [], cs = .5, occ = new Set(), used = new Set(), gm = .35;
  if (ISL.islands.length) {
    mainFs.forEach(f => { const b = bbOf(f), p0 = P(b[0], b[3]), p1 = P(b[2], b[1]); for (let gx = Math.floor(p0[0] / u / cs); gx <= Math.floor(p1[0] / u / cs); gx++) for (let gy = Math.floor(p0[1] / u / cs); gy <= Math.floor(p1[1] / u / cs); gy++) occ.add(gx + ',' + gy) });
    const cnt = (x, y, w, h) => { let n = 0; for (let gx = Math.floor(x / cs); gx <= Math.floor((x + w) / cs); gx++) for (let gy = Math.floor(y / cs); gy <= Math.floor((y + h) / cs); gy++) if (occ.has(gx + ',' + gy)) n++; return n };
    ISL.islands.forEach((g, i) => {
      const b = g.bb, px = (b[2] - b[0]) * .06 + .002, py = (b[3] - b[1]) * .06 + .002, ic = [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2], imx = 111320 * Math.cos(ic[1] * Math.PI / 180), Wm = (b[2] - b[0] + 2 * px) * imx, Hm = (b[3] - b[1] + 2 * py) * 111320;
      const w = Math.min(9.5, Math.max(5.5, Math.sqrt(45 * Wm / Hm))), h = Math.min(7.5, Math.max(4, 45 / w)), Ni = niceN(Math.max(Wm * 100 / w, Hm * 100 / h) * 1.04);
      const slots = [[FR.x + gm, FR.y + gm], [FR.x + gm, FR.y + FR.h - gm - h], [FR.x + FR.w - gm - w, FR.y + FR.h - gm - h], [FR.x + FR.w - gm - w, FR.y + gm]];
      let best = -1, bs = 1e18; slots.forEach(([sx, sy], si) => { if (used.has(si)) return; const sc = cnt(sx, sy, w, h); if (sc < bs) { bs = sc; best = si } }); used.add(best);
      const F = { x: slots[best][0], y: slots[best][1], w, h }, ki = 100 / Ni, el = document.querySelector('#pulauJudul input[data-i="' + i + '"]');
      const Pi = (lo, la) => [X(F.x + F.w / 2 + (lo - ic[0]) * imx * ki), Y(F.y + F.h / 2 - (la - ic[1]) * 111320 * ki)];
      const I = { F, P: Pi, k: ki, mx: imx, my: 111320, clon: ic[0], clat: ic[1], win: [ic[0] - F.w / 2 / ki / imx, ic[1] - F.h / 2 / ki / 111320, ic[0] + F.w / 2 / ki / imx, ic[1] + F.h / 2 / ki / 111320], main: false, N: Ni, title: el ? el.value : '' };
      INS.push(I); FRAMES.push(I);
    });
  }
  /* ---- kelas tema (sekali untuk semua bingkai) ---- */
  const cls = new Map();
  if (tema !== 'kerja') {
    for (const f of fs) { const kk = keyOf(tema, f.properties); f._k = kk; if (kk == null) continue; if (!cls.has(kk)) { const sy = tema === 'adm' ||/^kar|pangan|sektor/.test(tema) ? null : symFor(tema, kk); cls.set(kk, { sy, a: 0, col: sy ? sy.f : tema === 'ubah' ? (kk === 'Berubah' ? '#e53935' : '#fff') : /^kar/.test(tema) ? BINCOL[kk] : tema === 'pangan' ? '#C8F546' : tema === 'sektor' ? (SEKCOL[kk] || hash(kk)) : hash(kk) }) } cls.get(kk).a += arOf(f) }
    for (const e of cls.values()) { const sy2 = e.sy || { L: [{ k: 'f', c: e.col }] }; e.ops = await paints(sy2, SC); e.lops = SC === 1 ? e.ops : await paints(sy2, 1) }
  }
  /* ---- peta dasar: visibilitas legenda dari gabungan semua bingkai ---- */
  const base = new Map(), pts = [], pc = new Set(); if (tema === 'kerja') base.set('Batas Lokasi Kerja', { L: [{ k: 's', c: '#ffeb3b', w: 3 }] });
  const pip = (x, y, rr) => { let ins = false; for (const r of rr) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) ins = !ins } return ins };
  const trg = tgt.flatMap(f => rings(f.geometry)), tb = tgt.length ? bounds(tgt) : null;
  const inArea = q => !tb || (q[0] >= tb[0] && q[0] <= tb[2] && q[1] >= tb[1] && q[1] <= tb[3] && pip(q[0], q[1], trg));
  const wins = FRAMES.map(z => z.win), inWin = q => wins.some(w => q[0] >= w[0] && q[0] <= w[2] && q[1] >= w[1] && q[1] <= w[3]);
  const free = $('#batasLuar').checked ? /pantai|^batas (provinsi|kab)/i : /pantai/i, vis = new Map(), syOf = new Map(), items = [];
  const test = (g, fr) => { const cs2 = lines(g).flat(); for (let i = 0; i < cs2.length; i++) if (fr ? inWin(cs2[i]) : inArea(cs2[i])) return true; return false };
  for (const L of S.dasar) for (const f of L.features) {
    if (/Point/.test(f.geometry.type)) { pts.push(f); continue }
    const nm = String(prop(f.properties, 'KETERANGAN') ?? L.name), fr = free.test(nm); if (S.coast && /pantai/i.test(nm)) continue; if (!syOf.has(nm)) syOf.set(nm, find(S.top, nm) || { L: [{ k: 's', c: '#555', w: 1 }] });
    if (!vis.get(nm) && test(f.geometry, fr)) vis.set(nm, 1); items.push([f, nm, fr]);
  }
  if (S.coast) { syOf.set('Garis Pantai', find(S.top, 'Garis Pantai') || { L: [{ k: 's', c: '#00bcd4', w: 1 }] }); for (const f of S.coast) { if (!f.geometry) continue; if (!vis.get('Garis Pantai') && test(f.geometry, true)) vis.set('Garis Pantai', 1); items.push([f, 'Garis Pantai', true]) } }
  syOf.forEach((sy, nm) => { if (vis.get(nm)) base.set(nm, sy) });
  const ptXY = f => f.geometry.type === 'MultiPoint' ? f.geometry.coordinates[0] : f.geometry.coordinates, ptsIn = pts.filter(f => inArea(ptXY(f)));
  ptsIn.forEach(f => { const rm = prop(f.properties, 'REMARK'); if (rm) pc.add(String(rm)) });
  /* ---- gambar isi satu bingkai ---- */
  const drawFrame = async FM => {
    const { F, P, k, mx, my, clon, clat, win, main } = FM, fx0 = X(F.x), fx1 = X(F.x + F.w), fy0 = Y(F.y), fy1 = Y(F.y + F.h), LAB = [];
    c.save(); c.beginPath(); c.rect(fx0, fy0, fx1 - fx0, fy1 - fy0); c.clip();
    if (tema === 'kerja') await tiles(c, P, u, k, clon, clat, mx, my, F.w, F.h);
    else { c.fillStyle = '#c6f3ff'; c.fillRect(fx0, fy0, fx1 - fx0, fy1 - fy0); if (S.bati) await drawBati(c, P, win) }
    if (S.kab) {
      c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.lineWidth = Math.max(.5, .01 * u);
      for (const f of S.kab) {
        if (!hit(bbOf(f), win)) continue;
        const nm = String(prop(f.properties, 'WADMKK') || ''), RP = []; let a0 = 1e9, b0 = 1e9, a1 = -1e9, b1 = -1e9; c.beginPath();
        rings(f.geometry).forEach(r => {
          let px = 1e9, py = 1e9; const pts2 = [];
          r.forEach((q, i) => { const p = P(q[0], q[1]); if (i && Math.abs(p[0] - px) < 1 && Math.abs(p[1] - py) < 1) return; px = p[0]; py = p[1]; i ? c.lineTo(px, py) : c.moveTo(px, py); pts2.push(p); a0 = Math.min(a0, px); a1 = Math.max(a1, px); b0 = Math.min(b0, py); b1 = Math.max(b1, py) });
          c.closePath(); RP.push(pts2);
        });
        if (tema !== 'kerja') { c.fill('evenodd'); c.stroke() }
        if (main && nm && nm.toLowerCase() !== wil.toLowerCase() && a1 > fx0 && a0 < fx1 && b1 > fy0 && b0 < fy1) { c.font = fnt(.45, 1); const hw = c.measureText(nm).width / 2 + .2 * u, hh = .4 * u, lp = labelPt(RP, [Math.max(a0, fx0 + hw), Math.max(b0, fy0 + hh), Math.min(a1, fx1 - hw), Math.min(b1, fy1 - hh)], u); if (lp) LAB.push({ nm, p: lp.p, pr: lp.d }) }
      }
    }
    if (tema !== 'kerja') for (const f of fs) { if (f._k == null || !hit(bbOf(f), win)) continue; const e = cls.get(f._k); c.beginPath(); rings(f.geometry).forEach(r => { r.forEach((q, j) => { const p = P(q[0], q[1]); j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]) }); c.closePath() }); runOps(e.ops) }
    const clipPath = () => { c.beginPath(); tgt.forEach(f => rings(f.geometry).forEach(r => { r.forEach((q, i) => { const p = P(q[0], q[1]); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]) }); c.closePath() })) };
    if (tema === 'kerja') {
      if (tgt.length) { c.save(); c.beginPath(); c.rect(fx0, fy0, fx1 - fx0, fy1 - fy0); tgt.forEach(f => rings(f.geometry).forEach(r => { r.forEach((q, i) => { const p = P(q[0], q[1]); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]) }); c.closePath() })); c.fillStyle = 'rgba(255,255,255,.5)'; c.fill('evenodd'); c.restore() }
      c.strokeStyle = '#ffeb3b'; c.lineWidth = .06 * u * TK; c.beginPath(); tgt.forEach(f => rings(f.geometry).forEach(r => { r.forEach((q, i) => { const p = P(q[0], q[1]); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]) }); c.closePath() })); c.stroke();
      const sv = S.survey || [], sf = ['KETERANGAN', 'KATEGORI', 'JENIS', 'KLASIFIKASI', 'REMARK', 'NAMOBJ'].find(z => sv.length && prop(sv[0].properties, z) !== undefined);
      sv.forEach(f => { const g = f.geometry, q = g.type === 'MultiPoint' ? g.coordinates[0] : g.coordinates; if (!q || q[0] < win[0] || q[0] > win[2] || q[1] < win[1] || q[1] > win[3]) return; const cat = String((sf && prop(f.properties, sf)) || 'Titik Survei'), sy = S.ptsym.get(norm(cat)) || S.ptsym.get(norm('Titik Survei')), nm = sy ? cat : 'Titik Survei', p = P(q[0], q[1]); let e = cls.get(nm); if (!e) { e = { a: 0, pt: 1, psy: sy, pin: !sy, ops: [] }; cls.set(nm, e) } e.a++; if (sy) dot(p, sy, SC); else drawPin(c, p[0], p[1], .6 * u) });
    }
    const strokeF = ([f, nm]) => { const sy = syOf.get(nm); c.beginPath(); lines(f.geometry).forEach(l => l.forEach((q, i) => { const p = P(q[0], q[1]); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]) })); sy.L.forEach(l => { setStroke(l, TB * SC * bw(nm)); c.stroke() }); c.setLineDash([]); c.lineCap = 'butt' };
    const itv = items.filter(z => hit(bbOf(z[0]), win));
    itv.filter(z => z[2]).forEach(strokeF);
    c.save(); if (tgt.length) { clipPath(); c.clip('evenodd') } itv.filter(z => !z[2]).forEach(strokeF); c.restore();
    ptsIn.forEach(f => { const q = ptXY(f); if (q[0] < win[0] || q[0] > win[2] || q[1] < win[1] || q[1] > win[3]) return; const p = P(q[0], q[1]), sy = S.ptsym.get(norm(prop(f.properties, 'REMARK'))); if (sy) dot(p, sy, SC); else { c.fillStyle = '#000'; c.beginPath(); c.arc(p[0], p[1], .09 * u, 0, 7); c.fill() } });
    if ($('#labelKecamatan').checked) {
      const G = new Map();
      for (const f of fs) { const b = bbOf(f); if (!hit(b, win)) continue; const nm = String(prop(f.properties, 'WADMKC') || ''); if (!nm) continue; const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, w = arOf(f) || 1e-12; let g = G.get(nm); if (!g) G.set(nm, g = { sx: 0, sy: 0, s: 0, L: [] }); g.sx += cx * w; g.sy += cy * w; g.s += w; g.L.push([cx, cy]) }
      G.forEach((g, nm) => { const gx = g.sx / g.s, gy = g.sy / g.s; let best = null, bd = 1e18; for (const [cx, cy] of g.L) { const d = (cx - gx) ** 2 + (cy - gy) ** 2; if (d < bd) { bd = d; best = [cx, cy] } } const p = P(best[0], best[1]); if (p[0] > fx0 && p[0] < fx1 && p[1] > fy0 && p[1] < fy1) LAB.push({ nm, p, pr: 1e5, kec: 1 }) });
    }
    if (main) LAB.push({ nm: wil, p: P(clon, clat), pr: Infinity });
    const placed = main ? INS.map(I => [X(I.F.x), Y(I.F.y), X(I.F.x + I.F.w), Y(I.F.y + I.F.h)]) : [];
    LAB.sort((a, b) => (b.pr || 0) - (a.pr || 0)).forEach(l => { c.font = fnt(l.kec ? .3 : .45, 1); const w = c.measureText(l.nm).width + .2 * u, h = (l.kec ? .36 : .5) * u, bx = [l.p[0] - w / 2, l.p[1] - h / 2, l.p[0] + w / 2, l.p[1] + h / 2]; if (placed.some(r => bx[0] < r[2] && bx[2] > r[0] && bx[1] < r[3] && bx[3] > r[1])) return; placed.push(bx); c.textAlign = 'center'; c.strokeStyle = '#fff'; c.lineWidth = (l.kec ? .08 : .1) * u; c.strokeText(l.nm, l.p[0], l.p[1]); c.fillStyle = l.kec ? '#111' : '#00b89c'; c.fillText(l.nm, l.p[0], l.p[1]) });
    c.restore();
  };
  await drawFrame(FRAMES[0]);
  for (const I of INS) {
    await drawFrame(I);
    c.strokeStyle = '#000'; c.lineWidth = .05 * u; c.strokeRect(X(I.F.x), Y(I.F.y), X(I.F.w), Y(I.F.h));
    if (I.title) txt(I.title, I.F.x + .25, I.F.y + .4, .32, { b: 1, halo: 1 });
    txt('SKALA 1:' + I.N.toLocaleString('id-ID'), I.F.x + .25, I.F.y + I.F.h - .3, .26, { halo: 1 });
  }
  /* bingkai dan grid koordinat */
  c.strokeStyle = '#000'; c.lineWidth = .05 * u; c.strokeRect(X(FR.x), Y(FR.y), X(FR.w), Y(FR.h)); c.lineWidth = .1 * u; c.strokeRect(X(1.2), Y(.6), X(39.6), Y(28.5));
  [.2, .5, .8].forEach(t => {
    const lo = clon + (t - .5) * FR.w / k / mx, la = clat - (t - .5) * FR.h / k / my, tx = FR.x + FR.w * t, ty = FR.y + FR.h * t;
    txt(dms(lo, 1), tx, FR.y - .35, .28, { a: 'center', c: '#1565c0' }); txt(dms(lo, 1), tx, FR.y + FR.h + .35, .28, { a: 'center', c: '#1565c0' });
    [[FR.x - .35, -90], [FR.x + FR.w + .35, 90]].forEach(([x, r]) => { c.save(); c.translate(X(x), Y(ty)); c.rotate(r * Math.PI / 180); txt(dms(la, 0), 0, 0, .28, { a: 'center', c: '#1565c0' }); c.restore() });
  });
  /* panel kanan */
  const cx = RX + RW / 2, fit = (t, w, fs, b) => { c.font = fnt(fs, b); let o = t; while (c.measureText(o).width > w * u && o.length > 3) o = o.slice(0, -2); return o === t ? t : o.trimEnd() + '…' };
  if (LG.complete) c.drawImage(LG, X(cx - 1.1), Y(1.4), X(2.2), Y(2.2 * LG.naturalHeight / LG.naturalWidth));
  ['KANTOR WILAYAH BPN PROVINSI JAWA TIMUR', 'KEMENTERIAN AGRARIA DAN TATA RUANG', 'BADAN PERTANAHAN NASIONAL'].forEach((t, i) => txt(t, cx, 4.0 + i * .42, .3, { a: 'center', b: 1 }));
  const T = titleOf(tema).toUpperCase(), W = T.split(' '); let TL = [T];
  if (T.length > 22) { let bi = 1, bd = 1e9; for (let q = 1; q < W.length; q++) { const d = Math.abs(W.slice(0, q).join(' ').length - T.length / 2); if (d < bd) { bd = d; bi = q } } TL = [W.slice(0, bi).join(' '), W.slice(bi).join(' ')] }
  TL.forEach((t, q) => txt(t, cx, 5.75 + q * .65, .46, { a: 'center', b: 1 })); const ty0 = 5.75 + TL.length * .65;
  txt((/^kota /i.test(wil) ? '' : 'KABUPATEN ') + wil.toUpperCase(), cx, ty0 + .1, .4, { a: 'center', b: 1 }); txt('TAHUN ' + $('#tahun').value, cx, ty0 + .65, .4, { a: 'center', b: 1 });
  const ny = ty0 + 2.3, kw = 2.1, kh = KP.naturalWidth ? kw * KP.naturalHeight / KP.naturalWidth : 2.3;
  if (KP.complete && KP.naturalWidth) c.drawImage(KP, X(cx - kw / 2), Y(ny + .05 - kh / 2), X(kw), Y(kh));
  txt('SKALA 1:' + N.toLocaleString('id-ID'), cx, ny + 1.5, .3, { a: 'center' });
  const kmCm = 1000 * k, step = [.1, .2, .25, .5, 1, 2, 2.5, 5, 10, 20].find(q => q * kmCm >= 1.1) || 20, bx = cx - 2 * step * kmCm;
  c.lineWidth = .02 * u; for (let q = 0; q < 4; q++) { c.fillStyle = q % 2 ? '#fff' : '#000'; c.fillRect(X(bx + q * step * kmCm), Y(ny + 1.85), X(step * kmCm), Y(.15)); c.strokeRect(X(bx + q * step * kmCm), Y(ny + 1.85), X(step * kmCm), Y(.15)); txt(String(+(q * step).toFixed(2)), bx + q * step * kmCm, ny + 2.35, .24, { a: 'center' }) }
  txt(+(4 * step).toFixed(2) + ' Km', bx + 4 * step * kmCm, ny + 2.35, .24, { a: 'center' });
  txt('PETUNJUK LETAK PROVINSI', cx, ny + 3.1, .28, { a: 'center', b: 1 });
  const IB = { x: cx - 3.8, y: ny + 3.4, w: 7.6, h: 3.4 }; c.fillStyle = '#d6ecf7'; c.fillRect(X(IB.x), Y(IB.y), X(IB.w), Y(IB.h));
  const SI = +$('#skInset').value || 700000;
  if (S.kab) {
    const [a0, b0, a1, b1] = bounds(tgt.length ? tgt : fs), clo = (a0 + a1) / 2, cla = (b0 + b1) / 2, k2 = 100 / SI, mx2 = 111320 * Math.cos(cla * Math.PI / 180), kx = mx2 * k2, ky = 111320 * k2;
    const Q = (lo, la) => [X(IB.x + IB.w / 2 + (lo - clo) * kx), Y(IB.y + IB.h / 2 - (la - cla) * ky)];
    c.save(); c.beginPath(); c.rect(X(IB.x), Y(IB.y), X(IB.w), Y(IB.h)); c.clip();
    const iw = [clo - IB.w / 2 / kx, cla - IB.h / 2 / ky, clo + IB.w / 2 / kx, cla + IB.h / 2 / ky];
    { c.fillStyle = '#d6ecf7'; c.fillRect(X(IB.x), Y(IB.y), X(IB.w), Y(IB.h)); if (S.bati) await drawBati(c, Q, iw) }
    const LB = [];
    for (const hit of [false, true]) for (const f of S.kab) {
      const nm = String(prop(f.properties, 'WADMKK') || ''), on = nm.toLowerCase() === wil.toLowerCase(); if (on !== hit) continue;
      let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
      c.fillStyle = on ? '#e53935' : '#f1f1f1'; c.strokeStyle = on ? '#8e0000' : '#888'; c.lineWidth = (on ? .035 : .012) * u; c.beginPath();
      rings(f.geometry).forEach(r => { let px = 1e9, py = 1e9; r.forEach((q, i) => { const p = Q(q[0], q[1]); if (i && Math.abs(p[0] - px) < 1 && Math.abs(p[1] - py) < 1) return; px = p[0]; py = p[1]; i ? c.lineTo(px, py) : c.moveTo(px, py); bx0 = Math.min(bx0, px); bx1 = Math.max(bx1, px); by0 = Math.min(by0, py); by1 = Math.max(by1, py) }); c.closePath() });
      c.fill('evenodd'); c.stroke(); LB.push({ nm, on, bx0, by0, bx1, by1 });
    }
    const ix0 = X(IB.x), ix1 = X(IB.x + IB.w), iy0 = Y(IB.y), iy1 = Y(IB.y + IB.h);
    LB.forEach(l => { if (!l.nm) return; const vx0 = Math.max(l.bx0, ix0), vx1 = Math.min(l.bx1, ix1), vy0 = Math.max(l.by0, iy0), vy1 = Math.min(l.by1, iy1); if (vx1 - vx0 < .9 * u || vy1 - vy0 < .3 * u) return; c.font = fnt(.2, l.on); c.textAlign = 'center'; c.lineWidth = .06 * u; c.strokeStyle = '#fff'; c.strokeText(l.nm, (vx0 + vx1) / 2, (vy0 + vy1) / 2); c.fillStyle = '#111'; c.fillText(l.nm, (vx0 + vx1) / 2, (vy0 + vy1) / 2) });
    const ra = Q(winLL[0], winLL[3]), rb = Q(winLL[2], winLL[1]), rcx = (ra[0] + rb[0]) / 2, rcy = (ra[1] + rb[1]) / 2, hw = Math.max(Math.abs(rb[0] - ra[0]) / 2, .15 * u), hh = Math.max(Math.abs(rb[1] - ra[1]) / 2, .15 * u);
    c.strokeStyle = '#e00000'; c.lineWidth = .05 * u; c.strokeRect(rcx - hw, rcy - hh, hw * 2, hh * 2);
    INS.forEach(I => {
      const a = Q(I.win[0], I.win[3]), b = Q(I.win[2], I.win[1]);
      c.strokeRect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
    });
    c.restore();
  }
  c.strokeStyle = '#000'; c.lineWidth = .03 * u; c.strokeRect(X(IB.x), Y(IB.y), X(IB.w), Y(IB.h)); txt('SKALA 1:' + SI.toLocaleString('id-ID'), cx, IB.y + IB.h + .3, .24, { a: 'center' });
  /* sumber data (isi manual dari kolom di panel kiri) */
  const SF = .21, SP = .27, srcL = []; c.font = fnt(SF);
  $('#sumber').value.split('\n').forEach(ln => { if (!ln.trim()) { srcL.push(''); return } const ind = /^\s+/.test(ln) ? '  ' : /^\d+\./.test(ln.trim()) ? '' : '', words = ln.trim().split(' '); let cur = ind;
    words.forEach(w => { if (c.measureText(cur + w).width > (RW - .4) * u && cur.trim()) { srcL.push(cur); cur = '   ' + w + ' ' } else cur += w + ' ' }); srcL.push(cur) });
  const yS = 28.6 - srcL.length * SP; srcL.forEach((t, i) => txt(t, RX + .2, yS + i * SP, SF));
  /* legenda */
  let y = IB.y + IB.h + .95; txt('KETERANGAN', RX + .2, y, .45, { b: 1 }); y += .55;
  const yMax = yS - .35, bl = [...base], pl = [...pc], pB = .34, rowsB = Math.max(bl.length, pl.length);
  bl.forEach(([n, sy], i) => { const yy = y + i * pB; sy.L.forEach(l => { setStroke(l, TB * bw(n)); c.beginPath(); c.moveTo(X(RX + .2), Y(yy)); c.lineTo(X(RX + 1.1), Y(yy)); c.stroke() }); c.setLineDash([]); c.lineCap = 'butt'; txt(fit(n, 3.8, .26), RX + 1.3, yy, .26) });
  pl.forEach((n, i) => { const yy = y + i * pB, sy = S.ptsym.get(norm(n)); if (sy) dot([X(RX + 5.6), Y(yy)], sy, .7); else { c.fillStyle = '#000'; c.beginPath(); c.arc(X(RX + 5.6), Y(yy), .1 * u, 0, 7); c.fill() } c.textAlign = 'left'; txt(fit(n, 3.6, .26), RX + 6.2, yy, .26) });
  y += rowsB * pB + .35;
  const arr = [...cls]; /^kar/.test(tema) ? arr.sort((a, b) => BINS.findIndex(z => z[1] === a[0]) - BINS.findIndex(z => z[1] === b[0])) : arr.sort((a, b) => b[1].a - a[1].a);
  const names = arr.map(([name]) => tema === 'sektor' ? `Tersedia untuk ${name}` : name), availH = yMax - y;
  const wrap2 = (t, tw, fz) => {
    c.font = fnt(fz); const W = q => c.measureText(q).width / u; if (W(t) <= tw) return [t];
    const ws = t.split(' '); let l1 = '', k = 0; while (k < ws.length && W(l1 ? l1 + ' ' + ws[k] : ws[k]) <= tw) { l1 = l1 ? l1 + ' ' + ws[k] : ws[k]; k++ }
    let rest = ws.slice(k).join(' ');
    if (!l1) { let q = ws[0]; while (W(q) > tw && q.length > 2) q = q.slice(0, -1); l1 = q; rest = (ws[0].slice(q.length) + ' ' + ws.slice(1).join(' ')).trim() }
    if (W(rest) > tw) { while (W(rest + '…') > tw && rest.length > 2) rest = rest.slice(0, -1); rest = rest.trimEnd() + '…' }
    return [l1, rest];
  };
  const build = (fz, cols) => { const cw = (RW - .2) / cols, wr = names.map(t => wrap2(t, cw - .95, fz)), lh = fz * 1.2, hs = wr.map(l => l.length * lh + fz * .5); return { fz, cw, wr, lh, hs } };
  let LY = null;
  find: for (const fz of [.26, .24, .22, .2, .18, .16, .14]) for (const cols of [1, 2, 3]) {
    const t = build(fz, cols), cs = []; let cur = [], h = 0;
    for (let i = 0; i < names.length; i++) { if (h + t.hs[i] > availH && cur.length) { cs.push(cur); cur = []; h = 0 } cur.push(i); h += t.hs[i] }
    cs.push(cur); if (cs.length <= cols) { LY = { ...t, cs }; break find }
  }
  if (!LY) { const t = build(.14, 3), per = Math.ceil(names.length / 3); LY = { ...t, cs: [0, 1, 2].map(q => names.map((_, i) => i).slice(q * per, (q + 1) * per)) } }
  LY.cs.forEach((col, ci) => {
    let yy = y; const x = RX + .2 + ci * LY.cw;
    col.forEach(i => {
      const e = arr[i][1], lines = LY.wr[i], mid = yy + lines.length * LY.lh / 2, sh = Math.max(.26, Math.min(.38, LY.fz * 1.4));
      if (e.pin) drawPin(c, X(x + .3), Y(mid + .22), .5 * u);
      else if (e.psy) dot([X(x + .3), Y(mid)], e.psy, .7);
      else { const pth = () => { c.beginPath(); c.rect(X(x), Y(mid - sh / 2), X(.6), Y(sh)) }; c.save(); pth(); c.clip(); pth(); runOps(e.lops || e.ops); c.restore(); c.strokeStyle = '#000'; c.lineWidth = .01 * u; c.strokeRect(X(x), Y(mid - sh / 2), X(.6), Y(sh)) }
      lines.forEach((ln, k) => txt(ln, x + .75, yy + LY.lh / 2 + k * LY.lh, LY.fz)); yy += LY.hs[i];
    });
  });
  return { N, kelas: cls.size };
}
$('#go').onclick = async () => { await LOADING; if (!S.djpa) return st('Muat Peta DJPA (.zip) dulu.'); st('Membuat layout...'); try { const r = await render($('#cv'), 80); st(`Selesai. Skala 1:${r.N.toLocaleString('id-ID')}, ${r.kelas} kelas.`) } catch (e) { console.error(e); st('Gagal: ' + errMsg(e)) } };
$('#png').onclick = async () => {
  if (!S.djpa) return st('Buat layout dulu.');
  try {
    const t = document.createElement('canvas'); await render(t, 300);
    const a = document.createElement('a'); a.download = downloadBaseName($('#tema').value) + '.png'; a.href = t.toDataURL('image/png'); a.click();
  } catch (e) {
    console.error(e); st(/tainted|insecure|security/i.test(errMsg(e)) ? 'Ekspor diblokir oleh CORS citra Google. Pilih Esri Wayback atau tangkap layar.' : 'Gagal mengunduh PNG: ' + errMsg(e));
  }
};
function makePdf(cv, title) {
  const { jsPDF } = window.jspdf, d = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [PG.w * 10, PG.h * 10], compress: true });
  d.setProperties({ title }); d.addImage(cv.toDataURL('image/png'), 'PNG', 0, 0, PG.w * 10, PG.h * 10, undefined, 'FAST'); return d;
}
$('#pdf').onclick = async () => {
  if (!S.djpa) return st('Buat layout dulu.'); st('Menyiapkan PDF (300 dpi), mohon tunggu...');
  try { const t = document.createElement('canvas'); await render(t, 300); const name = downloadBaseName($('#tema').value); makePdf(t, name).save(name + '.pdf'); st('PDF selesai diunduh.') }
  catch (e) { console.error(e); st(/tainted|insecure|security/i.test(errMsg(e)) ? 'Ekspor diblokir oleh CORS citra Google. Pilih Esri Wayback atau tangkap layar.' : 'Gagal membuat PDF: ' + errMsg(e)) }
};

async function loadDefaults() {
  const get = async u => { const r = await fetch(u); if (!r.ok) throw new Error(u + ' (HTTP ' + r.status + ')'); return r.blob() };
  try {
    st('Membaca .stylx...');
    for (const n of ['Simbol_semua', 'RTR']) S.sets.push({ n: n + '.stylx', m: await readStylx(await get('./' + n + '.stylx'), 'poly') });
    const tp = await get('./Toponim.stylx'); S.top = await readStylx(tp, 'line'); S.ptsym = await readStylx(tp, 'point');
    st(S.sets.reduce((a, z) => a + z.m.size, 0) + ' simbol dimuat. Muat Peta Dasar, Batas Kab/Kota Jatim, dan Peta DJPA (.zip).');
  } catch (e) {
    console.error(e); st('Gagal membaca .stylx: ' + (e.message || e) + '. Buka lewat server/GitHub Pages (bukan klik dua kali), atau pilih file .stylx manual di bawah.');
    const el = $('#st'); if (el.style) el.style.color = '#c62828'; const m = $('#manualSim'); if (m) m.hidden = false;
  }
}
$('#fSim').onchange = async e => { try { for (const f of e.target.files) { st('Membaca ' + f.name + '...'); S.sets = S.sets.filter(z => z.n !== f.name); S.sets.push({ n: f.name, m: await readStylx(f, 'poly') }); if (/topon/i.test(f.name)) { S.top = await readStylx(f, 'line'); S.ptsym = await readStylx(f, 'point') } } st('Simbol dimuat manual (' + S.sets.reduce((a, z) => a + z.m.size, 0) + ').'); const el = $('#st'); if (el.style) el.style.color = '' } catch (x) { st('Gagal: ' + errMsg(x)) } };
bind('#fDasar', async f => { await LOADING; S.dasar = await readZip(f) });
bind('#fKab', async f => { S.kab = (await readZip(f)).flatMap(l => l.features); const c = {}; S.kab.forEach(x => { const p = prop(x.properties, 'WADMPR') || '(tanpa provinsi)'; c[p] = (c[p] || 0) + 1 }); return 'Batas kab/kota: ' + S.kab.length + ' fitur (' + Object.entries(c).map(([k, v]) => k + ' ' + v).join(', ') + ')' });
bind('#fBati', async f => { S.bati = await loadBati(f); return 'Batimetri dimuat: ' + S.bati.info });
bind('#fPantai', async f => { S.coast = (await readZip(f)).flatMap(l => l.features); return 'Garis pantai: ' + S.coast.length + ' fitur' });
const LOADING = loadDefaults();

if (typeof document.querySelectorAll === 'function') {
  document.querySelectorAll('.dropzone').forEach(z => {
    const inp = document.getElementById(z.dataset.fileInput), nameEl = z.querySelector('[data-file-name]'); if (!inp) return;
    const show = () => { const n = inp.files && inp.files.length ? [...inp.files].map(f => f.name).join(', ') : ''; nameEl.textContent = n || 'Seret atau pilih file'; z.classList.toggle('has-file', !!n) };
    z.addEventListener('click', e => { if (e.target !== inp) inp.click() });
    z.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click() } });
    ['dragenter', 'dragover'].forEach(t => z.addEventListener(t, e => { e.preventDefault(); z.classList.add('dragover') }));
    ['dragleave', 'drop'].forEach(t => z.addEventListener(t, e => { e.preventDefault(); z.classList.remove('dragover') }));
    z.addEventListener('drop', e => { const fl = e.dataTransfer && e.dataTransfer.files; if (!fl || !fl.length) return; const dt = new DataTransfer(); [...fl].forEach(f => dt.items.add(f)); inp.files = dt.files; inp.dispatchEvent(new Event('change')); show() });
    inp.addEventListener('change', show);
  });
  const pk = document.getElementById('pulauKm'); if (pk) pk.addEventListener('change', buildIslandUI);
}
