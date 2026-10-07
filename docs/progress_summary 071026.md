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

*Seluruh pengerjaan di atas telah di-commit dan di-push ke repository Git di branch main.*
