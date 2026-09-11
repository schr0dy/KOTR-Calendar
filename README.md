# KOTR Calendar 🥊

Aplicación de calendario de equipo para **King of the Ring** (MMA).

## ✨ Características

- 📅 Vistas de calendario: **Mensual, Semanal y Diaria**
- 👥 **4 equipos**: Direction, Human Resources, Operations, Marketing
- 🥊 **Eventos MMA** resaltados en dorado
- 🔐 Sistema de permisos por equipo (Direction puede editar todo)
- 🔄 Sincronización en tiempo real (Firebase Firestore)
- 💻 App de escritorio Windows con **actualización automática** vía GitHub Releases
- 🎨 Diseño negro/dorado King of the Ring

## 🚀 Setup inicial

### 1. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Crea un nuevo proyecto
3. Activa **Authentication** → Email/Password
4. Activa **Firestore Database** (modo producción)
5. Ve a Configuración del proyecto → Tus apps → Añadir app web
6. Copia la configuración

### 2. Variables de entorno

```bash
cp .env.example .env
# Edita .env con tus valores de Firebase
```

### 3. Reglas de seguridad Firestore

En Firebase Console → Firestore → Reglas:

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

### 4. Instalar y ejecutar

```bash
npm install
npm run dev
```

## 📦 Crear instalador (.exe)

```bash
npm run build:win
# El .exe se genera en: release/
```

## 🔄 Sistema de actualizaciones automáticas

1. Sube el código a un repositorio GitHub
2. Edita `package.json` → `build.publish.owner` con tu usuario de GitHub
3. Añade los secretos de Firebase en GitHub → Settings → Secrets:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Para publicar una nueva versión:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
   GitHub Actions compilará el .exe y lo publicará automáticamente.
5. Los usuarios con la app instalada recibirán la actualización automáticamente.

## 👥 Colores por equipo

| Equipo | Color |
|--------|-------|
| Direction | 🟡 Dorado (#C9A84C) |
| Human Resources | 🔵 Azul (#4A9EFF) |
| Operations | 🟢 Verde (#2ECC8E) |
| Marketing | 🔴 Coral (#FF6B6B) |
| Eventos MMA ⭐ | 🟡 Dorado (#C9A84C) |

## 📝 Crear el primer usuario (Direction/Admin)

El primer usuario debe crearse manualmente desde Firebase Console:
1. Firebase Console → Authentication → Users → Add user
2. Luego en Firestore → Colección `users` → Añadir documento con el UID del usuario:
   ```json
   {
     "name": "Admin",
     "email": "admin@kotr.com",
     "team": "direction",
     "role": "admin",
     "createdAt": <timestamp>
   }
   ```
3. Desde la app, ese usuario puede crear los demás desde el Panel de Administración.
