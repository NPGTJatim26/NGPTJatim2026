# Layout Peta Otomatis

Satu halaman web (HTML/CSS/JS), pemrosesan di browser. Cara kerjanya sama dengan dashboard: file `.stylx` dimuat dengan `fetch`
dari folder yang sama dengan `index.html`, jadi **harus dibuka lewat server** (GitHub Pages, atau `python -m http.server`), bukan klik dua kali.

## Letakkan dalam satu folder
`index.html`, `app.js`, `style.css`, `logo.js`, `font.js`, `Simbol_semua.stylx`, `RTR.stylx`, `Toponim.stylx`

## Input pengguna
Peta DJPA (.zip), Peta Dasar PT LN (.zip), Batas Kab/Kota Jatim (.zip), Peta Titik Survei (.zip, opsional), Garis Pantai (.zip, opsional), dan Batimetri (.zip berisi .tif + .tfw/.prj, opsional).
Mengganti simbologi cukup mengganti file `.stylx` di folder yang sama.

## Catatan
- Garis pantai diambil langsung dari fitur "Garis Pantai" pada Peta Dasar yang diunggah.
- Peta dasar (jalan, sungai, rel, batas, titik) dipotong ke batas kab/kota target; hanya "Garis Pantai" yang tidak dipotong.
- Ukuran simbol mengikuti style (.stylx) pada skala peta yang dibuat; tidak ada pengaturan skala referensi.
- ZIP shapefile dengan proyeksi Cylindrical Equal Area ikut terbaca; .prj tidak dikenal atau tidak ada akan menampilkan pesan galat yang jelas.
- Aturan Potensi Sektor Lain / Pangan mengikuti dashboard (kata kunci `SEK` di `app.js`).
- Batimetri: raster dibaca di browser (geotiff.js + proj4), hanya jendela yang dipakai peta utama dan inset. Nilai <= 0 dianggap kedalaman laut, nilai > 0 / tanpa data dianggap daratan (transparan). CRS dibaca dari GeoTIFF atau .prj; bila tidak ada, dipakai UTM 50S, atau isi kolom EPSG. Tidak dipakai di peta utama Peta Kerja (memakai citra), tetapi dipakai di inset semua tema.
- Ekspor: PNG 300 dpi atau PDF A3 (420 x 297 mm) satu halaman. PDF berisi gambar peta resolusi 300 dpi (raster), bukan vektor, sehingga teks tidak bisa diseleksi. Memakai jsPDF 4.2.1 dari CDN.
- Nama berkas unduhan mengikuti tema peta dan nama Kabupaten/Kota dari data DJPA, misalnya `Peta Administrasi_KOTA PASURUAN.png`. Untuk tema RTRW/RDTR dan kesesuaiannya, nama mengikuti pilihan jenis rencana tata ruang.
- Inset pulau terpencil: poligon DJPA dikelompokkan menurut kedekatan; kelompok terluas menjadi peta utama dan maksimal 4 kelompok lain menjadi kotak inset di dalam bingkai (di sudut yang paling sedikit menimpa daratan), masing-masing dengan skala sendiri. Inset petunjuk letak provinsi menampilkan kotak merah untuk cakupan peta utama dan setiap inset pulau. Jarak pemisah diatur di kolom "Pisahkan pulau jika berjarak > (km)" (0 = nonaktif); judul inset bisa diedit. Gugus yang lebih kecil dari 4 terbesar tidak ditampilkan kecuali berada di dalam jendela salah satu bingkai.
- Label kecamatan (WADMKC) mengikuti kotak centang di panel pengaturan.
- Tampilan mengikuti index.html dan style.css portal (kotak unggah seret-lepas, tema terang/gelap).
