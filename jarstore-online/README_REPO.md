# 📦 JarStore

> Repository online di programmi Java — Login con GitHub, revisione admin, anti-spam.

**Live:** [tuo-progetto.vercel.app](https://tuo-progetto.vercel.app)

---

## ✨ Funzionalità

- 🔐 **Login con GitHub OAuth**
- 📤 **Carica i tuoi programmi `.jar`** — vengono messi in coda per revisione
- ✅ **Admin panel** — approva/rifiuta submission, gestisce utenti
- 🛡️ **Anti-spam** basato su GitHub (non sull'IP):
  - Account GitHub deve avere ≥ 5 giorni
  - Almeno 1 repository pubblico
  - Max 2 submission ogni 24h
  - Max 2 submission in attesa contemporaneamente
- ⭐ **Whitelist** per utenti verificati (nessun limite)
- 🚫 **Blacklist** admin per bannare utenti

---

## 🏗️ Stack

| Layer    | Tecnologia              |
|----------|-------------------------|
| Frontend | React 18 + Vite         |
| Hosting  | Vercel (serverless)     |
| Database | Supabase (PostgreSQL)   |
| Storage  | Supabase Storage        |
| Auth     | GitHub OAuth 2.0 + JWT  |

**Costo: 0€** — tutto su piani gratuiti.

---

## 🚀 Setup

Vedi [`jarstore-online/README.md`](./jarstore-online/README.md) per le istruzioni complete di deploy.

---

## 👥 Contributori

| | Username | Ruolo |
|---|---|---|
| <img src="https://github.com/CosmoUniverso.png" width="24"/> | [@CosmoUniverso](https://github.com/CosmoUniverso) | Lead Developer |
| <img src="https://github.com/gabrielerada07.png" width="24"/> | [@gabrielerada07](https://github.com/gabrielerada07) | Collaboratore |
