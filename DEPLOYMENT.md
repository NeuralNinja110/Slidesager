# Slidesager Deployment Guide

## Overview
Slidesager is configured for deployment on Vercel with a serverless architecture.

## Prerequisites
- Vercel account
- Vercel CLI installed: `npm install -g vercel`

## Environment Variables
Before deploying, you'll need to set up the following environment variables in your Vercel dashboard:

### Required Variables
- `OPENAI_API_KEY` - Your OpenAI API key (for GPT models)
- `ANTHROPIC_API_KEY` - Your Anthropic API key (for Claude models)
- `GEMINI_API_KEY` - Your Google Gemini API key

### Optional Variables
- `NODE_ENV` - Set to `production`

## Deployment Steps

### 1. Using Vercel CLI (Recommended)
```bash
# Clone the repository
git clone <your-repo-url>
cd Slidesager

# Install dependencies
npm install

# Build the project locally (optional, to test)
npm run build

# Deploy to Vercel
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Select your account/team
# - Confirm project settings
```

### 2. Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Vercel will automatically detect the configuration
5. Add environment variables in the project settings
6. Deploy

## Configuration Files

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/public/$1"
    }
  ]
}
```

## Build Scripts
The project includes the following build scripts:
- `npm run build` - Builds both client and server
- `npm run vercel-build` - Vercel-specific build command

## API Routes
All API routes are handled by the serverless function at `/api/index.ts`:
- `/api/presentations` - Presentation management
- `/api/presentations/generate` - Generate new presentations
- `/api/presentations/:id/preview` - Get presentation preview
- `/api/presentations/:id/download/:format` - Download presentations

## Storage
The application uses in-memory storage. For production, consider integrating with:
- Database (PostgreSQL, MongoDB)
- File storage (AWS S3, Vercel Blob)

## Troubleshooting

### Common Issues
1. **Build failures**: Check that all dependencies are installed
2. **API errors**: Verify environment variables are set correctly
3. **Marp CLI issues**: Ensure the deployment environment supports the required dependencies

### Logs
Check deployment logs in the Vercel dashboard under the "Functions" tab.

## Development
For local development:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`
