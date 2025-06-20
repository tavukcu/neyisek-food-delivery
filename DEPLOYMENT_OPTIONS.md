# NeYisek.com Deployment Seçenekleri

## 🚨 Mevcut Durum
Şu anda Hostinger için sadece statik bir tanıtım sayfası hazırlandı çünkü:
- Next.js API routes Hostinger shared hosting'de çalışmaz
- Firebase entegrasyonu server-side işlemler gerektirir
- Dinamik özellikler Node.js environment'ı gerektirir

## ✅ Çözüm Seçenekleri

### 1. VPS/VDS Hosting (TAM UYGULAMA)
**Önerilen çözüm** - Tam uygulamanız çalışacak

#### Hosting Sağlayıcıları:
- **Hostinger VPS** (ayda ~$3.99)
- **DigitalOcean** (ayda $4-6)
- **Vultr** (ayda $2.50-6)
- **AWS EC2** (ayda $3-10)

#### Deployment Adımları:
```bash
# 1. VPS'e bağlan
ssh root@your-vps-ip

# 2. Node.js yükle
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. PM2 yükle (process manager)
npm install -g pm2

# 4. Nginx yükle (reverse proxy)
sudo apt install nginx

# 5. Projeyi clone et veya upload et
git clone your-repo
cd neyisek

# 6. Dependencies yükle
npm install

# 7. Build yap
npm run build

# 8. PM2 ile başlat
pm2 start npm --name "neyisek" -- start

# 9. Nginx konfigürasyonu
# /etc/nginx/sites-available/neyisek dosyası oluştur
```

### 2. Vercel (ÜCRETSİZ - TAM UYGULAMA)
**En kolay çözüm**

```bash
# 1. Vercel CLI yükle
npm i -g vercel

# 2. Deploy et
vercel

# 3. Domain bağla (isteğe bağlı)
# Vercel dashboard'dan custom domain ekle
```

### 3. Netlify (TAM UYGULAMA)
```bash
# 1. Netlify CLI yükle
npm install -g netlify-cli

# 2. Build ve deploy
npm run build
netlify deploy --prod --dir=.next
```

### 4. Railway (TAM UYGULAMA)
- GitHub repo'yu bağla
- Otomatik deploy
- Aylık $5-10

### 5. Hostinger Shared + API Backend Ayrı
Mevcut Hostinger'da frontend, API'yi başka yerde host et:
- Frontend: Hostinger (mevcut)
- Backend API: Vercel/Railway/Heroku

## 🎯 En İyi Seçimler

### Ücretsiz Başlangıç:
1. **Vercel** (en kolay, otomatik CI/CD)
2. **Netlify**

### Ücretli Profesyonel:
1. **Hostinger VPS** (ayda $3.99)
2. **DigitalOcean** (ayda $4-6)

## 🚀 Hemen Vercel ile Deploy Edelim mi?
Vercel en hızlı çözüm - 5 dakikada tam uygulamanız online olacak! 