# Lirim & Elira — Ftesë Martese

Faqe interaktive e ftesës së dasmës me RSVP, email summary ditor, dhe admin dashboard.

**Stack:** Cloudflare Pages + Pages Functions + D1 Database + Workers (cron) + Resend API

---

## 📁 Struktura

```
lirim-elira/
├── public/
│   ├── index.html        ← faqja kryesore
│   ├── seal.webp         ← vula rose gold
│   └── transition.mp4    ← video e tranzicionit
├── functions/api/
│   ├── rsvp.js           ← POST /api/rsvp (pranon RSVP)
│   └── admin.js          ← GET /api/admin?key=XXX (dashboard)
├── worker/
│   ├── index.js          ← daily summary email cron
│   └── wrangler.toml
├── schema.sql            ← skema e database
└── README.md
```

---

## 🚀 Setup hap-pas-hapi

### 1️⃣ Krijo GitHub repo dhe push

```bash
cd lirim-elira/
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/lirim-elira.git
git push -u origin main
```

### 2️⃣ Krijo D1 Database në Cloudflare

```bash
npm install -g wrangler
wrangler login

# Krijon database (kopjo `database_id` që del në output)
wrangler d1 create lirim-elira-db

# Aplikoj schema
wrangler d1 execute lirim-elira-db --remote --file=./schema.sql
```

### 3️⃣ Lidhe repo me Cloudflare Pages

1. Hap [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. Zgjedh repo-n `lirim-elira`
3. Build settings:
   - Framework preset: **None**
   - Build command: *(bosh)*
   - Build output directory: **public**
4. Klik **Save and Deploy**

### 4️⃣ Lidhe D1 me Pages

Pas deployment:
1. Project Settings → **Bindings** → **D1 Database binding**
2. Variable name: `DB`
3. D1 database: `lirim-elira-db`
4. Save & redeploy

### 5️⃣ Setup Resend për email

1. Krijoni llogari në [resend.com](https://resend.com) (falas: 100 emails/ditë)
2. **Domains** → **Add Domain** → `lirim-elira.xyz`
3. Shtoni DNS records në Cloudflare (Resend ju jep ato saktësisht)
4. Pasi domain-i verifikohet, **API Keys** → **Create API Key** → kopjoje

### 6️⃣ Setup cron worker për email

```bash
cd worker/

# Edito wrangler.toml: vendos `database_id` nga hapi 2

# Vendos secret variables
wrangler secret put FROM_EMAIL       # → noreply@lirim-elira.xyz
wrangler secret put TO_EMAIL         # → berishalee@gmail.com
wrangler secret put RESEND_API_KEY   # → re_xxxxxxxxx
wrangler secret put ADMIN_KEY        # → një string i rastësishëm i gjatë

# Deploy
wrangler deploy
```

### 7️⃣ Vendos ADMIN_KEY te Pages

Cloudflare Pages → Settings → **Environment variables**:
- Variable name: `ADMIN_KEY`
- Value: i njëjti string si te worker-i (hapi 6)
- Klik **Encrypt** (rekomandohet)

### 8️⃣ Lidh domain-in `lirim-elira.xyz`

Cloudflare Pages → **Custom domains** → **Set up a custom domain** → `lirim-elira.xyz`

Pasi shtohet, domain-i lidhet automatikisht me Pages.

---

## 🧪 Testimi

### RSVP test (lokal)

```bash
cd lirim-elira/
wrangler pages dev public --d1 DB=lirim-elira-db
```

Hap http://localhost:8788 në browser.

### Manual trigger i daily summary

```
https://lirim-elira-cron.YOUR-SUBDOMAIN.workers.dev/?key=YOUR_ADMIN_KEY
```

### Shiko admin dashboard

```
https://lirim-elira.xyz/api/admin?key=YOUR_ADMIN_KEY
```

---

## 🔐 Sekretet

**Mos i commit-o ndonjëherë:**
- `RESEND_API_KEY`
- `ADMIN_KEY`
- `.dev.vars`

Të gjitha këto vendosen përmes `wrangler secret put` ose Cloudflare dashboard.

---

## 📧 Kur arrijnë email-et

Cron-i punon çdo ditë në **09:00 UTC** (10:00 në Kosovë gjatë verës, 11:00 në dimër).

Email dërgohet **vetëm nëse ka RSVPs të reja** në 24 orët e fundit (jo email i zbrazët çdo ditë).

---

## 🛠️ Debugging

**Logs të Worker-it:**
```bash
cd worker/
wrangler tail
```

**Logs të Pages Functions:**
Cloudflare dashboard → Pages → projekti → **Functions** → **Real-time logs**

**Kontrollo database:**
```bash
wrangler d1 execute lirim-elira-db --remote --command "SELECT * FROM rsvps ORDER BY created_at DESC LIMIT 10"
```
