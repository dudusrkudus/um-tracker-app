# **File 2 — `TECH_SPEC.md`**

## **1\. Ringkasan Teknis**

Aplikasi dibangun sebagai web application mobile-friendly dengan arsitektur:

text  
`Next.js Frontend`  
      `↓`  
`Next.js Server Actions / Route Handlers`  
      `↓`  
`Supabase Auth + PostgreSQL + PostGIS`  
      `↓`  
`Supabase Realtime`  
      `↓`  
`Dashboard Live Map`

Sumber data eksternal:

text  
`Telegram Bot`  
      `↓`  
`Telegram Webhook`  
      `↓`  
`Next.js Route Handler atau Supabase Edge Function`  
      `↓`  
`Validasi token dan payload`  
      `↓`  
`runner_locations`

Supabase Realtime mendukung Broadcast, Presence, dan Postgres Changes. Untuk MVP, Postgres Changes lebih sederhana, sedangkan Broadcast lebih disarankan untuk skala dan keamanan yang lebih baik.Memory

## **2\. Stack Teknologi**

| Area | Teknologi |
| ----- | ----- |
| Frontend | Next.js App Router |
| UI | React |
| Bahasa | TypeScript |
| Styling | Tailwind CSS |
| Komponen | shadcn/ui |
| Backend | Next.js Route Handlers dan Supabase |
| Database | Supabase PostgreSQL |
| Geospatial | PostGIS |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |
| Map | MapLibre GL JS |
| Bot | Telegram Bot API |
| Validasi | Zod |
| Form | React Hook Form |
| Table | TanStack Table |
| Testing | Vitest, Playwright |
| Deployment | Vercel atau VPS |
| Monitoring | Sentry atau logging provider |
| Storage | Supabase Storage bila diperlukan |

## **3\. Prinsip Arsitektur**

* Gunakan server-side access untuk operasi sensitif.  
* Jangan pernah menaruh service role key di browser.  
* Gunakan Supabase Auth untuk autentikasi.  
* Gunakan RLS untuk pembatasan row.  
* Gunakan route handler untuk webhook Telegram.  
* Simpan raw webhook event untuk debugging terbatas.  
* Pisahkan data operasional dan data audit.  
* Gunakan UTC di database.  
* Tampilkan waktu dalam zona waktu Asia/Jakarta.  
* Semua endpoint harus memiliki validasi input.  
* Semua lokasi harus mempunyai timestamp server.

## **4\. Struktur Folder**

text  
`ultra-marathon-tracker/`  
`├── app/`  
`│   ├── (auth)/`  
`│   │   ├── login/`  
`│   │   │   └── page.tsx`  
`│   │   └── forgot-password/`  
`│   │       └── page.tsx`  
`│   ├── (dashboard)/`  
`│   │   ├── layout.tsx`  
`│   │   ├── dashboard/`  
`│   │   │   └── page.tsx`  
`│   │   ├── teams/`  
`│   │   │   ├── page.tsx`  
`│   │   │   └── [teamId]/`  
`│   │   │       └── page.tsx`  
`│   │   ├── runners/`  
`│   │   │   └── page.tsx`  
`│   │   ├── checkpoints/`  
`│   │   │   └── page.tsx`  
`│   │   ├── incidents/`  
`│   │   │   └── page.tsx`  
`│   │   ├── reports/`  
`│   │   │   └── page.tsx`  
`│   │   └── settings/`  
`│   │       └── page.tsx`  
`│   ├── tracking/`  
`│   │   ├── [token]/`  
`│   │   │   └── page.tsx`  
`│   │   └── page.tsx`  
`│   └── api/`  
`│       ├── telegram/`  
`│       │   └── webhook/`  
`│       │       └── route.ts`  
`│       ├── tracking/`  
`│       │   └── location/`  
`│       │       └── route.ts`  
`│       └── health/`  
`│           └── route.ts`  
`├── components/`  
`│   ├── dashboard/`  
`│   ├── teams/`  
`│   ├── runners/`  
`│   ├── checkpoints/`  
`│   ├── incidents/`  
`│   ├── maps/`  
`│   ├── forms/`  
`│   └── ui/`  
`├── lib/`  
`│   ├── supabase/`  
`│   │   ├── browser.ts`  
`│   │   ├── server.ts`  
`│   │   └── admin.ts`  
`│   ├── auth/`  
`│   ├── validations/`  
`│   ├── tracking/`  
`│   ├── telegram/`  
`│   ├── permissions/`  
`│   └── utils/`  
`├── types/`  
`│   ├── database.ts`  
`│   ├── domain.ts`  
`│   └── api.ts`  
`├── supabase/`  
`│   ├── migrations/`  
`│   ├── functions/`  
`│   │   └── telegram-webhook/`  
`│   └── tests/`  
`├── public/`  
`├── .env.example`  
`├── package.json`  
`├── README.md`  
`└── middleware.ts`

## **5\. Database Design**

## **5.1 `profiles`**

