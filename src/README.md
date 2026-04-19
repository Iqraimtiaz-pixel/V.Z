# VibeZ — Private 1-on-1 Chat App

A modern, dark-mode private messaging app built with React.

## Project Structure

```
vibez/
├── public/
│   └── index.html          # HTML shell + Google Fonts
├── src/
│   ├── index.js            # React entry point
│   ├── App.jsx             # Root router (Auth → List → Chat)
│   ├── services/
│   │   ├── db.js           # In-memory database (window.__vibezDB)
│   │   ├── auth.js         # Signup, Login, Profile, Privacy
│   │   ├── messages.js     # Send, Get, Vanish messages
│   │   └── friends.js      # Friend requests system
│   ├── utils/
│   │   └── helpers.js      # uid, fmtTime, fmtDate, avatarColor, EMOJIS
│   ├── components/
│   │   ├── Avatar.jsx      # User avatar with online indicator
│   │   └── ProfileEditModal.jsx  # Edit name/bio/photo + privacy toggles
│   └── screens/
│       ├── AuthScreen.jsx      # Login & Signup
│       ├── UsersListScreen.jsx # People / Friends / Requests tabs
│       └── ChatScreen.jsx      # 1-on-1 private chat
└── package.json
```

## Quick Start

```bash
cd vibez
npm install
npm start
```

Open http://localhost:3000

## Features

### Authentication
- Email + password signup and login
- No Google/social login
- Input validation with clear error messages

### Screens
1. **Auth Screen** — Sign In / Sign Up with tab switcher
2. **Users List** — Three tabs: People, Friends, Requests
3. **Chat Screen** — Full 1-on-1 private messaging

### Chat Features
- Real-time polling (every 3 seconds)
- Emoji picker (40 emojis)
- Last 50 messages shown
- Message timestamps + date separators
- Auto-scroll to newest message
- Keyboard hides after Send on mobile
- **👻 Vanish button** — deletes entire chat for both users

### Social Features
- Friend request system (send / accept / decline)
- Incoming request badge on header
- Friends tab with quick chat access

### Profile
- Upload photo from device
- Edit display name and bio
- Privacy settings:
  - Show/hide online status
  - Show/hide last seen
  - Show/hide profile photo
  - Show/hide bio

### Privacy & Security
- Each chat isolated by `ChatID = sort([userA, userB]).join("__")`
- Users only see their own messages
- Privacy settings respected across all views

### Design
- Dark mode: `#000000` background
- Primary: `#7C3AED` purple
- Sent bubbles: purple gradient
- Received bubbles: `#1F1F1F` dark grey
- Font: Sora (Google Fonts)

## Data Schema

### Users table
| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated unique ID |
| name | string | Display name |
| email | string | Login email |
| password | string | Plain text (demo only) |
| photo | string/null | Base64 image data |
| bio | string | Profile bio |
| createdAt | number | Unix timestamp |

### Messages table
| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated unique ID |
| text | string | Message content |
| senderId | string | Sender's user ID |
| receiverId | string | Receiver's user ID |
| chatId | string | Unique per user-pair |
| timestamp | number | Unix timestamp |
| vanished | boolean | Soft-delete flag |

### FriendRequests table
| Field | Type | Description |
|-------|------|-------------|
| id | string | Auto-generated unique ID |
| fromId | string | Sender's user ID |
| toId | string | Receiver's user ID |
| status | string | pending / accepted / rejected |
| createdAt | number | Unix timestamp |

## Notes
- All data is stored in `window.__vibezDB` (in-memory) — data resets on page refresh
- To persist data, replace the DB layer with Firebase, Supabase, or any backend
- Passwords stored in plain text for demo purposes — use bcrypt in production
