# Setup Google Drive

Penyimpanan akun memakai Google Drive milik pengguna. Google Drive menyimpan ZIP shapefile dan file Excel; Supabase tetap dipakai untuk login aplikasi dan hanya file lama yang sebelumnya tersimpan di Supabase.

## Konfigurasi satu kali oleh pemilik aplikasi

1. Buat atau pilih project di Google Cloud Console dan aktifkan **Google Drive API**.
2. Atur Google Auth Platform / consent screen: nama aplikasi, email dukungan, domain, dan status publikasi. Selama masih dalam mode pengujian, tambahkan akun Google penguji sebagai test user.
3. Buat OAuth Client ID dengan jenis aplikasi **Web application**.
4. Tambahkan alamat origin situs yang benar pada **Authorized JavaScript origins** (contoh: `https://domain-aplikasi.example`). Untuk pengembangan lokal, tambahkan origin lokal yang dipakai, misalnya `http://localhost:8000`.
5. Salin **Client ID** ke `GOOGLE_DRIVE_CLIENT_ID` di `frontend/drive-config.js`. Client ID memang digunakan di browser dan bukan rahasia. Jangan menaruh client secret di frontend.
6. Sajikan aplikasi lewat HTTPS pada domain produksi. Google OAuth tidak akan berjalan di `file://`; untuk lokal gunakan server web lokal.

Tidak dibutuhkan project Google Cloud, client secret, service account, atau project Supabase terpisah untuk setiap pengguna.

## Alur pengguna

Pengguna masuk atau mendaftar dari halaman landing. Sesi aplikasi yang sama dipakai oleh semua alat, sehingga pengguna tidak perlu masuk ulang saat berpindah halaman. Untuk file Drive, tekan **Hubungkan Google Drive** atau **Ambil dari Drive** pada alat yang digunakan, lalu pilih akun Google dan setujui izin bila diminta. Alamat email Google boleh berbeda dari email aplikasi. File baru disimpan di folder `Analisis Penggunaan Tanah` pada Drive pengguna. Unggahan menggunakan Drive resumable upload dalam potongan 8 MiB; daftar file, unduh, dan hapus juga dilakukan melalui Drive API.

Izin yang diminta adalah `drive.file` dan akses alamat email akun Google. Aplikasi tidak meminta akses menyeluruh ke semua isi Drive. Token akses hanya disimpan di memori halaman, bukan di local storage atau database; jika Google meminta otorisasi lagi, pengguna dapat menekan tombol hubungkan kembali.

Layout Peta, Dashboard, Tabel, dan Generator PPT dapat mengambil ZIP dari Drive sesuai jenis inputnya; Penyusun Laporan dapat mengambil berkas `.xlsx`, `.xls`, `.md`, atau `.txt`. Dashboard dan Tabel juga menyediakan daftar file Drive untuk dibuka. Pada Tabel, ZIP sumber disimpan otomatis setelah berhasil dibaca. Tombol **Simpan Excel ke Google Drive** menyimpan hasil `.xlsx`; tombol unduh lokal tetap tersedia. File lama yang tersimpan di bucket Supabase tetap ditampilkan sebagai file lama dan tidak otomatis dipindahkan ke Drive.

## Batasan

Drive mengatasi batas unggah/penyimpanan Supabase yang sebelumnya 50 MB. Namun, proses pembacaan dan analisis tetap berjalan di browser. File yang sangat besar masih memerlukan memori dan kemampuan perangkat yang memadai. Kuota penyimpanan Drive juga mengikuti akun pengguna.
