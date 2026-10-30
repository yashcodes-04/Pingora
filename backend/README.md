# Pingora - WhatsApp Clone Backend

Pingora is a high-performance real-time messaging backend inspired by WhatsApp, built using **Node.js**, **TypeScript**, **Express**, **Socket.io**, **Prisma ORM**, and **Neon PostgreSQL**, featuring **HeyGen AI Avatar** integration and an **Admin Moderation Portal**.

---

## 🌟 Key Features

1. **User Discovery & Contacts (WhatsApp-style)**
   - Case-insensitive search by `@username` or display name.
   - Direct 1-on-1 conversation instantiation via username.
   - Profile management with custom bios and avatars.

2. **HeyGen AI Avatars**
   - Integration with the **HeyGen AI Avatar API** (`/api/v1/avatars/heygen`).
   - Browse studio and talking-photo avatars.
   - Choose or generate custom AI avatars with talking scripts.
   - Seamless curated fallback catalog if `HEYGEN_API_KEY` is not yet configured.

3. **Real-time 1-on-1 Direct Messaging**
   - Socket.io powered instant message delivery.
   - Message status receipts: `SENT` → `DELIVERED` → `READ`.
   - Real-time typing indicators (`typing_start`, `typing_stop`).
   - Online/Offline presence tracking with automatic `lastSeenAt` timestamps.

4. **Public Community Chat Room**
   - Global channel where any registered user can drop messages in real-time.
   - Broadcast to all connected clients over `room:public`.
   - Live message moderation and removal.

5. **Admin Moderation & Analytics Portal**
   - Role-based Access Control (`ROLE = ADMIN`).
   - Dashboard statistics: total users, active conversations, message throughput, and banned/muted counts.
   - User moderation: ban/unban accounts and mute disruptive users from the public chat.
   - Message moderation: delete inappropriate messages in the public chat with instant broadcast removal.
   - Persistent Audit Log for all administrator actions.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime & Language** | Node.js (v20+) & TypeScript | Type safety, maintainability, modern ES syntax |
| **HTTP Framework** | Express.js | Modular routing, middlewares, and error handling |
| **Real-time Engine** | Socket.io 4.8+ | Bi-directional WebSocket communication & room management |
| **Database** | Neon PostgreSQL | Serverless PostgreSQL with connection pooling |
| **ORM** | Prisma 5.22 | Type-safe migrations, relations, and query building |
| **AI Avatar Engine** | HeyGen API | AI Talking Photo & Studio Avatar generation |
| **Authentication** | JWT (`jsonwebtoken`) & `bcryptjs` | Stateless authentication and password hashing |
| **Data Validation** | Zod | Runtime schema validation for requests and environments |

---

## 🗄️ Database Schema (Prisma / Neon)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id              String   @id @default(uuid())
  username        String   @unique
  email           String   @unique
  password        String
  displayName     String?
  avatarUrl       String?
  heygenAvatarId  String?
  bio             String?
  role            Role     @default(USER) // USER | ADMIN
  isBanned        Boolean  @default(false)
  isMutedInPublic Boolean  @default(false)
  lastSeenAt      DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  ...
}

model Conversation {
  id           String                    @id @default(uuid())
  type         ConversationType          @default(DIRECT)
  participants ConversationParticipant[]
  messages     Message[]
  updatedAt    DateTime                  @updatedAt
}

model Message {
  id             String        @id @default(uuid())
  conversationId String
  senderId       String
  content        String
  messageType    MessageType   @default(TEXT)
  status         MessageStatus @default(SENT) // SENT | DELIVERED | READ
  isDeleted      Boolean       @default(false)
  createdAt      DateTime      @default(now())
}

model PublicMessage {
  id        String   @id @default(uuid())
  senderId  String
  content   String
  isDeleted Boolean  @default(false)
  createdAt DateTime @default(now())
}