Menyimpan data pengguna aplikasi.

sql  
`create table public.profiles (`  
  `id uuid primary key references auth.users(id) on delete cascade,`  
  `full_name text not null,`  
  `phone text,`  
  `role text not null check (`  
    `role in (`  
      `'admin',`  
      `'race_director',`  
      `'support_coordinator',`  
      `'marshal',`  
      `'runner',`  
      `'viewer'`  
    `)`  
  `),`  
  `is_active boolean not null default true,`  
  `created_at timestamptz not null default now(),`  
  `updated_at timestamptz not null default now()`  
`);`

## **5.2 `events`**

sql  
`create table public.events (`  
  `id uuid primary key default gen_random_uuid(),`  
  `name text not null,`  
  `event_date date not null,`  
  `timezone text not null default 'Asia/Jakarta',`  
  `start_name text,`  
  `start_latitude double precision,`  
  `start_longitude double precision,`  
  `finish_name text,`  
  `finish_latitude double precision,`  
  `finish_longitude double precision,`  
  `status text not null default 'draft' check (`  
    `status in ('draft', 'ready', 'live', 'paused', 'completed', 'cancelled')`  
  `),`  
  `stale_warning_minutes integer not null default 15,`  
  `stale_critical_minutes integer not null default 30,`  
  `created_by uuid references public.profiles(id),`  
  `created_at timestamptz not null default now(),`  
  `updated_at timestamptz not null default now()`  
`);`

## **5.3 `categories`**

sql  
`create table public.categories (`  
  `id uuid primary key default gen_random_uuid(),`  
  `code text not null unique check (code in ('R1', 'R2', 'R4', 'R8', 'R16')),`  
  `runner_capacity integer not null check (runner_capacity > 0),`  
  `created_at timestamptz not null default now()`  
`);`

Seed data:

sql  
`insert into public.categories (code, runner_capacity)`  
`values`  
  `('R1', 1),`  
  `('R2', 2),`  
  `('R4', 4),`  
  `('R8', 8),`  
  `('R16', 16);`

## **5.4 `teams`**

sql  
`create table public.teams (`  
  `id uuid primary key default gen_random_uuid(),`  
  `event_id uuid not null references public.events(id) on delete cascade,`  
  `category_id uuid not null references public.categories(id),`  
  `team_code text not null,`  
  `team_name text not null,`  
  `captain_name text,`  
  `captain_phone text,`  
  `support_vehicle text,`  
  `support_pic text,`  
  `status text not null default 'not_started' check (`  
    `status in (`  
      `'not_started',`  
      `'checked_in',`  
      `'running',`  
      `'waiting_relay',`  
      `'resting',`  
      `'attention',`  
      `'emergency',`  
      `'finished',`  
      `'dnf',`  
      `'unknown'`  
    `)`  
  `),`  
  `last_known_latitude double precision,`  
  `last_known_longitude double precision,`  
  `last_location_at timestamptz,`  
  `last_location_source text,`  
  `created_at timestamptz not null default now(),`  
  `updated_at timestamptz not null default now(),`  
  `unique (event_id, team_code)`  
`);`

## **5.5 `runners`**

sql  
`create table public.runners (`  
  `id uuid primary key default gen_random_uuid(),`  
  `team_id uuid not null references public.teams(id) on delete cascade,`  
  `user_id uuid references public.profiles(id),`  
  `full_name text not null,`  
  `phone text,`  
  `relay_order integer not null check (relay_order > 0),`  
  `emergency_contact_name text,`  
  `emergency_contact_phone text,`  
  `status text not null default 'not_started' check (`  
    `status in (`  
      `'not_started',`  
      `'running',`  
      `'completed_leg',`  
      `'waiting_relay',`  
      `'resting',`  
      `'injured',`  
      `'evacuated',`  
      `'not_detected',`  
      `'finished'`  
    `)`  
  `),`  
  `tracking_token_hash text,`  
  `is_tracking_enabled boolean not null default false,`  
  `created_at timestamptz not null default now(),`  
  `updated_at timestamptz not null default now(),`  
  `unique (team_id, relay_order)`  
`);`

## **5.6 `checkpoints`**

sql  
`create table public.checkpoints (`  
  `id uuid primary key default gen_random_uuid(),`  
  `event_id uuid not null references public.events(id) on delete cascade,`  
  `code text not null,`  
  `name text not null,`  
  `sequence_no integer not null,`  
  `distance_km numeric(8,2),`  
  `latitude double precision not null,`  
  `longitude double precision not null,`  
  `geofence_radius_m integer not null default 100,`  
  `is_active boolean not null default true,`  
  `created_at timestamptz not null default now(),`  
  `unique (event_id, code),`  
  `unique (event_id, sequence_no)`  
`);`

## **5.7 `runner_locations`**

