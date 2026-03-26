# Crime Alert - Mobile App

A real-time crime reporting and emergency alert mobile application built with Expo (React Native) and Node.js. Users can report crimes, send emergency SOS alerts, share locations, and receive real-time notifications when crimes are reported nearby.

---

## Features

- **User Authentication** - Register and login with JWT-based authentication
- **Crime Reporting** - Report crimes with type, severity, description, and auto-detected GPS location
- **Emergency SOS** - One-tap emergency button that broadcasts your location to all nearby users
- **Real-Time Alerts** - Receive instant notifications via Socket.io when crimes are reported within 5km
- **Location Sharing** - Automatic GPS coordinates capture with reverse geocoding to street addresses
- **Crime Feed** - Browse recent crime reports with severity badges and time stamps
- **User Profile** - View account details, safety tips, and log out

---

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | Expo (React Native), React Navigation |
| Backend  | Node.js, Express.js                 |
| Database | MySQL (phpMyAdmin via XAMPP)         |
| ORM      | Sequelize                           |
| Auth     | JWT (jsonwebtoken), bcryptjs        |
| Realtime | Socket.io                           |
| Location | expo-location                       |

---

## Prerequisites

Before starting, make sure you have the following installed:

1. **Node.js** (v16 or higher) - [https://nodejs.org](https://nodejs.org)
   ```bash
   node --version
   ```

2. **npm** (comes with Node.js)
   ```bash
   npm --version
   ```

3. **XAMPP** (for MySQL and phpMyAdmin) - [https://www.apachefriends.org](https://www.apachefriends.org)

4. **Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

5. **Expo Go App** (on your mobile device) - Download from App Store or Google Play Store

---

## Project Structure

```
crime-alert/
├── App.js                             # App entry point
├── package.json                       # Frontend dependencies
├── src/
│   ├── config/
│   │   └── api.js                     # API and Socket URL configuration
│   ├── context/
│   │   └── AuthContext.js             # Authentication state management
│   ├── navigation/
│   │   └── AppNavigator.js            # Stack and Tab navigation
│   └── screens/
│       ├── LoginScreen.js             # Login page
│       ├── RegisterScreen.js          # Registration page
│       ├── HomeScreen.js              # Crime feed / dashboard
│       ├── ReportCrimeScreen.js       # Report a crime form
│       ├── EmergencyScreen.js         # SOS emergency button
│       ├── AlertsScreen.js            # Real-time alerts feed
│       └── ProfileScreen.js           # User profile and logout
└── backend/
    ├── server.js                      # Express + Socket.io server
    ├── .env                           # Environment variables
    ├── package.json                   # Backend dependencies
    ├── config/
    │   └── database.js                # Sequelize MySQL connection
    ├── middleware/
    │   └── auth.js                    # JWT authentication middleware
    ├── models/
    │   ├── index.js                   # Model associations
    │   ├── User.js                    # User model
    │   └── Crime.js                   # Crime model
    └── routes/
        ├── auth.js                    # Auth routes (register, login, profile)
        └── crimes.js                  # Crime routes (report, nearby, emergency)
```

---

## Getting Started

### Step 1: Clone or Navigate to the Project

```bash
cd /path/to/crime-alert
```

### Step 2: Start MySQL via XAMPP

1. Open the **XAMPP Control Panel**
2. Click **Start** next to **Apache**
3. Click **Start** next to **MySQL**
4. Verify both services show a green status

### Step 3: Create the Database

1. Open your browser and go to:
   ```
   http://localhost/phpmyadmin
   ```
2. Click **"New"** in the left sidebar
3. Enter the database name: `crime_alert`
4. Select collation: `utf8mb4_general_ci`
5. Click **"Create"**

> **Note:** You do NOT need to create tables manually. The backend will auto-create them when it starts.

### Step 4: Configure Environment Variables

Open the file `backend/.env` and verify the MySQL credentials match your XAMPP setup:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=crime_alert
JWT_SECRET=your_jwt_secret_change_in_production
```

- XAMPP uses `root` with an **empty password** by default
- If you set a MySQL password in XAMPP, update `DB_PASSWORD` accordingly
- For production, change `JWT_SECRET` to a strong random string

### Step 5: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 6: Start the Backend Server

```bash
node server.js
```

You should see:
```
Connected to MySQL - tables synced
Server running on port 5000
```

The following tables are automatically created in `crime_alert` database:
- **Users** - stores user accounts
- **Crimes** - stores crime reports

You can verify by refreshing phpMyAdmin and checking the `crime_alert` database.

### Step 7: Install Frontend Dependencies

Open a **new terminal** and run:

```bash
cd /path/to/crime-alert
npm install
```

### Step 8: Start the Expo App

```bash
npx expo start
```

You should see a QR code in the terminal along with options:
```
› Press a │ open Android
› Press w │ open web
› Press r │ reload app
```

### Step 9: Open the App

Choose one of the following methods:

**Option A - Physical Device (Recommended):**
1. Install **Expo Go** from your app store
2. Scan the QR code shown in the terminal
3. The app will load on your phone

**Option B - Android Emulator:**
1. Start Android Studio and launch an emulator
2. Press `a` in the Expo terminal

**Option C - Web Browser:**
1. Press `w` in the Expo terminal
2. The app will open in your default browser

---

## Testing on a Physical Device

When testing on a physical device, your phone and computer must be on the **same Wi-Fi network**. You also need to update the API URL:

1. Find your computer's local IP address:
   ```bash
   # Linux
   hostname -I

   # macOS
   ipconfig getifaddr en0

   # Windows
   ipconfig
   ```

2. Open `src/config/api.js` and update the URLs:
   ```javascript
   const API_URL = 'http://YOUR_LOCAL_IP:5000/api';
   const SOCKET_URL = 'http://YOUR_LOCAL_IP:5000';
   ```

   For example:
   ```javascript
   const API_URL = 'http://192.168.1.100:5000/api';
   const SOCKET_URL = 'http://192.168.1.100:5000';
   ```

---

## API Endpoints

### Authentication
| Method | Endpoint              | Description           | Auth Required |
| ------ | --------------------- | --------------------- | ------------- |
| POST   | `/api/auth/register`  | Register a new user   | No            |
| POST   | `/api/auth/login`     | Login                 | No            |
| GET    | `/api/auth/me`        | Get current user      | Yes           |
| PUT    | `/api/auth/location`  | Update user location  | Yes           |

### Crimes
| Method | Endpoint               | Description              | Auth Required |
| ------ | ---------------------- | ------------------------ | ------------- |
| POST   | `/api/crimes`          | Report a crime           | Yes           |
| GET    | `/api/crimes`          | Get all crimes (paginated) | Yes         |
| GET    | `/api/crimes/nearby`   | Get nearby crimes        | Yes           |
| POST   | `/api/crimes/emergency`| Send emergency alert     | Yes           |

---

## Socket.io Events

| Event              | Direction       | Description                              |
| ------------------ | --------------- | ---------------------------------------- |
| `crime-alert`      | Server → Client | Sent to users within 5km of a new crime  |
| `emergency-alert`  | Server → Client | Broadcast to all users on emergency SOS  |
| `new-crime`        | Server → Client | Broadcast to all users for feed updates  |
| `update-location`  | Client → Server | User sends their GPS coordinates         |

---

## Quick Start Summary

```bash
# Terminal 1 - Start Backend
cd crime-alert/backend
npm install
node server.js

# Terminal 2 - Start Frontend
cd crime-alert
npm install
npx expo start
```

Make sure XAMPP (Apache + MySQL) is running and the `crime_alert` database exists before starting the backend.

---

## Troubleshooting

| Problem                          | Solution                                                              |
| -------------------------------- | --------------------------------------------------------------------- |
| `MySQL connection error`         | Ensure XAMPP MySQL is running and credentials in `.env` are correct   |
| `ECONNREFUSED` on mobile         | Update `src/config/api.js` with your local IP instead of `localhost`  |
| `Location unavailable`           | Grant location permissions when prompted by the app                   |
| `Tables not created`             | Check phpMyAdmin for errors; ensure `crime_alert` database exists     |
| `Port 5000 already in use`       | Kill the existing process: `lsof -ti:5000 \| xargs kill` or change PORT in `.env` |
| `Expo QR code not scanning`      | Ensure phone and computer are on the same Wi-Fi network               |
