# **File 1 — `PRD.md`**

## **1\. Informasi Produk**

**Nama sementara:** Ultra Marathon Race Control

**Jenis produk:** Web application mobile-friendly

**Pengguna utama:** Race director, support team, marshal, koordinator kendaraan, dan administrator event.

**Tujuan utama:** Membantu tim operasional memantau status seluruh pelari dan tim relay dari start hingga finish secara terpusat, terstruktur, dan real-time.

**Platform:** Web desktop untuk command center dan web mobile untuk petugas lapangan serta pelari.

## **2\. Latar Belakang**

Perlombaan Jakarta–Bandung memiliki lima kategori relay:

* R1: satu pelari.  
* R2: dua pelari.  
* R4: empat pelari.  
* R8: delapan pelari.  
* R16: enam belas pelari.

Semakin besar jumlah relay, semakin kompleks kebutuhan pemantauan. Tim support perlu mengetahui:

* Posisi terakhir tim.  
* Pelari yang sedang aktif.  
* Checkpoint terakhir.  
* Waktu update lokasi.  
* Status pergantian pelari.  
* Tim yang terlambat atau tidak bergerak.  
* Tim yang membutuhkan bantuan.  
* Kondisi pelari sampai finish.

Masalah utama yang ingin diselesaikan adalah penyebaran informasi melalui chat, keterlambatan laporan, kesulitan mengetahui posisi terakhir, dan tidak adanya satu dashboard operasional yang menjadi sumber informasi bersama.

## **3\. Visi Produk**

Menyediakan satu pusat kendali digital yang membantu penyelenggara dan tim support memantau progres, keselamatan, komunikasi, dan status seluruh peserta ultra marathon secara cepat dan akurat.

## **4\. Misi Produk**

* Mengurangi ketergantungan pada laporan manual yang tersebar.  
* Menampilkan status seluruh tim dalam satu dashboard.  
* Memudahkan pencatatan checkpoint dan pergantian pelari.  
* Mempercepat identifikasi tim yang membutuhkan bantuan.  
* Menyediakan riwayat perlombaan yang dapat dievaluasi setelah event.  
* Menyediakan sistem fallback ketika GPS atau koneksi internet bermasalah.

## **5\. Tujuan Produk**

## **Tujuan MVP**

* Menyimpan data event, kategori, tim, pelari, dan checkpoint.  
* Menampilkan seluruh tim dalam dashboard operasional.  
* Menampilkan posisi terakhir pelari atau tim.  
* Menerima update lokasi dari web mobile dan Telegram.  
* Mencatat checkpoint secara manual.  
* Mencatat pergantian pelari.  
* Mencatat insiden dan kebutuhan bantuan.  
* Menampilkan alert data yang sudah tidak diperbarui.  
* Mencatat aktivitas penting dalam audit trail.

## **Tujuan non-fungsional**

* Dapat digunakan melalui smartphone.  
* Mudah dipelajari oleh petugas lapangan.  
* Tetap berguna ketika GPS tidak tersedia.  
* Memiliki kontrol akses berbasis peran.  
* Menyimpan waktu setiap update secara akurat.  
* Tidak menjadikan data lokasi publik secara default.

## **6\. Di Luar Ruang Lingkup MVP**

Fitur berikut tidak menjadi prioritas versi pertama:

* Aplikasi native Android atau iOS.  
* Integrasi perangkat GPS khusus.  
* Prediksi waktu finish berbasis machine learning.  
* Integrasi WhatsApp tidak resmi.  
* Sistem pembayaran peserta.  
* Modul pendaftaran peserta.  
* Livestream publik.  
* Sistem timing chip resmi.  
* Pelacakan kendaraan support secara otomatis.  
* Social feed atau komunitas pelari.

## **7\. Persona Pengguna**

## **Administrator**

Mengelola event, user, kategori, checkpoint, tim, pelari, dan konfigurasi sistem.

## **Race Director**

Memantau keseluruhan perlombaan, status tim, alert, insiden, dan kondisi operasional.

## **Support Coordinator**

Mengatur bantuan lapangan, kendaraan, konsumsi, komunikasi, dan tindak lanjut terhadap tim.

## **Marshal atau Checkpoint Officer**

Mencatat kedatangan, keberangkatan, pergantian pelari, dan kondisi tim di checkpoint.

## **Runner atau Team Captain**

Mengirim lokasi, memperbarui status, melakukan check-in, dan melaporkan kendala.

## **Viewer**