sql  
`create table public.runner_locations (`  
  `id bigint generated always as identity primary key,`  
  `event_id uuid not null references public.events(id) on delete cascade,`  
  `team_id uuid not null references public.teams(id) on delete cascade,`  
  `runner_id uuid references public.runners(id) on delete set null,`  
  `latitude double precision not null check (latitude between -90 and 90),`  
  `longitude double precision not null check (longitude between -180 and 180),`  
  `accuracy_m numeric(10,2),`  
  `speed_kmh numeric(10,2),`  
  `heading numeric(6,2),`  
  `battery_level integer check (battery_level between 0 and 100),`  
  `source text not null check (`  
    `source in ('web_gps', 'telegram', 'manual', 'checkpoint', 'import')`  
  `),`  
  `recorded_at timestamptz not null,`  
  `received_at timestamptz not null default now(),`  
  `metadata jsonb not null default '{}'::jsonb`  
`);`

Index yang diperlukan:

sql  
`create index runner_locations_team_time_idx`  
`on public.runner_locations (team_id, recorded_at desc);`

`create index runner_locations_event_time_idx`  
`on public.runner_locations (event_id, recorded_at desc);`

`create index runner_locations_source_idx`  
`on public.runner_locations (source);`

## **5.8 `checkpoint_logs`**

sql  
`create table public.checkpoint_logs (`  
  `id uuid primary key default gen_random_uuid(),`  
  `event_id uuid not null references public.events(id) on delete cascade,`  
  `checkpoint_id uuid not null references public.checkpoints(id),`  
  `team_id uuid not null references public.teams(id) on delete cascade,`  
  `runner_id uuid references public.runners(id) on delete set null,`  
  `arrived_at timestamptz not null,`  
  `departed_at timestamptz,`  
  `relay_changed boolean not null default false,`  
  `next_runner_id uuid references public.runners(id) on delete set null,`  
  `notes text,`  
  `recorded_by uuid not null references public.profiles(id),`  
  `created_at timestamptz not null default now()`  
`);`

## **5.9 `incidents`**

sql  
`create table public.incidents (`  
  `id uuid primary key default gen_random_uuid(),`  
  `event_id uuid not null references public.events(id) on delete cascade,`  
  `team_id uuid references public.teams(id) on delete set null,`  
  `runner_id uuid references public.runners(id) on delete set null,`  
  `type text not null check (`  
    `type in (`  
      `'injury',`  
      `'lost_contact',`  
      `'vehicle_problem',`  
      `'supplies',`  
      `'gps_problem',`  
      `'stopped',`  
      `'off_route',`  
      `'pickup_request',`  
      `'other'`  
    `)`  
  `),`  
  `severity text not null default 'medium' check (`  
    `severity in ('low', 'medium', 'high', 'emergency')`  
  `),`  
  `status text not null default 'open' check (`  
    `status in ('open', 'acknowledged', 'in_progress', 'resolved', 'cancelled')`  
  `),`  
  `description text not null,`  
  `latitude double precision,`  
  `longitude double precision,`  
  `assigned_to uuid references public.profiles(id),`  
  `reported_by uuid references public.profiles(id),`  
  `reported_at timestamptz not null default now(),`  
  `resolved_at timestamptz,`  
  `resolution_notes text,`  
  `created_at timestamptz not null default now(),`  
  `updated_at timestamptz not null default now()`  
`);`

## **5.10 `audit_logs`**

sql  
`create table public.audit_logs (`  
  `id bigint generated always as identity primary key,`  
  `actor_id uuid references public.profiles(id),`  
  `action text not null,`  
  `entity_type text not null,`  
  `entity_id text,`  
  `old_data jsonb,`  
  `new_data jsonb,`  
  `source text,`  
  `created_at timestamptz not null default now()`  
`);`

## **5.11 `telegram_connections`**

sql  
`create table public.telegram_connections (`  
  `id uuid primary key default gen_random_uuid(),`  
  `telegram_user_id text not null unique,`  
  `telegram_chat_id text,`  
  `runner_id uuid references public.runners(id) on delete cascade,`  
  `team_id uuid references public.teams(id) on delete cascade,`  
  `is_active boolean not null default true,`  
  `connected_at timestamptz not null default now(),`  
  `last_message_at timestamptz`  
`);`

## **5.12 `notification_events`**

sql  
`create table public.notification_events (`  
  `id bigint generated always as identity primary key,`  
  `event_id uuid references public.events(id) on delete cascade,`  
  `team_id uuid references public.teams(id) on delete cascade,`  
  `incident_id uuid references public.incidents(id) on delete cascade,`  
  `type text not null,`  
  `channel text not null check (`  
    `channel in ('in_app', 'telegram', 'email')`  
  `),`  
  `message text not null,`  
  `status text not null default 'pending' check (`  
    `status in ('pending', 'sent', 'failed', 'cancelled')`  
  `),`  
  `sent_at timestamptz,`  
  `error_message text,`  
  `created_at timestamptz not null default now()`  
`);`

## **6\. Relasi Database**

