# Mini Tools — udiantos.github.io

Kumpulan mini tools gratis, terutama untuk desain. Situs statis (tanpa server, tanpa login), berjalan di GitHub Pages.

| URL | Tool |
|---|---|
| `/` | Daftar tools |
| `/qolase/` | Kolase foto |
| `/round-foto/` | Bulatkan sudut foto |
| `/brat-maker/` | Brat Maker |
| `/ig-post/` | Tampilan postingan IG + frame story |
| `/color-picker/` | Ambil warna dari foto + palet otomatis |
| `/bongkar-plp/` | Bongkar file Pixellab (.plp) |

## Deploy
1. Buat repo bernama persis `udiantos.github.io` (public), lalu upload semua isi folder ini ke root repo (`index.html` harus berada di paling luar, bukan di dalam subfolder).
2. Repo → Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)`.
3. Tunggu 1–2 menit, lalu buka https://udiantos.github.io/

Tidak perlu `CNAME` maupun pengaturan DNS. Semua link memakai path absolut (`/qolase/` dst.), jadi situs ini harus berada di root domain, seperti `udiantos.github.io`.

## Menambah tool baru
Buat folder baru (misal `/nama-tool/` dengan `index.html`), lalu tambah satu kartu di `index.html` hub.