Melihat status terbatas tanpa hak mengubah data. Role ini dapat digunakan untuk pihak internal tertentu atau keluarga peserta jika dibutuhkan.

## **8\. Peran dan Hak Akses**

| Fitur | Admin | Race Director | Support | Marshal | Runner | Viewer |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| Melihat dashboard | Ya | Ya | Ya | Terbatas | Terbatas | Terbatas |
| Kelola event | Ya | Terbatas | Tidak | Tidak | Tidak | Tidak |
| Kelola tim | Ya | Ya | Terbatas | Tidak | Tidak | Tidak |
| Kelola pelari | Ya | Ya | Terbatas | Tidak | Profil sendiri | Tidak |
| Kelola checkpoint | Ya | Ya | Terbatas | Tidak | Tidak | Tidak |
| Input checkpoint | Ya | Ya | Ya | Ya | Terbatas | Tidak |
| Kirim lokasi | Ya | Ya | Ya | Ya | Ya | Tidak |
| Kelola insiden | Ya | Ya | Ya | Ya | Buat laporan | Tidak |
| Menutup insiden | Ya | Ya | Ya | Tidak | Tidak | Tidak |
| Melihat kontak darurat | Ya | Ya | Ya | Terbatas | Sendiri | Tidak |
| Export laporan | Ya | Ya | Ya | Tidak | Tidak | Tidak |

## **9\. User Stories**

## **Dashboard**

* Sebagai race director, saya ingin melihat semua tim dalam satu dashboard agar dapat mengetahui kondisi lomba secara umum.  
* Sebagai support coordinator, saya ingin memfilter tim berdasarkan kategori agar dapat fokus pada kelompok tertentu.  
* Sebagai operator, saya ingin melihat waktu update terakhir agar dapat membedakan posisi aktif dan data lama.  
* Sebagai pengguna, saya ingin melihat status tim dalam bentuk warna agar dapat memahami kondisi secara cepat.

## **Tim dan pelari**

* Sebagai admin, saya ingin membuat tim dengan kategori R1, R2, R4, R8, atau R16.  
* Sebagai admin, saya ingin menentukan urutan pelari relay.  
* Sebagai support coordinator, saya ingin mengetahui pelari yang sedang aktif.  
* Sebagai pelari, saya ingin mengirim lokasi dengan identitas yang benar.

## **Checkpoint**

* Sebagai marshal, saya ingin mencatat waktu kedatangan pelari.  
* Sebagai marshal, saya ingin mencatat waktu keberangkatan.  
* Sebagai marshal, saya ingin mencatat pergantian pelari.  
* Sebagai race director, saya ingin melihat checkpoint terakhir setiap tim.

## **Insiden**

* Sebagai pelari, saya ingin melaporkan cedera atau masalah teknis.  
* Sebagai support coordinator, saya ingin melihat daftar insiden yang belum diselesaikan.  
* Sebagai race director, saya ingin menetapkan tingkat urgensi insiden.  
* Sebagai petugas, saya ingin mencatat tindakan penyelesaian insiden.

## **Pelacakan**

* Sebagai operator, saya ingin melihat posisi terakhir pada peta.  
* Sebagai operator, saya ingin melihat sumber lokasi, apakah dari GPS, Telegram, atau input manual.  
* Sebagai operator, saya ingin menerima alert jika tim tidak mengirim lokasi selama periode tertentu.

## **10\. Status Tim**

Status utama:

* `not_started` — belum mulai.  
* `checked_in` — sudah check-in.  
* `running` — sedang berlomba.  
* `waiting_relay` — menunggu pergantian.  
* `resting` — sedang istirahat.  
* `attention` — perlu perhatian.  
* `emergency` — kondisi darurat.  
* `finished` — sudah finish.  
* `dnf` — tidak melanjutkan.  
* `unknown` — status belum dikonfirmasi.

## **11\. Status Pelari**

* Belum aktif.  
* Sedang berlari.  
* Selesai menjalankan leg.  
* Menunggu pergantian.  
* Istirahat.  
* Cedera.  
* Evakuasi.  
* Tidak terdeteksi.  
* Finish.

## **12\. Sumber Data Lokasi**

Sistem mendukung tiga sumber:

## **Web GPS**

Pelari membuka halaman mobile, memberikan izin lokasi, kemudian sistem mengirim koordinat berkala.

## **Telegram Bot**