text  
`events`  
 `├── categories`  
 `├── teams`  
 `│    ├── runners`  
 `│    ├── runner_locations`  
 `│    ├── checkpoint_logs`  
 `│    └── incidents`  
 `├── checkpoints`  
 `└── notification_events`

`profiles`  
 `├── runner profile`  
 `├── checkpoint_logs.recorded_by`  
 `├── incidents.reported_by`  
 `├── incidents.assigned_to`  
 `└── audit_logs.actor_id`

## **7\. Role Authorization**

Buat helper function:

sql  
`create or replace function public.has_role(required_role text)`  
`returns boolean`  
`language sql`  
`stable`  
`security definer`  
`set search_path = ''`  
`as $$`  
  `select exists (`  
    `select 1`  
    `from public.profiles`  
    `where id = (select auth.uid())`  
      `and role = required_role`  
      `and is_active = true`  
  `);`  
`$$;`

Untuk akses yang membutuhkan beberapa role:

sql  
`create or replace function public.has_any_role(required_roles text[])`  
`returns boolean`  
`language sql`  
`stable`  
`security definer`  
`set search_path = ''`  
`as $$`  
  `select exists (`  
    `select 1`  
    `from public.profiles`  
    `where id = (select auth.uid())`  
      `and role = any(required_roles)`  
      `and is_active = true`  
  `);`  
`$$;`

Pastikan function `security definer` tidak diletakkan sembarangan pada schema yang terbuka dan selalu menggunakan `set search_path = ''`. Supabase juga menekankan bahwa key dengan hak bypass RLS hanya boleh digunakan di server, bukan di browser.Memory

## **8\. RLS Policy Strategy**

Semua tabel di schema `public` wajib mengaktifkan RLS.

## **Prinsip umum**

* `anon` tidak boleh membaca data internal.  
* User authenticated dapat membaca data sesuai event dan role.  
* Admin dan race director dapat membaca hampir semua data operasional.  
* Support dapat membaca dan memperbarui data operasional yang diperlukan.  
* Marshal dapat membaca tim dan membuat checkpoint log.  
* Runner hanya dapat membaca profil serta mengirim lokasi miliknya.  
* Viewer hanya dapat membaca data yang secara eksplisit diizinkan.  
* Service role hanya digunakan oleh server-side process.

Supabase menyarankan policy terpisah untuk operasi `SELECT`, `INSERT`, `UPDATE`, dan `DELETE`, serta pengujian RLS dengan test database.Memory

Contoh policy untuk tabel `events`:

sql  
`alter table public.events enable row level security;`

`revoke all on table public.events from anon;`  
`grant select on table public.events to authenticated;`  
`grant insert, update, delete on table public.events to authenticated;`

`create policy "staff can view events"`  
`on public.events`  
`for select`  
`to authenticated`  
`using (`  
  `public.has_any_role(`  
    `array['admin', 'race_director', 'support_coordinator', 'marshal', 'viewer']`  
  `)`  
`);`

`create policy "admin can create events"`  
`on public.events`  
`for insert`  
`to authenticated`  
`with check (`  
  `public.has_any_role(array['admin'])`  
`);`

`create policy "admin or director can update events"`  
`on public.events`  
`for update`  
`to authenticated`  
`using (`  
  `public.has_any_role(array['admin', 'race_director'])`  
`)`  
`with check (`  
  `public.has_any_role(array['admin', 'race_director'])`  
`);`

## **9\. API Contract**

## **`POST /api/tracking/location`**

Menerima lokasi dari web mobile.

Request:

json  
`{`  
  `"trackingToken": "runner-token",`  
  `"latitude": -6.9175,`  
  `"longitude": 107.6191,`  
  `"accuracyM": 12.4,`  
  `"speedKmh": 8.2,`  
  `"heading": 180.4,`  
  `"batteryLevel": 73,`  
  `"recordedAt": "2026-10-04T08:30:00.000Z"`  
`}`

Response sukses:

json  
`{`  
  `"success": true,`  
  `"locationId": 12345,`  
  `"receivedAt": "2026-10-04T08:30:04.000Z"`  
`}`

Validasi:

* Token wajib ada.  
* Token harus valid.  
* Pelari harus aktif.  
* Event harus berstatus `live`.  
* Latitude valid.  
* Longitude valid.  
* Timestamp tidak boleh terlalu jauh di masa depan.  
* Rate limit berdasarkan token.  
* Jangan menerima lokasi dari runner yang sudah `finished` atau `dnf`.

## **`POST /api/telegram/webhook`**

Menerima update Telegram.

Alur:

text  
`Telegram update`  
      `↓`  
`Validasi secret webhook`  
      `↓`  
`Identifikasi telegram_user_id`  
      `↓`  
`Cari telegram_connections`  
      `↓`  
`Parse location atau command`  
      `↓`  
`Validasi runner dan event`  
      `↓`  
`Insert runner_locations`  
      `↓`  
`Update teams.last_known_*`  
      `↓`  
`Broadcast update`  
      `↓`  
`Kirim balasan Telegram`

Command minimum:

