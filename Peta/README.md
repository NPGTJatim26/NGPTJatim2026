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
- Label kecamatan pada layout diambil dari atribut `WADMKC` di Peta DJPA; label dapat dinyalakan atau dimatikan melalui pengaturan.
- Tema Administrasi tidak menggunakan simbol dari berkas `.stylx`; setiap kelas `WADMKC` diberi warna isian tersendiri agar nama kecamatan tidak cocok sebagian dengan simbol RTR/Simbol semua.
- Batimetri: raster dibaca di browser (geotiff.js + proj4), hanya jendela yang dipakai peta utama dan inset. Nilai <= 0 dianggap kedalaman laut, nilai > 0 / tanpa data dianggap daratan (transparan). CRS dibaca dari GeoTIFF atau .prj; bila tidak ada, dipakai UTM 50S, atau isi kolom EPSG. Tidak dipakai di peta utama Peta Kerja (memakai citra), tetapi dipakai di inset semua tema.
- Ekspor: PNG 300 dpi atau PDF A3 (420 x 297 mm) satu halaman. PDF berisi gambar peta resolusi 300 dpi (raster), bukan vektor, sehingga teks tidak bisa diseleksi. Memakai jsPDF 4.2.1 dari CDN.
