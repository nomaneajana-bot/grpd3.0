# Deployment Guide for GRPD 3.0

This guide covers multiple deployment options for testing and distributing the app.

## Quick Options Summary

1. **Web Deployment** (Easiest) - Deploy to Vercel/Netlify in minutes
2. **EAS Build** (Recommended for Mobile) - Build native apps for iOS/Android
3. **Expo Go** (Quick Testing) - Share QR code for immediate testing
4. **Development Build** (Advanced) - Custom builds with native modules

---

## Option 1: Web Deployment (Fastest)

Deploy the web version to Vercel, Netlify, or similar platforms.

### Deploy to Vercel

1. **Install Vercel CLI** (if not already installed):

   ```bash
   npm i -g vercel
   ```

2. **Build the web app**:

   ```bash
   npx expo export:web
   ```

3. **Deploy**:

   ```bash
   cd web-build
   vercel --prod
   ```

   Or connect your GitHub repo to Vercel for automatic deployments.

### Deploy to Netlify

1. **Build the web app**:

   ```bash
   npx expo export:web
   ```

2. **Deploy**:
   ```bash
   npx netlify deploy --prod --dir=web-build
   ```

### Access

- Share the URL with testers
- Works on any device with a browser
- No app installation required

---

## Option 2: EAS Build (Native Apps)

Build native iOS and Android apps for distribution.

### Setup

1. **Install EAS CLI**:

   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:

   ```bash
   eas login
   ```

3. **Configure EAS**:

   ```bash
   eas build:configure
   ```

4. **Build for iOS** (requires Apple Developer account):

   ```bash
   eas build --platform ios --profile preview
   ```

5. **Build for Android**:
   ```bash
   eas build --platform android --profile preview
   ```

### Distribution Options

- **Internal Distribution**: Share download links directly
- **TestFlight** (iOS): Submit to Apple TestFlight
- **Google Play Internal Testing**: Upload to Play Console
- **Ad Hoc** (iOS): Distribute to specific devices

### Build Profiles

Edit `eas.json` to configure different build profiles:

- `preview`: For testing (no app store submission)
- `production`: For app store releases

---

## Option 3: Expo Go (Quick Testing)

Share a QR code for immediate testing (limited to Expo SDK compatibility).

### Steps

1. **Start development server**:

   ```bash
   npm start
   ```

2. **Publish to Expo**:

   ```bash
   npx expo publish
   ```

3. **Share the URL**:
   - Users scan QR code with Expo Go app
   - Works immediately, no build required

### Limitations

- Only works with Expo Go compatible SDKs
- Some native modules may not work
- Not suitable for production

---

## Option 4: Development Build

Create custom development builds with full native module support.

### Setup

1. **Install EAS CLI**:

   ```bash
   npm install -g eas-cli
   ```

2. **Create development build**:

   ```bash
   eas build --profile development --platform ios
   eas build --profile development --platform android
   ```

3. **Install on devices**:
   - Download and install the build
   - Use `expo start --dev-client` to connect

---

## Recommended Setup for Testing

For quick testing with multiple users, I recommend:

1. **Web deployment** (Vercel/Netlify) - Share URL immediately
2. **EAS Build preview** - For native app testing

---

## Environment Variables

If you need environment variables:

1. Create `.env` file:

   ```
   EXPO_PUBLIC_API_URL=https://api.example.com
   ```

2. Access in code:

   ```typescript
   const apiUrl = process.env.EXPO_PUBLIC_API_URL;
   ```

3. For EAS Build, configure in `eas.json`:
   ```json
   {
     "build": {
       "preview": {
         "env": {
           "EXPO_PUBLIC_API_URL": "https://api.example.com"
         }
       }
     }
   }
   ```

---

## Next Steps

1. Choose your deployment method
2. Follow the setup steps above
3. Share the link/build with testers
4. Collect feedback and iterate

For questions, see:

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Web Deployment](https://docs.expo.dev/workflow/web/)