text  
`/start`  
`/help`  
`/status`  
`/location`  
`/checkin`  
`/relay`  
`/sos`

Contoh format pesan lokasi:

text  
`/location TEAM-R8-014`

Namun, jika Telegram mengirim object `location`, gunakan latitude dan longitude yang diberikan API daripada memproses teks manual.

## **`POST /api/checkpoints/log`**

Request:

json  
`{`  
  `"eventId": "event-uuid",`  
  `"teamId": "team-uuid",`  
  `"checkpointId": "checkpoint-uuid",`  
  `"runnerId": "runner-uuid",`  
  `"arrivedAt": "2026-10-04T08:45:00.000Z",`  
  `"departedAt": null,`  
  `"relayChanged": true,`  
  `"nextRunnerId": "runner-uuid",`  
  `"notes": "Pergantian normal"`  
`}`

## **`POST /api/incidents`**

Request:

json  
`{`  
  `"eventId": "event-uuid",`  
  `"teamId": "team-uuid",`  
  `"runnerId": "runner-uuid",`  
  `"type": "injury",`  
  `"severity": "high",`  
  `"description": "Pelari mengalami kram berat",`  
  `"latitude": -6.8,`  
  `"longitude": 107.4`  
`}`

## **`PATCH /api/incidents/:id`**

Untuk:

* Mengakui insiden.  
* Menugaskan PIC.  
* Mengubah status.  
* Menambahkan catatan penyelesaian.  
* Menutup insiden.

## **10\. Realtime Design**

## **MVP**

Gunakan Postgres Changes untuk:

* Update `teams`.  
* Insert `runner_locations`.  
* Insert `checkpoint_logs`.  
* Insert dan update `incidents`.

Contoh subscription:

ts  
`const channel = supabase`  
  ``.channel(`event:${eventId}`)``  
  `.on(`  
    `'postgres_changes',`  
    `{`  
      `event: '*',`  
      `schema: 'public',`  
      `table: 'teams',`  
      ``filter: `event_id=eq.${eventId}`,``  
    `},`  
    `(payload) => {`  
      `refreshTeam(payload);`  
    `}`  
  `)`  
  `.subscribe();`

Postgres Changes lebih sederhana untuk implementasi awal, tetapi Supabase menyebut Broadcast sebagai opsi yang lebih baik untuk skalabilitas dan keamanan.Memory

## **Fase lanjutan**

Gunakan Broadcast private channel untuk update posisi frekuensi tinggi:

text  
`private:event:<event_id>:locations`  
`private:event:<event_id>:incidents`  
`private:event:<event_id>:operations`

Broadcast sebaiknya mengirim payload ringan:

json  
`{`  
  `"type": "location_updated",`  
  `"teamId": "team-uuid",`  
  `"runnerId": "runner-uuid",`  
  `"latitude": -6.9175,`  
  `"longitude": 107.6191,`  
  `"recordedAt": "2026-10-04T08:30:00.000Z",`  
  `"source": "web_gps"`  
`}`

Jangan mengirim seluruh histori lokasi melalui Realtime. Simpan histori di database dan hanya broadcast perubahan terbaru.

## **11\. Location Tracking Strategy**

## **Web GPS**

Gunakan browser Geolocation API:

ts  
`navigator.geolocation.watchPosition(`  
  `(position) => {`  
    `const payload = {`  
      `latitude: position.coords.latitude,`  
      `longitude: position.coords.longitude,`  
      `accuracyM: position.coords.accuracy,`  
      `speedKmh: position.coords.speed`  
        `? position.coords.speed * 3.6`  
        `: null,`  
      `heading: position.coords.heading,`  
      `recordedAt: new Date(position.timestamp).toISOString(),`  
    `};`

    `sendLocation(payload);`  
  `},`  
  `(error) => {`  
    `handleLocationError(error);`  
  `},`  
  `{`  
    `enableHighAccuracy: true,`  
    `maximumAge: 30000,`  
    `timeout: 20000,`  
  `}`  
`);`

Pertimbangkan interval pengiriman:

* Normal: setiap 30–60 detik.  
* Kecepatan rendah: setiap 60–120 detik.  
* Saat halaman aktif: sesuai konfigurasi.  
* Hindari pengiriman terlalu sering untuk menghemat baterai dan biaya.

## **Validasi lokasi**

Tolak atau tandai:

* Akurasi lebih buruk dari threshold.  
* Lonjakan jarak tidak masuk akal.  
* Timestamp terlalu lama.  
* Timestamp masa depan.  
* Lokasi di luar area event secara ekstrem.  
* Duplikasi koordinat berulang tanpa perubahan status.

Jangan langsung menghapus data mencurigakan. Simpan dengan flag metadata agar dapat diaudit.

## **12\. Perhitungan Status Stale**

Buat fungsi:

ts  
`function getLocationFreshness(`  
  `lastLocationAt: string | null,`  
  `warningMinutes: number,`  
  `criticalMinutes: number`  
