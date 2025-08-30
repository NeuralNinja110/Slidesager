#!/bin/bash

# Slidesager Setup Script for Unix/Linux/macOS
# This script sets up the development environment for Slidesager

set -e

echo "🎯 Setting up Slidesager - AI PowerPoint Generator"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    echo "   Please update Node.js and try again."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Install Marp CLI globally if not already installed
if ! command -v marp &> /dev/null; then
    echo ""
    echo "📋 Installing Marp CLI globally..."
    npm install -g @marp-team/marp-cli
    echo "✅ Marp CLI installed successfully"
else
    echo "✅ Marp CLI already installed: $(marp --version)"
fi

# Create temp directory for Marp outputs
echo ""
echo "📁 Creating temp directory..."
mkdir -p temp
echo "✅ Temp directory created"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cat > .env << EOL
# Slidesager Environment Variables
# These are optional - users can enter API keys directly in the UI

# OpenAI API Key (optional)
# OPENAI_API_KEY=your_openai_api_key_here

# Anthropic API Key (optional)
# ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Google Gemini API Key (optional)
# GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development
EOL
    echo "✅ .env file created with default configuration"
    echo "   You can edit this file to add default API keys (optional)"
else
    echo "✅ .env file already exists"
fi

# Check if git is available and initialize if needed
if command -v git &> /dev/null; then
    if [ ! -d .git ]; then
        echo ""
        echo "🔧 Initializing git repository..."
        git init
        echo "✅ Git repository initialized"
    fi
    
    # Create .gitignore if it doesn't exist
    if [ ! -f .gitignore ]; then
        echo ""
        echo "📝 Creating .gitignore..."
        cat > .gitignore << EOL
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/

# Temp files
temp/
*.tmp
*.temp

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# API keys and secrets (extra safety)
*api_key*
*secret*
*token*
EOL
        echo "✅ .gitignore created"
    fi
fi

# Build the project
echo ""
echo "🔨 Building the project..."
npm run build

echo ""
echo "🎉 Setup complete!"
echo ""
echo "🚀 To start the development server:"
echo "   npm run dev"
echo ""
echo "🌐 The application will be available at:"
echo "   http://localhost:5000"
echo ""
echo "📚 For more information, see the README.md file"
echo ""
echo "⚠️  Remember to:"
echo "   1. Get API keys from your preferred LLM provider"
echo "   2. Enter them in the UI when generating presentations"
echo "   3. Never commit API keys to version control"
echo ""
echo "Happy presenting! 🎯"
