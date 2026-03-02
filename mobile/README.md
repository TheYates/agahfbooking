# AGAHF Booking Mobile App

A React Native mobile app for the AGAHF Booking system, built with Expo.

## Features

- **Client Authentication**: Login with X-Number and OTP
- **Book Appointments**: Browse departments and book available slots
- **View Appointments**: See all your appointments with status
- **Cancel Appointments**: Cancel upcoming appointments
- **Real-time Updates**: Using TanStack Query for efficient data fetching

## Tech Stack

- **Expo**: React Native framework
- **Expo Router**: File-based navigation
- **TanStack Query**: Data fetching and caching
- **Supabase**: Database and realtime subscriptions
- **Secure Storage**: Token storage using iOS Keychain/Android Keystore

## Project Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Auth group
│   │   ├── login.tsx      # X-Number input
│   │   └── verify-otp.tsx # OTP verification
│   ├── (tabs)/            # Main app tabs
│   │   ├── index.tsx      # Dashboard
│   │   ├── book.tsx       # Book appointment
│   │   ├── appointments.tsx # My appointments
│   │   └── profile.tsx    # User profile
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point
├── src/
│   ├── components/        # Reusable components
│   ├── context/           # React contexts (Auth)
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Libraries config (QueryClient)
│   ├── types/             # TypeScript types
│   └── utils/             # Utilities (API, Auth, Storage)
└── assets/                # Images and icons
```

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Install dependencies:
```bash
cd mobile
npm install
```

2. Create environment variables:
Create a `.env` file in the `mobile/` directory:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start the development server:
```bash
npm start
```

4. Run on device:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

### Building for Production

```bash
# iOS
npx expo prebuild -p ios
cd ios && pod install && cd ..
npx expo run:ios --configuration Release

# Android
npx expo prebuild -p android
npx expo run:android --variant release
```

## API Integration

The mobile app connects to the same Next.js backend API as the web app. Key endpoints:

- `POST /api/auth/send-otp` - Send OTP to client
- `POST /api/auth/verify-otp` - Verify OTP and login
- `GET /api/departments` - List departments
- `GET /api/appointments/available-slots` - Get available slots
- `POST /api/appointments/book` - Book appointment
- `GET /api/appointments/client` - Get client appointments
- `DELETE /api/appointments/cancel` - Cancel appointment

## Authentication Flow

1. User enters X-Number on login screen
2. OTP is sent via SMS
3. User enters 6-digit OTP
4. Session token stored securely in device Keychain/Keystore
5. Token sent with every API request in Authorization header

## Shared Code

Types and utilities are ported from the web app:
- `src/types/index.ts` - Database types
- `src/utils/api.ts` - API client
- `src/utils/auth.ts` - Auth functions

## Notes

- Uses React 19 (same as web app)
- Mobile-first design already exists in web app, adapted for native
- Push notifications can be added later with `expo-notifications`
- Currently supports only client role (patient bookings)

## License

Same as the main AGAHF Booking project.