`) {`  
  `if (!lastLocationAt) {`  
    `return 'never';`  
  `}`

  `const ageMinutes =`  
    `(Date.now() - new Date(lastLocationAt).getTime()) / 60000;`

  `if (ageMinutes <= 5) return 'fresh';`  
  `if (ageMinutes <= warningMinutes) return 'warning';`  
  `if (ageMinutes <= criticalMinutes) return 'stale';`  
  `return 'critical';`  
`}`

Status freshness sebaiknya dihitung dari `last_location_at`, bukan hanya dari status tim.

## **13\. Dashboard UI Specification**

## **Layout desktop**

text  
`┌─────────────────────────────────────────────────────────────┐`  
`│ Header: Event | Live Status | User | Clock                  │`  
`├─────────────┬───────────────────────────┬───────────────────┤`  
`│ Filter       │                           │ Alert Panel       │`  
`│ Categories   │                           │ Open incidents    │`  
`│ Status       │          Live Map         │ Stale teams       │`  
`│ Checkpoint   │                           │ Emergency         │`  
`├─────────────┴───────────────────────────┴───────────────────┤`  
`│ Team Cards / Operational Table                              │`  
`└─────────────────────────────────────────────────────────────┘`

## **Layout mobile**

text  
`┌──────────────────────────┐`  
`│ Event header             │`  
`│ Live / Alerts            │`  
`├──────────────────────────┤`  
`│ Summary cards            │`  
`├──────────────────────────┤`  
`│ Filter                   │`  
`├──────────────────────────┤`  
`│ Team list                │`  
`├──────────────────────────┤`  
`│ Bottom navigation        │`  
`└──────────────────────────┘`

## **Komponen utama**

* `EventHeader`  
* `RaceSummaryCards`  
* `CategoryFilter`  
* `StatusFilter`  
* `LiveMap`  
* `TeamList`  
* `TeamCard`  
* `TeamDetailDrawer`  
* `AlertPanel`  
* `IncidentList`  
* `CheckpointLogForm`  
* `RunnerStatusBadge`  
* `FreshnessBadge`  
* `LocationSourceBadge`  
* `EmergencyActionButton`

## **14\. Team Detail Page**

Isi halaman:

* Kode dan nama tim.  
* Kategori.  
* Status.  
* Pelari aktif.  
* Daftar seluruh pelari berdasarkan urutan.  
* Posisi terakhir.  
* Waktu update.  
* Sumber lokasi.  
* Checkpoint terakhir.  
* Riwayat checkpoint.  
* Riwayat lokasi.  
* Insiden terkait.  
* Kontak kapten.  
* Kontak support PIC.  
* Tombol ubah status.  
* Tombol catat checkpoint.  
* Tombol buat insiden.

## **15\. Peta**

Fitur peta:

* Marker tim.  
* Warna marker berdasarkan status.  
* Cluster marker jika jumlah banyak.  
* Rute utama.  
* Checkpoint marker.  
* Popup detail singkat.  
* Filter marker berdasarkan kategori.  
* Filter marker berdasarkan freshness.  
* Center map ke tim tertentu.  
* Panel legenda.

Data marker minimal:

ts  
`type TeamMarker = {`  
  `teamId: string;`  
  `teamCode: string;`  
  `category: string;`  
  `latitude: number;`  
  `longitude: number;`  
  `status: string;`  
  `freshness: string;`  
  `lastLocationAt: string | null;`  
  `activeRunnerName: string | null;`  
`};`

## **16\. Telegram Integration**

## **Environment variables**

text  
`TELEGRAM_BOT_TOKEN=`  
`TELEGRAM_WEBHOOK_SECRET=`  
`TELEGRAM_WEBHOOK_URL=`

## **Webhook security**

Gunakan secret path atau header secret token:

text  
`POST /api/telegram/webhook/<secret>`

Atau gunakan header:

text  
`X-Telegram-Bot-Api-Secret-Token`

## **Connection flow**

text  
`Admin membuat koneksi runner`  
      `↓`  
`Sistem membuat pairing code`  
      `↓`  
`Runner mengirim /start <pairing_code>`  
      `↓`  
`Bot membaca telegram_user_id`  
      `↓`  
`Sistem menyimpan hubungan runner dan Telegram`  
      `↓`  
`Runner dapat mengirim lokasi`

Jangan menghubungkan akun hanya berdasarkan nama Telegram. Gunakan pairing code sekali pakai.

## **17\. Notification Rules**

## **Alert lokasi**

* Tidak ada lokasi selama 15 menit: warning.  
* Tidak ada lokasi selama 30 menit: critical.  
* Baterai kurang dari 20%: warning.  
* Baterai kurang dari 10%: critical.

## **Alert operasional**

* Tim belum berangkat sesuai jadwal.  
* Tim belum tiba di checkpoint sesuai estimasi.  
* Pelari menekan SOS.  
* Insiden severity `high` atau `emergency`.  
* Tim keluar koridor rute.

