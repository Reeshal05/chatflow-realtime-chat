# ChatFlow Frontend

React frontend for the ChatFlow real-time chat application.

## Features

- Modern React 18 with Vite
- Real-time messaging interface
- Responsive design
- User authentication
- Social networking features
- File sharing capabilities

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

## Build for Production

\`\`\`bash
npm run build
\`\`\`

## Project Structure

\`\`\`
src/
├── components/ # React components
│ ├── Auth/ # Authentication components
│ ├── Chat/ # Chat interface components
│ ├── Friends/ # Social features components
│ ├── layout/ # UI layout components
│ ├── profile/ # profile management components
│ └── Common/ # Shared components
├── context/ # React context providers
├── hooks/ # Custom React hooks
├── services/ # API service functions
├── utils/ # Utility functions
└── App.jsx # Main App component
\`\`\`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
