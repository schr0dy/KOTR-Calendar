# KOTR Calendar 🥊

Team calendar application for **King of the Ring** (MMA).

## ✨ Features

- 📅 Calendar views: **Monthly, Weekly, and Daily**
- 👥 **4 teams**: Direction, Human Resources, Operations, Marketing
- 🥊 **MMA Events** highlighted in gold
- 🔐 Team-based permission system (Direction can edit everything)
- 🔄 Real-time synchronization (Firebase Firestore)
- 💻 Windows desktop app with **automatic updates** via GitHub Releases
- 🎨 King of the Ring black/gold design

## 🚀 Initial Setup

### 1. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database** (production mode)
5. Go to Project Settings → Your apps → Add web app
6. Copy the configuration

### 2. Environment Variables

```bash
cp .env.example .env
# Edit .env with your Firebase values.
```

### 3. Firestore Security Rules

In Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users: only authenticated users can read, only admins can write
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.team == 'direction';
      allow create: if request.auth != null; // For initial creation
    }
    
    // Events: all authenticated users can read
    match /events/{eventId} {
      allow read: if request.auth != null;
      
      // Create: any authenticated user
      allow create: if request.auth != null;
      
      // Update/Delete: own events OR Direction team
      allow update, delete: if request.auth != null && (
        resource.data.createdBy == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.team == 'direction'
      );
    }
  }
}
```

### 4. Install and Run

```bash
npm install
npm run dev
```

## 📦 Create Installer (.exe)

```bash
npm run build:win
# The .exe is generated in: release/
```

## 🔄 Automatic Update System

1. Upload the code to a GitHub repository
2. Edit `package.json` → `build.publish.owner` with your GitHub username
3. Add the Firebase secrets in GitHub → Settings → Secrets and variables → Actions:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. To publish a new version:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
   GitHub Actions will automatically build the .exe and publish it.
5. Users with the app installed will receive the update automatically.

## 👥 Team Colors

| Team | Color |
|--------|-------|
| Direction | 🟡 Gold (#C9A84C) |
| Human Resources | 🔵 Blue (#4A9EFF) |
| Operations | 🟢 Green (#2ECC8E) |
| Marketing | 🔴 Coral (#FF6B6B) |
| MMA Events ⭐ | 🟡 Gold (#C9A84C) |

## 📝 Create the First User (Direction/Admin)

The first user must be created manually from the Firebase Console:
1. Firebase Console → Authentication → Users → Add user
2. Then in Firestore → `users` collection → Add document with the user's UID:
   ```json
   {
     "name": "Admin",
     "email": "admin@kotr.com",
     "team": "direction",
     "role": "admin",
     "createdAt": <timestamp>
   }
   ```
3. From the app, that user can create the rest of the users from the Administration Panel.
