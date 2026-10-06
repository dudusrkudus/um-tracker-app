# Progress Summary - 5 Oktober 2026

Berikut adalah ringkasan fitur baru dan perubahan utama yang telah ditambahkan pada sistem **Ultra Marathon Race Control** hari ini:

## 1. Integrasi Laporan Darurat (SOS) & Upload Foto via Telegram
- **Webhook Telegram Cerdas:** Bot Telegram kini dapat menerima laporan dari pelari baik berupa **teks** maupun **gambar/foto**.
- **Autentikasi Token Pelari:** Sistem menggunakan `tracking_token_hash` dari masing-masing pelari sebagai validasi otorisasi.
- **Auto-Upload ke Supabase Storage:** File foto yang dikirim ke bot akan diunduh dan secara otomatis diunggah (di-*upload*) ke bucket `incidents` di Supabase.

## 2. Fitur Laporan SOS pada Web GPS Tracker
- **Antarmuka (UI) Baru:** Ditambahkan tombol merah "Kirim SOS / Laporan" pada halaman `app/tracking/[token]`.
- **Formulir Laporan:** Pelari dapat mengetik deskripsi kejadian dan melampirkan foto secara langsung melalui browser HP mereka.
- **API Khusus (`/api/tracking/sos`):** Endpoint API baru yang dirancang untuk menerima `FormData` (teks & file gambar) secara aman dan memprosesnya menjadi tiket insiden di *database*.

## 3. Peningkatan Visualisasi Dashboard (Incidents)
- **Tabel Insiden Aktif di Halaman Utama:** Menambahkan daftar singkat insiden yang sedang berjalan (aktif) di beranda (Dashboard utama) agar panitia dapat mendeteksi keadaan darurat (seperti kram, logistik habis) secepat mungkin tanpa harus pindah menu.
- **Tampilan Foto Bukti:** Pada halaman *Detail Insiden*, admin kini bisa melihat secara langsung *thumbnail/gambar* foto yang dikirimkan oleh pelari, baik dari Telegram maupun Web GPS.

## 4. Modul Manajemen Pengguna (User Management)
- **Halaman Baru (`/users`):** Dibuat khusus untuk menambah dan mengelola staf panitia (PIC, Marshal, Race Director, dsb).
- **Integrasi Supabase Auth Admin:** Penambahan akun pengguna baru akan secara otomatis membuat *credentials* (Email & Password) untuk *login*, sekaligus mengisi data pada tabel `profiles`.
- **Proteksi Akses (Role-Based Access Control):** Menu Manajemen Pengguna diamankan dan **HANYA** bisa diakses atau dilihat oleh pengguna dengan hak akses sebagai `admin`.

## 5. Perbaikan Bug & Antarmuka (Bugfixes)
- **Perbaikan CSS Login:** Memperbaiki masalah kontras pada tombol "*Sign In*" di halaman Login sehingga tulisannya bisa terbaca dengan jelas.
- **Stabilitas Webhook:** Menangani masalah parsing karakter `#` pada `TELEGRAM_WEBHOOK_SECRET` dengan mengubah struktur _secret_ dan memperbaiki validasi _update_id_ agar tidak memproses perintah duplikat.
- **Skema Database:** Penambahan kolom `photo_url` pada tabel `incidents` dan pembuatan bucket Storage baru.

---

*Catatan: Untuk rangkuman progres tanggal 6 Oktober 2026, silakan merujuk pada file [progress_summary 061026.md](progress_summary%20061026.md).*
