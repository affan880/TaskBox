# TaskBox

A React Native task management application with Firebase integration.

## Setup

1. Install dependencies:
```bash
npm install
```

2. iOS specific setup:
```bash
cd ios
pod install
cd ..
```

3. Create a `.env` file in the root directory with the following variables:
```
FIREBASE_WEB_CLIENT_ID=your_web_client_id
FIREBASE_IOS_CLIENT_ID=your_ios_client_id
```

## Usage

### Development

- Start Metro bundler:
```bash
npm start
```

- Run on iOS:
```bash
npm run ios
```

- Run on Android:
```bash
npm run android
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Tech Stack

- React Native (CLI)
- TypeScript
- NativeWind (Tailwind CSS for React Native)
- React Navigation
- Firebase (Authentication, Firestore, Storage)
- Google Sign-In
- React Query with React Query Kit
- Zustand (State Management)
- React Native MMKV (Storage)
- React Native Gesture Handler
- React Native Reanimated
- React Native SVG

## Folder Structure

```
src/
├── api/          # API related code (axios, react-query)
├── app/          # Screens and navigation setup
├── components/   # Shared components
│   └── ui/      # Core UI components (buttons, inputs)
├── lib/          # Shared libraries
│   ├── auth/    # Authentication
│   ├── hooks/   # Custom hooks
│   └── utils/   # Utility functions
├── store/        # Zustand store
├── theme/        # Theme configuration
├── translations/ # i18n files
└── types/       # TypeScript types
```

## Contributing

Please follow our commit message conventions:

- `fix:` for bug fixes
- `feat:` for new features
- `perf:` for performance improvements
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding missing tests
- `chore:` for maintenance tasks
