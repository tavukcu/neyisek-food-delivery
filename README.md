# NeYisek.com - Turkish Food Delivery Platform

[![Next.js](https://img.shields.io/badge/Next.js-13-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-v9-orange)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC)](https://tailwindcss.com/)

Modern, AI-powered food delivery platform designed specifically for the Turkish market. Built with Next.js, TypeScript, Firebase, and Google Gemini AI.

## 🚀 Features

### Core Features
- **Real-time Order Tracking** - Live GPS tracking and status updates
- **AI-Powered Recommendations** - Smart food suggestions using Google Gemini AI
- **Multi-language Support** - Turkish and English localization
- **Advanced Search** - AI-enhanced search with filters
- **Real-time Notifications** - Push notifications and in-app alerts
- **User Authentication** - Secure login with Firebase Auth

### Restaurant Management
- **Restaurant Dashboard** - Complete restaurant management panel
- **Menu Management** - Easy menu creation and editing
- **Order Management** - Real-time order processing
- **Analytics Dashboard** - Revenue, orders, and performance metrics
- **Financial Reports** - Automated financial reporting

### Admin Features
- **Super Admin Panel** - Platform-wide management
- **User Management** - Customer and restaurant user control
- **Analytics & Reports** - Business intelligence dashboard
- **Commission Management** - Automated commission tracking
- **Advertisement Management** - Banner and promotion control

### AI Integration
- **Smart Recommendations** - Personalized food suggestions
- **Mood-based Suggestions** - AI recommendations based on user mood
- **Cross-selling** - Intelligent upselling recommendations
- **Content Generation** - AI-powered descriptions and content

## 🛠 Tech Stack

### Frontend
- **Next.js 13** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Hot Toast** - Beautiful notifications
- **Lucide React** - Modern icon library

### Backend & Services
- **Firebase v9**
  - Authentication (Auth)
  - Firestore Database
  - Cloud Storage
  - Cloud Messaging (FCM)
  - Hosting
- **Google Gemini AI** - AI-powered features
- **Vercel** - Deployment and hosting

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Git** - Version control

## 📦 Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/neyisek-food-delivery.git
cd neyisek-food-delivery
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

4. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🚀 Deployment

### Firebase Hosting
```bash
# Build the project
npm run build

# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase hosting
firebase init hosting

# Deploy
firebase deploy
```

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

## 📱 Features Overview

### For Customers
- Browse restaurants and menus
- AI-powered food recommendations
- Real-time order tracking
- Multiple payment options
- Rating and review system
- Favorites and order history
- Location-based delivery

### For Restaurants
- Restaurant registration and verification
- Menu management with categories
- Real-time order processing
- Performance analytics
- Financial reporting
- Customer reviews management
- Marketing tools

### For Administrators
- Platform-wide management
- User and restaurant oversight
- Analytics and reporting
- Commission tracking
- Advertisement management
- System configuration

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project
2. Enable Authentication (Email/Password, Google)
3. Set up Firestore Database
4. Configure Cloud Storage
5. Enable Cloud Messaging
6. Set up Security Rules

### Gemini AI Setup
1. Get API key from Google AI Studio
2. Configure in environment variables
3. Set up AI prompts and responses

## 📊 Analytics & Monitoring

- User engagement tracking
- Order completion rates
- Revenue analytics
- Performance monitoring
- Error tracking and reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛡 Security

- Firebase Security Rules implemented
- Input validation and sanitization
- Secure authentication flow
- Data encryption in transit
- Regular security audits

## 📞 Support

For support, email support@neyisek.com or create an issue in this repository.

## 🗺 Roadmap

- [ ] Mobile app development (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-city expansion
- [ ] Integration with POS systems
- [ ] Voice ordering with AI
- [ ] Advanced delivery optimization
- [ ] Loyalty program system
- [ ] Corporate ordering features

---

Built with ❤️ for the Turkish food delivery market 