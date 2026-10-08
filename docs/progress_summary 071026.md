# Progress Summary - 7 Oktober 2026

Berikut adalah rangkuman pengerjaan dan fitur-fitur baru yang diselesaikan pada tanggal 7 Oktober 2026:

## 1. Peningkatan Sistem Web GPS Tracker (`/tracking/[token]`)
- **Informasi Pelari:** Nama pelari kini ditampilkan di bagian atas halaman pelacakan untuk memberi kejelasan siapa yang sedang menggunakan perangkat/link tersebut.
- **Auto-Tracking 5 Menit:** Sistem pelacakan secara otomatis mengirim koordinat GPS setiap 5 menit begitu pelari menekan tombol **"START"**.
- **Pencegah Auto-Sleep (Screen Wake Lock API):** Mengimplementasikan fitur _Wake Lock_ agar layar HP pelari tidak otomatis mati (terkunci) saat fitur _tracking_ sedang berjalan. Hal ini memastikan interval 5 menit tidak dibekukan (_suspend_) oleh sistem operasi ponsel.
- **Auto-Redirect Pelari Selanjutnya:** Ketika pelari menekan tombol **"FINISH"**, sistem akan otomatis memuat halaman pelacakan untuk pelari berikutnya dalam satu tim tanpa harus keluar atau memindai kode QR ulang.

## 2. Penyempurnaan Laporan SOS & Insiden
- **UI/UX Pemilihan File:** Mengganti input file standar browser yang membingungkan dengan tombol khusus yang lebih intuitif: **"Buka Kamera"** (langsung memanggil kamera HP) dan **"Pilih Galeri/File"**.
- **Multi-File Upload:** Pelari sekarang dapat memilih dan mengunggah beberapa foto atau dokumen sekaligus dalam satu kali laporan SOS.
- **Tampilan Admin:** Di halaman Detail Insiden pada _dashboard_, admin/tim support kini dapat melihat semua lampiran (baik itu jejeran foto maupun tautan unduhan untuk format dokumen seperti PDF/Word).

## 3. Fitur Edit Data Pelari (Admin)
- **Tombol Edit:** Menambahkan tombol **Edit** (ikon pensil) pada tabel di halaman **Manajemen Runners** untuk mempermudah pembaruan data.
- **Formulir Edit Pelari:** Membuat halaman khusus `runners/[id]/edit` beserta komponen `RunnerEditForm` dan fungsionalitas `updateRunner` di _server action_ agar admin dapat mengubah data pelari (seperti nama, nomor kontak, dan status) kapan saja.

## 4. Optimalisasi Halaman Publik (Live Map)
- **Sinkronisasi Otomatis:** Memodifikasi klien peta agar memicu pembaruan tabel **Team Status** di bawahnya secara _real-time_. Begitu ada perubahan posisi atau status yang ditangkap peta, tabel di bawahnya akan otomatis tersinkron tanpa _refresh_ manual.
- **Penyegaran Status "Freshness":** Menambahkan interval penyegaran otomatis setiap 1 menit untuk memastikan indikator warna kesegaran data (_fresh/warning/stale_) tetap akurat seiring berjalannya waktu.
- **Tampilan Peta Mobile-Friendly:** Menyesuaikan tinggi komponen peta agar bersifat responsif (menggunakan `45vh` pada layar _mobile_). Dengan ini, pengunjung yang menggunakan _smartphone_ dapat melihat peta sekaligus tabel _Team Status_ di bawahnya dalam satu layar tanpa harus banyak _scrolling_.

---

## 5. Peningkatan Pelaporan SOS & Insiden
- **Kompresi Gambar Otomatis:** Menambahkan kompresi gambar di sisi perangkat pelari (_client-side image compression_) sebelum diunggah. Hal ini mencegah kegagalan laporan SOS akibat ukuran foto yang terlalu besar (_error 413 Payload Too Large_).
- **Perbaikan Zona Waktu:** Menyesuaikan zona waktu pada daftar insiden aktif di _dashboard_ admin agar selalu sesuai dengan waktu lokal.
- **Dialog Insiden di Peta:** Menambahkan dialog pop-up interaktif pada peta publik sehingga pengunjung dapat melihat detail insiden yang dilaporkan pelari secara langsung tanpa berpindah halaman.

## 6. Halaman Publik Khusus per Tim (Team-Specific Pages)
- **Rute Dinamis per Tim:** Menyesuaikan _middleware_ dan struktur _routing_ agar setiap tim (atau grup tim) memiliki halaman Live Map publiknya sendiri (misal: `/[team_code]`).
- **Filter Peta Berdasarkan Prefix:** Halaman publik per grup/tim kini mendukung filter otomatis pada peta, sehingga penonton hanya melihat pelari-pelari dari tim yang dicari (mendukung filter banyak tim dengan _prefix_ tertentu).
- **Auto-Zoom Peta Publik:** Peta publik kini secara cerdas melakukan penyesuaian area pandang (_auto-zoom bounds_) untuk mencakup seluruh posisi pelari yang sedang aktif di peta.
- **Ekspor Tautan GPS:** Menambahkan fungsionalitas untuk mengekspor link GPS tim secara massal.

## 7. Optimasi Teknis & Sistem Pelacakan
- **Auto-Enable Tracking:** Perangkat pelacakan GPS kini akan otomatis aktif (_enabled_) segera setelah status pelari di sistem berubah menjadi "Running".
- **Kesesuaian Next.js 15+:** Memperbaiki penanganan parameter rute asinkron (_await params_) pada halaman publik khusus tim untuk mematuhi standar terbaru Next.js 15+.

---

*Seluruh pengerjaan di atas telah di-commit dan di-push ke repository Git di branch main.*
