const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

console.log('🚀 NeYisek Hostinger Deployment Hazırlığı Başlıyor...\n');

// Deployment klasörünü oluştur
const deploymentDir = 'hostinger-deployment';
if (fs.existsSync(deploymentDir)) {
  fs.rmSync(deploymentDir, { recursive: true });
}
fs.mkdirSync(deploymentDir);

// .next build dosyalarını kopyala
console.log('📦 Build dosyaları kopyalanıyor...');
copyDirectory('.next', path.join(deploymentDir, '.next'));

// Public dosyalarını kopyala
console.log('🎨 Public dosyaları kopyalanıyor...');
copyDirectory('public', path.join(deploymentDir, 'public'));

// Package dosyalarını kopyala
console.log('📋 Package dosyaları kopyalanıyor...');
fs.copyFileSync('package.json', path.join(deploymentDir, 'package.json'));
fs.copyFileSync('package-lock.json', path.join(deploymentDir, 'package-lock.json'));
fs.copyFileSync('next.config.js', path.join(deploymentDir, 'next.config.js'));

// Environment dosyası oluştur (örnek)
console.log('🔧 Environment dosyası oluşturuluyor...');
const envContent = `# NeYisek Production Environment
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAhY94ep5kHijI6sQmYDqaHjxJ8WuLlrMU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=yem30-halil.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=yem30-halil
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=yem30-halil.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=483321488725
NEXT_PUBLIC_FIREBASE_APP_ID=1:483321488725:web:9876fc0d8f617a0c973bdc
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-YW6S5TBRGP

# Server Environment
NODE_ENV=production

# Optional: Firebase Admin (for notifications)
# FIREBASE_PROJECT_ID=yem30-halil
# FIREBASE_CLIENT_EMAIL=your-service-account@yem30-halil.iam.gserviceaccount.com
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
`;

fs.writeFileSync(path.join(deploymentDir, '.env.local'), envContent);

// Start script oluştur
console.log('🎯 Start script oluşturuluyor...');
const startScript = `#!/bin/bash
echo "🚀 NeYisek Başlatılıyor..."
echo "📦 Dependencies yükleniyor..."
npm install --production
echo "🎯 Production server başlatılıyor..."
npm start
`;

fs.writeFileSync(path.join(deploymentDir, 'start.sh'), startScript);
fs.chmodSync(path.join(deploymentDir, 'start.sh'), '755');

// README dosyası oluştur
console.log('📖 README dosyası oluşturuluyor...');
const readmeContent = `# NeYisek - Hostinger Deployment

Bu paket NeYisek food delivery uygulamasının Hostinger VPS'te çalıştırılması için hazırlanmıştır.

## Özellikler
- ✅ Tam çalışır Next.js 14 uygulaması
- ✅ Firebase ile gerçek zamanlı veri senkronizasyonu
- ✅ Müşteri yönetimi
- ✅ Restoran yönetimi
- ✅ Sipariş takibi
- ✅ Admin paneli
- ✅ Responsive tasarım

## Kurulum

### 1. Dosyaları Yükle
Bu zip dosyasının içeriğini VPS'inizin bir dizinine çıkarın:
\`\`\`bash
unzip neyisek-full-hostinger.zip
cd neyisek-hostinger
\`\`\`

### 2. Node.js Kurulumu
Node.js 18+ gereklidir:
\`\`\`bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
\`\`\`

### 3. Dependencies Yükle
\`\`\`bash
npm install --production
\`\`\`

### 4. Environment Ayarları
\`.env.local\` dosyasını ihtiyacınıza göre düzenleyin.

### 5. Uygulamayı Başlat
\`\`\`bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
\`\`\`

### 6. PM2 ile Sürekli Çalıştırma (Önerilen)
\`\`\`bash
sudo npm install -g pm2
pm2 start npm --name "neyisek" -- start
pm2 startup
pm2 save
\`\`\`

## Port Ayarları
Uygulama varsayılan olarak 3000 portunda çalışır. Farklı port için:
\`\`\`bash
PORT=8080 npm start
\`\`\`

## Domain Bağlama
Apache/Nginx reverse proxy kullanarak domain'inizi uygulamaya yönlendirin.

### Nginx Örneği:
\`\`\`nginx
server {
    listen 80;
    server_name neyisek.com www.neyisek.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

## Sorun Giderme
- Port 3000'in açık olduğundan emin olun
- Firewall ayarlarını kontrol edin
- Log dosyalarını inceleyin: \`pm2 logs neyisek\`

## Destek
Herhangi bir sorun yaşarsanız Firebase Console'dan verileri kontrol edin.

---
NeYisek © 2024 - Tam Fonksiyonel Food Delivery Platform
`;

fs.writeFileSync(path.join(deploymentDir, 'README.md'), readmeContent);

// ZIP dosyası oluştur
console.log('📦 ZIP dosyası oluşturuluyor...');
createZip();

function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) return;
  
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function createZip() {
  const output = fs.createWriteStream('neyisek-full-hostinger.zip');
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  output.on('close', () => {
    const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
    console.log(`\n✅ Deployment paketi hazır!`);
    console.log(`📦 Dosya: neyisek-full-hostinger.zip`);
    console.log(`📊 Boyut: ${sizeInMB} MB`);
    console.log(`📁 İçerik: Full Next.js uygulaması`);
    console.log(`\n🚀 Hostinger VPS'e yükleyip çalıştırabilirsiniz!`);
    console.log(`\nYükleme adımları:`);
    console.log(`1. ZIP'i VPS'e yükle`);
    console.log(`2. unzip neyisek-full-hostinger.zip`);
    console.log(`3. cd neyisek-hostinger`);
    console.log(`4. npm install --production`);
    console.log(`5. npm start`);
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);
  archive.directory(deploymentDir, false);
  archive.finalize();
} 