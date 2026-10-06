# Buku Panduan Penggunaan Sistem Ultra Marathon Race Control & Tracking

Buku panduan ini disusun sebagai petunjuk teknis operasional bagi seluruh pihak yang terlibat dalam penyelenggaraan perlombaan Ultra Marathon: **Administrator, Race Director, Marshal di Lapangan, dan Pelari (Runners)**.

---

## DAFTAR ISI
1. [Tentang Sistem & Peran Pengguna](#1-tentang-sistem--peran-pengguna)
2. [Panduan untuk Pelari (Runners)](#2-panduan-untuk-pelari-runners)
   - [A. Pelacakan Melalui Web GPS Tracker (Browser HP)](#a-pelacakan-melalui-web-gps-tracker-browser-hp)
   - [B. Pelacakan Melalui Bot Telegram](#b-pelacakan-melalui-bot-telegram)
3. [Panduan untuk Marshal & Panitia Pos](#3-panduan-untuk-marshal--panitia-pos)
   - [A. Mencatat Waktu Kedatangan di Checkpoint](#a-mencatat-waktu-kedatangan-di-checkpoint)
   - [B. Mencatat Pergantian Pelari (Serah Terima Estafet)](#b-mencatat-pergantian-pelari-serah-terima-estafet)
4. [Panduan untuk Race Director & Administrator](#4-panduan-untuk-race-director--administrator)
   - [A. Monitoring Live Tracking Map](#a-monitoring-live-tracking-map)
   - [B. Pengelolaan Insiden & Keadaan Darurat (SOS)](#b-pengelolaan-insiden--keadaan-darurat-sos)
   - [C. Manajemen Pelari & Override Status Manual](#c-manajemen-pelari--override-status-manual)
   - [D. Manajemen Master Data (Event, Tim, Checkpoints, Users)](#d-manajemen-master-data-event-tim-checkpoints-users)
5. [Tanya Jawab & Troubleshooting (FAQ)](#5-tanya-jawab--troubleshooting-faq)

---

## 1. Tentang Sistem & Peran Pengguna

Sistem Ultra Marathon Race Control adalah platform pelacakan real-time berbasis web untuk memantau pergerakan pelari beregu (relay), mencatat waktu di setiap pos checkpoint, serta mengelola keadaan darurat secara cepat.

### Pembagian Hak Akses (Roles)
| Role | Akses Menu | Tanggung Jawab Utama |
| :--- | :--- | :--- |
| **Admin** | Seluruh Menu Termasuk `/users` | Konfigurasi sistem, tambah panitia, kelola master data |
| **Race Director** | Dashboard, Map, Teams, Runners, Checkpoints, Logs, Incidents | Komando utama perlombaan, monitoring rute & keselamatan |
| **Support Coordinator** | Dashboard, Map, Incidents, Checkpoint Logs | Penanganan laporan medis, logistik, dan insiden |
| **Marshal** | Checkpoint Logs, Incidents, Map | Pencatatan waktu di pos lintasan & lapor insiden lapangan |
| **Runner (Pelari)** | Halaman Khusus `/tracking/[token]` & Bot Telegram | Mengirim GPS, menekan tombol start/finish, lapor darurat |

---

## 2. Panduan untuk Pelari (Runners)

Pelari dapat dilacak menggunakan salah satu dari dua metode: **Web GPS Tracker** atau **Bot Telegram**.

### A. Pelacakan Melalui Web GPS Tracker (Browser HP)
Setiap pelari akan menerima link pelacakan unik dari panitia (contoh: `https://domain-app/tracking/abc123token`).

1. **Membuka Aplikasi:**
   - Buka link pelacakan di browser Chrome atau Safari di ponsel Anda.
2. **Izin Lokasi (GPS):**
   - Saat browser meminta izin: pilih **"Allow" / "Izinkan Saat Menggunakan Aplikasi"**.
   - Pastikan GPS ponsel diatur ke mode akurasi tinggi (*High Accuracy*).
3. **Mulai Berlari (Tombol START):**
   - Tekan tombol hijau **"START"** sesaat sebelum Anda mulai berlari pada leg giliran Anda.
   - Sistem akan otomatis mengirimkan koordinat awal keberangkatan ke server.
4. **Selesai Berlari (Tombol FINISH):**
   - Begitu Anda tiba di pos pergantian dan menyerahkan estafet ke pelari berikutnya, tekan tombol merah **"FINISH"**.
   - Lokasi akhir Anda akan terekam dan status Anda berganti menjadi selesai leg.
5. **Mengirim Laporan Darurat / SOS:**
   - Jika mengalami cedera, kram, atau kehabisan logistik di jalur:
   - Tekan tombol **"🚨 Kirim SOS / Laporan"**.
   - Ketik pesan singkat kendala Anda (contoh: *"Kram parah di KM 22, butuh medis"*).
   - Lampirkan foto kejadian jika memungkinkan.
   - Tekan **Kirim**. Laporan beserta koordinat Anda akan langsung membunyikan alarm di dashboard panitia.

---

### B. Pelacakan Melalui Bot Telegram
Alternatif pelacakan yang sangat hemat baterai dan tahan di latar belakang ponsel.

1. **Menghubungkan Akun (Pairing):**
   - Buka bot Telegram yang ditentukan panitia (misal: `@PlayOnTrackerBot`).
   - Tekan tombol **Start** atau ketik:  
     `/start <KODE_PAIRING>`  
     *(Kode pairing dibagikan oleh panitia sebelum lomba).*
   - Bot akan membalas: *"Berhasil terhubung! Halo [Nama Anda]..."*
2. **Mengaktifkan Live Location:**
   - Tekan tombol klip lampiran (📎) di chat bot $\rightarrow$ Pilih **Location** $\rightarrow$ Pilih **Share My Live Location for...** $\rightarrow$ Pilih durasi (misal: **1 Hour** atau **8 Hours**).
   - Bot akan membalas konfirmasi bahwa Live Location aktif.
   - Peta Live Tracking panitia akan langsung memantau pergerakan Anda secara *real-time*.
3. **Mengirim Foto atau Laporan SOS via Telegram:**
   - Cukup kirim pesan teks atau foto langsung ke obrolan bot Telegram.
   - Untuk keadaan darurat prioritas tinggi, awali pesan dengan kata `/sos` (contoh: `/sos pelari cedera di turunan`).

---

## 3. Panduan untuk Marshal & Panitia Pos

Marshal bertugas mencatat kedatangan dan serah terima pelari di pos lintasan melalui menu **Checkpoint Logs** (`/checkpoint-logs`).

### A. Mencatat Waktu Kedatangan di Checkpoint
Gunakan **Tab Checkpoint** saat tim pelari tiba di pos pemeriksaan (*Water Station*):

1. Masuk ke menu **Checkpoint Logs**.
2. Di formulir **Pencatatan cepat**, pilih tab **Checkpoint**.
3. **Pilih Tim** (misal: `PlayOn-R16`).
4. **Otomatisasi Sistem:**
   - Nama pelari yang saat ini bertugas otomatis terpilih.
   - Pos checkpoint berikutnya otomatis diusulkan oleh sistem.
   - Kolom **Waktu tiba (WIB)** otomatis terisi waktu saat ini.
5. *(Opsional)* Isi kolom **Waktu berangkat (WIB)** saat pelari melanjutkan lari dan tambahkan **Catatan** bila ada hal khusus.
6. Tekan tombol **"Catat checkpoint"**.
7. Data akan langsung masuk ke tabel riwayat dan tervalidasi.

> **PENTING:** Waktu kedatangan tidak boleh diisi dengan tanggal atau jam di masa depan (*future time*). Gunakan waktu saat ini atau sesuaikan mundur jika terlambat menginput.

---

### B. Mencatat Pergantian Pelari (Serah Terima Estafet)
Gunakan **Tab Pergantian relay** saat terjadi serah terima tongkat estafet antar pelari:

1. Pilih tab **Pergantian relay**.
2. **Pilih Tim** dan **Pilih Checkpoint** tempat serah terima terjadi.
3. **Pelari Keluar (Outgoing Runner):** Otomatis terisi pelari yang sedang aktif membawa tongkat.
4. **Pelari Masuk (Next Runner):** Pilih nama pelari berikutnya yang akan menerima tongkat dan melanjutkan rute.
5. Periksa waktu pergantian.
6. Tekan tombol **"Catat Pergantian"**.
7. **Hasil Otomatis:**
   - Pelari lama otomatis ditandai `completed_leg`.
   - Pelari baru otomatis ditandai `running`.
   - Nama pelari di **Live Tracking Map** dan **Dashboard** langsung diperbarui.

---

## 4. Panduan untuk Race Director & Administrator

### A. Monitoring Live Tracking Map (`/map`)
Peta pelacak menampilkan situasi lomba secara visual dan *real-time*:

* **Arti Warna Pin Tim:**
  * **Hijau:** Tim sedang berlari (*Running*).
  * **Kuning:** Tim sedang bersiap estafet di pos (*Waiting Relay*).
  * **Biru:** Tim telah menyelesaikan seluruh rute lomba (*Finished*).
  * **Merah / Oranye:** Tim sedang dalam penanganan insiden darurat (*Attention / Emergency*).
* **Peringatan Hilang Sinyal (Stale Warning):**
  * Jika titik tim berubah menjadi **abu-abu dengan garis tepi merah**, artinya posisi GPS pelari tidak terbarui selama **lebih dari 15 menit**. Panitia wajib menghubungi pelari atau tim pendamping untuk mengecek baterai atau sinyal.
* **Fitur Anti-Overlap:**
  * Jika beberapa tim berada di titik kordinat yang persis sama (misal di garis Start), titik-titik tersebut otomatis memisahkan diri membentuk formasi melingkar sehingga nomor tim tetap terlihat jelas.

---

### B. Pengelolaan Insiden & Keadaan Darurat (SOS) (`/incidents`)
Setiap kali ada laporan SOS dari Telegram atau Web GPS:

1. Notifikasi darurat akan langsung muncul di **Dashboard** dan menu **Incidents**.
2. Klik insiden untuk membuka **Detail Insiden**.
3. **Melihat Titik Lokasi Kejadian:**
   - Klik tombol **"📍 Buka di Live Map"**: Peta internal akan langsung terbang (*flyTo*) ke titik lokasi kejadian dengan penanda berkedip merah (`🚨 Lokasi Kejadian`).
   - Klik tombol **"↗ Google Maps"**: Membuka rute jalan di aplikasi Google Maps untuk tim evakuasi/ambulans.
4. **Melihat Foto Bukti:**
   - Foto kondisi lapangan yang dikirim pelari langsung ditampilkan di bagian lampiran.
5. **Menugaskan PIC & Update Status:**
   - Race Director / Support Coordinator dapat menugaskan staf penanggung jawab (**PIC**) dan mengubah status tiket insiden dari `open` $\rightarrow$ `investigating` $\rightarrow$ `resolved`.

---

### C. Manajemen Pelari & Override Status Manual (`/runners`)
Jika terjadi kondisi khusus di lapangan (misal pelari lupa menekan tombol FINISH atau ponsel mati):

1. Masuk ke menu **Runners**.
2. Cari nama pelari yang bersangkutan.
3. Di kolom status, admin dapat langsung memilih status baru melalui dropdown instan (`not_started`, `running`, `completed_leg`, `finished`).
4. **Kirim Link Tracker:** Tekan tombol tautan di sebelah nama pelari untuk menyalin URL pelacak Web GPS pelari tersebut.

---

### D. Manajemen Master Data (Admin Only)
* **Events (`/events`):** Mengatur nama perlombaan, tanggal pelaksanaan, dan mengubah status event (`draft` $\rightarrow$ `ready` $\rightarrow$ `live` $\rightarrow$ `finished`).
* **Teams (`/teams`):** Mendaftarkan kode tim (PlayOn-R16, R8, R4), nama tim, dan kategori lomba.
* **Checkpoints (`/checkpoints`):** Mengelola titik pos pemeriksaan, koordinat (Latitude & Longitude), jarak kumulatif (KM), dan status aktif.
* **Users (`/users`):** Mendaftarkan akun login panitia baru beserta peran masing-masing (*role*).

---

## 5. Tanya Jawab & Troubleshooting (FAQ)

### Q1: Mengapa muncul pesan error *"Input tidak valid: arrival time is in the future"*?
> **Jawaban:** Jam atau tanggal kedatangan yang Anda masukkan melebihi jam server saat ini. Pastikan tidak memilih tanggal di masa depan saat melakukan uji coba sistem.

### Q2: Mengapa pelari sudah membagikan Live Location di Telegram tetapi posisinya belum muncul di peta?
> **Jawaban:** 
> 1. Pastikan pelari sudah melakukan pairing akun dengan perintah `/start <kode>` sebelum membagikan lokasi.
> 2. Pastikan pelari memilih **"Share My Live Location"** (berdurasi 1 jam/8 jam), bukan hanya mengirim pin lokasi statis.
> 3. Pastikan izin GPS di aplikasi Telegram ponsel diatur ke *"Always Allow"* agar tetap aktif saat layar ponsel terkunci.

### Q3: Bagaimana urutan pelari pertama ditentukan untuk R16, R8, dan R4?
> **Jawaban:** Sistem membaca nomor urut estafet (**Relay Order #1**) di data pelari. Begitu Anda memilih tim di menu Checkpoint Logs, sistem otomatis memuat nama pelari nomor 1 tanpa perlu Anda pilih manual.

### Q4: Apakah pelari perlu menginstal aplikasi khusus dari Play Store / App Store?
> **Jawaban:** Tidak perlu. Pelari cukup menggunakan browser standar (Chrome/Safari) untuk Web GPS Tracker, atau menggunakan aplikasi Telegram yang sudah terpasang di ponsel mereka.