model AuditLog {
  id        String   @id @default(uuid())
  adminId   String
  action    String
  targetId  String?
  details   String?
  createdAt DateTime @default(now())
}
```

---

## 📁 Project Directory Structure

```
backend/
├── prisma/
│   └── schema.prisma             # Neon PostgreSQL schema definition
├── src/
│   ├── config/
│   │   ├── env.ts                # Zod environment validation
│   │   └── prisma.ts             # Prisma client singleton
│   ├── controllers/
│   │   ├── admin.controller.ts   # Moderation & stats controller
│   │   ├── auth.controller.ts    # Register, login, getMe
│   │   ├── avatar.controller.ts  # HeyGen AI avatar endpoints
│   │   ├── chat.controller.ts    # Direct 1-on-1 chat controller
│   │   ├── publicChat.controller.ts # Public room chat controller
│   │   └── user.controller.ts    # Username search & profile updates
│   ├── middlewares/
│   │   ├── admin.middleware.ts   # Admin authorization guard
│   │   ├── auth.middleware.ts    # JWT token verification & ban checker
│   │   ├── error.middleware.ts   # Global Express error handler
│   │   └── validate.middleware.ts# Zod payload validator
│   ├── routes/
│   │   ├── admin.routes.ts
│   │   ├── auth.routes.ts
│   │   ├── avatar.routes.ts
│   │   ├── chat.routes.ts
│   │   ├── index.ts              # Aggregated router mounted at /api/v1
│   │   ├── publicChat.routes.ts
│   │   └── user.routes.ts
│   ├── services/
│   │   ├── admin.service.ts
│   │   ├── auth.service.ts
│   │   ├── chat.service.ts
│   │   ├── heygen.service.ts     # HeyGen AI avatar integration
│   │   ├── publicChat.service.ts
│   │   └── user.service.ts
│   ├── socket/
│   │   ├── events.ts             # Socket event constants
│   │   ├── handlers/
│   │   │   ├── chat.handler.ts   # Direct message & typing events
│   │   │   └── publicChat.handler.ts # Public chat broadcasts
│   │   ├── index.ts              # Socket.io server with JWT handshake
│   │   └── presence.ts           # Online/offline presence tracker
│   ├── utils/
│   │   ├── logger.ts
│   │   └── response.ts           # Standard API response formatters
│   └── index.ts                  # Main server entrypoint
├── test/
│   └── services.test.mjs         # Automated test suite
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 20+
- A [Neon](https://neon.tech) PostgreSQL account & database connection string.
- (Optional) A [HeyGen](https://www.heygen.com/) account and API key.

### 2. Configuration
Navigate to the `backend` directory:
```bash
cd backend
cp .env.example .env
```
Edit `.env` with your Neon credentials and settings:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://<username>:<password>@ep-your-pooler.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://<username>:<password>@ep-your-direct.neon.tech/neondb?sslmode=require"
JWT_SECRET="your_strong_random_jwt_secret"
HEYGEN_API_KEY="your_heygen_api_key"
CLIENT_ORIGIN="http://localhost:3000,http://localhost:5173"
```

### 3. Push Database Schema to Neon
Synchronize the Prisma models with your Neon database:
```bash
npm run prisma:push
```

### 4. Run Development Server
```bash
npm run dev
```
The server will boot on `http://localhost:5000` with both Express HTTP and Socket.io active.

### 5. Build & Test
```bash
# Build TypeScript
npm run build

# Run automated tests
npm test
```

---

## 📡 API Reference

### 🔐 Authentication (`/api/v1/auth`)
* `POST /register`: Create a new user (`username`, `email`, `password`, `displayName`, `avatarUrl`, `role`).
* `POST /login`: Log in with email or username + password. Returns `{ user, token }`.
* `GET /me`: Fetch authenticated user profile (Requires `Bearer <token>`).

### 👤 User Discovery (`/api/v1/users`)
* `GET /search?q=@alex`: Search users by username or display name.
* `GET /:username`: Get public profile by username.
* `PATCH /profile`: Update display name, bio, or avatar.

### 🤖 HeyGen AI Avatars (`/api/v1/avatars`)
* `GET /heygen/list`: List available HeyGen AI avatars (studio & photo avatars).
* `POST /heygen/select`: Choose an AI avatar and automatically apply it to profile.

### 💬 1-on-1 Direct Chat (`/api/v1/chats`)
* `GET /conversations`: List active conversations with last message and unread metadata.
* `POST /start`: Start or fetch direct conversation with `{ username }`.
* `GET /conversations/:conversationId/messages`: Fetch conversation messages (paginated).
* `POST /conversations/:conversationId/messages`: Send direct message via REST.
* `POST /conversations/:conversationId/read`: Mark conversation as read.

### 📢 Public Chat (`/api/v1/public-chat`)
* `GET /messages`: Fetch public chat room message history.
* `POST /messages`: Post a message to the public chat.
* `DELETE /messages/:messageId`: Delete a message (owner or admin).

### 🛡️ Admin Moderation (`/api/v1/admin`)
*(Requires role: `ADMIN`)*
* `GET /dashboard`: Summary metrics (users, direct messages, public messages, active conversations).
* `GET /users`: List and search all users with ban & mute states.
* `PATCH /users/:userId/ban`: Ban or unban a user account.
* `PATCH /users/:userId/mute`: Mute or unmute a user from the public chat room.
* `DELETE /public-messages/:messageId`: Moderator deletion of offensive public messages.
* `GET /audit-logs`: Audit trail of all admin actions.

---

## ⚡ Socket.io Real-time Events

### Connection & Handshake
Clients must provide a valid JWT token during handshake:
```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: {
    token: "YOUR_JWT_TOKEN"
  }
});
```

### Events Catalog

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `presence:online` | Server → Client | `{ userId, username }` | Broadcast when a user comes online |
| `presence:offline` | Server → Client | `{ userId, lastSeenAt }` | Broadcast when a user disconnects |
| `chat:join` | Client → Server | `{ conversationId }` | Subscribe to conversation room |
| `chat:send_message` | Client → Server | `{ conversationId, content, recipientId }` | Send 1-on-1 message |
| `chat:new_message` | Server → Client | `{ message, conversationId }` | Delivered to recipient and conversation room |
| `chat:typing_start` | Client ↔ Server | `{ conversationId, recipientId }` | Relays typing indicator |
| `chat:typing_stop` | Client ↔ Server | `{ conversationId, recipientId }` | Relays stopped typing |
| `chat:message_read` | Client ↔ Server | `{ conversationId, readerId }` | Notifies sender of read receipt |
| `public:join` | Client → Server | - | Join global public chat room |
| `public:send_message` | Client → Server | `{ content }` | Drop message into public room |
| `public:new_message` | Server → Client | `{ message }` | Broadcast to all clients in public room |
