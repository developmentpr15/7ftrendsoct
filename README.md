# 7Ftrends 📱

A modern fashion discovery and wardrobe management app built with React Native and Expo.

## ✨ Features

### 🏠 Home Feed
- Instagram-style stories
- Trending fashion hashtags with filtering
- Real-time search functionality
- Post creation with image upload
- Like, comment, and share interactions

### 💬 Messaging
- Real-time conversations with fashion enthusiasts
- Chat history and notifications
- Message threads with typing indicators

### 🔔 Notifications
- Activity notifications (likes, comments, follows)
- Challenge updates and announcements
- Interactive notification center

### 👗 Wardrobe Management
- Digital wardrobe with categorization
- Outfit suggestions and recommendations
- Item tracking and organization
- Style statistics and insights

### 📸 AR Try-On
- Virtual clothing try-on with camera
- Photo gallery for saved looks
- AR-powered fashion exploration

### 🏆 Fashion Challenges
- Participate in style competitions
- Create and host custom challenges
- Leaderboard and achievements

### 👤 User Profile
- Editable bio and profile customization
- Activity statistics and history
- Comprehensive settings and preferences

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- Physical iOS/Android device or simulator

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd 7ftrends
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run the app**
   - Scan the QR code with Expo Go app on your phone
   - Or run on simulator: `npm run ios` or `npm run android`

## 🛠️ Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **State Management**: Zustand
- **Backend**: Supabase
- **Styling**: React Native StyleSheet
- **Icons**: Expo Vector Icons
- **Fonts**: Google Fonts (Pacifico)

## 📁 Project Structure

```
7ftrends/
├── src/
│   ├── components/           # Reusable UI components
│   ├── navigation/           # Navigation setup
│   ├── store/               # State management
│   └── utils/               # Utility functions
├── docs/                   # Documentation
└── .expo/                  # Expo build files
```

## 🔧 Configuration

### Environment Variables
Create `.env.local` with:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_APP_NAME=7Ftrends
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### Supabase Setup
1. Create a new project at [Supabase](https://supabase.com)
2. Enable Authentication (Email/Password)
3. Create necessary tables for users, posts, challenges
4. Update environment variables with your credentials

## 📱 Platform Support

- **iOS**: iPhone, iPad (iOS 13+)
- **Android**: Android 8.0+ (API Level 26+)
- **Web**: React Native Web (development)

## 🐛 Troubleshooting

### Common Issues

**Metro bundler errors**
```bash
npm start -- --reset-cache
```

**Permission issues**
- Ensure camera permissions are granted
- Check network connectivity
- Verify Supabase connection

**Build errors**
```bash
expo install --fix
```

### Network Issues
- Check your internet connection
- Verify Supabase service status
- Review [NETWORK_TROUBLESHOOTING.md](docs/NETWORK_TROUBLESHOOTING.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the [documentation](docs/)
- Review the [troubleshooting guide](docs/NETWORK_TROUBLESHOOTING.md)

---

Built with ❤️ for fashion enthusiasts everywhere.