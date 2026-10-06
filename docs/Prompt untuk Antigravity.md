Anda adalah senior full-stack engineer dan product engineer.

Bangun aplikasi web mobile-friendly bernama “Ultra Marathon Race Control” untuk membantu tim support memantau perlombaan ultra marathon Jakarta–Bandung dengan kategori R1, R2, R4, R8, dan R16.

Gunakan:  
\- Next.js App Router  
\- React  
\- TypeScript  
\- Tailwind CSS  
\- shadcn/ui  
\- Supabase Auth  
\- Supabase PostgreSQL  
\- PostGIS  
\- Supabase Realtime  
\- MapLibre GL JS  
\- Telegram Bot API  
\- Zod  
\- React Hook Form  
\- TanStack Table  
\- Vitest  
\- Playwright

Gunakan dokumen PRD.md dan TECH\_SPEC.md sebagai sumber kebenaran utama.

Prioritas utama:  
1\. Dashboard operasional untuk race director dan support team.  
2\. Manajemen event, kategori, tim, pelari, dan checkpoint.  
3\. Tracking posisi terakhir pelari atau tim.  
4\. Input lokasi melalui web GPS, Telegram, dan manual.  
5\. Checkpoint logging.  
6\. Pergantian pelari relay.  
7\. Incident management.  
8\. Status stale jika lokasi tidak diperbarui.  
9\. Role-based access.  
10\. Audit trail.  
11\. Mobile-friendly interface.  
12\. Realtime update.

Jangan membangun semua fitur sekaligus. Implementasikan secara bertahap dan berhenti setelah setiap phase selesai untuk memastikan aplikasi dapat dijalankan.

PHASE 1 — Setup:  
\- Buat project Next.js dengan TypeScript.  
\- Buat struktur folder yang rapi.  
\- Buat Supabase browser client, server client, dan admin client.  
\- Buat authentication.  
\- Buat protected dashboard layout.  
\- Buat .env.example.  
\- Pastikan secret key tidak pernah dikirim ke browser.  
\- Buat README instalasi.

PHASE 2 — Database:  
\- Buat migration untuk profiles, events, categories, teams, runners, checkpoints, runner\_locations, checkpoint\_logs, incidents, audit\_logs, telegram\_connections, dan notification\_events.  
\- Aktifkan PostGIS.  
\- Buat seed R1, R2, R4, R8, R16.  
\- Buat updated\_at triggers.  
\- Aktifkan RLS untuk semua tabel exposed.  
\- Buat policy berdasarkan role.  
\- Buat pgTAP RLS tests untuk allow dan deny.  
\- Generate database types.

PHASE 3 — Master data:  
\- Buat CRUD event.  
\- Buat CRUD team.  
\- Buat CRUD runner.  
\- Buat CRUD checkpoint.  
\- Terapkan validasi kapasitas kategori.  
\- Terapkan validasi urutan relay yang unik.  
\- Buat loading, empty, error, dan success state.

PHASE 4 — Dashboard:  
\- Buat dashboard race control.  
\- Tampilkan summary: total tim, running, finished, stale, open incidents.  
\- Buat filter kategori, status, checkpoint, dan freshness.  
\- Buat team cards dan operational table.  
\- Tampilkan last location time dan source.  
\- Buat detail team.  
\- Buat freshness badge:  
  fresh, warning, stale, critical, never.  
\- Gunakan warna yang aksesibel dan jangan hanya mengandalkan warna.

PHASE 5 — Map:  
\- Integrasikan MapLibre GL JS.  
\- Tampilkan marker posisi terakhir.  
\- Tampilkan checkpoint.  
\- Tampilkan route placeholder yang dapat dikonfigurasi.  
\- Marker harus memiliki warna berdasarkan status.  
\- Popup marker menampilkan team code, active runner, status, dan last update.  
\- Pastikan map tidak gagal total apabila API map key belum tersedia.

