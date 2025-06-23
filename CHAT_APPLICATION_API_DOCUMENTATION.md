# Chat Application API Documentation

## Table of Contents
1. [Backend APIs](#backend-apis)
2. [Frontend Services](#frontend-services)
3. [GraphQL Schema](#graphql-schema)
4. [WebSocket Communication](#websocket-communication)
5. [File Management](#file-management)
6. [Authentication & User Management](#authentication--user-management)
7. [Blocking System](#blocking-system)

---

## Backend APIs

### 1. GraphQL Endpoints

**Base URL:** `http://localhost:8081/graphql`

#### Queries

##### Get All Users
```graphql
query {
  users {
    id
    name
    isOnline
  }
}
```
**Purpose:** Retrieve all users in the system
**Controller:** `ChatController.users()`

##### Get User by ID
```graphql
query {
  user(id: "1") {
    id
    name
    isOnline
  }
}
```
**Purpose:** Get specific user details
**Controller:** `ChatController.user(Long id)`

##### Get User by Name
```graphql
query {
  userByName(name: "John") {
    id
    name
    isOnline
  }
}
```
**Purpose:** Find user by username
**Controller:** `ChatController.userByName(String name)`

##### Get Contacts for User
```graphql
query {
  contacts(userId: "1") {
    id
    name
    isOnline
  }
}
```
**Purpose:** Get contact list for a specific user (excludes blocked users)
**Controller:** `ChatController.contacts(Long userId)`

##### Get Messages Between Users
```graphql
query {
  messages(senderId: "1", receiverId: "2") {
    id
    senderId
    receiverId
    content
    timestamp
    read
    fileUrl
    fileType
    fileName
    isEncrypted
    encryptedContent
    encryptedAESKey
    iv
    signature
  }
}
```
**Purpose:** Retrieve chat history between two users
**Controller:** `ChatController.messages(Long senderId, Long receiverId)`

#### Mutations

##### Send Message
```graphql
mutation {
  sendMessage(
    senderId: "1",
    receiverId: "2",
    content: "Hello!",
    fileUrl: "http://localhost:8081/api/files/file123",
    fileType: "image/png",
    fileName: "image.png"
  ) {
    id
    senderId
    receiverId
    content
    timestamp
    read
    fileUrl
    fileType
    fileName
    isEncrypted
  }
}
```
**Purpose:** Send a new message (text or file)
**Controller:** `ChatController.sendMessage(...)`

##### Create User
```graphql
mutation {
  createUser(name: "John Doe") {
    id
    name
    isOnline
  }
}
```
**Purpose:** Create a new user account
**Controller:** `ChatController.createUser(String name)`

##### Mark Message as Read
```graphql
mutation {
  markMessageAsRead(messageId: "123", userId: "1")
}
```
**Purpose:** Mark a message as read
**Controller:** `ChatController.markMessageAsRead(Long messageId, Long userId)`

##### Set Typing Status
```graphql
mutation {
  setTypingStatus(userId: "1", receiverId: "2", isTyping: true)
}
```
**Purpose:** Update typing indicator status
**Controller:** `ChatController.setTypingStatus(...)`

#### Subscriptions

##### New Message Subscription
```graphql
subscription {
  onNewMessage(receiverId: "1") {
    id
    senderId
    receiverId
    content
    timestamp
    read
    fileUrl
    fileType
    fileName
  }
}
```
**Purpose:** Real-time message notifications
**Controller:** `ChatController.onNewMessage(Long receiverId)`

### 2. REST API Endpoints

#### User Management
- **GET** `/api/users/for-user/{userId}` - Get users excluding blocked ones
- **GET** `/api/users/all` - Get all users (admin)
- **POST** `/api/users/{userId}/status?online=true` - Set user online/offline status

#### File Management
- **POST** `/api/files/upload` - Upload file
- **GET** `/api/files/{fileName}` - Download file

#### Blocked Users
- **POST** `/api/blocked-users/block` - Block a user
- **POST** `/api/blocked-users/unblock` - Unblock a user
- **GET** `/api/blocked-users/{userId}/blocked` - Get blocked users list
- **GET** `/api/blocked-users/check?userId1=1&userId2=2` - Check if user is blocked
- **GET** `/api/blocked-users/check-mutual?userId1=1&userId2=2` - Check mutual blocking

#### Encryption
- **POST** `/api/generate-keys` - Generate encryption keys for all users

---

## Frontend Services

### 1. ChatService (`chat.service.ts`)

#### Core Methods

##### Connection Management
```typescript
connect(user: User): void
```
**Purpose:** Establish WebSocket connection for real-time communication

```typescript
disconnect(): void
```
**Purpose:** Close WebSocket connection

##### User Operations
```typescript
getUsers(): Observable<any>
```
**Purpose:** Fetch all users via GraphQL

```typescript
getUsersForUser(userId: number): Observable<any>
```
**Purpose:** Get users excluding blocked ones

```typescript
getContactsList(userId: number): Observable<any>
```
**Purpose:** Get contact list for user

```typescript
createUser(name: string): Observable<any>
```
**Purpose:** Create new user account

##### Message Operations
```typescript
loadMessages(senderId: number, receiverId: number): void
```
**Purpose:** Load chat history between users

```typescript
sendMessage(message: Message): void
```
**Purpose:** Send new message

```typescript
getMessages(): Observable<Message[]>
```
**Purpose:** Get observable stream of messages

##### File Operations
```typescript
uploadFile(file: File): Observable<any>
```
**Purpose:** Upload file to server

##### Blocking Operations
```typescript
blockUser(blockerId: number, blockedId: number, reason?: string): Observable<any>
```
**Purpose:** Block a user

```typescript
unblockUser(blockerId: number, blockedId: number): Observable<any>
```
**Purpose:** Unblock a user

```typescript
getBlockedUsers(userId: number): Observable<any>
```
**Purpose:** Get list of blocked users

```typescript
isUserBlocked(userId1: number, userId2: number): Observable<any>
```
**Purpose:** Check if user is blocked

##### Real-time Features
```typescript
setTypingStatus(senderId: number, receiverId: number, isTyping: boolean): void
```
**Purpose:** Send typing indicator

```typescript
getTypingStatus(): Observable<any>
```
**Purpose:** Receive typing indicators

```typescript
getUserStatusUpdates(): Observable<any>
```
**Purpose:** Receive user online/offline status updates

### 2. AuthService (`auth.service.ts`)

```typescript
getCurrentUser(): Observable<User | null>
```
**Purpose:** Get current logged-in user

```typescript
setCurrentUser(user: User): void
```
**Purpose:** Set current user and save to localStorage

```typescript
login(user: User): void
```
**Purpose:** Login user and navigate to chat

```typescript
logout(): void
```
**Purpose:** Logout user and clear data

```typescript
createUser(name: string): Observable<any>
```
**Purpose:** Create new user account

```typescript
findUserByName(name: string): Observable<User | null>
```
**Purpose:** Find user by username

### 3. NotificationService (`notification.service.ts`)

```typescript
requestPermission(): void
```
**Purpose:** Request browser notification permission

```typescript
showNotification(title: string, body: string, icon?: string): void
```
**Purpose:** Display browser notification

```typescript
playNotificationSound(): void
```
**Purpose:** Play notification sound

---

## GraphQL Schema

### Types

#### User Type
```graphql
type User {
  id: ID!
  name: String!
  isOnline: Boolean!
}
```

#### Message Type
```graphql
type Message {
  id: ID!
  senderId: ID!
  receiverId: ID!
  content: String!
  timestamp: Float!
  read: Boolean!
  fileUrl: String
  fileType: String
  fileName: String
  isEncrypted: Boolean
  encryptedContent: String
  encryptedAESKey: String
  iv: String
  signature: String
}
```

### Root Types

#### Query
- `users: [User!]!` - Get all users
- `user(id: ID!): User` - Get user by ID
- `userByName(name: String!): User` - Get user by name
- `contacts(userId: ID!): [User!]!` - Get user contacts
- `messages(senderId: ID!, receiverId: ID!): [Message!]!` - Get messages
- `blockedUsers(userId: ID!): [User!]!` - Get blocked users
- `isUserBlocked(blockerId: ID!, blockedId: ID!): Boolean!` - Check if blocked

#### Mutation
- `createUser(name: String!): User!` - Create user
- `sendMessage(...)` - Send message
- `markMessageAsRead(messageId: ID!, userId: ID!): Boolean!` - Mark as read
- `setTypingStatus(userId: ID!, receiverId: ID!, isTyping: Boolean!): Boolean!` - Set typing
- `blockUser(blockerId: ID!, blockedId: ID!, reason: String): Boolean!` - Block user
- `unblockUser(blockerId: ID!, blockedId: ID!): Boolean!` - Unblock user

#### Subscription
- `onNewMessage(receiverId: ID!): Message!` - Real-time messages

---

## WebSocket Communication

### Connection
- **URL:** `ws://localhost:8081/ws`
- **Protocol:** STOMP over WebSocket

### Topics
- `/topic/messages/{userId}` - Receive new messages
- `/topic/typing/{userId}` - Receive typing indicators
- `/topic/user-status` - Receive user status updates

### Destinations
- `/app/chat.sendMessage` - Send message
- `/app/chat.typing` - Send typing status
- `/app/user.connect` - User connection
- `/app/user.disconnect` - User disconnection

---

## File Management

### Upload Process
1. **Frontend:** Select file via `<input type="file">`
2. **Frontend:** Call `ChatService.uploadFile(file)`
3. **Backend:** Store file in `C:/chatapp/uploads/`
4. **Backend:** Return file URL
5. **Frontend:** Send message with file URL

### Download Process
1. **Frontend:** Click download button
2. **Frontend:** Navigate to file URL
3. **Backend:** Serve file with proper headers
4. **Browser:** Download or display file

### File Storage
- **Location:** `C:/chatapp/uploads/`
- **Naming:** UUID-based filenames
- **URL Pattern:** `http://localhost:8081/api/files/{fileName}`

---

## Authentication & User Management

### User Creation Flow
1. User enters name in login form
2. System checks if user exists
3. If not exists, creates new user
4. Generates encryption keys
5. Sets user as current user
6. Navigates to chat interface

### Session Management
- **Storage:** localStorage
- **Key:** `currentUser`
- **Data:** User object with id, name, isOnline

---

## Blocking System

### Block User Flow
1. User clicks block button
2. Frontend calls `ChatService.blockUser()`
3. Backend creates BlockedUser record
4. User disappears from contact list
5. Messages between users are hidden

### Unblock User Flow
1. User goes to settings
2. Views blocked users list
3. Clicks unblock button
4. Backend removes BlockedUser record
5. User reappears in contact list

### Block Checking
- Automatic filtering in contact lists
- Message visibility restrictions
- Mutual blocking support

---

## Error Handling

### Frontend
- HTTP errors caught in service methods
- User-friendly error messages
- Fallback to empty arrays/objects

### Backend
- Try-catch blocks in controllers
- Standardized error responses
- Logging for debugging

### Common Error Scenarios
- Network connectivity issues
- File upload failures
- User not found errors
- Permission denied errors
- Database connection issues

---

## Security Features

### End-to-End Encryption
- AES encryption for message content
- RSA key exchange
- Unique keys per user
- Encrypted file attachments

### Input Validation
- GraphQL argument validation
- File type restrictions
- Content sanitization
- SQL injection prevention

### Authentication
- Session-based authentication
- User verification
- Access control for resources

---

## Performance Optimizations

### Frontend
- Observable-based reactive programming
- Efficient change detection
- Lazy loading of components
- File upload progress tracking

### Backend
- Connection pooling
- Query optimization
- Caching strategies
- Asynchronous processing

### Real-time Communication
- WebSocket connection management
- Message queuing
- Connection retry logic
- Heartbeat monitoring
