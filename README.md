# CIDIKA TRAVEL&TOUR — React (CRA, JSX) + Tailwind + Supabase + Netlify

> Node **v22.17.0** (Windows) — tanpa Vite, full JSX.

## 0) Ekstrak & Buka Folder
Ekstrak zip ini ke: `C:\Projects\cidika-travel` lalu buka di VS Code.

## 1) Install Dependencies
```powershell
cd C:\Projects\cidika-travel
npm install
```

## 2) Tailwind sudah siap
Konfigurasi ada di `tailwind.config.js`, `postcss.config.js`, dan `src/index.css`.

## 3) Supabase Setup
1. Buat project di https://supabase.com (Region terdekat).
2. Di Project Settings → API, salin:
   - `Project URL` → `.env.local` => `REACT_APP_SUPABASE_URL`
   - `anon public key` → `.env.local` => `REACT_APP_SUPABASE_ANON_KEY`
3. Buat file `.env.local` dari `.env.example` dan isi nilai di atas.
4. SQL (Table minimal):
```sql
-- Tabel konten per halaman (multi-bahasa)
create table if not exists page_content (
  id bigint generated always as identity primary key,
  page text not null,      -- e.g. 'home','explore','faq','contact'
  key text not null,       -- e.g. 'hero_title','hero_desc'
  lang text not null check (lang in ('en','id','ja')),
  content text,
  image_url text,
  updated_at timestamp with time zone default now()
);
create index on page_content(page, key, lang);

-- Tabel packages (opsional, jika ingin isi dinamis dari DB)
create table if not exists packages (
  id uuid default gen_random_uuid() primary key,
  slug text unique,
  title jsonb,          -- {en:'',id:'',ja:''}
  description jsonb,    -- {en:'',id:'',ja:''}
  price_tiers jsonb,    -- [["1",1000000],["2",550000],...]
  images jsonb,
  is_active boolean default true,
  updated_at timestamp with time zone default now()
);

-- Tabel orders (insert oleh anon)
create table if not exists orders (
  id bigint generated always as identity primary key,
  package_id text,
  name text,
  email text,
  phone text,
  pax int,
  notes text,
  status text default 'new',
  created_at timestamp with time zone default now()
);

-- RLS
alter table page_content enable row level security;
alter table packages enable row level security;
alter table orders enable row level security;

-- Policy: publik read page_content & packages
create policy "public read page_content" on page_content for select using (true);
create policy "public read packages" on packages for select using (true);

-- Policy: admin write (ganti 'your_admin_email@domain.com')
-- Buat Supabase Auth user untuk admin (email/password).
create policy "admin upsert page_content" on page_content
for insert with check (auth.email() = 'your_admin_email@domain.com');
create policy "admin update page_content" on page_content
for update using (auth.email() = 'your_admin_email@domain.com');

create policy "admin upsert packages" on packages
for insert with check (auth.email() = 'your_admin_email@domain.com');
create policy "admin update packages" on packages
for update using (auth.email() = 'your_admin_email@domain.com');

-- Policy: anon insert orders
create policy "anon insert orders" on orders
for insert with check (true);
create policy "admin read orders" on orders
for select using (auth.email() = 'your_admin_email@domain.com');
```

> Note: di app ini halaman Admin memakai Supabase Auth email/password.
> Setelah login sukses, token dummy disimpan sebagai `sb:token` di localStorage untuk membantu guard di hosting statis. Untuk keamanan produksi, sebaiknya implement guard berdasarkan session Supabase secara penuh (fetch `getSession()` dan subscribe `onAuthStateChange`).

## 4) Run Dev
```powershell
npm start
```
App jalan di http://localhost:3000

## 5) GitHub Repo
```powershell
git init
git add .
git commit -m "Init CIDIKA TRAVEL&TOUR (CRA, Tailwind, i18n, Supabase, Netlify)"
git branch -M main
git remote add origin https://github.com/<username>/cidika-travel.git
git push -u origin main
```

## 6) Netlify Deploy
1. Buat site baru → Import from Git.
2. Pilih repo `cidika-travel`.
3. Build command: `npm run build`
4. Publish directory: `build`
5. Environment variables:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
   - Opsional: set `NODE_VERSION=22.17.0` (sudah di `netlify.toml`)

## 7) Struktur & Fitur
- **Navbar**: Explore, Destinasi, FAQ, Contact, Login Admin, toggle dark/light, switch bahasa.
- **Home**: Hero slider auto 3 detik + panah, daftar paket (harga per pax), tombol keranjang.
- **Explore**: detail tiap paket (spot, termasuk, harga, catatan).
- **Cart**: context + localStorage, Checkout stub (tinggal insert ke tabel `orders` Supabase).
- **Admin**:
  - **Dashboard**: hitung total orders/packages/page_content.
  - **Kustomisasi**: CRUD untuk `page_content` (konten multi-bahasa).
  - **Orderan**: list order dari Supabase.

## 8) Next Steps (Opsional)
- Ganti hero images (letakkan di `/public/` lalu update `heroImages` di `Home.jsx`).
- Sempurnakan ProtectedRoute dan auth session Supabase.
- Hubungkan Checkout agar `orders` ter-insert via Supabase.
- Ganti placeholder logo di `/public/logo.png` dengan logo asli.

Selamat ngoding! 🎉