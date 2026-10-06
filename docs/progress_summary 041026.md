# Rangkuman Progres Pengembangan: Ultra Marathon Tracking App
*Terakhir Diperbarui: 4 Oktober 2026*

Dokumen ini merangkum seluruh pencapaian dan fitur yang telah berhasil diimplementasikan dari awal proyek hingga saat ini.

## 1. Setup Infrastruktur & Fondasi Aplikasi
- **Tech Stack**: Next.js 15 (App Router), React 19, Tailwind CSS, TypeScript, dan shadcn/ui.
- **Database Backend**: Menggunakan Supabase (PostgreSQL).
- **Skema Database Utama**:
  - `profiles`: Data pengguna/admin.
  - `events` & `categories`: Master data perlombaan dan kategori (R1, R2, R4, dll).
  - `teams` & `runners`: Data tim dan urutan pelari relay.
  - `checkpoints`: Titik-titik pantau (WS) beserta radius *geofence*.
  - `runner_locations` & `incidents`: Pencatatan histori pergerakan dan kejadian darurat (SOS).
- **Keamanan**: Implementasi *Row Level Security* (RLS) di seluruh tabel Supabase untuk memastikan data hanya bisa dibaca/diubah oleh pihak yang berwenang (Admin/Sistem).

## 2. Autentikasi & Dashboard Admin
- **Halaman Login**: Terintegrasi dengan Supabase Auth.
- **Layout Dashboard**: *Sidebar* interaktif dan proteksi *middleware* agar *Dashboard* hanya bisa diakses oleh *User* yang sudah *Login*.
- **Halaman Ringkasan (Dashboard)**: Menampilkan metrik utama seperti Total Tim, Tim yang sedang berjalan (*Running*), Tim yang sudah selesai (*Finished*), dan Indikator Data Usang (*Stale Data Warning*).

## 3. Fitur Utama (Phase 6 & 7) - Web GPS Tracking
- **Web Tracker untuk Pelari**: 
  - Dibangun halaman khusus di `/tracking/[token]` yang akan diakses pelari dari *browser* HP mereka.
  - Halaman ini menggunakan `navigator.geolocation.watchPosition` (HTML5) untuk melacak titik GPS secara terus-menerus.
- **API Sinkronisasi**: 
  - Membuat *endpoint* `/api/tracking/location` yang menerima koordinat GPS dan menyimpannya ke tabel `runner_locations`.
  - Endpoint menggunakan *Service Role Key* (`createAdminClient`) untuk mengizinkan sistem merekam data meskipun pelari tidak memiliki *session login* secara publik (Bypass RLS dengan aman).

## 4. Fitur Utama (Phase 8) - Telegram Bot Integration
- **Webhook Telegram**: Membangun *endpoint* `/api/telegram/webhook` untuk memproses *chat* dari Marshal di lapangan.
- **Sistem Anti-Duplikasi**: Membuat tabel `telegram_updates` untuk memastikan perintah Telegram yang sama tidak dieksekusi dua kali (*idempotent*).
- **Perintah yang Didukung**:
  - `/start <kode>`: Menautkan akun Telegram marshal/pelari ke sistem.
  - `/checkin <tim> <pos>`: Mencatat kedatangan tim di Checkpoint.
  - `/relay <tim> <pos>`: Mencatat pergantian pelari di sistem (status pelari lama menjadi *completed*, pelari baru menjadi *running*).
  - `/sos <pesan>`: Melaporkan status darurat (Incident) beserta koordinat yang akan menyalakan alarm di *Dashboard Admin*.

## 5. Fitur Utama (Phase 9) - Master Data Management
- Membangun halaman *Listing* dan *Formulir Pembuatan* (Create) untuk 4 entitas utama:
  1. **Events** (`/events/create`)
  2. **Teams** (`/teams/create`)
  3. **Runners** (`/runners/create`)
  4. **Checkpoints** (`/checkpoints/create`)
- **Validasi Zod & Server Actions**: Seluruh input diamankan dengan skema Zod (Next.js 19 standard) dan diproses melalui Server Actions (`lib/admin-actions.ts`).
- **Quick Actions (Aksi Cepat)**:
  - **Ubah Status Event & Tim**: Terdapat *dropdown* di tabel `Events` dan `Teams` untuk mempermudah admin mengganti status secara *real-time* (DRAFT -> LIVE, atau NOT_STARTED -> RUNNING).
  - **Generate GPS Link**: Menambahkan tombol di halaman `Runners` untuk men-*generate* link pelacakan unik (`/tracking/[token]`) yang bisa langsung di-*copy* dan dikirim ke pelari via WhatsApp.

---

### Tindakan Selanjutnya (Untuk Sesi Mendatang)
1. **Penyempurnaan Peta (Live Map)**: Memastikan titik-titik pelari muncul secara dinamis dan ikon/warna berubah sesuai dengan status kedaluwarsa (*stale*) di peta *Race Control*.
2. **Deployment (Vercel)**: Mendaftarkan Webhook URL sesungguhnya ke server API Telegram (saat ini sistem lokal `localhost` belum bisa menerima Webhook Telegram secara langsung tanpa bantuan *ngrok* atau *tunnel*).
3. **Pengujian End-to-End**: Melakukan simulasi penuh dari mulai event LIVE -> pelari klik Link GPS -> pelari lari -> marshal lapor di Telegram -> pergantian di Checkpoint -> Finish.