Untuk MVP, notification cukup masuk ke dashboard. Telegram notification dapat ditambahkan setelah alur data stabil.

## **18\. Background Jobs**

Diperlukan job periodik untuk:

* Mengidentifikasi tim stale.  
* Membuat notification event.  
* Mengirim reminder.  
* Membersihkan temporary pairing code.  
* Mengarsipkan event lama.  
* Menghasilkan rekap berkala.

Contoh logika:

text  
`Setiap 1 menit:`  
  `Ambil event berstatus live`  
  `Ambil tim dengan last_location_at lama`  
  `Jika melewati threshold dan belum ada alert:`  
      `buat notification_event`  
      `broadcast alert`

Gunakan cron provider, Supabase scheduled function, atau scheduler dari hosting.

## **19\. Audit Trail**

Aksi berikut wajib dicatat:

* Membuat atau mengubah tim.  
* Mengubah status tim.  
* Mengubah status pelari.  
* Mencatat checkpoint.  
* Membuat insiden.  
* Mengubah tingkat insiden.  
* Menutup insiden.  
* Mengubah checkpoint.  
* Mengubah role user.  
* Menghubungkan akun Telegram.  
* Menghapus atau membatalkan data operasional.

## **20\. Error Handling**

Kategori error:

* `AUTH_REQUIRED`  
* `FORBIDDEN`  
* `INVALID_INPUT`  
* `INVALID_LOCATION`  
* `INVALID_TRACKING_TOKEN`  
* `EVENT_NOT_LIVE`  
* `RUNNER_NOT_ACTIVE`  
* `RATE_LIMITED`  
* `TELEGRAM_NOT_CONNECTED`  
* `DUPLICATE_CHECKPOINT_LOG`  
* `INTERNAL_ERROR`

Format response:

json  
`{`  
  `"success": false,`  
  `"error": {`  
    `"code": "INVALID_LOCATION",`  
    `"message": "Koordinat lokasi tidak valid"`  
  `}`  
`}`

## **21\. Rate Limiting**

Minimum rate limit:

* Endpoint lokasi: maksimal 1 request per 15–30 detik per token.  
* Webhook Telegram: validasi update ID agar tidak diproses dua kali.  
* Login: gunakan proteksi bawaan Supabase Auth.  
* Incident creation: batasi duplikasi laporan.  
* Export: batasi request per user.

## **22\. Offline Strategy**

## **MVP minimum**

* Form checkpoint menampilkan status koneksi.  
* Jika koneksi terputus, tampilkan pesan bahwa data belum tersimpan.  
* Jangan memberikan indikasi sukses sebelum server mengonfirmasi.

## **Fase 2**

Gunakan IndexedDB untuk menyimpan:

* Checkpoint log.  
* Status pergantian.  
* Insiden.  
* Lokasi terakhir.

Saat koneksi kembali:

text  
`Ambil data lokal`  
      `↓`  
`Urutkan berdasarkan waktu`  
      `↓`  
`Kirim ke server`  
      `↓`  
`Server melakukan idempotency check`  
      `↓`  
`Tandai data sebagai synced`

## **23\. Testing Strategy**

## **Unit test**

Uji:

* Validasi koordinat.  
* Perhitungan freshness.  
* Validasi kategori dan kapasitas.  
* Perhitungan status tim.  
* Parsing pesan Telegram.  
* Permission helper.  
* Format waktu.

## **Integration test**

Uji:

* Insert lokasi.  
* Update posisi terakhir tim.  
* Checkpoint log.  
* Pembuatan insiden.  
* Telegram webhook.  
* Realtime subscription.  
* RLS policy.

## **End-to-end test**

Skenario minimum:

1. Admin login.  
2. Admin membuat event.  
3. Admin membuat tim R8.  
4. Admin menambahkan delapan pelari.  
5. Runner pairing dengan Telegram.  
6. Runner mengirim lokasi.  
7. Dashboard menampilkan marker.  
8. Marshal membuat checkpoint log.  
9. Support membuat insiden.  
10. Race director menutup insiden.  
11. Tim ditandai finish.

Supabase menyarankan pengujian RLS dengan skenario allow dan deny untuk setiap operasi penting.Memory

## **24\. Observability**

Log minimum:

* Request ID.  
* User ID.  
* Event ID.  
* Team ID.  
* Endpoint.  
* Response status.  
* Duration.  
* Error code.  
* Telegram update ID.  
* Location source.

Dashboard monitoring:

* Jumlah lokasi per menit.  
* Jumlah webhook gagal.  
* Jumlah error validasi.  
* Jumlah tim stale.  
* Jumlah insiden terbuka.  
* Latensi realtime.

## **25\. Environment Variables**