PHASE 6 — Checkpoint dan incident:  
\- Buat form checkpoint log.  
\- Buat form relay change.  
\- Buat incident creation.  
\- Buat incident list dan detail.  
\- Dukung severity low, medium, high, emergency.  
\- Dukung status open, acknowledged, in\_progress, resolved, cancelled.  
\- Buat assignment PIC.  
\- Buat audit log untuk perubahan penting.

PHASE 7 — Web GPS:  
\- Buat halaman tracking mobile dengan tracking token.  
\- Gunakan navigator.geolocation.watchPosition.  
\- Kirim latitude, longitude, accuracy, speed, heading, battery jika tersedia, dan recorded\_at.  
\- Buat endpoint POST /api/tracking/location.  
\- Validasi semua input dengan Zod.  
\- Tambahkan rate limiting.  
\- Tolak token invalid dan runner inactive.  
\- Simpan source sebagai web\_gps.  
\- Update last known location pada team.

PHASE 8 — Telegram:  
\- Buat POST /api/telegram/webhook.  
\- Implementasikan pairing code.  
\- Simpan telegram\_user\_id dan chat\_id.  
\- Dukung /start, /help, /status, /location, /checkin, /relay, dan /sos.  
\- Terima location object dari Telegram.  
\- Validasi webhook secret.  
\- Cegah duplicate update\_id.  
\- Simpan source sebagai telegram.  
\- Jangan gunakan nama Telegram sebagai satu-satunya identitas runner.

PHASE 9 — Realtime:  
\- Untuk MVP gunakan Supabase Postgres Changes.  
\- Subscribe ke teams, runner\_locations, checkpoint\_logs, dan incidents.  
\- Buat abstraction agar dapat berpindah ke Broadcast private channel pada fase berikutnya.  
\- Jangan mengirim seluruh histori lokasi melalui realtime.  
\- Pastikan hanya user berizin yang menerima event.

PHASE 10 — Quality:  
\- Buat unit tests untuk validasi, freshness, permissions, dan Telegram parsing.  
\- Buat integration tests untuk location endpoint, checkpoint, incident, dan webhook.  
\- Buat Playwright test untuk login, membuat team, mengirim lokasi, melihat marker, membuat checkpoint, dan menyelesaikan incident.  
\- Buat RLS tests untuk anon, authenticated, admin, support, marshal, runner, dan viewer.  
\- Jalankan lint, typecheck, test, dan build.  
\- Perbaiki semua error sebelum melanjutkan.

Aturan coding:  
\- Gunakan TypeScript strict.  
\- Gunakan server components secara default.  
\- Gunakan client components hanya jika memerlukan interaksi browser.  
\- Jangan memasukkan service role key ke client.  
\- Semua mutasi harus divalidasi.  
\- Semua operasi penting harus memiliki audit log.  
\- Gunakan UTC pada database dan tampilkan Asia/Jakarta pada UI.  
\- Sediakan loading, empty, error, dan offline state.  
\- Jangan gunakan data dummy pada production flow.  
\- Gunakan soft delete atau status inactive untuk data penting.  
\- Jangan membuat fitur di luar PRD sebelum MVP selesai.

Pada akhir setiap phase:  
1\. Tampilkan file yang dibuat atau diubah.  
2\. Tampilkan command yang harus dijalankan.  
3\. Tampilkan hasil test.  
4\. Tampilkan risiko atau keputusan teknis.  
5\. Tunggu persetujuan sebelum melanjutkan phase berikutnya.  



Catatan Implementasi Penting
Mulailah dari Phase 1 sampai Phase 4 sebelum mengerjakan GPS dan Telegram. Dengan urutan tersebut, Anda akan memiliki fondasi data, role, dashboard, dan alur operasional terlebih dahulu. Setelah itu, integrasi lokasi dapat ditambahkan tanpa mengubah struktur produk secara besar-besaran.

Untuk versi awal saat perlombaan berlangsung, kombinasi dashboard + checkpoint manual + Telegram location sebaiknya dianggap sebagai jalur utama, sedangkan web GPS menjadi fitur tambahan karena browser mobile dapat terpengaruh oleh baterai, izin lokasi, dan aktivitas background.