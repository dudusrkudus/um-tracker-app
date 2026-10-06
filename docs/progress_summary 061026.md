# Progress Summary - 6 Oktober 2026

Berikut adalah ringkasan lengkap fitur baru, penyempurnaan sistem, dan perbaikan bug yang berhasil diselesaikan pada sistem **Ultra Marathon Race Control** pada hari ini:

---

## 1. Antarmuka Mobile & Navigasi Pengguna (Mobile UI/UX)
- **Menu Navigasi Bawah (Mobile Bottom Nav):**
  - Menambahkan komponen navigasi bawah khusus layar ponsel/tablet kecil (`components/navigation/MobileBottomNav.tsx`) dengan 6 menu utama: **Dashboard, Live Map, Tim, Pelari, Checkpoint, dan Insiden**.
  - Menyembunyikan sidebar desktop di layar kecil dan menyajikan navigasi bawah yang ramah sentuhan dengan indikator rute aktif.
- **Optimalisasi Dashboard Metrics:**
  - Merampingkan kartu statistik ringkasan di halaman Dashboard utama (`/dashboard`) menjadi format kompak 1 baris 5 kolom sehingga tidak memakan ruang vertikal di layar ponsel maupun desktop.
- **Perbaikan Autentikasi Login:**
  - Mengatasi error Next.js runtime *"An unexpected response was received from the server"* pada `/login` dengan memperbarui konfigurasi `middleware.ts` untuk meloloskan request header `next-action` dan memisahkan state login interaktif.

---

## 2. Penyempurnaan Telegram Bot & Live Location Real-Time
- **Dukungan Penuh Telegram Live Location (`edited_message`):**
  - Mengatasi masalah di mana pembaruan live location berkala dari pelari diabaikan oleh server. Telegram mengirimkan pergerakan live location sebagai payload `edited_message`, yang kini diproses secara otomatis ke tabel `runner_locations` dan `teams`.
  - Menggunakan field `edit_date` untuk menjaga kebaruan stempel waktu (*timestamp*) koordinat GPS.
- **Notifikasi Konfirmasi Pintar:**
  - Bot Telegram kini mengirimkan pesan konfirmasi satu kali saat pelari pertama kali mengaktifkan Live Location:
    > *"📍 Live Location aktif (X menit)! Posisi Anda terhubung real-time ke Live Tracking Map."*
  - Pembaruan koordinat berikutnya saat pelari bergerak berjalan hening (*silent*) di latar belakang agar tidak mengganggu layar obrolan pelari.
- **Perbaikan Stabilitas Pairing Telegram:**
  - Mengatasi error `PGRST116 (JSON object requested, multiple rows returned)` saat pelari memasukkan kode `/start <kode>` dengan menambahkan logika pembersihan pairing lama dan pembatasan query baris tunggal.

---

## 3. Perekaman Lokasi Insiden & Navigasi Peta Interaktif
- **Otomatis Menangkap Lokasi Terakhir Pelari/Tim:**
  - Jika pelari mengirimkan laporan insiden atau foto via Telegram / Web GPS tanpa menyertakan titik GPS langsung, sistem sekarang otomatis mengambil koordinat tracking terakhir dari tabel `runner_locations` atau `teams.last_known_latitude / longitude`.
  - Jika pelari mengirimkan pin lokasi setelah membuat laporan insiden, sistem otomatis melengkapi koordinat pada tiket insiden terbuka tersebut.
- **Tampilan Interaktif di Halaman Detail Insiden (`/incidents/[id]`):**
  - Menampilkan angka koordinat GPS lengkap beserta label penanda (misal: *Perkiraan - Posisi Terakhir Tim*).
  - Dilengkapi 2 tombol navigasi langsung:
    1. 📍 **Buka di Live Map**: Membuka peta internal `/map`, otomatis terbang (*flyTo*) dan zoom ke titik kejadian.
    2. ↗ **Google Maps**: Membuka titik koordinat di Google Maps pada tab browser baru.
- **Efek Penanda Insiden pada Live Tracking Map:**
  - Komponen `TrackingMap.tsx` kini mendukung parameter URL `lat`, `lng`, dan `incident`.
  - Saat dibuka dari detail insiden, peta menampilkan penanda khusus berkedip merah (🚨) lengkap dengan jendela popup keterangan insiden.

---

## 4. Modul Checkpoint Logs & Master Data Checkpoints
- **Aktivasi 17 Checkpoint Rute Resmi:**
  - Mengaktifkan seluruh master checkpoint dari **START (Kemdiktisaintek, Senayan)** hingga **WS15 (Cibabat Park, Cimahi)** menjadi berstatus `is_active: true`.
- **Formulir Pencatatan Cepat Aktif Penuh (`/checkpoint-logs`):**
  - **Tab Checkpoint**: Mencatat waktu kedatangan (*Arrived At*) dan keberangkatan (*Departed At*) tim di pos pemeriksaan. Sistem otomatis mendeteksi pelari aktif (#1 saat awal lomba) dan mengusulkan pos berikutnya.
  - **Tab Pergantian Relay**: Mencatat serah-terima estafet antar pelari di pos pergantian. Pelari lama otomatis ditandai `completed_leg` dan pelari baru otomatis aktif menjadi `running`.
- **Pembaruan Query Resilien:**
  - Halaman `checkpoint-logs` diperbarui agar tetap menampilkan checkpoint aktif secara konsisten.

---

## 5. Live Tracking Map Real-Time & Fast Polling
- **Stabilisasi Koneksi Supabase Realtime:**
  - Memoisasi instance klien Supabase browser (`useMemo`) di `TrackingMapClient.tsx` untuk mencegah putus-nyambung koneksi websocket.
  - Menambahkan pemantauan tabel `runner_locations` pada kanal websocket realtime.
- **Fast Polling Fallback (4 Detik):**
  - Mempercepat interval penyegaran cadangan dari 15 detik menjadi **4 detik**, memastikan pergerakan pin tim selalu segar dan mulus di layar race control.