text  
`NEXT_PUBLIC_APP_URL=`  
`NEXT_PUBLIC_SUPABASE_URL=`  
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=`  
`SUPABASE_SECRET_KEY=`

`TELEGRAM_BOT_TOKEN=`  
`TELEGRAM_WEBHOOK_SECRET=`  
`TELEGRAM_WEBHOOK_URL=`

`NEXT_PUBLIC_MAP_STYLE_URL=`  
`NEXT_PUBLIC_MAPTILER_KEY=`

`SENTRY_DSN=`  
`CRON_SECRET=`

`SUPABASE_SECRET_KEY` hanya boleh digunakan pada server-side code. Jangan memasukkannya ke komponen client atau file yang diekspos ke browser.

## **26\. Deployment**

## **Supabase**

* Buat project production.  
* Aktifkan PostGIS.  
* Jalankan migration.  
* Jalankan seed kategori.  
* Aktifkan RLS.  
* Jalankan RLS tests.  
* Konfigurasi Realtime.  
* Buat storage bucket jika dibutuhkan.  
* Konfigurasi backup dan retention.

## **Next.js**

* Deploy ke Vercel atau VPS.  
* Masukkan environment variables.  
* Konfigurasi domain.  
* Aktifkan HTTPS.  
* Konfigurasi cron job.  
* Konfigurasi monitoring.

## **Telegram**

* Buat bot melalui BotFather.  
* Simpan bot token di server.  
* Register webhook HTTPS.  
* Aktifkan secret token webhook.  
* Uji command `/start`, `/help`, dan pengiriman lokasi.

## **27\. Tahapan Implementasi untuk Antigravity**

## **Phase 1 — Project setup**

Deliverables:

* Next.js App Router.  
* TypeScript.  
* Tailwind.  
* shadcn/ui.  
* Supabase client.  
* Auth layout.  
* Environment configuration.  
* Basic navigation.  
* README.

Acceptance criteria:

* Project dapat dijalankan lokal.  
* Login dapat digunakan.  
* Protected route berfungsi.  
* Tidak ada secret key di client.

## **Phase 2 — Database**

Deliverables:

* Semua migration.  
* Seed kategori.  
* Trigger updated timestamp.  
* RLS policy.  
* RLS tests.  
* Generated database types.

Acceptance criteria:

* Migration dapat dijalankan dari database kosong.  
* User tanpa izin tidak dapat membaca data internal.  
* Admin dapat mengelola data dasar.  
* RLS tests lulus.

## **Phase 3 — Master data**

Deliverables:

* Event management.  
* Category management.  
* Team management.  
* Runner management.  
* Checkpoint management.

Acceptance criteria:

* CRUD berfungsi.  
* Validasi form berfungsi.  
* Kapasitas kategori diterapkan.  
* Data team dan runner konsisten.

## **Phase 4 — Dashboard**

Deliverables:

* Summary cards.  
* Team list.  
* Filter.  
* Team detail.  
* Status badges.  
* Freshness badges.  
* Responsive layout.

Acceptance criteria:

* Dashboard dapat digunakan desktop dan mobile.  
* Operator dapat menemukan team dalam maksimal beberapa langkah.  
* Timestamp terlihat jelas.

## **Phase 5 — Checkpoint dan insiden**

Deliverables:

* Checkpoint log form.  
* Relay change form.  
* Incident form.  
* Incident list.  
* Incident detail.  
* Assignment dan resolution flow.

Acceptance criteria:

* Checkpoint dapat dicatat.  
* Pergantian dapat dikaitkan dengan runner berikutnya.  
* Insiden memiliki status dan prioritas.  
* Semua perubahan masuk audit log.

## **Phase 6 — Tracking**

Deliverables:

* Web GPS tracking page.  
* Location endpoint.  
* Last known location.  
* Map marker.  
* Location history.  
* Stale detection.

Acceptance criteria:

* Koordinat valid tersimpan.  
* Marker muncul pada peta.  
* Posisi terakhir berubah setelah data baru.  
* Data stale ditandai.

## **Phase 7 — Telegram**

Deliverables:

* Bot webhook.  
* Pairing code.  
* Telegram connection.  
* Location parsing.  
* Basic commands.  
* Telegram error handling.

Acceptance criteria:

* Telegram user dapat dipasangkan dengan runner.  
* Lokasi Telegram masuk ke database.  
* Lokasi muncul di dashboard.  
* User yang belum dipasangkan ditolak.

## **Phase 8 — Realtime dan alert**

Deliverables:

* Realtime dashboard.  
* Incident alerts.  
* Stale alerts.  
* Notification events.  
* Private channel authorization jika menggunakan Broadcast.

Acceptance criteria:

* Operator tidak perlu refresh manual.  
* Update status muncul pada client aktif.  
* Alert tidak dibuat berulang tanpa kontrol.  
* Channel tidak dapat diakses user tanpa izin.

## **Phase 9 — Testing dan deployment**

Deliverables:

* Unit tests.  
* Integration tests.  
* E2E tests.  
* RLS tests.  
* Production checklist.  
* Deployment documentation.

Acceptance criteria:

* Critical flow lulus.  
* RLS tests lulus.  
* Webhook Telegram teruji.  
* Production env tervalidasi.  
* Backup dan monitoring siap.

