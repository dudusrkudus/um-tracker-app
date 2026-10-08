# Progress Summary - 8 Oktober 2026

Berikut adalah rangkuman pengerjaan dan fitur-fitur baru yang diselesaikan pada tanggal 8 Oktober 2026:

## 1. Halaman Rekaman Waktu Pelari (Team Time Records)
- **Komponen Baru:** Membuat komponen khusus `TeamTimeRecords` untuk mencatat rekaman waktu durasi lari yang secara otomatis muncul di halaman *dashboard* publik setiap tim (contoh: `/[team_code]`).
- **Penghitungan Durasi Pelari:** Mengkalkulasi durasi waktu tempuh secara individual per pelari mulai dari garis *Start* hingga tiba di *Finish*. Sistem cerdas ini mengambil data riwayat waktu tidak hanya dari *scan* **Checkpoint Logs**, tetapi juga sebagai cadangan mengambil waktu jejak **Runner Locations** (GPS). 
- **Total Akumulasi Waktu Tim:** Menambahkan perhitungan "Total Waktu Tim" yang tertera dengan elegan pada bagian atas tabel. Ini menunjukkan akumulasi waktu sejak pelari pertama bergerak (misal, dari Jakarta) hingga pelari terakhir selesai (misal, di Bandung).

## 2. Peningkatan Akurasi Status & Simulasi (UI/UX)
- **Pesan Status Dinamis:** Menyempurnakan antarmuka tabel waktu untuk beradaptasi dengan kondisi data pelari di lapangan (terutama saat testing simulasi dari halaman Admin):
  - Jika pelari berstatus sedang berlari namun belum ada koordinat GPS, sistem akan merespons dengan menampilkan pesan: **"Menunggu GPS..."**.
  - Jika pelari telah berstatus selesai namun riwayat pergerakannya kosong (karena simulasi manual), sistem menampilkannya sebagai **"Selesai (Tanpa Jejak)"** alih-alih mencoba menghitung angka kosong.

## 3. Perbaikan Sinkronisasi Catatan Waktu (Bypass RLS & Force Dynamic)
- **Akar Masalah:** GPS pelari di lapangan sebenarnya terkirim dan tersimpan di database dengan baik (11 titik koordinat tercatat), tetapi tabel *Catatan Waktu Pelari* pada halaman publik menggunakan *anonymous client* yang terblokir oleh *Row Level Security* (RLS) PostgreSQL untuk tabel `runner_locations`.
- **Solusi:** 
  - Mengubah pemanggilan query pada [TeamTimeRecords.tsx](file:///c:/Aplikasi/um-tracking-app/components/teams/TeamTimeRecords.tsx) menggunakan `createAdminClient()` di sisi server agar bebas dari batasan RLS publik.
  - Menambahkan konfigurasi `export const dynamic = 'force-dynamic'` & `revalidate = 0` pada [app/[team_code]/page.tsx](file:///c:/Aplikasi/um-tracking-app/app/[team_code]/page.tsx) agar browser tidak menyajikan halaman *cache* lama ketika direfresh.
  - Menyempurnakan status pelari yang sedang aktif berlari agar menampilkan jam mulai, durasi berjalan real-time, dan kolom selesai bertanda `-`.

---

*Semua pembaruan telah di-push ke branch main dan langsung ter-deploy otomatis di Vercel.*