Pelari atau support team mengirimkan lokasi melalui bot Telegram. Telegram Bot API menggunakan endpoint HTTPS untuk komunikasi bot dan menyediakan method lokasi untuk data geografis.[core.telegram](https://core.telegram.org/bots/api)

## **Input manual**

Petugas menginput posisi atau checkpoint secara manual ketika GPS atau Telegram tidak tersedia.

## **13\. Aturan Data Stale**

| Umur data | Status | Tampilan |
| ----- | ----- | ----- |
| 0–5 menit | Normal | Hijau |
| \>5–15 menit | Perlu dipantau | Kuning |
| \>15–30 menit | Warning | Oranye |
| \>30 menit | Tidak segar | Merah |
| Tidak pernah ada data | Belum terdeteksi | Abu-abu |

Batas waktu harus dapat dikonfigurasi oleh admin.

## **14\. Fitur MVP**

## **Autentikasi**

* Login email dan password.  
* Reset password.  
* Logout.  
* Pengelolaan role.  
* Perlindungan halaman berdasarkan role.

## **Manajemen event**

* Membuat event.  
* Mengubah detail event.  
* Menentukan waktu start.  
* Menentukan lokasi start dan finish.  
* Menentukan status event.  
* Menentukan aturan stale data.  
* Mengaktifkan atau menutup event.

## **Manajemen kategori**

Kategori bawaan:

* R1.  
* R2.  
* R4.  
* R8.  
* R16.

Admin dapat mengatur jumlah pelari per kategori.

## **Manajemen tim**

* Kode tim.  
* Nama tim.  
* Kategori.  
* Nama kapten.  
* Nomor kontak kapten.  
* Kendaraan support.  
* PIC support.  
* Status tim.  
* Catatan khusus.

## **Manajemen pelari**

* Nama.  
* Nomor telepon.  
* Urutan relay.  
* Kontak darurat.  
* Status.  
* Token perangkat.  
* Catatan kesehatan operasional yang relevan.

## **Manajemen checkpoint**

* Kode checkpoint.  
* Nama checkpoint.  
* Urutan.  
* Latitude.  
* Longitude.  
* Jarak dari start.  
* Nama petugas.  
* Catatan operasional.

## **Dashboard**

* Ringkasan jumlah tim.  
* Jumlah tim aktif.  
* Jumlah tim finish.  
* Jumlah warning.  
* Jumlah insiden terbuka.  
* Peta posisi.  
* Daftar status tim.  
* Filter kategori.  
* Filter status.  
* Filter checkpoint.  
* Pencarian kode atau nama tim.

## **Tracking lokasi**

* Menyimpan latitude.  
* Menyimpan longitude.  
* Menyimpan akurasi.  
* Menyimpan kecepatan.  
* Menyimpan level baterai jika tersedia.  
* Menyimpan sumber data.  
* Menyimpan waktu data diterima.  
* Menampilkan posisi terakhir.  
* Menampilkan usia data.

## **Checkpoint log**

* Tim.  
* Pelari.  
* Checkpoint.  
* Waktu tiba.  
* Waktu berangkat.  
* Status pergantian.  
* Catatan.  
* Petugas pencatat.

## **Incident management**

Jenis insiden:

* Cedera.  
* Kehilangan kontak.  
* Kendaraan bermasalah.  
* Kekurangan air atau makanan.  
* GPS bermasalah.  
* Pelari berhenti.  
* Tersesat atau keluar rute.  
* Permintaan penjemputan.  
* Lainnya.

Tingkat prioritas:

* Rendah.  
* Sedang.  
* Tinggi.  
* Darurat.

## **Audit trail**

Catat:

* User.  
* Aksi.  
* Data yang diubah.  
* Waktu.  
* Sumber aksi.  
* Catatan perubahan.

## **15\. Fitur Fase 2**

* Tracking GPS web yang lebih stabil.  
* Riwayat rute.  
* Geofencing checkpoint.  
* Perhitungan progres jarak.  
* Estimasi waktu tiba.  
* Alert baterai rendah.  
* Alert keluar koridor rute.  
* Notifikasi Telegram.  
* Export Excel.  
* Export PDF.  
* Mode offline checkpoint.  
* Dashboard layar besar command center.

## **16\. Fitur Fase 3**

* Aplikasi PWA yang dapat di-install.  
* Integrasi perangkat GPS khusus.  
* Integrasi WhatsApp Business API.  
* Prediksi waktu finish.  
* Pelacakan kendaraan support.  
* Portal publik terbatas.  
* Statistik performa relay.  
* Rekap pasca-event otomatis.  
* Multi-event management.  
* Dukungan multi-tenant untuk penyelenggara berbeda.

## **17\. Alur Utama**

## **Alur persiapan**

text  
`Admin membuat event`  
      `↓`  
`Admin membuat checkpoint`  
      `↓`  
`Admin mengimpor tim dan pelari`  
      `↓`  
`Admin mengatur role user`  
      `↓`  
`Runner atau captain menerima token tracking`  
      `↓`  
`Petugas melakukan briefing`

## **Alur perlombaan**

text  
`Tim check-in`  
      `↓`  
`Tim mulai`  
      `↓`  
`Runner mengirim lokasi`  
      `↓`  
`Dashboard menerima update`  
      `↓`  
`Tim tiba di checkpoint`  
      `↓`  
`Marshal mencatat kedatangan`  
      `↓`  
`Pergantian dicatat jika ada`  
      `↓`  
`Runner berikutnya mulai`  
      `↓`  
`Tim finish`  
      `↓`  
`Race director mengonfirmasi finish`

## **Alur insiden**

text  
`Runner atau petugas membuat laporan`  
      `↓`  
`Sistem memberi prioritas`  
      `↓`  
`Support coordinator menerima alert`  
      `↓`  
`PIC ditugaskan`  
      `↓`  
`Tindakan dilakukan`  
      `↓`  
`Insiden diperbarui`  
      `↓`  
`Race director menutup insiden`

## **18\. Acceptance Criteria MVP**

## **Dashboard**

* Dashboard menampilkan semua tim pada event aktif.  
* Filter kategori berfungsi.  
* Filter status berfungsi.  
* Posisi terakhir menampilkan waktu update.  
* Data stale diberi indikator visual.  
* Perubahan status terlihat tanpa refresh manual.

## **Data tim**

* Admin dapat membuat tim R1, R2, R4, R8, dan R16.  
* Jumlah pelari tidak boleh melebihi kapasitas kategori.  
* Urutan relay harus unik dalam satu tim.  
* Tim dapat memiliki satu atau lebih support PIC.

## **Checkpoint**

* Petugas dapat memilih tim dan checkpoint.  
* Sistem mencatat waktu server.  
* Sistem mencegah duplikasi log yang tidak valid.  
* Riwayat checkpoint dapat dilihat dari detail tim.

## **Tracking**

* Sistem dapat menerima koordinat valid.  
* Latitude harus berada antara \-90 dan 90\.  
* Longitude harus berada antara \-180 dan 180\.  
* Setiap lokasi memiliki timestamp.  
* Data lokasi memiliki sumber.  
* Posisi terakhir tim dapat ditampilkan.

## **Insiden**

* Insiden memiliki tipe dan tingkat prioritas.  
* Insiden terbuka terlihat di dashboard.  
* Insiden dapat ditugaskan kepada PIC.  
* Insiden memiliki status penyelesaian.

## **Security**

* User tanpa login tidak dapat membuka dashboard internal.  
* Runner hanya dapat mengirim lokasi sesuai tokennya.  
* Viewer tidak dapat mengubah data.  
* Service key tidak boleh dikirim ke browser.  
* Semua tabel exposed menggunakan RLS. Supabase merekomendasikan RLS di setiap tabel exposed, disertai grant dan policy yang sesuai.Memory

## **19\. Risiko Produk**

| Risiko | Dampak | Mitigasi |
| ----- | ----- | ----- |
| Sinyal internet buruk | Lokasi terlambat | Input manual dan queue lokal |
| Baterai habis | Tracking terputus | Indikator baterai dan power bank |
| Pelari lupa tracking | Data tidak tersedia | Reminder dan checkpoint manual |
| GPS meleset | Posisi tidak akurat | Simpan akurasi dan validasi manual |
| Operator terlalu banyak alert | Alert diabaikan | Prioritas dan deduplikasi |
| Data terlalu terbuka | Risiko privasi | Login, RLS, dan role |
| Salah memasukkan pelari | Tracking keliru | Token perangkat dan validasi |
| Dashboard terlalu kompleks | Lambat digunakan | Fokus pada status, timestamp, dan tindakan |

## **20\. KPI Produk**

* Persentase tim dengan update lokasi valid.  
* Waktu rata-rata sejak lokasi dikirim sampai tampil.  
* Jumlah tim tanpa update lebih dari 15 menit.  
* Waktu rata-rata penyelesaian insiden.  
* Persentase checkpoint yang tercatat.  
* Jumlah error input pelari.  
* Persentase tim yang finish dengan data lengkap.  
* Jumlah laporan manual dibandingkan laporan otomatis.

