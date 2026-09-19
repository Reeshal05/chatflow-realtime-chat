# ChatFlow Backend

Express.js backend server for the ChatFlow real-time chat application.

## Features

- RESTful API endpoints
- JWT authentication
- Socket.io real-time communication
- MongoDB database integration
- User management and social features
- File upload handling

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Create environment file:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

3. Configure your environment variables in `.env`

4. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user account

### Messages

- `GET /api/messages` - Get message history
- `POST /api/messages` - Send new message
- `DELETE /api/messages/:id` - Delete message

### Social Features

- `POST /api/follow/request` - Send follow request
- `POST /api/follow/accept` - Accept follow request
- `POST /api/follow/reject` - Reject follow request
- `DELETE /api/follow/unfollow` - Unfollow user

## Socket Events

### Client to Server

- `join_room` - Join chat room
- `send_message` - Send message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator

### Server to Client

- `message_received` - New message received
- `user_joined` - User joined room
- `typing_indicator` - Show typing indicator
- `online_users` - Updated online users list
